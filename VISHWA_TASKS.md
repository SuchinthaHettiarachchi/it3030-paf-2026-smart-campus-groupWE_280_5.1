# Vishwa – Module A: Facilities & Assets Catalogue
## IT3030 PAF Assignment 2026

---

## 🎯 Your Responsibility

You own **everything** under `resource/` — backend and frontend. No other member touches your files.

---

## 🗄️ Database Table: `resources`

Create this table in Supabase SQL Editor:

```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,          -- LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT
    capacity INTEGER,                    -- NULL for equipment (projectors, cameras)
    location VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, OUT_OF_SERVICE, MAINTENANCE
    availability_start TIME,            -- e.g., 08:00
    availability_end TIME,              -- e.g., 18:00
    available_days VARCHAR(50),         -- e.g., "MON,TUE,WED,THU,FRI"
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed data
INSERT INTO resources (name, type, capacity, location, status, availability_start, availability_end, available_days)
VALUES
  ('Lecture Hall A', 'LECTURE_HALL', 200, 'Block A, Floor 1', 'ACTIVE', '08:00', '18:00', 'MON,TUE,WED,THU,FRI'),
  ('CS Lab 01', 'LAB', 40, 'Block B, Floor 2', 'ACTIVE', '08:00', '17:00', 'MON,TUE,WED,THU,FRI'),
  ('Meeting Room 3', 'MEETING_ROOM', 12, 'Admin Block, Floor 3', 'ACTIVE', '09:00', '17:00', 'MON,TUE,WED,THU,FRI'),
  ('Projector #1', 'EQUIPMENT', NULL, 'Store Room A', 'ACTIVE', '08:00', '18:00', 'MON,TUE,WED,THU,FRI'),
  ('Sony Camera', 'EQUIPMENT', NULL, 'Store Room B', 'OUT_OF_SERVICE', '08:00', '18:00', 'MON,TUE,WED,THU,FRI');
```

---

## ⚙️ Backend – Spring Boot

### Entity: `Resource.java`
**File:** `backend/src/main/java/com/smartcampus/modules/resource/Resource.java`

```java
@Entity
@Table(name = "resources")
public class Resource {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    private String name;

    @NotBlank
    private String type;         // LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT

    private Integer capacity;

    @NotBlank
    private String location;

    private String description;

    @NotBlank
    private String status = "ACTIVE";   // ACTIVE, OUT_OF_SERVICE, MAINTENANCE

    private LocalTime availabilityStart;
    private LocalTime availabilityEnd;
    private String availableDays;
    private String imageUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // getters + setters
}
```

### DTOs
**File:** `dto/ResourceRequestDTO.java`
```java
public class ResourceRequestDTO {
    @NotBlank private String name;
    @NotBlank private String type;
    private Integer capacity;
    @NotBlank private String location;
    private String description;
    private String status;
    private String availabilityStart;  // "HH:mm"
    private String availabilityEnd;
    private String availableDays;
    private String imageUrl;
}
```

### Repository: `ResourceRepository.java`
```java
@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {
    List<Resource> findByType(String type);
    List<Resource> findByStatus(String status);
    List<Resource> findByTypeAndStatus(String type, String status);

    @Query("SELECT r FROM Resource r WHERE " +
           "(:type IS NULL OR r.type = :type) AND " +
           "(:location IS NULL OR LOWER(r.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:minCapacity IS NULL OR r.capacity >= :minCapacity)")
    List<Resource> searchResources(@Param("type") String type,
                                   @Param("location") String location,
                                   @Param("status") String status,
                                   @Param("minCapacity") Integer minCapacity);
}
```

---

## 🌐 REST API Endpoints (Your 4+ Required)

| # | Method | Endpoint | Description | Auth Required |
|---|--------|----------|-------------|---------------|
| 1 | `GET` | `/api/resources` | List all resources (with filters) | Any logged-in user |
| 2 | `GET` | `/api/resources/{id}` | Get single resource by ID | Any logged-in user |
| 3 | `POST` | `/api/resources` | Create a new resource | ADMIN only |
| 4 | `PUT` | `/api/resources/{id}` | Update resource details | ADMIN only |
| 5 | `DELETE` | `/api/resources/{id}` | Delete (or deactivate) a resource | ADMIN only |
| 6 | `PATCH` | `/api/resources/{id}/status` | Update status only (ACTIVE/OUT_OF_SERVICE) | ADMIN only |

