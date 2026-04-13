# Notifications Implementation Guide

## ✅ REQUIRED Notifications (PDF Requirements)

All required notifications from PAF Assignment 2026 have been implemented.

---

## Module B — Booking Notifications

### 1. Booking Approved ✅
**Trigger:** Admin approves a booking  
**Recipient:** Booking owner (USER)  
**Implementation:** `BookingService.updateBookingStatus()`  

```java
// Code location: BookingService.java lines 78-87
if ("APPROVED".equals(status)) {
    notificationService.createNotification(
        saved.getUserId(),
        "Booking Approved ✓",
        "Your booking for " + saved.getResourceName() + " has been approved! Time: " + 
        saved.getStartTime().toLocalDate() + " " + saved.getStartTime().toLocalTime(),
        saved.getId(),
        "BOOKING"
    );
}
```

**Example Notification:**
- **Title:** "Booking Approved ✓"
- **Message:** "Your booking for Main Auditorium has been approved! Time: 2026-03-03 14:00"

---

### 2. Booking Rejected (with reason) ✅
**Trigger:** Admin rejects a booking with optional reason  
**Recipient:** Booking owner (USER)  
**Implementation:** `BookingService.updateBookingStatus()`  

```java
// Code location: BookingService.java lines 88-100
else if ("REJECTED".equals(status)) {
    String message = "Your booking for " + saved.getResourceName() + " has been rejected.";
    if (rejectionReason != null && !rejectionReason.isEmpty()) {
        message += " Reason: " + rejectionReason;
    }
    notificationService.createNotification(
        saved.getUserId(),
        "Booking Rejected ✗",
        message,
        saved.getId(),
        "BOOKING"
    );
}
```

**Example Notification:**
- **Title:** "Booking Rejected ✗"
- **Message:** "Your booking for Computer Lab A has been rejected. Reason: Resource under maintenance"

---

## Module C — Ticket Notifications

### 3. Ticket Status Changes ✅
**Triggers:** Status changes from OPEN → IN_PROGRESS → RESOLVED → CLOSED, or REJECTED  
**Recipient:** Ticket owner (USER)  
**Implementation:** `TicketService.updateTicketStatus()`  

```java
// Code location: TicketService.java lines 80-131
switch (status) {
    case "OPEN":
        title = "Ticket Opened";
        message = "Your ticket '" + saved.getTitle() + "' has been opened and is awaiting review.";
        break;
    case "IN_PROGRESS":
        title = "Ticket In Progress";
        message = "Your ticket '" + saved.getTitle() + "' is now being worked on.";
        break;
    case "RESOLVED":
        title = "Ticket Resolved ✓";
        message = "Your ticket '" + saved.getTitle() + "' has been resolved!";
        break;
    case "CLOSED":
        title = "Ticket Closed";
        message = "Your ticket '" + saved.getTitle() + "' has been closed.";
        break;
    case "REJECTED":
        title = "Ticket Rejected ✗";
        message = "Your ticket '" + saved.getTitle() + "' has been rejected.";
        if (saved.getRejectionReason() != null) {
            message += " Reason: " + saved.getRejectionReason();
        }
        break;
}
```

**Example Notifications:**
- **Title:** "Ticket In Progress" | **Message:** "Your ticket 'Projector not working' is now being worked on."
- **Title:** "Ticket Resolved ✓" | **Message:** "Your ticket 'AC not cooling' has been resolved!"
- **Title:** "Ticket Rejected ✗" | **Message:** "Your ticket 'Request' has been rejected. Reason: Duplicate issue"

---

### 4. New Comment on Ticket ✅
**Trigger:** Someone comments on a user's ticket  
**Recipient:** Ticket owner (USER)  
**Implementation:** `TicketService.addComment()`  

```java
// Code location: TicketService.java lines 135-145
// If someone other than creator comments, notify creator
if (!t.getCreatorId().equals(comment.getAuthorId())) {
    notificationService.createNotification(
        t.getCreatorId(),
        "New Comment",
        "New comment on your ticket: " + t.getTitle(),
        t.getId(),
        "TICKET"
    );
}
```

**Example Notification:**
- **Title:** "New Comment"
- **Message:** "New comment on your ticket: Projector not working"

---

## Module D — Notification UI ✅

### Notification Panel/List Implementation
**Location:** `frontend/src/pages/NotificationsPage.jsx`

**Features:**
- ✅ Bell icon in header with unread count badge
- ✅ Real-time notification count (polls every 30 seconds)
- ✅ Filter tabs: "All" / "Unread"
- ✅ Visual distinction for unread notifications (blue background)
- ✅ Click to mark as read
- ✅ "Mark All Read" button
- ✅ Icon-based notification types (Calendar for bookings, Ticket for tickets)
- ✅ Relative timestamps ("2h ago", "Just now")
- ✅ Empty states for no notifications
- ✅ Responsive design

