# Multi-Student Check-in Testing Guide

## Changes Made

### 1. Fixed Real-time Attendance Count
- **Issue**: Admin side not showing updated counts
- **Fix**: Removed stale closure issue in auto-refresh mechanism
- **Result**: Counts update every 5 seconds automatically

### 2. Improved Duplicate Detection
- **Logic**: Only checks by name (case-insensitive)
- **Allows**: Same QR code + different names ✅
- **Blocks**: Same QR code + same name (any case) ❌

### 3. Enhanced Logging
- **Frontend**: Console shows name, userId, email being sent
- **Backend**: Console shows duplicate check details

### 4. Better UX
- "Check in Another Student" button after successful check-in
- "Try Different Name" button when duplicate detected
- Shows which name was already used

---

## Testing Steps

### Test 1: Real-time Count Updates
1. **Open two browser windows**:
   - Window 1: Admin/User bookings page
   - Window 2: QR verification page with QR code

2. **Create a booking**:
   - Resource: Lecture Hall or Lab
   - Expected Attendees: 10
   - Wait for admin approval

3. **Check in first student**:
   - Window 2: Enter name "Alice Johnson"
   - Click "Next" to check in
   - ✅ Should see "1 / 10 Students Checked In"

4. **Verify auto-refresh** (within 5 seconds):
   - Window 1: Should automatically show "1/10 checked in"
   - Check console: Should see "📊 Attendance updated"

5. **Check in second student**:
   - Window 2: Click "Check in Another Student"
   - Enter name "Bob Smith"
   - Click "Next"
   - ✅ Should see "2 / 10 Students Checked In"

6. **Verify count updates**:
   - Window 1: Should show "2/10 checked in" within 5 seconds

---

### Test 2: Different Names (Should Work)
1. **Scan QR code from phone** (or copy URL)
2. **First check-in**:
   - Name: "John Doe"
   - Click "Next"
   - ✅ **Expected**: Success message

3. **Second check-in** (same QR, different device):
   - Name: "Jane Smith"
   - Click "Next"
   - ✅ **Expected**: Success message
   - Count should be 2/10

4. **Check console logs**:
   - **Frontend**: Should show different names being sent
   - **Backend**: Should show "✅ NEW CHECK-IN SUCCESSFUL!" for both

---

### Test 3: Same Name (Should Block)
1. **First check-in**:
   - Name: "Sarah Wilson"
   - ✅ **Expected**: Success

2. **Second check-in** (same QR):
   - Name: "sarah wilson" (lowercase)
   - ❌ **Expected**: "Already Checked In" error
   - Should show: "Name entered: sarah wilson"
   - Button: "Try Different Name"

3. **Third check-in** (same QR):
   - Name: "SARAH WILSON" (uppercase)
   - ❌ **Expected**: Same error (case-insensitive match)

4. **Check backend console**:
   - Should see: "⚠️ DUPLICATE BLOCKED - Name: 'SARAH WILSON' already exists as 'Sarah Wilson'"

---

## Console Logs to Watch

### Frontend Console (Browser DevTools)
```
🎫 Check-in attempt:
   Name: Alice Johnson
   UserId: alice-johnson
   Email: (none)
   URL: /api/bookings/verify-qr?qrData=...&userId=alice-johnson&userName=Alice%20Johnson

✅ Check-in SUCCESS: {success: true, message: "Check-in Successful", ...}

🔄 Auto-refreshing attendance counts...
📊 Attendance updated for Lecture Hall A: 1/10
```

### Backend Console (Terminal)
```
🔍 Check-in request - BookingId: 65f..., UserId: 'alice-johnson', UserName: 'Alice Johnson'

✅ NEW CHECK-IN SUCCESSFUL!
   Name: 'Alice Johnson'
   UserId: 'alice-johnson'
   Progress: 1/10
```

### When Duplicate Detected
```
🔍 Check-in request - BookingId: 65f..., UserId: 'sarah-wilson', UserName: 'sarah wilson'

⚠️ DUPLICATE BLOCKED - Name: 'sarah wilson' already exists as 'Sarah Wilson'
   Existing record: UserId='sarah-wilson', CheckedInAt=2026-03-05T14:30:15
```

---

## Expected Behavior

| Scenario | Result |
|----------|--------|
| Same QR + same name (exact) | ❌ Blocked |
| Same QR + same name (different case) | ❌ Blocked |
| Same QR + different names | ✅ Allowed |
| Admin viewing bookings | ✅ Count updates every 5 seconds |
| User viewing own bookings | ✅ Count updates every 5 seconds |

---

## Restart Instructions

1. **Stop backend** (Ctrl+C in backend terminal)
2. **Restart backend**:
   ```powershell
   cd backend
   .\gradlew bootRun
   ```
3. **Frontend should auto-refresh** (Vite hot reload)
4. **Test with actual phone scanning** for best results

---

## Troubleshooting

### Count not updating?
- Check browser console for "🔄 Auto-refreshing attendance counts..."
- Verify backend is running and responding to `/api/bookings/{id}/attendance`
- Wait at least 5 seconds after check-in

### Duplicate detection not working?
- Check backend console for "🔍 Check-in request" logs
- Verify exact names being sent (check frontend console)
- Ensure MongoDB is running and connected

### "Try Different Name" button not showing?
- Only shows if booking has expected attendees > 1
- Only shows if current count < expected count
- Check that booking was created with expectedAttendees field

---

## Quick Test Command

**Backend Console**: Should show detailed logs for each check-in attempt including the exact name comparison.

**Frontend Console**: Open DevTools → Console tab to see real-time check-in attempts and auto-refresh logs.