### Query Parameters for GET `/api/resources`
- `?type=LAB`
- `?location=Block A`
- `?status=ACTIVE`
- `?minCapacity=30`
- Combine freely: `?type=LAB&status=ACTIVE&minCapacity=20`

### Controller Skeleton
**File:** `modules/resource/ResourceController.java`

```java
@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public ResponseEntity<List<ResourceResponseDTO>> getAllResources(
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String location,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) Integer minCapacity) {
        return ResponseEntity.ok(resourceService.searchResources(type, location, status, minCapacity));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(resourceService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponseDTO> create(@Valid @RequestBody ResourceRequestDTO dto) {
        return ResponseEntity.status(201).body(resourceService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponseDTO> update(@PathVariable UUID id,
                                                      @Valid @RequestBody ResourceRequestDTO dto) {
        return ResponseEntity.ok(resourceService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        resourceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceResponseDTO> updateStatus(@PathVariable UUID id,
                                                            @RequestParam String status) {
        return ResponseEntity.ok(resourceService.updateStatus(id, status));
    }
}
```

### HTTP Status Codes to Use
- `200 OK` – successful GET / PUT / PATCH
- `201 Created` – successful POST
- `204 No Content` – successful DELETE
- `400 Bad Request` – validation failure
- `404 Not Found` – resource ID not found
- `403 Forbidden` – non-admin tries admin endpoint

---

## 🖥️ Frontend – React Pages & Components

### Files You Own

```
frontend/src/
├── pages/resources/
│   ├── ResourceListPage.jsx       ← Browse + filter all resources
│   └── ResourceDetailPage.jsx     ← View single resource
├── pages/admin/
│   └── AdminResourcePage.jsx      ← Admin CRUD management
├── components/resource/
│   ├── ResourceCard.jsx           ← Card display for one resource
│   ├── ResourceFilter.jsx         ← Filter bar (type, location, capacity)
│   ├── ResourceForm.jsx           ← Create/Edit form (Admin)
│   └── ResourceStatusBadge.jsx    ← ACTIVE / OUT_OF_SERVICE badge
└── services/resourceService.js    ← All API calls for resources
```

### `resourceService.js`
```javascript
import axios from '../api/axiosInstance';  // shared axios with auth header

export const getResources = (filters = {}) =>
  axios.get('/api/resources', { params: filters });

export const getResourceById = (id) =>
  axios.get(`/api/resources/${id}`);

export const createResource = (data) =>
  axios.post('/api/resources', data);

export const updateResource = (id, data) =>
  axios.put(`/api/resources/${id}`, data);

export const deleteResource = (id) =>
  axios.delete(`/api/resources/${id}`);

export const updateResourceStatus = (id, status) =>
  axios.patch(`/api/resources/${id}/status`, null, { params: { status } });
```

### UI Requirements
- **Resource List Page:** Grid of resource cards, filter bar at top, search by type/location/capacity
- **Resource Card:** Shows name, type badge, capacity, location, status badge
- **Admin Resource Page:** Table view with Create / Edit / Delete buttons, status toggle
- **Resource Form:** Validated form with dropdowns for type/status, time pickers for availability

---

## 🧪 Testing

Create a Postman collection called `Vishwa – Resources` with these requests:

1. `GET /api/resources` – no filters
2. `GET /api/resources?type=LAB&status=ACTIVE`
3. `GET /api/resources/{valid-id}`
4. `GET /api/resources/{invalid-id}` → expect 404
5. `POST /api/resources` with valid body (as ADMIN) → expect 201
6. `POST /api/resources` with missing `name` → expect 400
7. `PUT /api/resources/{id}` – update name and capacity
8. `PATCH /api/resources/{id}/status?status=OUT_OF_SERVICE`
9. `DELETE /api/resources/{id}` (as ADMIN) → expect 204
10. `POST /api/resources` as USER → expect 403

---

## 📝 Report Section (Your Contribution)

Write these sections for the final PDF report:

- **Functional Requirements** – Module A (resources catalogue)
- **API Endpoint Table** – all 6 endpoints with method, path, request/response
- **Database Design** – `resources` table schema with field descriptions
- **Testing Evidence** – Postman screenshots for at least 5 test cases
- **UI Screenshots** – ResourceListPage, ResourceDetailPage, AdminResourcePage

---

## ⚠️ Do NOT Touch

- `booking/` – Charindhi's
- `ticket/` – Suchintha's
- `notification/` – Chanuka's
- `security/`, `config/` – Chanuka's
- `AuthContext.jsx` – Chanuka's
