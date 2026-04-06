# Suchintha – Module C: Incident Tickets, Attachments & Technician Updates
## IT3030 PAF Assignment 2026

---

## 🎯 Your Responsibility

You own everything under `ticket/` — backend and frontend. You depend on Chanuka's `users` table (read-only) and Vishwa's `resources` table (read-only for resource reference).

---

## 🗄️ Database Tables

Create these tables in Supabase SQL Editor:

```sql
-- Main tickets table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
    reported_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),          -- technician/staff
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,                  -- ELECTRICAL, PLUMBING, IT, FURNITURE, OTHER
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',     -- OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    location VARCHAR(150),
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    resolution_notes TEXT,
    rejection_reason TEXT,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket attachments (up to 3 images per ticket)
CREATE TABLE ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,         -- Supabase Storage URL
    file_size INTEGER,
    mime_type VARCHAR(50),
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket comments
CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,  -- true = only staff/admin can see
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Constraint: max 3 attachments per ticket (enforce in Service layer too)
CREATE INDEX idx_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX idx_comments_ticket ON ticket_comments(ticket_id);
```

---

## ⚙️ Backend – Spring Boot

### Entities

**`Ticket.java`** — `modules/ticket/Ticket.java`
```java
@Entity
@Table(name = "tickets")
public class Ticket {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID resourceId;

    @Column(nullable = false)
    private UUID reportedBy;

    private UUID assignedTo;

    @NotBlank private String title;
    @NotBlank private String category;   // ELECTRICAL, PLUMBING, IT, FURNITURE, OTHER
    @NotBlank private String description;

    private String priority = "MEDIUM";  // LOW, MEDIUM, HIGH, CRITICAL
    private String status = "OPEN";      // OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED

    private String location;
    private String contactName;
    private String contactPhone;
    private String contactEmail;

    private String resolutionNotes;
    private String rejectionReason;

    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // getters + setters
}
```

**`TicketAttachment.java`** — `modules/ticket/TicketAttachment.java`
```java
@Entity
@Table(name = "ticket_attachments")
public class TicketAttachment {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private UUID ticketId;
    private String fileName;
    private String fileUrl;
    private Integer fileSize;
    private String mimeType;
    private LocalDateTime uploadedAt;
}
```

**`TicketComment.java`** — `modules/ticket/TicketComment.java`
```java
@Entity
@Table(name = "ticket_comments")
public class TicketComment {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private UUID ticketId;
    private UUID authorId;
    @NotBlank private String content;
    private boolean internal = false;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### DTOs

```java
// TicketCreateDTO.java — for creating a ticket
public class TicketCreateDTO {
    @NotBlank private String title;
    @NotBlank private String category;
    @NotBlank private String description;
    private UUID resourceId;
    private String priority;
    private String location;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
}

// TicketStatusUpdateDTO.java — for staff/admin status updates
public class TicketStatusUpdateDTO {
    @NotBlank private String status;   // IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    private String resolutionNotes;
    private String rejectionReason;
}

// CommentDTO.java
public class CommentDTO {
    @NotBlank private String content;
    private boolean internal;
}
```

### Repositories

```java
// TicketRepository.java
@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByReportedBy(UUID userId);
    List<Ticket> findByAssignedTo(UUID technicianId);
    List<Ticket> findByStatus(String status);

    @Query("SELECT t FROM Ticket t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:category IS NULL OR t.category = :category)")
    List<Ticket> findWithFilters(@Param("status") String status,
                                  @Param("priority") String priority,
                                  @Param("category") String category);
}

// TicketAttachmentRepository.java
@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, UUID> {
    List<TicketAttachment> findByTicketId(UUID ticketId);
    long countByTicketId(UUID ticketId);  // for enforcing max 3 limit
}

