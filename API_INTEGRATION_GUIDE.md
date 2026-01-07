# Backend API Integration Guide - Mobile App

## 📋 Overview

Yeh guide backend APIs ko mobile app mein properly integrate karne ke liye complete steps deta hai.

---

## 🔧 Step 1: Backend Server Setup

### 1.1 Backend Server Start Karein

```bash
# Django backend folder mein jayein
cd YOUR_BACKEND_FOLDER

# Server start karein (ALL network interfaces par)
python manage.py runserver 0.0.0.0:8000
```

⚠️ **Important:** `0.0.0.0:8000` use karein, `localhost:8000` nahi (mobile devices connect nahi kar payenge)

### 1.2 Django Settings Update

`settings.py` mein ye ensure karein:

```python
ALLOWED_HOSTS = ['*']  # Development ke liye
# Production mein specific hosts add karein

CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",
    "http://192.168.10.41:8081",  # Your IP
    # Add other origins as needed
]

CORS_ALLOW_ALL_ORIGINS = True  # Development ke liye
```

---

## 📱 Step 2: Mobile App API Configuration

### 2.1 IP Address Update

`MOBILE/services/api.ts` file mein line 9 par apna IP address update karein:

```typescript
const YOUR_COMPUTER_IP = '192.168.10.41'; // UPDATE THIS
```

**IP address kaise find karein:**
- **Windows:** `ipconfig` run karein
- **Mac/Linux:** `ifconfig` ya `ip addr` run karein

### 2.2 API Base URL Auto-Detection

Current setup automatically detect karta hai:
- **Expo Go (Physical Device):** `http://YOUR_IP:8000`
- **Android Emulator:** `http://10.0.2.2:8000`
- **iOS Simulator:** `http://localhost:8000`
- **Web:** `http://localhost:8000`

---

## 🔌 Step 3: Integrated APIs List

### ✅ Currently Integrated APIs (9 APIs)

#### Authentication APIs (2)
1. **Login API** - `POST /api/login`
2. **Session Info API** - `GET /api/session-info`

#### Attendance APIs (7)
3. **Check In/Out API** - `POST /api/attendance-check/{userId}`
4. **Get Today's Attendance** - `GET /api/employee-attendance/{adminId}/{userId}?date=YYYY-MM-DD`
5. **Get Attendance History** - `GET /api/employee-history/{orgId}/{employeeId}?from_date=...&to_date=...`
6. **Get Monthly Attendance** - `GET /api/employee-monthly-attendance/{adminId}/{userId}/{month}/{year}`
7. **Get Attendance by Date** - `GET /api/employee-attendance/{adminId}?date=YYYY-MM-DD`
8. **Get User Attendance by Date** - `GET /api/employee-attendance/{adminId}/{userId}?date=YYYY-MM-DD`
9. **Get Employee Daily Info** - `GET /api/employee-daily-info/{adminId}`

#### Organization APIs (2)
10. **Get Organization Settings** - `GET /api/organization-settings/{organizationId}`
11. **Toggle Is Photo Updated** - `POST /api/is-photo-updated/{userId}`

#### Profile APIs (1)
12. **Upload Profile Photo** - `POST /api/employee/profile-photo-upload/{userId}`

---

## 🚀 Step 4: API Integration Testing

### 4.1 Test API Connection

```bash
# Mobile app start karein
cd MOBILE
npm start

# Expo Go app mein QR code scan karein
# Console logs check karein:
# ✅ "🚀 API Base URL: http://192.168.10.41:8000"
# ✅ "📱 Platform: android"
```

### 4.2 Test Login API

1. Login screen par jayein
2. Username/password enter karein
3. Console logs check karein:
   ```
   📡 Making API request to: POST /api/login
   ✅ API request successful
   ```

### 4.3 Test Attendance API

1. Home screen par jayein
2. Check-in button click karein
3. Selfie capture karein
4. Console logs check karein:
   ```
   📡 Making API request to: POST /api/attendance-check/...
   ✅ API request successful
   ```

---

## 📝 Step 5: API Request/Response Format

### Login API Example

**Request:**
```typescript
POST /api/login
Body: {
  "username": "employee123",
  "password": "password123"
}
```

