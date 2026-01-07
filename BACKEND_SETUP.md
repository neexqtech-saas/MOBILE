# Backend Server Setup for Mobile App

## Problem
Backend server is only listening on `127.0.0.1:8000` (localhost only), so mobile devices can't connect.

## Solution

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually WiFi or Ethernet).
Example: `192.168.10.41`

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```
Look for your network interface (usually `en0` or `wlan0`).

### Step 2: Update IP Address in Mobile App

Open `MOBILE/services/api.ts` and update line 8:
```typescript
const YOUR_COMPUTER_IP = '192.168.10.41'; // UPDATE THIS with your computer's IP address
```

### Step 3: Run Backend Server on All Network Interfaces

**For Django Backend:**

1. **Run server on all network interfaces:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
   
   ⚠️ **Important:** Don't use:
   ```bash
   python manage.py runserver  # This only listens on 127.0.0.1
   ```

2. **Update Django settings.py to allow all hosts:**
   ```python
   ALLOWED_HOSTS = ['*']  # For development only
   # Or specific IPs:
   # ALLOWED_HOSTS = ['192.168.10.41', 'localhost', '127.0.0.1']
   ```

### Step 4: Check Windows Firewall

1. Open **Windows Defender Firewall**
2. Click **Advanced Settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → **Next**
5. Select **TCP** and enter port **8000** → **Next**
6. Select **Allow the connection** → **Next**
7. Check all profiles → **Next**
8. Name it "Django Dev Server" → **Finish**

Or temporarily disable firewall for testing.

### Step 5: Verify Server is Listening

After starting server, check:
```bash
netstat -an | findstr :8000
```

✅ **You should see:**
```
TCP    0.0.0.0:8000         0.0.0.0:0              LISTENING
```

❌ **Wrong (won't work):**
```
TCP    127.0.0.1:8000         0.0.0.0:0              LISTENING
```

### Step 6: Test Connection

1. **From your phone's browser**, try:
   ```
   http://192.168.10.41:8000/api/login
   ```
   You should see a JSON response or error (not "Site can't be reached").

2. **From your computer's browser**, try:
   ```
   http://192.168.10.41:8000/api/login
   ```
   Both should work if server is configured correctly.

## Troubleshooting

### Issue: "Network request failed" or "Cannot connect to server"

**Checklist:**
1. ✅ Backend server is running: `python manage.py runserver 0.0.0.0:8000`
2. ✅ IP address is correct in `MOBILE/services/api.ts`
3. ✅ Phone and computer are on **same WiFi network**
4. ✅ Firewall allows port 8000
5. ✅ Server is listening on `0.0.0.0:8000` (check with `netstat`)

### Issue: "Site can't be reached" from phone browser

- **Backend not running:** Start Django server
- **Wrong IP:** Check IP with `ipconfig` and update in `api.ts`
- **Different WiFi:** Make sure phone and computer are on same network
- **Firewall blocking:** Allow port 8000 in Windows Firewall

### Issue: API calls work from browser but not from app

- **Check Expo Go console logs:** Look for API URL being used
- **Verify IP in logs:** Should show `http://192.168.10.41:8000`
- **Check app ownership:** Should show `expo` for Expo Go
- **Restart Expo:** Shake device → Reload, or press `r` in terminal

### Issue: IP address keeps changing

- Use a static IP address on your computer
- Or update IP in `api.ts` each time it changes
- Consider using a tool to automatically detect IP

## Quick Fix Checklist:

1. ✅ Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. ✅ Update IP in `MOBILE/services/api.ts` (line 8)
3. ✅ Stop Django server (Ctrl+C)
4. ✅ Run: `python manage.py runserver 0.0.0.0:8000`
5. ✅ Verify: `netstat -an | findstr :8000` shows `0.0.0.0:8000`
6. ✅ Test: Open `http://YOUR_IP:8000/api/login` in phone browser
7. ✅ Restart Expo app: Shake device → Reload

## Testing API Connection

You can test the API connection by:

1. **Login Screen:** Try logging in - check console logs for errors
2. **Home Screen:** Check if attendance data loads
3. **Console Logs:** Look for these messages:
   - `🚀 API Base URL: http://192.168.10.41:8000`
   - `📱 Platform: android` or `ios`
   - `🔧 App Ownership: expo`
   - `📡 Making API request to: ...`
   - `✅ API request successful` or `❌ Network Error: ...`

