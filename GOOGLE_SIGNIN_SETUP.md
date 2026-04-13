# Google Sign-In Setup - Simple Steps

## The Problem
The Google sign-in button shows error because you need real Google OAuth credentials.

## Quick Setup (15 minutes)

### Step 1: Go to Google Cloud Console
Open: https://console.cloud.google.com/

### Step 2: Create Project (if you don't have one)
- Click "Select a project" at the top
- Click "NEW PROJECT"
- Name: `SmartCampus`
- Click "CREATE"

### Step 3: Enable Google OAuth
- Wait for project to be created
- Make sure "SmartCampus" is selected in the project dropdown

### Step 4: Configure OAuth Consent Screen
- Left menu → "APIs & Services" → "OAuth consent screen"
- Choose "External" → Click "CREATE"
- App name: `SmartCampus`
- User support email: Your email
- Developer contact: Your email
- Click "SAVE AND CONTINUE"
- Click "SAVE AND CONTINUE" again (skip scopes)
- Click "SAVE AND CONTINUE" again (skip test users)
- Click "BACK TO DASHBOARD"

### Step 5: Create Credentials
- Left menu → "Credentials"
- Click "+ CREATE CREDENTIALS" at top
- Select "OAuth client ID"
- Application type: **Web application**
- Name: `SmartCampus Web`

### Step 6: Add Authorized Redirect URIs
**IMPORTANT**: Add EXACTLY these two URLs (copy-paste carefully):
```
http://192.168.1.193:8080/login/oauth2/code/google
http://localhost:8080/login/oauth2/code/google
```

Click "CREATE"

### Step 7: Copy Your Credentials
You'll see a popup with:
- **Client ID** (looks like: 123456789-abc.apps.googleusercontent.com)
- **Client secret** (looks like: GOCSPX-abc123...)

**COPY BOTH!**

### Step 8: Update Your Backend Config
1. Open: `backend/src/main/resources/application.properties`

2. Find these lines:
```properties
spring.security.oauth2.client.registration.google.client-id=dummy-client-id
spring.security.oauth2.client.registration.google.client-secret=dummy-client-secret
```

3. Replace with your real credentials:
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_ACTUAL_CLIENT_ID_HERE
spring.security.oauth2.client.registration.google.client-secret=YOUR_ACTUAL_CLIENT_SECRET_HERE
```

### Step 9: Restart Backend
Stop the backend (Ctrl+C) and run again:
```powershell
cd backend
.\gradlew bootRun
```

### Step 10: Test It!
- Open: http://192.168.1.193:5173
- Click "Sign in with Google"
- Should open Google login page
- Sign in with your Google account
- You'll be redirected back to SmartCampus!

## Common Issues

### Error: "redirect_uri_mismatch"
- The redirect URI in Google Console doesn't match exactly
- Make sure you have: `http://192.168.1.193:8080/login/oauth2/code/google`
- Check for typos, spaces, or http vs https

### Error: "Access blocked"
- Your app is in "Testing" mode
- Go to OAuth consent screen → "PUBLISH APP"
- Or add your email to test users

### Still shows error 400
- You're still using dummy credentials
- Double-check you updated application.properties with REAL credentials
- Restart the backend server

## Meanwhile: Use Dev Mode
While setting up Google OAuth, use the working login buttons:
- **Admin** (purple) - Full admin access
- **Student** (blue) - Regular user access
- **Tech** (orange) - Technician access

These work instantly without any setup!
