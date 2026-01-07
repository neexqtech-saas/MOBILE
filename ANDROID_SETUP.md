# Android Device Setup Guide

## Method 1: Expo Go App (Easiest - For Development/Testing)

### Step 1: Install Expo Go on Your Android Phone
1. Google Play Store se **Expo Go** app install karein
2. Link: https://play.google.com/store/apps/details?id=host.exp.exponent

### Step 2: Start Development Server
```bash
# Terminal mein project folder mein jayein
npm start
# ya
npx expo start
```

### Step 3: Connect Your Phone
**Option A: Same WiFi Network (Recommended)**
1. Computer aur phone dono same WiFi par hone chahiye
2. Terminal mein QR code dikhega
3. Expo Go app kholen
4. "Scan QR code" par click karein
5. QR code scan karein
6. App automatically load ho jayega

**Option B: Tunnel Mode (Different Networks)**
```bash
npx expo start --tunnel
```
- Ye slow ho sakta hai, lekin different networks par bhi kaam karega

**Option C: LAN IP (Manual)**
1. Terminal mein local IP address dikhega (e.g., `exp://192.168.1.5:8081`)
2. Expo Go app mein manually ye URL enter karein

---

## Method 2: Build APK (For Direct Installation)

### Step 1: EAS Build Setup (First Time Only)
```bash
# EAS CLI install karein
npm install -g eas-cli

# Login karein
eas login

# Configure karein
eas build:configure
```

### Step 2: Build APK
```bash
# Preview build (Testing ke liye)
npm run build:android:preview

# Production build (Release ke liye)
npm run build:android:production
```

### Step 3: Download and Install
1. Build complete hone ke baad, EAS dashboard se APK download karein
2. Android phone par APK install karein
3. "Install from Unknown Sources" allow karein (agar required ho)

---

## Method 3: Development Build (Advanced)

### Step 1: Install Development Client
```bash
# Development build create karein
eas build --platform android --profile development
```

### Step 2: Install on Device
- Build complete hone ke baad APK download karein
- Phone par install karein

---

## Quick Start Commands

```bash
# Development server start (Expo Go ke liye)
npm start

# Android emulator ke liye (agar Android Studio installed hai)
npm run android

# Specific Android device ke liye
npx expo start --android

# Tunnel mode (different networks)
npx expo start --tunnel
```

---

## Troubleshooting

### Problem: QR Code Scan nahi ho raha
**Solution:**
- Same WiFi network check karein
- Firewall settings check karein
- Tunnel mode try karein: `npx expo start --tunnel`

### Problem: App load nahi ho rahi
**Solution:**
- Internet connection check karein
- Expo Go app update karein
- Cache clear karein: `npx expo start -c`

### Problem: Camera permission error
**Solution:**
- Phone settings mein app permissions check karein
- Camera permission manually enable karein

### Problem: Build fail ho raha hai
**Solution:**
- EAS account check karein: `eas whoami`
- Build logs check karein: `eas build:list`

---

## Requirements

- **Android Version:** Android 6.0 (API 23) ya higher
- **Expo Go:** Latest version from Play Store
- **Internet:** Required for development builds
- **Permissions:** Camera, Location, Storage

---

## Notes

- **Expo Go** sirf development/testing ke liye hai
- Production ke liye **APK build** karein
- Camera aur location features ke liye proper permissions required hain
- First time build slow ho sakta hai (15-20 minutes)

---

## Support

Agar koi problem aaye to:
1. Terminal mein error check karein
2. Expo Go app logs check karein
3. EAS build logs check karein: `eas build:list`

