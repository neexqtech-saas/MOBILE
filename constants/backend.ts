import Constants from "expo-constants";

export function resolveBackendUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.backendUrl as string | undefined;
  const url =
    process.env.EXPO_PUBLIC_BACKEND_URL?.trim() || fromExtra?.trim();

  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_BACKEND_URL missing. MOBILE/.env mein ek line uncomment karo."
    );
  }
  return url.replace(/\/$/, "");
}