**Response:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_id": "758139e0-c525-4216-9b32-63ad72ab1c7a",
  "role": "user"
}
```

### Check-In API Example

**Request:**
```typescript
POST /api/attendance-check/{userId}
Headers: {
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
Body: {
  "marked_by": "mobile",
  "base64_images": ["data:image/png;base64,iVBORw0KG..."],
  "check_in_latitude": 28.6139,
  "check_in_longitude": 77.2090
}
```

**Response:**
```json
{
  "detail": "Check-in successful"
}
```

---

## 🔍 Step 6: API Error Handling

### Common Errors & Solutions

#### Error 1: Network Request Failed
**Problem:** Backend server connect nahi ho raha

**Solution:**
1. Backend server running hai? `python manage.py runserver 0.0.0.0:8000`
2. IP address correct hai? `services/api.ts` mein check karein
3. Same WiFi network? Phone aur computer same network par hone chahiye
4. Firewall check karein: Port 8000 allow hai?

#### Error 2: 401 Unauthorized
**Problem:** Access token invalid ya expired

**Solution:**
1. Logout karein aur phir login karein
2. Token refresh check karein
3. Backend CORS settings check karein

#### Error 3: 404 Not Found
**Problem:** API endpoint wrong hai

**Solution:**
1. Backend URLs check karein
2. API prefix `/api/` correct hai?
3. Backend server logs check karein

#### Error 4: 500 Internal Server Error
**Problem:** Backend mein error hai

**Solution:**
1. Backend server logs check karein
2. Database connection check karein
3. Backend code check karein

---

## 🛠️ Step 7: API Integration Checklist

### Pre-Integration Checklist:
- [ ] Backend server running (`python manage.py runserver 0.0.0.0:8000`)
- [ ] IP address updated (`services/api.ts` line 9)
- [ ] Django `ALLOWED_HOSTS` configured
- [ ] CORS settings enabled
- [ ] Firewall port 8000 allow kiya
- [ ] Phone aur computer same WiFi par hain

### Integration Checklist:
- [ ] Login API working
- [ ] Session Info API working
- [ ] Check-In API working
- [ ] Check-Out API working
- [ ] Attendance fetch APIs working
- [ ] Organization settings API working
- [ ] Profile photo upload API working

### Testing Checklist:
- [ ] Login successful
- [ ] Session info fetch successful
- [ ] Check-in with selfie successful
- [ ] Check-out with selfie successful
- [ ] Today's attendance fetch successful
- [ ] Attendance history fetch successful
- [ ] Monthly attendance fetch successful
- [ ] Organization settings fetch successful
- [ ] Profile photo upload successful

---

## 📊 Step 8: API Monitoring & Debugging

### Console Logs Check Karein

Mobile app console mein ye logs dikhne chahiye:

```
🚀 API Base URL: http://192.168.10.41:8000
📱 Platform: android
🔧 App Ownership: expo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 API REQUEST SENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 Endpoint: /api/login
📌 Method: POST
✅ Status: 200
📦 Response Data: {...}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Network Tab Check (Web)

Web platform par browser DevTools → Network tab mein:
- API requests dikhenge
- Request/Response details check kar sakte hain
- Status codes check kar sakte hain

---

## 🔐 Step 9: Authentication Flow

### Complete Flow:

1. **Login:**
   ```
   POST /api/login
   → Get access_token, refresh_token, user_id, role
   → Store in AsyncStorage
   ```

2. **Session Info:**
   ```
   GET /api/session-info
   → Get user details (name, email, admin_id, org_id, etc.)
   → Store in Zustand store
   ```

3. **API Calls:**
   ```
   All subsequent API calls use Bearer token:
   Authorization: Bearer {access_token}
   ```

4. **Token Refresh:**
   ```
   If token expires, use refresh_token to get new access_token
   ```

---

## 📱 Step 10: Mobile App API Usage

### Store Integration (`store/hrmsStore.ts`)

```typescript
// Login
const result = await apiService.login(username, password);

// Session Info
const sessionInfo = await apiService.getSessionInfo();

// Check In
const result = await apiService.checkInOut(userId, images, lat, lng, true);

// Check Out
const result = await apiService.checkInOut(userId, images, lat, lng, false);

// Fetch Today's Attendance
await apiService.getUserAttendanceByDate(adminId, userId, today);

// Fetch Attendance History
await apiService.getAttendanceHistory(orgId, userId, fromDate, toDate);

// Fetch Monthly Attendance
await apiService.getMonthlyAttendance(adminId, userId, month, year);

// Fetch Organization Settings
await apiService.getOrganizationSettings(organizationId);

// Upload Profile Photo
await apiService.uploadProfilePhoto(userId, base64Image);

// Toggle Is Photo Updated
await apiService.toggleIsPhotoUpdated(userId);
```

---

## 🎯 Quick Start Commands

```bash
# 1. Backend start karein
cd BACKEND_FOLDER
python manage.py runserver 0.0.0.0:8000

# 2. Mobile app start karein (new terminal)
cd MOBILE
npm start

# 3. Expo Go app mein QR code scan karein
# 4. Test karein - Login karein aur check-in karein
```

---

## 📞 Support & Troubleshooting

### Common Issues:

1. **"Network request failed"**
   - Backend server check karein
   - IP address check karein
   - WiFi network check karein

2. **"Cannot connect to server"**
   - Firewall check karein
   - Port 8000 allow karein
   - Server `0.0.0.0:8000` par run ho raha hai?

3. **"401 Unauthorized"**
   - Login phir se karein
   - Token refresh check karein

### Debug Commands:

```bash
# Check if server is listening
netstat -an | findstr :8000  # Windows
netstat -an | grep :8000      # Mac/Linux

# Test API from phone browser
http://YOUR_IP:8000/api/login
```

---

## ✅ Success Indicators

Agar sab kuch sahi hai to:
- ✅ Login successful
- ✅ Session info fetch successful
- ✅ Check-in/out successful
- ✅ Attendance data load ho raha hai
- ✅ Console logs proper dikh rahe hain
- ✅ No network errors

---

**Last Updated:** Complete API integration guide with all endpoints

