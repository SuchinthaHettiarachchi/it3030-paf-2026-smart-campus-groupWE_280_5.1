# Google OAuth Authentication Flow with Role Selection

## Overview
The Smart Campus application now uses Google OAuth for authentication, followed by role selection for new users.

## Authentication Flow

### Step 1: User Clicks "Sign in with Google"
- User sees a single "Sign in with Google" button on the home page
- Clicking redirects to Google OAuth consent screen

### Step 2: Google Authentication
- User logs in with their Google account
- Google asks for permission to share email and profile info
- User approves the permissions

### Step 3: Role Selection (First Time Only)
- After successful Google authentication, user is redirected to `/select-role` page
- User sees three role options:
  - **Administrator** - Manage resources, bookings, and users
  - **Student** - Book resources and raise tickets
  - **Technician** - Handle maintenance tickets
- User selects their role and clicks "Continue"

### Step 4: Access Granted
- User's role is saved in the database
- User is redirected to the home page
- User can now access features based on their selected role

## Setup Requirements

### Backend (Spring Boot)
1. **Google Cloud Console Setup**:
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `http://192.168.1.193:8080/login/oauth2/code/google`
   - Copy Client ID and Client Secret

2. **Update `application.properties`**:
   ```properties
   spring.security.oauth2.client.registration.google.client-id=YOUR_ACTUAL_CLIENT_ID
   spring.security.oauth2.client.registration.google.client-secret=YOUR_ACTUAL_CLIENT_SECRET
   spring.security.oauth2.client.registration.google.scope=profile,email
   spring.security.oauth2.client.registration.google.redirect-uri=http://192.168.1.193:8080/login/oauth2/code/google
   ```

### Frontend (React + Vite)
- No additional setup required
- OAuth redirect is configured to `http://192.168.1.193:5173/select-role`
- Role selection page is at `/select-role`

## API Endpoints

### `GET /api/auth/me`
- **Purpose**: Get current authenticated user
- **Authentication**: Required (OAuth session)
- **Returns**: User object with id, name, email, role
- **Error**: 401 if not authenticated

### `POST /api/auth/select-role`
- **Purpose**: Set user's role after Google authentication
- **Authentication**: Required (OAuth session)
- **Body**: `{ "role": "ADMIN" | "USER" | "TECHNICIAN" }`
- **Returns**: Updated user object
- **Error**: 401 if not authenticated, 400 if invalid role

## Role Capabilities

### Administrator (ADMIN)
- View and manage all resources
- Approve/reject booking requests
- Assign tickets to technicians
- Access QR verification page

### Student (USER)
- View available resources
- Create booking requests
- Raise maintenance tickets
- View own bookings and tickets

### Technician (TECHNICIAN)
- View assigned tickets
- Update ticket status
- Add comments to tickets
- Access QR verification page

## Security Features

1. **Session-Based Authentication**: Uses Spring Security OAuth2 with sessions
2. **CORS Protection**: Only allows requests from configured frontend origins
3. **Role-Based Access Control**: Each API endpoint checks user role
4. **Public Endpoints**: `/verify-qr` endpoint is public for QR scanning

## Troubleshooting

### Issue: "Not authenticated" error
- **Cause**: User is not logged in via Google
- **Solution**: Click "Sign in with Google" button

### Issue: Redirect loops or stuck on role selection
- **Cause**: User exists in database but has no role assigned
- **Solution**: Complete role selection or manually update role in database

### Issue: 400 error on Google OAuth
- **Cause**: Invalid/missing Google OAuth credentials
- **Solution**: Follow setup guide in `GOOGLE_SIGNIN_SETUP.md`

### Issue: CORS errors
- **Cause**: Frontend running on different IP/port than configured
- **Solution**: Update CORS configuration in `SecurityConfig.java`

## Development Notes

- Dev mode buttons have been removed
- All users must authenticate via Google OAuth
- First-time users must select a role
- Role can be changed later by administrators (future feature)
- Notifications work for all authenticated users based on their role

## Testing the Flow

1. **Start Backend**: 
   ```bash
   cd backend
   .\gradlew bootRun
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**: 
   - Open `http://192.168.1.193:5173` in browser
   - Click "Sign in with Google"
   - Authenticate with Google
   - Select a role (Administrator/Student/Technician)
   - Start using the application

4. **Verify Notifications**:
   - Login as Student, create a booking
   - Login as Administrator, check bell icon for notification
   - Approve/reject the booking
   - Student receives notification about decision
