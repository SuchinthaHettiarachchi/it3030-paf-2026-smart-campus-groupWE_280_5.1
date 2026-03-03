# SmartCampus - Cloud Deployment Guide

This guide will help you deploy SmartCampus to free cloud platforms.

## Prerequisites
- GitHub account
- MongoDB Atlas account (free)
- Vercel account (free - connect with GitHub)
- Railway account (free - connect with GitHub)

## Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Create a new cluster:
   - Choose FREE tier (M0)
   - Select a cloud provider and region (closest to you)
   - Cluster name: SmartCampus
4. Set up database access:
   - Click "Database Access" → "Add New Database User"
   - Username: `smartcampus`
   - Password: Generate a secure password (save it!)
   - User Privileges: Atlas admin
5. Set up network access:
   - Click "Network Access" → "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
6. Get your connection string:
   - Click "Database" → "Connect" → "Connect your application"
   - Select "Java" and version
   - Copy the connection string, it looks like:
     ```
     mongodb+srv://smartcampus:<password>@smartcampus.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - Add database name before the `?`: `.../smartcampus?retryWrites=true&w=majority`

**SAVE THIS CONNECTION STRING - YOU'LL NEED IT!**

## Step 2: Migrate Your Local Data to MongoDB Atlas

### Option A: Using MongoDB Compass (Recommended)
1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connect to your LOCAL MongoDB: `mongodb://localhost:27017`
3. Export each collection (Users, Resources, Bookings, Tickets, Notifications):
   - Select collection → Export → JSON
4. Connect to MongoDB Atlas using your connection string
5. Import each JSON file to the corresponding collection

### Option B: Using mongodump/mongorestore (Command Line)
```powershell
# Export from local MongoDB
mongodump --uri="mongodb://localhost:27017/SmartCampus" --out="./backup"

# Import to MongoDB Atlas
mongorestore --uri="YOUR_ATLAS_CONNECTION_STRING" ./backup/SmartCampus
```

## Step 3: Push to GitHub

```powershell
cd "c:\Users\Lenovo\Desktop\PAF project"
git add .
git commit -m "Initial commit for cloud deployment"

# Create a new repository on GitHub (https://github.com/new)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/smartcampus.git
git branch -M main
git push -u origin main
```

## Step 4: Deploy Backend to Railway

1. Go to https://railway.app/ and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `smartcampus` repository
4. Railway will detect the backend automatically
5. Add environment variables:
   - Click on your backend service → "Variables" tab
   - Add these variables:
     ```
     MONGODB_URI=your_mongodb_atlas_connection_string
     PORT=8080
     ```
6. Railway will automatically deploy your backend
7. Once deployed, copy your backend URL (e.g., `https://smartcampus-production.up.railway.app`)

## Step 5: Deploy Frontend to Vercel

1. Go to https://vercel.com/signup and sign in with GitHub
2. Click "Add New" → "Project"
3. Import your `smartcampus` repository
4. Configure the project:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variable:
   - Name: `VITE_API_URL`
   - Value: Your Railway backend URL (e.g., `https://smartcampus-production.up.railway.app`)
6. Click "Deploy"
7. Once deployed, copy your frontend URL (e.g., `https://smartcampus.vercel.app`)

## Step 6: Update Backend CORS Settings

Go to Railway → Backend service → Variables, add:
```
FRONTEND_URL=https://smartcampus.vercel.app
```

Then update your SecurityConfig.java to use this environment variable.

## Step 7: Test Your Application

1. Open your Vercel frontend URL in a browser
2. Login as Admin/Student/Technician
3. Create a booking and view the QR code
4. Scan the QR code from your phone (on mobile data)
5. It should work from anywhere in the world! 🎉

## Troubleshooting

- If backend deployment fails: Check Railway logs
- If frontend shows API errors: Verify VITE_API_URL is correct
- If QR codes don't work: Make sure QR code URLs use your Vercel domain
- If "Access Denied" errors: Check MongoDB Atlas network access settings

## Cost

All these services are FREE:
- MongoDB Atlas: 512MB free forever
- Vercel: 100GB bandwidth/month free
- Railway: 500 hours/month free (about 20 days)

Your application will be accessible from anywhere in the world! 🌍