**UI Components:**
```jsx
// Header bell icon with badge
<Link to="/notifications" className="relative">
  <Bell className="w-5 h-5" />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-600 text-white">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</Link>

// Notification item
<div className="p-4 bg-blue-50 border-blue-200"> // Unread style
  <h3>Booking Approved ✓</h3>
  <p>Your booking for Main Auditorium has been approved!</p>
  <span>2h ago</span>
</div>
```

---

## ⭐ OPTIONAL Notifications (Bonus Features)

### Module B — Booking (Extra)

#### 5. Technician Assigned to Ticket ✅
**Trigger:** Admin assigns a technician to a ticket  
**Recipients:** TECHNICIAN + ticket owner  
**Implementation:** `TicketService.assignTechnician()`  

```java
// Code location: TicketService.java lines 105-116
notificationService.createNotification(
    technicianId,
    "New Assignment",
    "You have been assigned to ticket: " + saved.getTitle(),
    saved.getId(),
    "TICKET"
);
```

**Example Notification:**
- **Title:** "New Assignment"
- **Message:** "You have been assigned to ticket: Projector not working"

---

## API Endpoints

### GET /api/notifications
**Returns:** List of user's notifications  
**Query Params:**
- `unreadOnly=true` - Only unread notifications
- `unreadOnly=false` - All notifications

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "title": "Booking Approved ✓",
    "message": "Your booking for Main Auditorium has been approved! Time: 2026-03-03 14:00",
    "relatedEntityType": "BOOKING",
    "relatedEntityId": "booking123",
    "isRead": false,
    "createdAt": "2026-03-03T10:30:00"
  }
]
```

### PATCH /api/notifications/:id/read
**Description:** Mark a single notification as read  
**Response:** Updated notification object

### PATCH /api/notifications/mark-all-read
**Description:** Mark all user's notifications as read  
**Response:** Success message

---

## Database Schema

### Notification Model
```java
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    
    private String userId;          // Recipient user ID
    private String title;            // Notification title
    private String message;          // Notification message content
    
    private String relatedEntityType;  // "BOOKING" | "TICKET" | "RESOURCE"
    private String relatedEntityId;    // ID of related entity
    
    private Boolean isRead;          // Read status
    private LocalDateTime createdAt; // Timestamp
}
```

---

## Testing Notifications

### Test Booking Approval Notification
1. Login as USER (dev-user)
2. Create a booking
3. Login as ADMIN (dev-admin)
4. Go to Bookings page
5. Approve the booking
6. Login back as USER
7. Check notifications (bell icon) - should show "Booking Approved ✓"

### Test Booking Rejection Notification
1. Login as USER (dev-user)
2. Create a booking
3. Login as ADMIN (dev-admin)
4. Go to Bookings page
5. Reject the booking with reason: "Resource unavailable"
6. Login back as USER
7. Check notifications - should show "Booking Rejected ✗" with reason

### Test Ticket Status Change Notification
1. Login as USER (dev-user)
2. Create a ticket
3. Login as ADMIN (dev-admin) or TECHNICIAN (dev-technician)
4. Go to Tickets page
5. Change status to "IN_PROGRESS"
6. Login back as USER
7. Check notifications - should show "Ticket In Progress"

### Test Comment Notification
1. Login as USER (dev-user)
2. Create a ticket
3. Login as ADMIN or TECHNICIAN
4. Add a comment to the ticket
5. Login back as USER
6. Check notifications - should show "New Comment"

---

## Notification Types Summary

| Type | Trigger | Recipient | Status |
|------|---------|-----------|--------|
| Booking Approved | Admin approves booking | Booking owner | ✅ |
| Booking Rejected | Admin rejects booking | Booking owner | ✅ |
| Ticket Opened | Ticket status → OPEN | Ticket owner | ✅ |
| Ticket In Progress | Ticket status → IN_PROGRESS | Ticket owner | ✅ |
| Ticket Resolved | Ticket status → RESOLVED | Ticket owner | ✅ |
| Ticket Closed | Ticket status → CLOSED | Ticket owner | ✅ |
| Ticket Rejected | Ticket status → REJECTED | Ticket owner | ✅ |
| New Comment | Comment added to ticket | Ticket owner | ✅ |
| Technician Assigned | Technician assigned | Technician + Owner | ✅ |

---

## Future Enhancements (Not Implemented)

- Resource status change notifications (ACTIVE ↔ OUT_OF_SERVICE)
- Resource deleted notifications
- Booking cancelled notifications
- Booking time updated notifications
- Upcoming booking reminders (e.g., 1 hour before)
- Priority change notifications
- Role change notifications (USER → TECHNICIAN/ADMIN)
- Welcome notification on account creation
- Push notifications (web push, email)
- In-app notification sound/toast alerts

---

## Performance Considerations

**Current Implementation:**
- Polling every 30 seconds for notification count
- Notifications loaded on demand when page is visited
- Database indexed on `userId` and `isRead` fields

**Recommended Improvements:**
- Implement WebSocket for real-time notifications
- Add server-sent events (SSE) for live updates
- Implement notification aggregation (group similar notifications)
- Add pagination for notification list
- Implement push notifications using service workers