// TicketCommentRepository.java
@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, UUID> {
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(UUID ticketId);
}
```

---

## 🌐 REST API Endpoints (Your 4+ Required)

### Tickets

| # | Method | Endpoint | Description | Auth |
|---|--------|----------|-------------|------|
| 1 | `POST` | `/api/tickets` | Create new ticket | USER |
| 2 | `GET` | `/api/tickets/my` | Get current user's tickets | USER |
| 3 | `GET` | `/api/tickets` | Get all tickets (with filters) | ADMIN/TECHNICIAN |
| 4 | `GET` | `/api/tickets/{id}` | Get ticket details | USER (own) / ADMIN |
| 5 | `PATCH` | `/api/tickets/{id}/status` | Update status + resolution notes | ADMIN/TECHNICIAN |
| 6 | `PATCH` | `/api/tickets/{id}/assign` | Assign technician | ADMIN |

### Attachments

| # | Method | Endpoint | Description | Auth |
|---|--------|----------|-------------|------|
| 7 | `POST` | `/api/tickets/{id}/attachments` | Upload image (multipart, max 3) | USER (own ticket) |
| 8 | `DELETE` | `/api/tickets/{id}/attachments/{attachId}` | Delete attachment | USER (own) / ADMIN |

### Comments

| # | Method | Endpoint | Description | Auth |
|---|--------|----------|-------------|------|
| 9 | `POST` | `/api/tickets/{id}/comments` | Add comment | USER / ADMIN |
| 10 | `PUT` | `/api/tickets/{id}/comments/{commentId}` | Edit own comment | Own author only |
| 11 | `DELETE` | `/api/tickets/{id}/comments/{commentId}` | Delete own comment | Own author / ADMIN |

### Controller Skeletons

**`TicketController.java`**
```java
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<TicketResponseDTO> create(
            @Valid @RequestBody TicketCreateDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = ((AppUserDetails) user).getId();
        return ResponseEntity.status(201).body(ticketService.create(dto, userId));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<TicketResponseDTO>> getMyTickets(
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = ((AppUserDetails) user).getId();
        return ResponseEntity.ok(ticketService.getMyTickets(userId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<List<TicketResponseDTO>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(ticketService.getAll(status, priority, category));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN','TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> getById(@PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ticketService.getById(id, user));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<TicketResponseDTO> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody TicketStatusUpdateDTO dto) {
        return ResponseEntity.ok(ticketService.updateStatus(id, dto));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponseDTO> assign(
            @PathVariable UUID id,
            @RequestParam UUID technicianId) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, technicianId));
    }
}
```

**`TicketAttachmentController.java`**
```java
@RestController
@RequestMapping("/api/tickets/{ticketId}/attachments")
@RequiredArgsConstructor
public class TicketAttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<AttachmentResponseDTO> upload(
            @PathVariable UUID ticketId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails user) {
        // validate: max 3 per ticket, image MIME types only
        return ResponseEntity.status(201).body(attachmentService.upload(ticketId, file, user));
    }

    @DeleteMapping("/{attachId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID ticketId,
                                       @PathVariable UUID attachId,
                                       @AuthenticationPrincipal UserDetails user) {
        attachmentService.delete(ticketId, attachId, user);
        return ResponseEntity.noContent().build();
    }
}
```

### File Upload Logic (Supabase Storage)

Use Supabase Storage bucket `ticket-attachments`:

```java
// In AttachmentService.java
public AttachmentResponseDTO upload(UUID ticketId, MultipartFile file, UserDetails user) {
    // 1. Check max 3 attachments
    long count = attachmentRepository.countByTicketId(ticketId);
    if (count >= 3) throw new BadRequestException("Maximum 3 attachments allowed per ticket");

    // 2. Validate file type (only images)
    String mime = file.getContentType();
    if (mime == null || !mime.startsWith("image/")) {
        throw new BadRequestException("Only image files are allowed");
    }

    // 3. Upload to Supabase Storage via REST API
    String fileName = ticketId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
    String uploadUrl = supabaseUrl + "/storage/v1/object/ticket-attachments/" + fileName;
    // Use RestTemplate or WebClient to PUT the file bytes to uploadUrl with apiKey header

    // 4. Save metadata to DB
    TicketAttachment att = new TicketAttachment();
    att.setTicketId(ticketId);
    att.setFileName(file.getOriginalFilename());
    att.setFileUrl(supabaseUrl + "/storage/v1/object/public/ticket-attachments/" + fileName);
    att.setFileSize((int) file.getSize());
    att.setMimeType(mime);
    att.setUploadedAt(LocalDateTime.now());
    return toDTO(attachmentRepository.save(att));
}
```

### Ticket Status Workflow

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
              ↓
           REJECTED (with rejection_reason)
```

Enforce valid transitions in `TicketService.updateStatus()`:
```java
Map<String, List<String>> validTransitions = Map.of(
    "OPEN",        List.of("IN_PROGRESS", "REJECTED"),
    "IN_PROGRESS", List.of("RESOLVED", "REJECTED"),
    "RESOLVED",    List.of("CLOSED"),
    "CLOSED",      List.of(),
    "REJECTED",    List.of()
);
```

---

## 🖥️ Frontend – React Pages & Components

### Files You Own

