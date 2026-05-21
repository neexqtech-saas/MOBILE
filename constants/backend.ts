import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Local dev server — PC ka WiFi IP (`ipconfig` → IPv4).
 * Phone + web dono isi IP par backend hit karenge.
 */
export const DEV_LAN_HOST = "192.168.10.36";
export const DEV_BACKEND_PORT = 8000;
export const LOCAL_BACKEND_URL = `http://${DEV_LAN_HOST}:${DEV_BACKEND_PORT}`;

/** Sirf production APK / release build ke liye (abhi sab jagah local) */
export const PRODUCTION_BACKEND_URL = LOCAL_BACKEND_URL;

function getMetroLanHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (typeof hostUri === "string" && hostUri.includes(":")) {
    const host = hostUri.split(":")[0]?.trim();
    if (host && host !== "127.0.0.1" && host !== "localhost") {
      return host;
    }
  }
  const debuggerHost = (Constants.expoGoConfig as { debuggerHost?: string } | undefined)
    ?.debuggerHost;
  if (typeof debuggerHost === "string" && debuggerHost.includes(":")) {
    const host = debuggerHost.split(":")[0]?.trim();
    if (host && host !== "127.0.0.1" && host !== "localhost") {
      return host;
    }
  }
  return null;
}

export function resolveBackendUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.backendUrl as string | undefined;
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim() || fromExtra?.trim();

  if (envUrl && !envUrl.includes("127.0.0.1") && !envUrl.includes("localhost")) {
    return envUrl.replace(/\/$/, "");
  }

  if (Constants.isDevice && Platform.OS !== "web") {
    const lan = getMetroLanHost();
    if (lan) {
      return `http://${lan}:${DEV_BACKEND_PORT}`;
    }
  }

  if (Platform.OS === "android" && !Constants.isDevice) {
    return `http://10.0.2.2:${DEV_BACKEND_PORT}`;
  }

  return LOCAL_BACKEND_URL;
}
