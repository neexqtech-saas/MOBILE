import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import type { ImagePickerAsset } from "expo-image-picker";
import type { AttachmentUploadInput } from "@/services/api";

/** Prepare gallery/camera assets for Django multipart upload (field name `file`). */
export async function prepareAssetsForUpload(
  assets: ImagePickerAsset[]
): Promise<AttachmentUploadInput[]> {
  const results: AttachmentUploadInput[] = [];

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const mime = asset.mimeType || "image/jpeg";
    const name = asset.fileName || `upload_${Date.now()}_${i}.jpg`;
    let uri = asset.uri;

    if (Platform.OS === "android" && uri.startsWith("content://")) {
      const safeName = name.replace(/[^\w.-]/g, "_");
      const dest = `${FileSystem.cacheDirectory ?? ""}att_${Date.now()}_${i}_${safeName}`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      uri = dest.startsWith("file://") ? dest : `file://${dest}`;
    }

    results.push({ uri, name, type: mime });
  }

  return results;
}
