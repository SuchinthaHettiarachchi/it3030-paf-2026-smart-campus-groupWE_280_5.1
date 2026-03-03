# Google OAuth 2.0 Setup Guide

## ✅ OAuth 2.0 Login Implementation

This project implements Google OAuth 2.0 sign-in with role-based access control.

### Supported Roles:
- **USER** - Regular users (students) who can book resources and create tickets
- **ADMIN** - Administrators who can approve bookings, manage resources, and delete any booking
- **TECHNICIAN** - Technical staff who can manage tickets and verify QR codes

---

## How to Configure Google OAuth

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API** for your project

### Step 2: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Configure the consent screen:
   - User Type: **External** (for testing) or **Internal** (for organization)
   - App name: **SmartCampus**
   - Support email: your email
   - Scopes: `openid`, `profile`, `email`

4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **SmartCampus Backend**
   - Authorized JavaScript origins:
     ```
     http://localhost:8080
     http://192.168.1.193:8080
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:8080/login/oauth2/code/google
     http://192.168.1.193:8080/login/oauth2/code/google
     ```

5. Copy the **Client ID** and **Client Secret**

### Step 3: Update application.properties

Edit `backend/src/main/resources/application.properties`:

```properties
# Replace these with your actual Google OAuth credentials
spring.security.oauth2.client.registration.google.client-id=YOUR_ACTUAL_CLIENT_ID_HERE
spring.security.oauth2.client.registration.google.client-secret=YOUR_ACTUAL_CLIENT_SECRET_HERE
spring.security.oauth2.client.registration.google.scope=openid,profile,email
```

### Step 4: Update Frontend OAuth URL

Edit `frontend/src/components/LoginButton.jsx`:

Change the login URL from:
```javascript
window.location.href = 'http://localhost:8080/oauth2/authorization/google';
```

To:
```javascript
window.location.href = 'http://192.168.1.193:8080/oauth2/authorization/google';
```

### Step 5: Update SecurityConfig Redirect URLs

Edit `backend/src/main/java/com/smartcampus/security/SecurityConfig.java`:

Update the success URL to match your network IP:
```java
.defaultSuccessUrl("http://192.168.1.193:5173", true)
.logoutSuccessUrl("http://192.168.1.193:5173/")
```

---

## Role-Based Access Control

### Current Implementation:

**Frontend Route Protection** (`App.jsx`):
- Only logged-in users can access protected routes
- Admin/Technician can access Verify QR page
- All users can access notifications

**Backend Endpoint Security**:

| Endpoint | USER | ADMIN | TECHNICIAN |
|----------|------|-------|------------|
| `GET /api/resources` | ✓ | ✓ | ✓ |
| `POST /api/resources` | ✗ | ✓ | ✗ |
| `PUT /api/resources/:id` | ✗ | ✓ | ✗ |
| `DELETE /api/resources/:id` | ✗ | ✓ | ✗ |
| `POST /api/bookings` | ✓ | ✗ | ✗ |
| `DELETE /api/bookings/:id` | Own only | All | ✗ |
| `PATCH /api/bookings/:id/approve` | ✗ | ✓ | ✗ |
| `PATCH /api/bookings/:id/reject` | ✗ | ✓ | ✗ |
| `GET /api/bookings/verify-qr` | Public (no auth) | Public | Public |
| `POST /api/tickets` | ✓ | ✓ | ✓ |
| `PATCH /api/tickets/:id/status` | ✗ | ✓ | ✓ |
| `PATCH /api/tickets/:id/assign` | ✗ | ✓ | ✗ |
| `GET /api/notifications` | Own only | Own only | Own only |

---

## Development Bypass Mode

For development without Google OAuth credentials, the app uses a **Dev Bypass Filter**:

**How to use:**
1. In browser console/localStorage:
   ```javascript
   // Login as Admin
   localStorage.setItem('devRole', 'dev-admin');
   
   // Login as User
   localStorage.setItem('devRole', 'dev-user');
   
   // Login as Technician
   localStorage.setItem('devRole', 'dev-technician');
   ```

2. Refresh the page

**Dev Bypass Users** (created in `DataInitializer.java`):
- `dev-admin` → ADMIN role
- `dev-user` → USER role  
- `dev-technician` → TECHNICIAN role

---

## Testing OAuth Flow

1. **Restart Backend** with valid Google OAuth credentials
2. **Restart Frontend** with updated OAuth URL
3. Click **Sign in with Google** button
4. Authenticate with Google account
5. On first login, user is created with default **USER** role
6. Admin can change roles through database or future admin panel

---

## Security Features Implemented

✅ **OAuth 2.0 Integration** - Google sign-in with email verification  
✅ **Role-Based Access Control** - USER, ADMIN, TECHNICIAN roles  
✅ **Protected Routes** - Frontend routes secured based on authentication  
✅ **Secured Endpoints** - Backend API endpoints protected by role  
✅ **Session Management** - HTTP sessions with cookies  
✅ **CORS Configuration** - Configured for localhost and network access  
✅ **Dev Bypass Filter** - Development mode for testing without OAuth  

---

## Production Deployment Checklist

- [ ] Replace dummy OAuth credentials with real Google Client ID/Secret
- [ ] Update all URLs from localhost/network IP to production domain
- [ ] Disable Dev Bypass Filter in production
- [ ] Use environment variables for sensitive configuration
- [ ] Enable HTTPS for OAuth redirect URIs
- [ ] Configure database with production credentials
- [ ] Set up proper session store (Redis/MongoDB)

---

## Troubleshooting

**Issue:** "redirect_uri_mismatch" error  
**Solution:** Ensure redirect URI in Google Console matches exactly: `http://localhost:8080/login/oauth2/code/google`

**Issue:** User always gets USER role  
**Solution:** For now, manually update MongoDB user document. Future: Build admin panel for role management.

**Issue:** Session lost on page refresh  
**Solution:** Check that cookies are enabled and `withCredentials: true` is set in axios config.

---

## Next Steps (Optional Enhancements)

- Add role upgrade notifications (USER → TECHNICIAN/ADMIN)
- Implement account creation welcome notification
- Add admin panel for user role management
- Implement refresh tokens for longer sessions
- Add multi-factor authentication (MFA)
