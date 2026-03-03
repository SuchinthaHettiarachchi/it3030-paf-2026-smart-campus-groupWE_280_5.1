# Google OAuth Setup Guide

To make the "Sign in with Google" button work, you need to set up OAuth credentials from Google Cloud Console.

## Step-by-Step Instructions

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create a New Project (or select existing)
- Click on the project dropdown at the top
- Click "New Project"
- Name it "SmartCampus" or any name you prefer
- Click "Create"

### 3. Enable Google+ API
- In the left sidebar, go to "APIs & Services" → "Library"
- Search for "Google+ API"
- Click on it and press "Enable"

### 4. Create OAuth 2.0 Credentials
- Go to "APIs & Services" → "Credentials"
- Click "+ CREATE CREDENTIALS" at the top
- Select "OAuth 2.0 Client ID"

### 5. Configure OAuth Consent Screen (if prompted)
- User Type: Select "External"
- Click "Create"
- App name: "SmartCampus"
- User support email: Your email
- Developer contact: Your email
- Click "Save and Continue"
- Scopes: Click "Save and Continue" (use defaults)
- Test users: Click "Save and Continue"
- Click "Back to Dashboard"

### 6. Create OAuth Client ID
- Go back to "Credentials" → "+ CREATE CREDENTIALS" → "OAuth 2.0 Client ID"
- Application type: **Web application**
- Name: "SmartCampus Web Client"

### 7. Add Authorized Redirect URIs
Add these EXACT URLs (very important):
```
http://192.168.1.193:8080/login/oauth2/code/google
http://localhost:8080/login/oauth2/code/google
```

### 8. Copy Your Credentials
After creating, you'll see:
- **Client ID** (looks like: 123456789-abc123xyz.apps.googleusercontent.com)
- **Client Secret** (looks like: GOCSPX-abc123xyz...)

**KEEP THESE SAFE!**

### 9. Update Your Backend Configuration
Open: `backend/src/main/resources/application.properties`

Replace these lines:
```properties
spring.security.oauth2.client.registration.google.client-id=dummy-client-id
spring.security.oauth2.client.registration.google.client-secret=dummy-client-secret
```

With your actual credentials:
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_ACTUAL_CLIENT_ID_HERE
spring.security.oauth2.client.registration.google.client-secret=YOUR_ACTUAL_CLIENT_SECRET_HERE
```

### 10. Restart Your Backend
Stop and restart the backend server:
```powershell
cd backend
.\gradlew bootRun
```

### 11. Test It!
- Open http://192.168.1.193:5173
- Click "Sign in with Google"
- You should see the Google sign-in page
- After signing in, you'll be redirected back to your app

## Troubleshooting

### Error 400: redirect_uri_mismatch
- Make sure the redirect URI in Google Console EXACTLY matches: `http://192.168.1.193:8080/login/oauth2/code/google`
- Check for typos, extra spaces, http vs https

### Error 400: malformed request
- You haven't set up real credentials yet
- Make sure you replaced "dummy-client-id" and "dummy-client-secret" with real values

### Not redirecting back to your app
- Check the `defaultSuccessUrl` in SecurityConfig.java matches your frontend URL

## Current Configuration

✅ Frontend URL: `http://192.168.1.193:5173`
✅ Backend URL: `http://192.168.1.193:8080`
✅ OAuth Redirect URI: `http://192.168.1.193:8080/login/oauth2/code/google`

## Quick Note

While you're setting this up, you can use the **Admin**, **Student**, or **Tech** buttons in the navbar - they work immediately without any OAuth setup!
