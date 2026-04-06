# Charindhi – Module B: Booking Workflow & Conflict Checking
## IT3030 PAF Assignment 2026

---

## 🎯 Your Responsibility

You own **everything** under `booking/` — backend and frontend. You depend on Vishwa's `resources` table (read-only from your side) and Chanuka's `users` table (read-only).

---

## 🗄️ Database Table: `bookings`

Create this table in Supabase SQL Editor:

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose TEXT NOT NULL,
    expected_attendees INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED, CANCELLED
    admin_remark TEXT,                               -- reason for rejection / note on approval
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for conflict checking (critical for performance)
CREATE INDEX idx_bookings_conflict
  ON bookings(resource_id, booking_date, status)
  WHERE status = 'APPROVED';
```

---

## ⚙️ Backend – Spring Boot

### Entity: `Booking.java`
**File:** `backend/src/main/java/com/smartcampus/modules/booking/Booking.java`

```java
@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID resourceId;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private LocalDate bookingDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @NotBlank
    private String purpose;

    private Integer expectedAttendees;

    private String status = "PENDING";  // PENDING, APPROVED, REJECTED, CANCELLED

    private String adminRemark;
    private UUID reviewedBy;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // getters + setters
}
```

### DTOs

**`BookingRequestDTO.java`**
```java
public class BookingRequestDTO {
    @NotNull private UUID resourceId;
    @NotNull private LocalDate bookingDate;
    @NotNull private String startTime;   // "HH:mm"
    @NotNull private String endTime;     // "HH:mm"
    @NotBlank private String purpose;
    private Integer expectedAttendees;
}
```

**`BookingReviewDTO.java`** (Admin approve/reject)
```java
public class BookingReviewDTO {
    @NotBlank private String action;     // "APPROVE" or "REJECT"
    private String remark;               // required if REJECT
}
```

### Repository: `BookingRepository.java`
```java
@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    // Conflict check query — THE most important query in your module
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE " +
           "b.resourceId = :resourceId AND " +
           "b.bookingDate = :date AND " +
           "b.status = 'APPROVED' AND " +
           "b.startTime < :endTime AND " +
           "b.endTime > :startTime")
    boolean hasConflict(@Param("resourceId") UUID resourceId,
                        @Param("date") LocalDate date,
                        @Param("startTime") LocalTime startTime,
                        @Param("endTime") LocalTime endTime);

    List<Booking> findByUserId(UUID userId);
    List<Booking> findByStatus(String status);
    List<Booking> findByResourceId(UUID resourceId);

    @Query("SELECT b FROM Booking b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:resourceId IS NULL OR b.resourceId = :resourceId) AND " +
           "(:userId IS NULL OR b.userId = :userId)")
    List<Booking> findAllWithFilters(@Param("status") String status,
                                     @Param("resourceId") UUID resourceId,
                                     @Param("userId") UUID userId);
}
```

---

## 🌐 REST API Endpoints (Your 4+ Required)

| # | Method | Endpoint | Description | Auth |
|---|--------|----------|-------------|------|
| 1 | `POST` | `/api/bookings` | Create booking request | USER |
| 2 | `GET` | `/api/bookings/my` | Get current user's bookings | USER |
| 3 | `GET` | `/api/bookings` | Get all bookings (with filters) | ADMIN |
| 4 | `GET` | `/api/bookings/{id}` | Get single booking | USER (own) / ADMIN |
| 5 | `PUT` | `/api/bookings/{id}/review` | Approve or reject | ADMIN |
| 6 | `PATCH` | `/api/bookings/{id}/cancel` | Cancel an approved booking | USER (own) |

### Conflict Checking Logic (implement in Service)

```java
// In BookingService.java
public BookingResponseDTO createBooking(BookingRequestDTO dto, UUID userId) {
    LocalTime start = LocalTime.parse(dto.getStartTime());
    LocalTime end = LocalTime.parse(dto.getEndTime());

    // Validate time range
    if (!end.isAfter(start)) {
        throw new BadRequestException("End time must be after start time");
    }

    // Check for scheduling conflict
    boolean conflict = bookingRepository.hasConflict(
        dto.getResourceId(), dto.getBookingDate(), start, end
    );
    if (conflict) {
        throw new ConflictException("Resource is already booked for this time slot");
    }

    // Check resource exists and is ACTIVE
    // (call ResourceRepository or use ResourceService via injection)

    Booking booking = new Booking();
    booking.setResourceId(dto.getResourceId());
    booking.setUserId(userId);
    booking.setBookingDate(dto.getBookingDate());
    booking.setStartTime(start);
    booking.setEndTime(end);
    booking.setPurpose(dto.getPurpose());
    booking.setExpectedAttendees(dto.getExpectedAttendees());
    booking.setStatus("PENDING");
    booking.setCreatedAt(LocalDateTime.now());

    return toResponseDTO(bookingRepository.save(booking));
}
```

### Controller Skeleton
**File:** `modules/booking/BookingController.java`

```java
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<BookingResponseDTO> create(
            @Valid @RequestBody BookingRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = ((AppUserDetails) userDetails).getId();
        return ResponseEntity.status(201).body(bookingService.createBooking(dto, userId));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = ((AppUserDetails) userDetails).getId();
        return ResponseEntity.ok(bookingService.getMyBookings(userId));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponseDTO>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID resourceId,
            @RequestParam(required = false) UUID userId) {
        return ResponseEntity.ok(bookingService.getAllBookings(status, resourceId, userId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<BookingResponseDTO> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.getById(id, userDetails));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDTO> review(
            @PathVariable UUID id,
            @Valid @RequestBody BookingReviewDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID adminId = ((AppUserDetails) userDetails).getId();
        return ResponseEntity.ok(bookingService.reviewBooking(id, dto, adminId));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<BookingResponseDTO> cancel(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, userDetails));
    }
}
```

### HTTP Status Codes
- `201 Created` – booking created
- `200 OK` – review / cancel / get
- `400 Bad Request` – invalid time range / missing fields
- `409 Conflict` – scheduling conflict detected
- `403 Forbidden` – user tries to see/cancel someone else's booking
- `404 Not Found` – booking ID doesn't exist

---

## 🖥️ Frontend – React Pages & Components

### Files You Own

```
frontend/src/
├── pages/bookings/
│   ├── BookingListPage.jsx          ← User's own bookings
│   ├── BookingFormPage.jsx          ← Create new booking (resource picker + date/time)
│   └── AdminBookingsPage.jsx        ← Admin view all bookings + approve/reject
├── components/booking/
│   ├── BookingCard.jsx              ← Display a single booking
│   ├── BookingStatusBadge.jsx       ← PENDING / APPROVED / REJECTED / CANCELLED
│   ├── BookingForm.jsx              ← Form with resource selector, date, time pickers
│   └── ReviewModal.jsx             ← Admin modal to approve/reject with remark
└── services/bookingService.js       ← All API calls for bookings
```

### `bookingService.js`
```javascript
import axios from '../api/axiosInstance';

