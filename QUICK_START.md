# 🚀 Quick Start - Bina Login Ke

## Method 1: Expo Go Se (Sabse Aasan - Bina Login Ke) ⚡

### Steps:

1. **Terminal mein Ctrl+C daba kar exit karein** (agar EAS login prompt hai)

2. **Expo Go app install karein** apne phone par:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

3. **App start karein:**
   ```bash
   cd MOBILE
   npm start
   ```

4. **QR code scan karein** apne phone se:
   - Android: Expo Go app kholkar QR scanner use karein
   - iOS: Camera app se QR code scan karein

5. **Done!** App automatically load ho jayega.

---

## Method 2: APK Build Ke Liye (EAS Account Chahiye)

Agar aapko permanent APK file chahiye, to:

1. **Naya Expo account banayein:**
   - Browser mein jayein: https://expo.dev/signup
   - Free account banayein

2. **Login karein:**
   ```bash
   eas login
   ```

3. **APK build karein:**
   ```bash
   npm run build:android:preview
   ```

---

## Current Status

Agar aap terminal mein stuck hain (EAS login prompt par), to:
- **Ctrl+C** daba kar exit karein
- Phir `npm start` chalaayein (Expo Go ke liye)


