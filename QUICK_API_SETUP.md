# Quick API Setup - 5 Minutes

## 🚀 Fastest Way to Connect Backend APIs

### Step 1: Backend Start (1 minute)

```bash
# Backend folder mein jayein
cd YOUR_BACKEND_FOLDER

# Server start karein
python manage.py runserver 0.0.0.0:8000
```

✅ **Verify:** Browser mein `http://localhost:8000/api/login` open karein - response aana chahiye

---

### Step 2: Find Your IP (30 seconds)

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" - e.g., 192.168.10.41
```

**Mac/Linux:**
```bash
ifconfig
# Look for inet address - e.g., 192.168.10.41
```

---

### Step 3: Update Mobile App (30 seconds)

`MOBILE/services/api.ts` file open karein, line 9:

```typescript
const YOUR_COMPUTER_IP = '192.168.10.41'; // YAHAN APNA IP DAALEN
```

💾 **Save** karein

---

### Step 4: Start Mobile App (1 minute)

```bash
cd MOBILE
npm start
```

📱 Expo Go app mein QR code scan karein

---

### Step 5: Test (2 minutes)

1. **Login screen** par jayein
2. Username/password enter karein
3. **Login** button click karein
4. Console logs check karein:
   ```
   ✅ "🚀 API Base URL: http://192.168.10.41:8000"
   ✅ "📡 API CALL STARTED"
   ✅ "✅ API request successful"
   ```

---

## ✅ Success Checklist

- [ ] Backend server running (`0.0.0.0:8000`)
- [ ] IP address updated in `api.ts`
- [ ] Mobile app started
- [ ] QR code scanned
- [ ] Login successful
- [ ] Console logs show API calls

---

## 🐛 Quick Troubleshooting

**Problem:** "Network request failed"
- ✅ Backend running hai? `python manage.py runserver 0.0.0.0:8000`
- ✅ IP address correct hai?
- ✅ Same WiFi network?

**Problem:** "Cannot connect"
- ✅ Firewall port 8000 allow karein
- ✅ Server `0.0.0.0:8000` par run ho raha hai?

**Problem:** "401 Unauthorized"
- ✅ Login phir se karein
- ✅ Token refresh check karein

---

## 📞 Need Help?

Complete guide: `API_INTEGRATION_GUIDE.md`