export const createBooking = (data) =>
  axios.post('/api/bookings', data);

export const getMyBookings = () =>
  axios.get('/api/bookings/my');

export const getAllBookings = (filters = {}) =>
  axios.get('/api/bookings', { params: filters });

export const getBookingById = (id) =>
  axios.get(`/api/bookings/${id}`);

export const reviewBooking = (id, data) =>
  axios.put(`/api/bookings/${id}/review`, data);

export const cancelBooking = (id) =>
  axios.patch(`/api/bookings/${id}/cancel`);
```

### UI Requirements
- **Booking Form:** Resource dropdown (fetched from Vishwa's API), date picker, time range picker, purpose input, attendees input. Show error if conflict is detected (409 response).
- **My Bookings:** Table/card list with status badges, Cancel button for APPROVED bookings.
- **Admin Bookings:** Table with filter by status/resource. Approve/Reject buttons open a modal with optional remark field.

---

## 🧪 Testing

Create Postman collection `Charindhi – Bookings`:

1. `POST /api/bookings` – valid request → expect 201
2. `POST /api/bookings` – overlapping time on same resource → expect 409
3. `POST /api/bookings` – end time before start time → expect 400
4. `GET /api/bookings/my` – as USER → returns only own bookings
5. `GET /api/bookings` – as USER → expect 403
6. `GET /api/bookings` – as ADMIN with `?status=PENDING` filter
7. `PUT /api/bookings/{id}/review` – APPROVE with remark
8. `PUT /api/bookings/{id}/review` – REJECT with remark
9. `PATCH /api/bookings/{id}/cancel` – cancel approved booking
10. `PATCH /api/bookings/{id}/cancel` – try to cancel someone else's booking → expect 403

---

## 📝 Report Section (Your Contribution)

- **Functional Requirements** – Module B (booking workflow)
- **Conflict Checking Algorithm** – explain the SQL/JPQL overlap detection logic
- **API Endpoint Table** – all 6 endpoints with request/response samples
- **State Transition Diagram** – PENDING → APPROVED/REJECTED → CANCELLED
- **Testing Evidence** – Postman screenshots for at least 5 tests
- **UI Screenshots** – BookingFormPage, BookingListPage, AdminBookingsPage

---

## ⚠️ Do NOT Touch

- `resource/` – Vishwa's
- `ticket/` – Suchintha's
- `notification/` – Chanuka's
- `security/`, `config/` – Chanuka's
- Only **read** from the `resources` table; never alter it
