# API Configuration Guide

## Expo Go Network Setup

For Expo Go to connect to your backend API, you need to configure the correct IP address.

### Steps:

1. **Find your computer's IP address:**
   - **Windows**: Open Command Prompt and run `ipconfig`
     - Look for "IPv4 Address" under your active network adapter
     - Example: `192.168.1.100`
   - **Mac/Linux**: Open Terminal and run `ifconfig` or `ip addr`
     - Look for your network interface (usually `en0` or `wlan0`)
     - Example: `192.168.1.100`

2. **Update API URL in `services/api.ts`:**
   
   For **Physical Device (Expo Go)**:
   ```typescript
   // Replace with your computer's IP address
   return 'http://192.168.1.100:8000'; // UPDATE THIS
   ```
   
   For **Android Emulator**:
   ```typescript
   return 'http://10.0.2.2:8000'; // Already configured
   ```
   
   For **iOS Simulator**:
   ```typescript
   return 'http://localhost:8000'; // Already configured
   ```

3. **Make sure:**
   - Your backend server is running on port 8000
   - Your phone and computer are on the same WiFi network
   - Firewall allows connections on port 8000

### Quick Fix:

1. Open `CraftedConnect/services/api.ts`
2. Find the `getApiBaseUrl()` function
3. For physical devices, uncomment and update the IP address line:
   ```typescript
   return 'http://YOUR_IP_ADDRESS:8000'; // Replace YOUR_IP_ADDRESS
   ```

### Testing:

After updating, restart your Expo app:
- Shake device → Reload
- Or press `r` in the terminal

