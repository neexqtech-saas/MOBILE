# Play Store Deployment Guide (Hindi/English)

## ✅ क्या आपका Project Play Store पर Deploy हो सकता है?

**हाँ! आपका project Play Store पर deploy हो सकता है।** यह एक Expo project है, जो Play Store के लिए बिल्कुल सही है।

---

## 📋 पूर्व-आवश्यकताएं (Prerequisites)

### 1. Expo Account
- Expo account बनाएं: https://expo.dev/signup
- Login करें: `npx expo login`

### 2. Google Play Console Account
- Google Play Console account बनाएं: https://play.google.com/console
- **$25 one-time fee** चुकानी होगी (developer registration के लिए)

### 3. EAS CLI Install करें
```bash
npm install -g eas-cli
```

---

## 🚀 Step-by-Step Deployment Process

### Step 1: EAS CLI Setup

```bash
cd MOBILE
npx eas login
npx eas build:configure
```

### Step 2: Project Configuration Check

✅ **अब तक completed:**
- ✅ Android permissions added (Camera, Location, etc.)
- ✅ Android version code set (versionCode: 1)
- ✅ Package name configured (com.hrmspro.app)
- ✅ EAS configuration file (eas.json) created

### Step 3: Build Production APK/AAB

**Option A: App Bundle (Recommended - Play Store के लिए)**
```bash
npx eas build --platform android --profile production
```

**Option B: APK (Testing के लिए)**
```bash
npx eas build --platform android --profile preview
```

### Step 4: Google Play Console Setup

1. **New App Create करें:**
   - https://play.google.com/console पर जाएं
   - "Create app" बटन पर क्लिक करें
   - App name: "neexQ hrms"
   - Default language: Hindi/English
   - App type: App
   - Free/Paid: चुनें

2. **App Details Fill करें:**
   - App description
   - Screenshots (minimum 2)
   - Feature graphic (1024x500px)
   - App icon (512x512px)
   - Privacy Policy URL (जरूरी है)

### Step 5: Upload App Bundle

1. Build complete होने के बाद, download link मिलेगा
2. Google Play Console → Production → Create new release
3. App Bundle (.aab file) upload करें
4. Release notes add करें
5. Review करें और Submit करें

### Step 6: Submit for Review

- Internal testing → Testing करें
- Closed testing → Beta testers के साथ test करें
- Open testing → Public beta
- Production → Final release

---

## 📝 Important Notes

### Version Management

हर नए release के लिए `app.json` में version update करें:

```json
{
  "expo": {
    "version": "1.0.1",  // User-facing version (X.Y.Z format)
    "android": {
      "versionCode": 2  // Increment by 1 for each release
    }
  }
}
```

### Permissions

Current permissions:
- ✅ CAMERA (Attendance selfie के लिए)
- ✅ LOCATION (Location tracking के लिए)
- ✅ STORAGE (Image storage के लिए)
- ✅ INTERNET (API calls के लिए)

### Package Name

**Important:** Package name `com.hrmspro.app` है। इसे change न करें क्योंकि:
- Play Store पर unique होना चाहिए
- Change करने से नया app बनाना पड़ेगा

---

## 🔧 Build Commands

### Development Build
```bash
npx eas build --profile development --platform android
```

### Preview/Testing Build
```bash
npx eas build --profile preview --platform android
```

### Production Build (Play Store)
```bash
npx eas build --profile production --platform android
```

### Local Build (Optional)
```bash
npx eas build --profile production --platform android --local
```

---

## 📱 Build Status Check

```bash
# Check build status
npx eas build:list

# View specific build
npx eas build:view [BUILD_ID]
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Build Fails
**Solution:** 
- Check `eas.json` configuration
- Verify all permissions are correct
- Check app.json for syntax errors

### Issue 2: Package Name Already Exists
**Solution:**
- `app.json` में `android.package` change करें
- Unique package name use करें (e.g., `com.yourcompany.hrmspro`)

### Issue 3: Version Code Conflict
**Solution:**
- हर release में `versionCode` को increment करें
- Auto-increment enabled है `eas.json` में

### Issue 4: Missing Permissions
**Solution:**
- `app.json` में required permissions add करें
- App को rebuild करें

---

## 🎯 Quick Deployment Checklist

- [ ] Expo account बनाया और login किया
- [ ] EAS CLI installed
- [ ] `eas build:configure` run किया
- [ ] Google Play Console account बनाया ($25 paid)
- [ ] Production build created (`npx eas build --platform android --profile production`)
- [ ] App details filled (description, screenshots, privacy policy)
- [ ] App Bundle (.aab) uploaded to Play Console
- [ ] Release notes added
- [ ] Submitted for review

---

## 📞 Support

- Expo Docs: https://docs.expo.dev/build/introduction/
- EAS Build: https://docs.expo.dev/build/eas-build/
- Play Console Help: https://support.google.com/googleplay/android-developer

---

## 🎉 Next Steps After Approval

1. App approved होने के बाद Play Store पर live होगा
2. Users download कर सकेंगे
3. Updates के लिए नया build upload करें
4. Analytics देखने के लिए Play Console use करें

---

**तैयार हैं? चलिए deploy करते हैं! 🚀**

