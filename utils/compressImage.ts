import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

const MAX_WIDTH = 640;
const JPEG_QUALITY = 0.5;
/** ~500KB base64 — safe under nginx 1MB limit with JSON wrapper */
export const MAX_BASE64_CHARS = 500_000;

function getImageManipulator(): {
  manipulateAsync: (
    uri: string,
    actions: { resize?: { width?: number } }[],
    options: { compress?: number; format: string; base64?: boolean }
  ) => Promise<{ base64?: string; uri: string }>;
  SaveFormat: { JPEG: string };
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-image-manipulator");
  } catch {
    return null;
  }
}

async function resizeCanvasDataUrlAsync(
  dataUrl: string,
  maxWidth: number = MAX_WIDTH,
  quality: number = JPEG_QUALITY
): Promise<string> {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return dataUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function isLocalFileUri(source: string): boolean {
  return (
    source.startsWith("file://") ||
    source.startsWith("content://") ||
    (Platform.OS === "ios" && source.startsWith("/"))
  );
}

async function manipulateToDataUrl(uri: string): Promise<string | null> {
  const ImageManipulator = getImageManipulator();
  if (!ImageManipulator) {
    return null;
  }
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH } }],
      {
        compress: JPEG_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );
    if (result.base64) {
      return `data:image/jpeg;base64,${result.base64}`;
    }
  } catch (err) {
    console.warn("expo-image-manipulator failed (rebuild app if needed):", err);
  }
  return null;
}

/** Resize + JPEG compress so JSON base64 uploads stay under nginx limits (~1MB). */
export async function compressImageForUpload(source: string): Promise<string> {
  if (!source?.trim()) {
    return source;
  }

  if (source.startsWith("data:") && Platform.OS === "web") {
    return resizeCanvasDataUrlAsync(source, MAX_WIDTH, JPEG_QUALITY);
  }

  if (isLocalFileUri(source)) {
    const dataUrl = await manipulateToDataUrl(source);
    if (dataUrl) {
      return dataUrl;
    }
    const base64 = await FileSystem.readAsStringAsync(source, { encoding: "base64" });
    if (base64.length > MAX_BASE64_CHARS) {
      throw new Error(
        "Photo is too large. Close the app, run: npx expo run:android (or ios), then try again."
      );
    }
    return `data:image/jpeg;base64,${base64}`;
  }

  if (source.startsWith("data:")) {
    const ImageManipulator = getImageManipulator();
    if (!ImageManipulator) {
      if (Platform.OS === "web") {
        return resizeCanvasDataUrlAsync(source, MAX_WIDTH, JPEG_QUALITY);
      }
      const stripped = stripDataUriPrefix(source);
      if (stripped.length <= MAX_BASE64_CHARS) {
        return source;
      }
      throw new Error("Photo is too large. Restart the app after npm install.");
    }
    const comma = source.indexOf(",");
    const header = comma >= 0 ? source.slice(0, comma) : "";
    const base64 = comma >= 0 ? source.slice(comma + 1) : source;
    const ext = header.toLowerCase().includes("png") ? "png" : "jpg";
    const path = `${FileSystem.cacheDirectory}upload_${Date.now()}.${ext}`;
    await FileSystem.writeAsStringAsync(path, base64, { encoding: "base64" });
    const dataUrl = await manipulateToDataUrl(path);
    return dataUrl ?? source;
  }

  return source;
}

export async function compressImagesForUpload(sources: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const s of sources) {
    const compressed = await compressImageForUpload(s);
    if (stripDataUriPrefix(compressed).length > MAX_BASE64_CHARS) {
      throw new Error(
        "Photo is still too large. Retake the photo or run npm install in the MOBILE folder."
      );
    }
    out.push(compressed);
  }
  return out;
}

/** Prefer camera asset URI; fall back to base64 data URL. */
export async function compressFromCameraAsset(asset: {
  uri?: string;
  base64?: string | null;
}): Promise<string | null> {
  if (asset.uri) {
    const fromUri = await compressImageForUpload(asset.uri);
    if (stripDataUriPrefix(fromUri).length <= MAX_BASE64_CHARS) {
      return fromUri;
    }
  }
  if (asset.base64) {
    return compressImageForUpload(`data:image/jpeg;base64,${asset.base64}`);
  }
  return null;
}

export function isMultipartImageUri(uri: string | undefined | null): boolean {
  return !!uri && isLocalFileUri(uri);
}

/** Backend profile-photo API expects raw base64 without data-URI prefix. */
export function stripDataUriPrefix(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/[a-z0-9+.-]+;base64,(.+)$/i);
  return match?.[1] ?? dataUrl;
}

export function estimateBase64Chars(dataUrlOrBase64: string): number {
  return stripDataUriPrefix(dataUrlOrBase64).length;
}

/** Compress camera capture to raw base64 ready for profile-photo / attendance APIs. */
export async function prepareProfilePhotoBase64(
  asset: { uri?: string; base64?: string | null },
  fallbackDataUrl?: string | null
): Promise<string> {
  let source: string | null = null;
  if (asset.uri) {
    source = asset.uri;
  } else if (asset.base64) {
    source = `data:image/jpeg;base64,${asset.base64}`;
  } else if (fallbackDataUrl) {
    source = fallbackDataUrl;
  }
  if (!source) {
    throw new Error("No image to upload");
  }
  const compressed = await compressImageForUpload(source);
  const raw = stripDataUriPrefix(compressed);
  if (raw.length > MAX_BASE64_CHARS) {
    throw new Error(
      `Photo is still too large (${Math.round(raw.length / 1024)}KB). Please capture again.`
    );
  }
  return raw;
}
