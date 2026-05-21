/**
 * Loads .env at build time so EXPO_PUBLIC_BACKEND_URL is embedded in the APK/IPA.
 * Rebuild required after changing .env: npx expo run:android --variant release
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const m = line.match(/^\s*EXPO_PUBLIC_BACKEND_URL\s*=\s*(.+)\s*$/);
      if (m) {
        process.env.EXPO_PUBLIC_BACKEND_URL = m[1]
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    });
}

const appJson = require("./app.json");

const backendUrl =
  process.env.EXPO_PUBLIC_BACKEND_URL?.trim() || "http://192.168.10.36:8000";

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      backendUrl,
    },
  },
};
