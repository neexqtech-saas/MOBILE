# API Backend Mapping Verification

Yeh document verify karta hai ki mobile app ki APIs backend URLs se correctly match kar rahi hain.

## ✅ API Mapping Status

### 1. **Attendance Check-In/Check-Out** ✅
- **Backend URL:** `attendance-check/<uuid:userid>` (POST)
- **Mobile App:** `/api/attendance-check/${userId}` (POST)
- **Status:** ✅ Match
- **Method:** `apiService.checkInOut()`
- **Location:** `MOBILE/services/api.ts` (line 436)

---

### 2. **Get Employee Attendance (All Employees)** ✅
- **Backend URL:** `employee-attendance/<uuid:admin_id>` (GET)
- **Mobile App:** `/api/employee-attendance/${adminId}?date=${date}` (GET)
- **Status:** ✅ Match
- **Method:** `apiService.getAttendanceByDate()`
- **Location:** `MOBILE/services/api.ts` (line 522)
- **Query Params:** `date` (required) ✅

---

### 3. **Get Employee Attendance (Specific User)** ✅
- **Backend URL:** `employee-attendance/<uuid:admin_id>/<uuid:user_id>` (GET)
- **Mobile App:** `/api/employee-attendance/${adminId}/${userId}?date=${date}` (GET)
- **Status:** ✅ Match
- **Method:** `apiService.getUserAttendanceByDate()`
- **Location:** `MOBILE/services/api.ts` (line 533)
- **Query Params:** `date` (required) ✅
- **Used In:**
  - `fetchTodayAttendance()` - Today's attendance
  - `fetchAttendanceAfterPunch()` - After check-in/out
  - `fetchAttendanceByDate()` - Date click modal

---

### 4. **Get Monthly Attendance** ✅
- **Backend URL:** `employee-monthly-attendance/<uuid:admin_id>/<uuid:user_id>/<int:month>/<int:year>` (GET)
- **Mobile App:** `/api/employee-monthly-attendance/${adminId}/${userId}/${month}/${year}` (GET)
- **Status:** ✅ Match
- **Method:** `apiService.getMonthlyAttendance()`
- **Location:** `MOBILE/services/api.ts` (line 552)
- **Used In:**
  - `AttendanceScreen.tsx` - Calendar color coding
  - `loadMonthlyAttendance()` function

---

### 5. **Get Attendance History** ✅
- **Backend URL:** `employee-history/<str:org_id>/<str:employee_id>` (GET)
- **Mobile App:** `/api/employee-history/${orgId}/${employeeId}?from_date=${fromDate}&to_date=${toDate}` (GET)
- **Status:** ✅ Match
- **Method:** `apiService.getAttendanceHistory()`
- **Location:** `MOBILE/services/api.ts` (line 469)
- **Query Params:** `from_date`, `to_date` (optional) ✅
- **Note:** Backend expects `str` but UUID strings work fine ✅

---

### 6. **Get Employee Daily Info** ✅
- **Backend URL:** `employee-daily-info/<uuid:admin_id>` (GET)
- **Mobile App:** `/api/employee-daily-info/${adminId}` (GET)
- **Status:** ✅ Match
- **Method:** `apiService.getEmployeeDailyInfo()`
- **Location:** `MOBILE/services/api.ts` (line 562)
- **Query Params:** `date`, `employee_id`, `status` (optional) - Currently not used in mobile app

---

## 📋 Additional APIs (Not in WorkLog URLs)

### 7. **Login API** ✅
- **Backend URL:** (Not in WorkLog URLs - likely in auth app)
- **Mobile App:** `/api/login` (POST)
- **Status:** ✅ Working (assumed in auth app)

### 8. **Session Info API** ✅
- **Backend URL:** (Not in WorkLog URLs - likely in auth app)
- **Mobile App:** `/api/session-info` (GET)
- **Status:** ✅ Working (assumed in auth app)
- **Important:** This API should return `admin_id` field

---

## ⚠️ Important Notes

### 1. **API Prefix**
- Backend URLs me `/api/` prefix nahi hai (Django main urls.py me include hota hai)
- Mobile app me `/api/` prefix use ho raha hai ✅
- Ye correct hai kyunki Django main urls.py me `path('api/', include('worklog.urls'))` hoga

### 2. **Parameter Types**
- Backend expects `<uuid:admin_id>` and `<uuid:user_id>` ✅
- Mobile app UUID strings pass kar raha hai ✅
- Backend expects `<str:org_id>` and `<str:employee_id>` ✅
- Mobile app UUID strings pass kar raha hai (UUID strings work as strings) ✅

### 3. **Query Parameters**
- `date` parameter: Required for attendance APIs ✅
- `from_date`, `to_date`: Optional for history API ✅
- Format: `YYYY-MM-DD` ✅

### 4. **Request Body (Check-In/Out)**
- `marked_by: "mobile"` ✅
- `base64_images: [...]` ✅
- `check_in_latitude`, `check_in_longitude` ✅
- `check_out_latitude`, `check_out_longitude` ✅

---

## 🔍 Current Issues & Solutions

### Issue 1: `adminId` is undefined
- **Problem:** Session info API se `admin_id` nahi aa raha
- **Temporary Fix:** Using `userId` as fallback `adminId`
- **Proper Fix:** Backend `/api/session-info` API me `admin_id` field add karo

### Issue 2: `orgId` missing for attendance history
- **Problem:** `organizationId` undefined hai
- **Temporary Fix:** Using `adminId` as fallback for `orgId`
- **Proper Fix:** Session info API se `organization_id` properly fetch karo

---

## ✅ Verification Checklist

- [x] All API endpoints match backend URLs
- [x] HTTP methods match (GET/POST)
- [x] URL parameters match (admin_id, user_id, etc.)
- [x] Query parameters match (date, from_date, to_date)
- [x] Request body structure matches backend expectations
- [x] Response structure matches backend format
- [ ] `admin_id` properly returned from session-info API
- [ ] `organization_id` properly returned from session-info API

---

## 🚀 Next Steps

1. **Backend API Update Required:**
   - `/api/session-info` API me `admin_id` field add karo
   - `/api/session-info` API me `organization_id` field ensure karo

2. **Mobile App:**
   - All APIs correctly mapped ✅
   - Console logging added for debugging ✅
   - Error handling improved ✅

---

## 📝 API Call Flow

### Login Flow:
1. `POST /api/login` → Get tokens
2. `GET /api/session-info` → Get user details (should include `admin_id`)
3. Set `adminId` in employee state

### Attendance Flow:
1. `POST /api/attendance-check/{userId}` → Check-in/out
2. `GET /api/employee-attendance/{adminId}/{userId}?date={today}` → Fetch updated attendance

### Calendar Flow:
1. `GET /api/employee-monthly-attendance/{adminId}/{userId}/{month}/{year}` → Get present/absent dates
2. `GET /api/employee-attendance/{adminId}/{userId}?date={selectedDate}` → Get date details on click

---

**Last Updated:** Based on WorkLog backend URLs provided

