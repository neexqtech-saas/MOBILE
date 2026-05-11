# Firebase Cloud Messaging (FCM) Setup Guide

## Overview
Yeh guide direct Google FCM token get karne ke liye hai (Expo Push Token nahi).

## Important Notes
⚠️ **Development Build Required**: Direct FCM token sirf development build mein kaam karega, Expo Go mein nahi.

## Step 1: Firebase Console Setup

1. **Firebase Console mein jao**: https://console.firebase.google.com/
2. **Project create karo** ya existing project select karo
3. **Android app add karo**:
   - Package name: `com.hrmspro.app` (app.json se)
   - Download `google-services.json`
4. **iOS app add karo** (agar iOS support chahiye):
   - Bundle ID: `com.hrmspro.app`
   - Download `GoogleService-Info.plist`

## Step 2: Firebase Config Files Add Karein

1. **Android**: `google-services.json` ko `MOBILE/` folder mein copy karo
2. **iOS**: `GoogleService-Info.plist` ko `MOBILE/` folder mein copy karo

## Step 3: Development Build Banao

Expo Go se direct FCM token nahi milega. Development build banana hoga:

```bash
# Android development build
npm run build:android:preview

# Ya EAS se
eas build --platform android --profile development
```

## Step 4: Code Already Updated ✅

Code already update ho chuka hai:
- ✅ Firebase packages installed (`@react-native-firebase/app`, `@react-native-firebase/messaging`)
- ✅ `app.json` mein Firebase plugin add ho gaya
- ✅ `getFcmToken()` function update ho gaya - pehle native FCM try karega, phir Expo Push Token fallback

## Step 5: Backend Setup (Firebase Admin SDK)

Backend mein Firebase Admin SDK use karein:

### Install Firebase Admin SDK
```bash
pip install firebase-admin
```

### Backend Code Example
```python
# Backend/core/utils/fcm_notifications.py
import firebase_admin
from firebase_admin import credentials, messaging
import os
from django.conf import settings

# Initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        cred_path = os.path.join(settings.BASE_DIR, 'firebase_service_account.json')
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

def send_fcm_notification(fcm_token, title, body, data=None):
    """
    Send FCM notification using native FCM token
    """
    try:
        initialize_firebase()
        
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=fcm_token,  # Direct FCM token (not Expo Push Token)
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    sound='default',
                    channel_id='task_notifications',
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound='default',
                        badge=1,
                    ),
                ),
            ),
        )
        
        response = messaging.send(message)
        print(f'Successfully sent FCM notification: {response}')
        return True
        
    except Exception as e:
        print(f'Error sending FCM notification: {str(e)}')
        return False
```

## Step 6: Firebase Service Account Setup

1. Firebase Console > Project Settings > Service Accounts
2. "Generate new private key" click karo
3. JSON file download karo
4. Backend mein `firebase_service_account.json` naam se save karo

## Token Format

### Before (Expo Push Token):
```
ExponentPushToken[WZeU37DjC2Uj7VuZZX8z4t]
```

### After (Native FCM Token):
```
dKx8Yz9... (long alphanumeric string, ~152 characters)
```

## Testing

1. Development build install karo phone par
2. Login karo - FCM token automatically update hoga
3. Backend se notification send karo - direct FCM token use karke

## Fallback Behavior

Agar Firebase setup nahi hai ya Expo Go use kar rahe ho:
- Code automatically Expo Push Token use karega (fallback)
- Development build mein native FCM token milega

## Troubleshooting

1. **Token `ExponentPushToken[...]` format mein hai**:
   - Development build install karo (Expo Go se nahi chalega)
   - Firebase config files (`google-services.json`) add karo

2. **Firebase error**:
   - Check karo ki `google-services.json` sahi location mein hai
   - `app.json` mein plugin properly configured hai

3. **Permissions error**:
   - Phone settings mein notification permissions enable karo

## Notes

- Development build ke baad hi native FCM token milega
- Expo Go mein Expo Push Token hi milega (fallback)
- Backend mein Firebase Admin SDK use karein direct FCM notifications ke liye

