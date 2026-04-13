# 🌐 Ngrok Setup Guide - Make QR Codes Work Anywhere!

This guide will help you expose your SmartCampus app to the internet so QR codes work from any WiFi or mobile data.

---

## 📋 Quick Setup (5 Minutes)

### Step 1: Install Ngrok

1. **Download Ngrok:**
   - Visit: https://ngrok.com/download
   - Click "Download for Windows"
   - Extract the zip file
   - Move `ngrok.exe` to: `C:\Users\Lenovo\ngrok\`

2. **Verify Installation:**
   ```powershell
   C:\Users\Lenovo\ngrok\ngrok.exe version
   ```

### Step 2: Get Ngrok Authtoken (FREE)

1. Sign up at: https://dashboard.ngrok.com/signup
2. Copy your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken
3. Open `ngrok.yml` in this project folder
4. Replace `YOUR_AUTHTOKEN_HERE` with your actual token

### Step 3: Start Your App

1. **Start Backend:**
   ```powershell
   cd backend
   .\gradlew bootRun
   ```

2. **Start Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Start Ngrok Tunnels:**
   - Double-click `start-ngrok.bat`
   - OR run in PowerShell:
     ```powershell
     C:\Users\Lenovo\ngrok\ngrok.exe start --all --config=ngrok.yml
     ```

### Step 4: Get Your Public URLs

After starting ngrok, you'll see output like:

```
Forwarding  https://abc123.ngrok.io -> http://localhost:5173  (frontend)
Forwarding  https://def456.ngrok.io -> http://localhost:8080  (backend)
```

**Copy these URLs!** You'll need them for the next step.

### Step 5: Update Your App Configuration

#### A. Update Frontend (.env file)

Open `frontend\.env` and replace with your FRONTEND ngrok URL:

```env
VITE_NETWORK_URL=https://abc123.ngrok.io
VITE_API_URL=https://def456.ngrok.io
```

#### B. Update Backend (SecurityConfig.java)

Open `backend/src/main/java/com/smartcampus/security/SecurityConfig.java`

Find the `corsConfigurationSource()` method and add your FRONTEND ngrok URL:

```java
configuration.setAllowedOrigins(List.of(
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.193:5173",
    "https://abc123.ngrok.io"  // Add this line with your frontend ngrok URL
));
```

#### C. Update axios.js

Open `frontend/src/api/axios.js` and update the baseURL logic:

```javascript
// In the request interceptor, add:
if (hostname.includes('ngrok.io')) {
    config.baseURL = 'https://def456.ngrok.io'; // Your backend ngrok URL
}
```

### Step 6: Restart Frontend

```powershell
# Stop frontend (Ctrl+C)
# Start again
cd frontend
npm run dev
```

---

## ✅ Testing

1. **On Computer:**
   - Open: https://abc123.ngrok.io (your frontend ngrok URL)
   - Login and navigate to Bookings

2. **On Phone (Any WiFi or Mobile Data):**
   - Open: https://abc123.ngrok.io
   - Scan QR code
   - QR code should open verification page!

---

## 🎯 Important Notes

### Free Tier Limitations:
- ✅ Works from anywhere (globally)
- ✅ 2 simultaneous tunnels (perfect for backend + frontend)
- ⚠️ URLs change every time you restart ngrok
- ⚠️ 60 requests/minute limit

### URL Changes:
Every time you restart ngrok, you get **new URLs**. You'll need to update:
1. `frontend\.env`
2. `backend/...SecurityConfig.java`
3. `frontend/src/api/axios.js`

To avoid this, upgrade to ngrok paid plan ($8/month) for fixed URLs.

---

## 🚀 Daily Use Workflow

1. Start backend → Start frontend → **Start ngrok**
2. Copy new ngrok URLs
3. Update configuration files
4. Restart frontend
5. Share frontend URL with anyone!

---

## 🆘 Troubleshooting

**"ERROR: authtoken not found"**
- Edit `ngrok.yml` and add your authtoken

**"Tunnel not found"**
- Make sure backend (8080) and frontend (5173) are running first

**"CORS error"**
- Check SecurityConfig.java has the correct ngrok URL
- Restart backend after changing CORS

**"QR code doesn't open"**
- Make sure QR codes are regenerated AFTER starting ngrok
- They should contain the ngrok URL, not localhost

---

## 🌐 Alternative: Deploy to Cloud (Permanent Solution)

For permanent URLs without restarting, consider deploying to:
- **Frontend**: Vercel, Netlify (FREE)
- **Backend**: Railway, Render, Heroku (FREE tier)
- **Database**: MongoDB Atlas (FREE)

This gives you permanent URLs like:
- Frontend: https://smartcampus.vercel.app
- Backend: https://smartcampus-api.railway.app

---

**Need help?** Check the ngrok dashboard: https://dashboard.ngrok.com