```
frontend/src/
├── pages/tickets/
│   ├── TicketListPage.jsx           ← User's own tickets
│   ├── TicketCreatePage.jsx         ← Submit new incident ticket
│   ├── TicketDetailPage.jsx         ← View ticket + comments + attachments
│   └── AdminTicketsPage.jsx         ← Admin/Technician view all tickets
├── components/ticket/
│   ├── TicketCard.jsx               ← Summary card
│   ├── TicketStatusBadge.jsx        ← Color-coded status badge
│   ├── TicketPriorityBadge.jsx      ← Priority indicator
│   ├── TicketForm.jsx               ← Create form with file upload
│   ├── AttachmentUploader.jsx       ← Drag-drop / file picker (max 3)
│   ├── CommentSection.jsx           ← Thread of comments
│   └── StatusUpdateModal.jsx        ← Admin: update status + notes
└── services/ticketService.js        ← All API calls
```

### `ticketService.js`
```javascript
import axios from '../api/axiosInstance';

export const createTicket = (data) =>
  axios.post('/api/tickets', data);

export const getMyTickets = () =>
  axios.get('/api/tickets/my');

export const getAllTickets = (filters = {}) =>
  axios.get('/api/tickets', { params: filters });

export const getTicketById = (id) =>
  axios.get(`/api/tickets/${id}`);

export const updateTicketStatus = (id, data) =>
  axios.patch(`/api/tickets/${id}/status`, data);

export const assignTechnician = (id, technicianId) =>
  axios.patch(`/api/tickets/${id}/assign`, null, { params: { technicianId } });

export const uploadAttachment = (ticketId, file) => {
  const form = new FormData();
  form.append('file', file);
  return axios.post(`/api/tickets/${ticketId}/attachments`, form,
    { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const deleteAttachment = (ticketId, attachId) =>
  axios.delete(`/api/tickets/${ticketId}/attachments/${attachId}`);

export const addComment = (ticketId, data) =>
  axios.post(`/api/tickets/${ticketId}/comments`, data);

export const editComment = (ticketId, commentId, data) =>
  axios.put(`/api/tickets/${ticketId}/comments/${commentId}`, data);

export const deleteComment = (ticketId, commentId) =>
  axios.delete(`/api/tickets/${ticketId}/comments/${commentId}`);
```

### UI Requirements
- **Create Ticket Form:** Category dropdown, priority dropdown, description textarea, resource picker, contact info fields, drag-drop image upload showing previews (max 3, with file size shown)
- **Ticket Detail Page:** Full info, image attachments displayed, comment thread below, status badge at top
- **Admin Tickets Page:** Table with filter by status/priority/category, assign technician dropdown, status update modal
- **Comment Section:** Each comment shows author name + time, edit/delete icons for own comments

---

## 🧪 Testing

Create Postman collection `Suchintha – Tickets`:

1. `POST /api/tickets` – valid ticket → expect 201
2. `POST /api/tickets` – missing description → expect 400
3. `GET /api/tickets/my` – as USER → own tickets only
4. `GET /api/tickets` – as USER → expect 403
5. `GET /api/tickets?status=OPEN&priority=HIGH` – as ADMIN
6. `PATCH /api/tickets/{id}/status` – IN_PROGRESS → RESOLVED with notes
7. `PATCH /api/tickets/{id}/status` – invalid transition (CLOSED → OPEN) → expect 400
8. `POST /api/tickets/{id}/attachments` – upload image → expect 201
9. `POST /api/tickets/{id}/attachments` – 4th image → expect 400
10. `POST /api/tickets/{id}/comments` – add comment
11. `PUT /api/tickets/{id}/comments/{cid}` – edit own comment
12. `DELETE /api/tickets/{id}/comments/{cid}` – delete someone else's comment → expect 403

---

## 📝 Report Section (Your Contribution)

- **Functional Requirements** – Module C (incident tickets, attachments, comments)
- **API Endpoint Table** – all 11 endpoints with method, path, request/response
- **Database Design** – `tickets`, `ticket_attachments`, `ticket_comments` schemas
- **State Transition Diagram** – ticket workflow (OPEN → CLOSED)
- **File Upload Design** – how Supabase Storage is used
- **Testing Evidence** – Postman screenshots for at least 6 test cases
- **UI Screenshots** – TicketCreatePage, TicketDetailPage, AdminTicketsPage

---

## ⚠️ Do NOT Touch

- `resource/` – Vishwa's
- `booking/` – Charindhi's
- `notification/` – Chanuka's
- `security/`, `config/` – Chanuka's
- Only **read** from `resources` and `users` tables; never alter them
