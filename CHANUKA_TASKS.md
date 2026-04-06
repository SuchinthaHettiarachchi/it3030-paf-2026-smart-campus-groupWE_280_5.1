# Chanuka – Module D + E: Notifications, Role Management & OAuth Integration
## IT3030 PAF Assignment 2026

---

## 🎯 Your Responsibility

You own:
- The **entire security layer** (Spring Security, JWT, OAuth 2.0 with Google)
- **User & role management**
- **In-app notification system**
- **GitHub Actions CI/CD**
- **Supabase project setup** (create and share credentials)

All other members depend on `AuthContext` and the `AppUserDetails` principal you provide.

---

## 🔧 Step 0: Supabase Project Setup (Do First — Others are Waiting)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note down: Project URL, `anon` key, `service_role` key, DB password
3. Create a `.env` file (gitignored) and share via private group channel:

```properties
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your-service-role-key
SPRING_DATASOURCE_URL=jdbc:postgresql://db.xxxx.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your-db-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret-min-32-chars
```

4. Add `.env` and `application-local.properties` to `.gitignore`
5. Run the SQL schema (your tables first, then share with others):

---

## 🗄️ Database Tables: `users`, `roles`, `user_roles`, `notifications`

```sql
-- Users (synced from Google OAuth on first login)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(100) UNIQUE,
    email VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ
);

-- Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL   -- USER, ADMIN, TECHNICIAN
);

INSERT INTO roles (name) VALUES ('USER'), ('ADMIN'), ('TECHNICIAN');

-- User-Role mapping
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,          -- BOOKING_APPROVED, BOOKING_REJECTED, TICKET_STATUS_CHANGED, NEW_COMMENT
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,                  -- booking ID or ticket ID this relates to
    reference_type VARCHAR(20),         -- BOOKING or TICKET
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

---

## ⚙️ Backend – Spring Boot

### Spring Boot Dependencies (add to `pom.xml`)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
```

### Entity: `User.java`
**File:** `modules/user/User.java`

```java
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String googleId;
    @Column(unique = true, nullable = false)
    private String email;
    private String name;
    private String avatarUrl;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();
}
```

### `AppUserDetails.java` — Other members use this
**File:** `security/AppUserDetails.java`

```java
public class AppUserDetails implements UserDetails {
    private final UUID id;
    private final String email;
    private final Collection<? extends GrantedAuthority> authorities;

    public AppUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.authorities = user.getRoles().stream()
            .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getName()))
            .collect(Collectors.toList());
    }

    public UUID getId() { return id; }

    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return null; }  // OAuth, no password
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
```

