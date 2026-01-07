# Mobile App - Integrated APIs List

Yeh document mobile app me integrated sabhi APIs ki complete list hai.

## 📋 Total APIs: 9

---

## 🔐 Authentication APIs (2)

### 1. **Login API**
- **Endpoint:** `POST /api/login`
- **Method:** `apiService.login()`
- **Location:** `MOBILE/services/api.ts` (line 345)
- **Used In:** 
  - `MOBILE/store/hrmsStore.ts` - `login()` function (line 391)
  - `MOBILE/screens/LoginScreen.tsx`
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "refresh_token": "string",
    "access_token": "string",
    "user_id": "string",
    "role": "string"
  }
  ```
- **Authentication Required:** ❌ No

---

### 2. **Session Info API**
- **Endpoint:** `GET /api/session-info`
- **Method:** `apiService.getSessionInfo()`
- **Location:** `MOBILE/services/api.ts` (line 353)
- **Used In:**
  - `MOBILE/store/hrmsStore.ts` - `login()` function (line 403)
  - `MOBILE/store/hrmsStore.ts` - `checkAuth()` function (line 483)
- **Purpose:** User profile data fetch karta hai (name, email, admin_id, org_id, etc.)
- **Response:**
  ```json
  {
    "success": true,
    "status": 200,
    "message": "string",
    "data": {
      "user_id": "string",
      "email": "string",
      "username": "string",
      "role": "string",
      "user_name": "string",
      "admin_id": "string",
      "organization_id": "string",
      "designation": "string",
      "job_title": "string"
    }
  }
  ```
- **Authentication Required:** ✅ Yes (Bearer Token)

---

## ⏰ Attendance APIs (7)

### 3. **Check In / Check Out API**
- **Endpoint:** `POST /api/attendance-check/{userId}`
- **Method:** `apiService.checkInOut()`
- **Location:** `MOBILE/services/api.ts` (line 360)
- **Used In:**
  - `MOBILE/store/hrmsStore.ts` - `checkIn()` function (line 547)
  - `MOBILE/store/hrmsStore.ts` - `checkOut()` function (line 565)
  - `MOBILE/screens/HomeScreen.tsx` - `handlePunch()` function (line 563)
- **Request Body:**
  ```json
  {
    "marked_by": "mobile",
    "base64_images": ["data:image/png;base64,..."],
    "check_in_latitude": 28.6139,
    "check_in_longitude": 77.2090,
    "check_out_latitude": 28.6139,
    "check_out_longitude": 77.2090
  }
  ```
- **Features:**
  - ✅ Selfie capture (base64 image)
  - ✅ Location tracking (latitude/longitude)
  - ✅ Automatic check-in/check-out detection
- **Response:**
  ```json
  {
    "detail": "Check-in successful" or "Check-out successful"
  }
  ```
- **Authentication Required:** ✅ Yes (Bearer Token)

---

### 4. **Get Today's Attendance API**
- **Endpoint:** `GET /api/employee-attendance/{adminId}/{userId}?date=YYYY-MM-DD`
- **Method:** `apiService.getUserAttendanceByDate()`
- **Location:** `MOBILE/services/api.ts` (line 456)
- **Used In:**
  - `MOBILE/store/hrmsStore.ts` - `fetchTodayAttendance()` function (line 590)
  - `MOBILE/store/hrmsStore.ts` - `fetchAttendanceAfterPunch()` function (line 698)
  - `MOBILE/screens/HomeScreen.tsx` - Auto-fetch on screen load
- **Purpose:** Aaj ki attendance details fetch karta hai
- **Response:**
  ```json
  {
    "status": 200,
    "message": "string",
    "data": [
      {
        "id": 1,
        "user_id": "uuid",
        "employee_name": "string",
        "attendance_date": "2025-01-15",
        "check_in": "2025-01-15T09:00:00Z",
        "check_out": "2025-01-15T18:00:00Z",
        "last_login_status": "checkin" or "checkout",
        "shift_name": "Morning Shift",
        "production_hours": "8h 30m",
        "attendance_status": "present",
        "multiple_entries": [
          {
            "id": 1,
            "check_in_time": "2025-01-15T09:00:00Z",
            "check_out_time": "2025-01-15T18:00:00Z",
            "total_working_minutes": 510,
            "check_in_image": "url",
            "check_out_image": "url"
          }
        ]
      }
    ]
  }
  ```
- **Authentication Required:** ✅ Yes (Bearer Token)

---

### 5. **Get Attendance History API**
- **Endpoint:** `GET /api/employee-history/{orgId}/{employeeId}?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD`
- **Method:** `apiService.getAttendanceHistory()`
- **Location:** `MOBILE/services/api.ts` (line 393)
- **Used In:**
  - `MOBILE/store/hrmsStore.ts` - `fetchAttendanceHistory()` function (line 795)
  - `MOBILE/screens/AttendanceScreen.tsx` - Attendance history list
- **Purpose:** Date range ke according attendance history fetch karta hai
- **Query Parameters:**
  - `from_date` (optional): Start date
  - `to_date` (optional): End date
- **Response:**
  ```json
  {
    "status": 200,
    "message": "string",
    "data": {
      "results": [
        {
          "id": 1,
          "attendance_date": "2025-01-15",
          "check_in": "2025-01-15T09:00:00Z",
          "check_out": "2025-01-15T18:00:00Z",
          "attendance_status": "present",
          "shift_name": "Morning Shift",
          "production_hours": "8h 30m",
          "multiple_entries": [...]
        }
      ],
      "count": 30,
      "next": "url",
      "previous": "url"
    }
  }
  ```
- **Authentication Required:** ✅ Yes (Bearer Token)

---

### 6. **Get Attendance by Date API**
- **Endpoint:** `GET /api/employee-attendance/{adminId}?date=YYYY-MM-DD`
- **Method:** `apiService.getAttendanceByDate()`
- **Location:** `MOBILE/services/api.ts` (line 446)
- **Used In:**
  - `MOBILE/store/hrmsStore.ts` - `getTodayAttendance()` function (line 422)
- **Purpose:** Specific date ki attendance fetch karta hai (admin ke saare employees ke liye)
- **Authentication Required:** ✅ Yes (Bearer Token)

---

### 7. **Get User Attendance by Date API**
- **Endpoint:** `GET /api/employee-attendance/{adminId}/{userId}?date=YYYY-MM-DD`
- **Method:** `apiService.getUserAttendanceByDate()`
- **Location:** `MOBILE/services/api.ts` (line 456)
- **Used In:**
  - `MOBILE/store/hrmsStore.ts` - `fetchTodayAttendance()` function (line 590)
  - `MOBILE/store/hrmsStore.ts` - `fetchAttendanceAfterPunch()` function (line 698)
  - `MOBILE/store/hrmsStore.ts` - `fetchAttendanceByDate()` function (line 881)
  - `MOBILE/screens/AttendanceScreen.tsx` - Date click par modal me details dikhane ke liye
- **Purpose:** Specific user ki specific date ki attendance fetch karta hai
- **Authentication Required:** ✅ Yes (Bearer Token)

---

### 8. **Get Monthly Attendance API**
- **Endpoint:** `GET /api/employee-monthly-attendance/{adminId}/{userId}/{month}/{year}`
- **Method:** `apiService.getMonthlyAttendance()`
- **Location:** `MOBILE/services/api.ts` (line 466)
- **Used In:**
  - `MOBILE/screens/AttendanceScreen.tsx` - `loadMonthlyAttendance()` function
- **Purpose:** Month aur year ke according present/absent dates fetch karta hai
- **Response:**
  ```json
  {
    "status": 200,
    "message": "string",
    "data": {
      "present": {
        "count": 20,
        "dates": ["2025-01-01", "2025-01-02", ...]
      },
      "absent": {
        "count": 8,
        "dates": ["2025-01-05", "2025-01-06", ...]
      }
    },
    "summary": {
      "employee_id": "uuid",
      "employee_name": "string",
      "month": 1,
      "year": 2025,
      "total_days": 31,
      "present_days": 20,
      "absent_days": 8
    }
  }
  ```
- **Features:**
  - ✅ Calendar me present dates (green) aur absent dates (red) color coding
  - ✅ Monthly summary (total, present, absent days)
- **Authentication Required:** ✅ Yes (Bearer Token)

---

### 9. **Get Employee Daily Info API**
- **Endpoint:** `GET /api/employee-daily-info/{adminId}`
- **Method:** `apiService.getEmployeeDailyInfo()`
- **Location:** `MOBILE/services/api.ts` (line 476)
- **Used In:** Currently not actively used (backup/alternative API)
- **Purpose:** Employee ki daily info fetch karta hai
- **Authentication Required:** ✅ Yes (Bearer Token)

---

## 📊 API Usage Summary

### By Screen:

1. **LoginScreen:**
   - ✅ Login API
   - ✅ Session Info API (after login)

2. **HomeScreen:**
   - ✅ Get Today's Attendance API (on load)
   - ✅ Check In/Out API (punch button)
   - ✅ Get User Attendance by Date API (after punch)

3. **AttendanceScreen:**
   - ✅ Get Monthly Attendance API (calendar color coding)
   - ✅ Get User Attendance by Date API (date click modal)
   - ✅ Get Attendance History API (history list)

### By Feature:

- **Authentication:** 2 APIs
- **Attendance Check In/Out:** 1 API
- **Attendance Fetching:** 6 APIs
- **Total:** 9 APIs

---

## 🔧 API Configuration

- **Base URL:** `http://192.168.10.41:8000` (Expo Go on physical device)
- **Base URL:** `http://10.0.2.2:8000` (Android emulator)
- **Base URL:** `http://localhost:8000` (iOS simulator / Web)
- **Authentication:** Bearer Token (stored in AsyncStorage)
- **Error Handling:** Comprehensive error messages with troubleshooting steps

---

## 📝 Notes

1. **Selfie Capture:** Check-in/check-out me selfie capture mandatory hai
2. **Location Tracking:** Optional location tracking (latitude/longitude)
3. **Multiple Entries:** API support multiple check-in/check-out entries per day
4. **Date Format:** All dates in `YYYY-MM-DD` format
5. **Time Format:** Times displayed as `HH:MM AM/PM`
6. **Total Hours:** Displayed as "X hours Y minutes" format

---

## 🐛 Troubleshooting

Agar API calls fail ho rahe hain, check karo:
1. Backend server running hai: `python manage.py runserver 0.0.0.0:8000`
2. IP address correct hai: `MOBILE/services/api.ts` me line 9
3. Phone aur computer same WiFi par hain
4. Firewall port 8000 allow karta hai
5. Console logs check karo: Detailed error messages dikhenge

Detailed troubleshooting guide: `MOBILE/BACKEND_SETUP.md`

