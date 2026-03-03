# Smart Campus - Features Guide

## Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **MongoDB**: mongodb://localhost:27017/SmartCampus

## User Roles & Features

### 🔴 ADMIN Role
Click the **purple "Admin" button** on the login page

#### Resources/Facilities Management
- ✅ View all campus resources (Lecture Halls, Labs, Equipment)
- ✅ **Add new resources** - Click "Add Resource" button
- ✅ **Edit existing resources** - Click "Edit" on any resource card
- ✅ Search resources by name
- ✅ View resource status (Active, Maintenance, Inactive)

#### Bookings Management
- ✅ View **ALL bookings** from all users
- ✅ **Create new bookings** - Click "New Booking" button
- ✅ **Approve/Reject** pending bookings
- ✅ View QR codes for approved bookings
- ✅ Filter bookings by status

#### Tickets/Maintenance Management
- ✅ View **ALL maintenance tickets**
- ✅ **Assign tickets** to technicians
- ✅ **Change ticket status** (Open, In Progress, Resolved, Closed, Rejected)
- ✅ Add comments to tickets
- ✅ View ticket history and details

---

### 🔵 STUDENT/USER Role
Click the **blue "Student" button** on the login page

#### Resources/Facilities
- ✅ View all available campus resources
- ✅ Search for resources
- ✅ View resource details (capacity, location, status)
- ❌ Cannot add/edit resources

#### My Bookings
- ✅ View **only YOUR bookings**
- ✅ **Create new booking requests** - Click "New Booking" button
  - Select facility/resource
  - Choose date and time
  - Provide purpose
- ✅ **Cancel your pending bookings**
- ✅ View QR codes for approved bookings
- ✅ Track booking status (Pending, Approved, Rejected)

#### My Tickets
- ✅ View **only YOUR tickets**
- ✅ **Raise new maintenance issues** - Click "Raise Issue" button
  - Enter title and description
  - Specify affected facility
- ✅ Add comments to your tickets
- ✅ View ticket progress and technician responses
- ❌ Cannot change ticket status or assign technicians

---

### 🟠 TECHNICIAN Role
Click the **orange "Tech" button** on the login page

#### Assigned Tickets
- ✅ View **only tickets assigned to you**
- ✅ **Update ticket status**
  - Mark as In Progress
  - Mark as Resolved
  - Mark as Closed
- ✅ Add comments and updates
- ✅ View ticket details and history

#### Resources (View Only)
- ✅ View all campus resources
- ✅ Search resources
- ❌ Cannot add/edit resources

---

## Sample Data in Database

### Resources (6 items)
1. Main Auditorium - Lecture Hall (200 capacity)
2. CS Lecture Hall 101 - Lecture Hall (50 capacity)
3. Computer Lab A - Lab (30 capacity)
4. Physics Lab - Lab (25 capacity) - IN MAINTENANCE
5. Projector Sony 4K - Equipment
6. Camera Kit Canon EOS - Equipment

### Users (4 items)
1. Admin User
2. John Doe (Student)
3. Jane Smith (Student)
4. Tech Support (Technician)

### Bookings (3 items)
- Main Auditorium booking (APPROVED)
- Computer Lab A booking (PENDING)
- Projector booking (APPROVED)

### Tickets (3 items)
- Projector not working (IN_PROGRESS)
- AC not cooling (OPEN)
- Equipment maintenance completed (RESOLVED)

---

## How to Test All Features

### Test as ADMIN:
1. Login as Admin
2. Go to **Facilities** tab
   - Click "Add Resource" and create a new facility
   - Click "Edit" on any existing resource
3. Go to **Bookings** tab
   - Click "New Booking" to create a booking
   - Approve or Reject pending bookings
4. Go to **Maintenance** tab
   - Click on any ticket to view details
   - Change status using dropdown
   - Assign to technician
   - Add comments

### Test as STUDENT:
1. Login as Student
2. Go to **Facilities** tab
   - Browse available resources
   - Search for specific facilities
3. Go to **Bookings** tab
   - Click "New Booking"
   - Select a resource, time, and purpose
   - Submit request
   - Cancel a pending booking
4. Go to **Maintenance** tab
   - Click "Raise Issue"
   - Fill in title, facility, and description
   - Submit ticket
   - Add comments to your tickets

### Test as TECHNICIAN:
1. Login as Tech
2. Go to **Maintenance** tab
   - View tickets assigned to you
   - Click on a ticket
   - Update status to "In Progress"
   - Add comments with updates
   - Mark as "Resolved" when done

---

## Common Issues & Solutions

### "Failed to save resource"
- Make sure all required fields are filled (Name, Type, Capacity, Location, Status)
- Check browser console for specific errors

### "No bookings found"
- ADMIN sees all bookings
- STUDENT only sees their own bookings
- Make sure you're logged in with the correct role

### "No collections in MongoDB"
- Collections are created automatically on first run
- Check: mongodb://localhost:27017/SmartCampus
- Restart backend if collections are missing

### Frontend not updating
- Vite has Hot Module Replacement (HMR)
- Refresh browser (F5) if needed
- Check that frontend is running on http://localhost:5173

---

## API Endpoints Reference

### Resources
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create resource (ADMIN)
- `PUT /api/resources/{id}` - Update resource (ADMIN)
- `DELETE /api/resources/{id}` - Delete resource (ADMIN)

### Bookings
- `GET /api/bookings` - Get all bookings (ADMIN)
- `GET /api/bookings/my-bookings` - Get user's bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/{id}/approve` - Approve/reject (ADMIN)
- `PATCH /api/bookings/{id}/cancel` - Cancel booking

### Tickets
- `GET /api/tickets` - Get tickets (role-based)
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/{id}/status` - Update status
- `PATCH /api/tickets/{id}/assign` - Assign technician (ADMIN)
- `GET /api/tickets/{id}/comments` - Get ticket comments
- `POST /api/tickets/{id}/comments` - Add comment

---

## Development Mode Notes

- OAuth2 is disabled in dev mode
- Users are mocked in frontend (no real authentication)
- Backend accepts all requests without auth check
- All data persists in MongoDB
- No actual image upload (uses URLs)

**Ready for production:** Implement real Google OAuth2, add proper authorization checks, implement file upload service
