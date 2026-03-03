# 🚀 Quick Deployment Checklist

Follow these steps to deploy SmartCampus to the cloud:

## ✅ Step 1: MongoDB Atlas Setup (5-10 minutes)

1. **Sign up**: https://www.mongodb.com/cloud/atlas/register
2. **Create free cluster** (M0 tier - FREE forever)
   - Provider: AWS, Google Cloud, or Azure
   - Region: Choose closest to you
   - Cluster name: SmartCampus
3. **Database Access**:
   - Username: `smartcampus`
   - Password: [Generate strong password - SAVE IT!]
4. **Network Access**:
   - Add IP: `0.0.0.0/0` (Allow from anywhere)
5. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the string: `mongodb+srv://smartcampus:<password>@...`
   - Replace `<password>` with your actual password
   - Add database name: `...mongodb.net/SmartCampus?retryWrites=true&w=majority`

**⚠️ SAVE THIS CONNECTION STRING!**

---

## ✅ Step 2: Migrate Data to Cloud (5 minutes)

### Option A: MongoDB Compass (Easiest)
1. Download: https://www.mongodb.com/try/download/compass
2. Connect to LOCAL: `mongodb://localhost:27017`
3. Export each collection:
   - Users → Export to JSON
   - Resources → Export to JSON
   - Bookings → Export to JSON
   - Tickets → Export to JSON
   - Notifications → Export to JSON
4. Connect to ATLAS using your connection string
5. Create database: `SmartCampus`
6. Import each JSON file to corresponding collection

### Option B: Command Line (Faster if you have mongodump)
```powershell
# Export from local
mongodump --uri="mongodb://localhost:27017/SmartCampus" --out="./backup"

# Import to Atlas (replace with YOUR connection string)
mongorestore --uri="mongodb+srv://smartcampus:PASSWORD@cluster.mongodb.net/SmartCampus" ./backup/SmartCampus
```

---

## ✅ Step 3: Push to GitHub (5 minutes)

1. **Create new GitHub repository**:
   - Go to: https://github.com/new
   - Name: `smartcampus` (or any name)
   - Visibility: Public or Private
   - DON'T initialize with README (we already have one)

2. **Push your code**:
```powershell
cd "c:\Users\Lenovo\Desktop\PAF project"

# Add GitHub as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/smartcampus.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## ✅ Step 4: Deploy Backend to Railway (10 minutes)

1. **Sign up**: https://railway.app/ (use GitHub to sign in)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `smartcampus` repository
   - Railway will auto-detect the backend

3. **Configure Service**:
   - Click on the backend service
   - Go to "Settings" tab
   - Root Directory: Leave blank (or set to `backend` if needed)

4. **Add Environment Variables**:
   - Click "Variables" tab
   - Add these variables:

   ```
   MONGODB_URI=mongodb+srv://smartcampus:YOUR_PASSWORD@cluster.mongodb.net/SmartCampus?retryWrites=true&w=majority
   PORT=8080
   FRONTEND_URL=https://smartcampus.vercel.app
   ```

   **Note**: We'll update FRONTEND_URL after deploying frontend

5. **Deploy**:
   - Railway auto-deploys
   - Wait for deployment (check logs for any errors)
   - Once deployed, copy your backend URL:
     - Go to "Settings" → "Networking" → "Generate Domain"
     - Copy the URL (e.g., `https://smartcampus-production.up.railway.app`)

**⚠️ SAVE YOUR BACKEND URL!**

---

## ✅ Step 5: Deploy Frontend to Vercel (5 minutes)

1. **Sign up**: https://vercel.com/signup (use GitHub to sign in)

2. **Create New Project**:
   - Click "Add New" → "Project"
   - Import your `smartcampus` GitHub repository

3. **Configure Build Settings**:
   - Framework Preset: **Vite**
   - Root Directory: **frontend**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variable**:
   - Click "Environment Variables"
   - Add:
     ```
     Name: VITE_API_URL
     Value: https://smartcampus-production.up.railway.app
     ```
     (Use YOUR Railway backend URL from Step 4)

5. **Deploy**:
   - Click "Deploy"
   - Wait for deployment (about 1-2 minutes)
   - Once done, copy your frontend URL (e.g., `https://smartcampus.vercel.app`)

**⚠️ SAVE YOUR FRONTEND URL!**

---

## ✅ Step 6: Update Backend CORS (2 minutes)

1. **Go to Railway**:
   - Open your backend service
   - Click "Variables" tab

2. **Update FRONTEND_URL**:
   - Find `FRONTEND_URL` variable
   - Change from `https://smartcampus.vercel.app` to YOUR actual Vercel URL
   - Example: `https://smartcampus-abc123.vercel.app`

3. **Redeploy**:
   - Railway will auto-redeploy with new environment variable

---

## ✅ Step 7: Test Your App! 🎉

1. **Open your Vercel URL** in browser
   - Example: `https://smartcampus.vercel.app`

2. **Login as Admin**:
   - Click "Admin" button

3. **Create a booking**:
   - Go to Resources
   - Create a booking
   - Approve it

4. **View QR Code**:
   - Go to Bookings
   - See the QR code

5. **Test on Mobile**:
   - Take out your phone (WiFi or Mobile Data - doesn't matter!)
   - Scan the QR code
   - It should open the verification page and check you in! 🎊

---

## 🎯 Your URLs

After deployment, save these URLs:

- **Frontend (Vercel)**: `https://smartcampus-XXXXX.vercel.app`
- **Backend (Railway)**: `https://smartcampus-production-XXXXX.up.railway.app`
- **MongoDB Atlas**: `mongodb+srv://smartcampus:PASSWORD@cluster.mongodb.net/SmartCampus`

---

## 🆘 Troubleshooting

### Backend won't start on Railway
- Check Railway logs: Click on service → "Deployments" → Click latest → "View Logs"
- Common issue: Wrong MongoDB URI (check password, database name)

### Frontend shows "Network Error"
- Check VITE_API_URL in Vercel environment variables
- Make sure it matches your Railway backend URL
- Try redeploying frontend after fixing

### QR codes don't work
- Make sure QR code URLs use your Vercel domain
- Check browser console for errors
- Verify `/api/bookings/verify-qr` endpoint is public in SecurityConfig.java

### "Access Denied" when scanning QR
- Check MongoDB Atlas → Network Access
- Make sure `0.0.0.0/0` is added

---

## 💰 Cost Breakdown

All services are **100% FREE**:
- ✅ MongoDB Atlas: 512MB storage (enough for thousands of bookings)
- ✅ Railway: $5 free credit monthly (500 hours/month)
- ✅ Vercel: 100GB bandwidth/month

Your app will work **forever** on free tier! 🎉

---

## 🌍 Benefits of Cloud Deployment

- ✅ Access from **anywhere in the world**
- ✅ QR codes work on **any WiFi or mobile data**
- ✅ No need to keep your computer running
- ✅ Automatic HTTPS (secure)
- ✅ Professional URLs
- ✅ Auto-scaling (handles more users)

---

**Need help? Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed explanations!**
