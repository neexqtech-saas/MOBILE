/**
 * Backend URL: EAS eas.json env → process.env, phir local MOBILE/.env.
 */
const fs = require("fs");
const path = require("path");

function loadBackendUrlFromDotEnv() {
  if (process.env.EXPO_PUBLIC_BACKEND_URL?.trim()) return;
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const m = trimmed.match(/^EXPO_PUBLIC_BACKEND_URL\s*=\s*(.+)$/);
      if (m) {
        process.env.EXPO_PUBLIC_BACKEND_URL = m[1]
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    });
}

loadBackendUrlFromDotEnv();

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
if (!backendUrl) {
  throw new Error(
    "EXPO_PUBLIC_BACKEND_URL missing. Local: MOBILE/.env uncomment karo. EAS: eas.json profile env ya expo.dev → Environment variables."
  );
}

const appJson = require("./app.json");

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      backendUrl: backendUrl.replace(/\/$/, ""),
    },
  },
};