### `SecurityConfig.java`
**File:** `config/SecurityConfig.java`

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthFilter jwtAuthFilter,
                                           OAuth2SuccessHandler successHandler) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/resources/**").authenticated()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth.successHandler(successHandler))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

### `OAuth2SuccessHandler.java`
**File:** `security/OAuth2SuccessHandler.java`

```java
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String googleId = oAuth2User.getAttribute("sub");
        String email    = oAuth2User.getAttribute("email");
        String name     = oAuth2User.getAttribute("name");
        String avatar   = oAuth2User.getAttribute("picture");

        // Upsert user in DB
        User user = userService.upsertFromGoogle(googleId, email, name, avatar);

        // Generate JWT
        String token = jwtUtil.generateToken(user);

        // Redirect frontend with token as query param (or set in cookie)
        String redirectUrl = "http://localhost:5173/auth/callback?token=" + token;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
```

### `JwtUtil.java`
**File:** `security/JwtUtil.java`

```java
@Component
public class JwtUtil {

    @Value("${JWT_SECRET}")
    private String secret;

    private final long EXPIRY_MS = 7 * 24 * 60 * 60 * 1000L; // 7 days

    public String generateToken(User user) {
        return Jwts.builder()
            .setSubject(user.getId().toString())
            .claim("email", user.getEmail())
            .claim("roles", user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRY_MS))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes()), SignatureAlgorithm.HS256)
            .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes()))
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    public boolean isValid(String token) {
        try { parseToken(token); return true; }
        catch (Exception e) { return false; }
    }
}
```

---

## 🌐 REST API Endpoints (Your 4+ Required)

### Auth Endpoints

| # | Method | Endpoint | Description | Auth |
|---|--------|----------|-------------|------|
| 1 | `GET` | `/api/auth/me` | Get current user profile | Logged in |
| 2 | `GET` | `/oauth2/authorization/google` | Trigger Google login (Spring handles) | Public |

### User Management (Admin)

| # | Method | Endpoint | Description | Auth |
|---|--------|----------|-------------|------|
| 3 | `GET` | `/api/admin/users` | List all users with roles | ADMIN |
| 4 | `PUT` | `/api/admin/users/{id}/roles` | Update user roles | ADMIN |
| 5 | `DELETE` | `/api/admin/users/{id}` | Deactivate/delete user | ADMIN |

### Notifications

| # | Method | Endpoint | Description | Auth |
|---|--------|----------|-------------|------|
| 6 | `GET` | `/api/notifications` | Get current user's notifications | Logged in |
| 7 | `PATCH` | `/api/notifications/{id}/read` | Mark one notification as read | Own user |
| 8 | `PATCH` | `/api/notifications/read-all` | Mark all as read | Own user |
| 9 | `DELETE` | `/api/notifications/{id}` | Delete a notification | Own user |

### `NotificationController.java`

```java
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getMyNotifications(
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = ((AppUserDetails) user).getId();
        return ResponseEntity.ok(notificationService.getForUser(userId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = ((AppUserDetails) user).getId();
        notificationService.markRead(id, userId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal UserDetails user) {
        UUID userId = ((AppUserDetails) user).getId();
        notificationService.markAllRead(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = ((AppUserDetails) user).getId();
        notificationService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
```

### `NotificationService.java` — How Other Modules Create Notifications

**This is what Charindhi and Suchintha will call from their services:**

```java
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // Called by BookingService when admin approves/rejects
    public void notifyBookingUpdate(UUID userId, String type, String title, String message, UUID bookingId) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);               // BOOKING_APPROVED, BOOKING_REJECTED
        n.setTitle(title);
        n.setMessage(message);
        n.setReferenceId(bookingId);
        n.setReferenceType("BOOKING");
        n.setRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(n);
    }

    // Called by TicketService when status changes or comment added
    public void notifyTicketUpdate(UUID userId, String type, String title, String message, UUID ticketId) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);               // TICKET_STATUS_CHANGED, NEW_COMMENT
        n.setTitle(title);
        n.setMessage(message);
        n.setReferenceId(ticketId);
        n.setReferenceType("TICKET");
        n.setRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(n);
    }

    public List<NotificationDTO> getForUser(UUID userId) {
        return notificationRepository
            .findByUserIdOrderByCreatedAtDesc(userId)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void markRead(UUID notifId, UUID userId) {
        Notification n = notificationRepository.findById(notifId)
            .orElseThrow(() -> new NotFoundException("Notification not found"));
        if (!n.getUserId().equals(userId)) throw new ForbiddenException("Not your notification");
        n.setRead(true);
        notificationRepository.save(n);
    }

    public void markAllRead(UUID userId) {
        notificationRepository.markAllReadForUser(userId);
    }

    public void delete(UUID notifId, UUID userId) {
        Notification n = notificationRepository.findById(notifId)
            .orElseThrow(() -> new NotFoundException("Notification not found"));
        if (!n.getUserId().equals(userId)) throw new ForbiddenException("Not your notification");
        notificationRepository.delete(n);
    }
}
```

---

## 🖥️ Frontend – React Pages & Components

### Files You Own

```
frontend/src/
├── context/
│   └── AuthContext.jsx              ← Global auth state (ALL members import this)
├── pages/
│   ├── LoginPage.jsx                ← Google Sign-In button
│   ├── AuthCallbackPage.jsx         ← Handles token from OAuth redirect
│   ├── notifications/
│   │   └── NotificationsPage.jsx   ← Full notification list
│   └── admin/
│       └── AdminUsersPage.jsx       ← User management (roles)
├── components/
│   ├── shared/
│   │   ├── Navbar.jsx               ← With notification bell + unread count badge
│   │   ├── NotificationBell.jsx     ← Dropdown panel showing recent notifications
│   │   └── ProtectedRoute.jsx       ← Redirects unauthenticated users
└── services/
    ├── notificationService.js
    └── authService.js
```

### `AuthContext.jsx` — Critical: All members depend on this

```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import axios from './api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const hasRole = (role) => user?.roles?.includes(role);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### `AuthCallbackPage.jsx`

```javascript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      login(token);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, []);

  return <div>Logging you in...</div>;
}
```

### `NotificationBell.jsx` (in Navbar)

```javascript
// Poll or fetch notifications; show unread count badge
// Click → dropdown with latest 5 notifications
// Each shows title, message snippet, time, click navigates to reference (booking/ticket)
// Mark as read on click
```

### UI Requirements
- **Login Page:** Google Sign-In button, simple centered layout
- **Notification Bell:** Red badge with unread count in navbar, dropdown on click showing latest notifications grouped by type
- **Notifications Page:** Full list with filter by read/unread, type filter, mark all read button
- **Admin Users Page:** Table of all users, role assignment dropdown (USER/ADMIN/TECHNICIAN), ability to change roles

---

## 🚀 GitHub Actions CI Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [dev, main]
  pull_request:
    branches: [dev, main]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Build and test
        run: mvn clean test
        env:
          SPRING_DATASOURCE_URL: ${{ secrets.SPRING_DATASOURCE_URL }}
          SPRING_DATASOURCE_USERNAME: ${{ secrets.SPRING_DATASOURCE_USERNAME }}
          SPRING_DATASOURCE_PASSWORD: ${{ secrets.SPRING_DATASOURCE_PASSWORD }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
```

Add secrets in GitHub repo → Settings → Secrets and variables → Actions.

---

## 🧪 Testing

Create Postman collection `Chanuka – Auth & Notifications`:

1. `GET /api/auth/me` – with valid JWT → returns user profile
2. `GET /api/auth/me` – without token → expect 401
3. `GET /api/notifications` – as USER → own notifications
4. `GET /api/notifications` – try to see another user's → expect 403 (by ID)
5. `PATCH /api/notifications/{id}/read` – mark one as read
6. `PATCH /api/notifications/read-all` – all become read
7. `DELETE /api/notifications/{id}` – delete own notification
8. `GET /api/admin/users` – as ADMIN → list all users
9. `GET /api/admin/users` – as USER → expect 403
10. `PUT /api/admin/users/{id}/roles` – assign TECHNICIAN role

---

## 📝 Report Section (Your Contribution)

- **Functional Requirements** – Module D (notifications) + Module E (auth/roles)
- **Security Architecture** – OAuth 2.0 flow diagram (Google → Spring → JWT → Frontend)
- **API Endpoint Table** – all 9 endpoints
- **Database Design** – `users`, `roles`, `user_roles`, `notifications` schemas
- **GitHub Actions** – screenshot of passing CI run
- **Testing Evidence** – Postman screenshots for at least 5 tests
- **UI Screenshots** – LoginPage, NotificationBell, NotificationsPage, AdminUsersPage

---

## ⚠️ You Must Deliver First (Others Depend On You)

1. **Supabase setup** + share `.env` → Day 1
2. **`users`, `roles`, `user_roles` tables** created → Day 1
3. **`AppUserDetails.java`** and **`JwtAuthFilter.java`** → Day 2 (Vishwa/Charindhi/Suchintha need this to test their secured endpoints)
4. **`AuthContext.jsx`** → Day 2 (frontend work blocked without this)
5. **`NotificationService.java`** with `notifyBookingUpdate()` and `notifyTicketUpdate()` methods → before Charindhi and Suchintha finish their services
