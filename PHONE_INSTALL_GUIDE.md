# 📱 Phone Par Install Karne Ka Guide

Aapke paas **3 tarike** hain app ko phone par install karne ke liye:

## Method 1: Expo Go App Se (Sabse Aasan - Development Ke Liye) ⚡

### Steps:
1. **Expo Go app install karein** apne phone par:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Computer par terminal mein ye command chalaayein:**
   ```bash
   cd MOBILE
   npm start
   ```
   Ya phir:
   ```bash
   cd MOBILE
   npx expo start
   ```

3. **QR code scan karein:**
   - Terminal mein ek QR code dikhega
   - Android: Expo Go app kholkar QR code scanner use karein
   - iOS: Camera app se QR code scan karein (Expo Go automatically open ho jayega)

4. **App automatically load ho jayega** apne phone par!

---

## Method 2: APK File Build Karke (Android Ke Liye) 📦

### Steps:

1. **EAS CLI install karein** (agar nahi hai):
   ```bash
   npm install -g eas-cli
   ```

2. **EAS account login karein:**
   ```bash
   eas login
   ```

3. **Android APK build karein:**
   ```bash
   cd MOBILE
   npm run build:android:preview
   ```
   
   Ya phir manually:
   ```bash
   eas build --platform android --profile preview
   ```

4. **Build complete hone ke baad:**
   - EAS dashboard se APK download karein
   - APK file ko apne phone par transfer karein
   - Phone settings mein "Unknown Sources" enable karein
   - APK file par tap karke install karein

---

## Method 3: Development Build (Sabse Best - Production Ke Liye) 🚀

### Android Ke Liye:

1. **Development build create karein:**
   ```bash
   cd MOBILE
   eas build --platform android --profile development
   ```

2. **Build complete hone ke baad:**
   - APK download karein
   - Phone par install karein

### iOS Ke Liye:

1. **iOS build create karein:**
   ```bash
   cd MOBILE
   eas build --platform ios --profile development
   ```

2. **Build complete hone ke baad:**
   - IPA file download karein
   - Xcode ya TestFlight se install karein

---

## Quick Start Commands

### Development Mode (Expo Go):
```bash
cd MOBILE
npm start
```

### Android APK Build:
```bash
cd MOBILE
npm run build:android:preview
```

### iOS Build:
```bash
cd MOBILE
npm run build:ios:preview
```

---

## Important Notes ⚠️

1. **EAS Account:** Production builds ke liye EAS account chahiye (free tier available hai)
2. **Internet Connection:** Build process ke liye stable internet chahiye
3. **Build Time:** Pehli baar build karne mein 10-15 minutes lag sakte hain
4. **Phone Settings:** Android par "Unknown Sources" enable karna zaroori hai APK install karne ke liye

---

## Troubleshooting 🔧

### Agar Expo Go mein app load nahi ho rahi:
- Same WiFi network par dono devices (computer aur phone) ko connect karein
- Firewall settings check karein
- `npx expo start --tunnel` command try karein

### Agar build fail ho raha hai:
- `eas build:configure` command chalaayein
- EAS account se login verify karein
- Internet connection check karein

---

## Need Help? 💬

Agar koi problem aaye to:
1. EAS documentation: https://docs.expo.dev/build/introduction/
2. Expo documentation: https://docs.expo.dev/
