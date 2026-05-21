/**
 * MOBILE/.env — sirf ek EXPO_PUBLIC_BACKEND_URL uncomment rakho.
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
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

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
if (!backendUrl) {
  throw new Error(
    "MOBILE/.env: EXPO_PUBLIC_BACKEND_URL ki ek line uncomment karo."
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
