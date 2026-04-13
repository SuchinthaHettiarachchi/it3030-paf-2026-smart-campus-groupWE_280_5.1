# Student Check-In Feature - Testing Guide

## 🎓 How to Test Multi-Student Attendance Tracking

### Step 1: Create a Booking with Expected Attendees

1. **Login as User** (green button)
2. Go to **"Bookings"** page
3. Click **"New Booking"** button
4. Fill in the form:
   - **Facility**: Select any lab/room (e.g., "Computer Lab A")
   - **Start Time**: Choose a time (within 15 minutes from now for immediate testing)
   - **End Time**: Choose end time
   - **Expected Attendees**: **100** (or any number)
   - **Purpose**: "Testing student check-in"
5. Click **"Submit Request"**
6. Status will show **"PENDING"**

### Step 2: Admin Approves the Booking

1. **Logout** and **Login as Admin** (purple button)
2. Go to **"Bookings"** page  
3. Find your booking (filter by "Pending" if needed)
4. Click **"Approve"** button
5. Status changes to **"APPROVED"**

### Step 3: Get the QR Code

After approval, you'll see:
- ✅ **QR Code** displayed on the booking card
- 📱 A button to **"Copy QR URL"**
- 📊 Attendance counter showing **"0 / 100 checked in"**

Click the **"Copy"** button to copy the QR URL.

### Step 4: Student Check-In (Repeat Multiple Times)

1. Open a **new browser tab/window** (or use Incognito mode)
2. **Paste the QR URL** in the address bar
3. You'll be redirected to the **QR Verification Page**
4. Click **"Next"** button
5. Fill in student details:
   - **Full Name**: "Student 1" (required)
   - **Student ID**: "2024001" (optional)
   - **Email**: "student1@uni.edu" (optional)
6. Click **"Check In"**
7. ✅ Success! You'll see:
   - **"Check-in Successful"**
   - **"1 / 100 Students Checked In"**

### Step 5: Multiple Students Check In

Repeat Step 4 with different names:
- **Student 2** → Shows "2 / 100"
- **Student 3** → Shows "3 / 100"
- **Student 4** → Shows "4 / 100"
- Continue as needed...

### Step 6: Test Duplicate Check-In

Try checking in again with the **same name/ID**:
- ⚠️ **"Already Checked In"** warning appears
- Shows their previous check-in time
- Still displays total count: "4 / 100"

### Step 7: View Attendance List

1. Go back to the **Bookings page** (as Admin or User)
2. Find the approved booking
3. You'll see: **"4 / 100 checked in"** (updated automatically)
4. Click **"View List"** button
5. **Attendance Modal** opens showing:
   - List of all students who checked in
   - Their names, emails
   - Check-in timestamps
   - Numbered list (1, 2, 3, 4...)

---

## 📋 Where to See Everything

### Booking Card Shows:
- **Expected Attendees**: "100 attendees" (before approval)
- **Attendance Count**: "4 / 100 checked in" (after students check in)
- **View List Button**: Click to see full attendance

### QR Verification Page Shows:
- Student check-in form
- Real-time count after each check-in
- Success/error messages

### Attendance List Modal Shows:
- Complete list of checked-in students
- Total count
- Individual check-in times

---

## 🔄 Equipment Bookings (Single Check-In)

For equipment/resource bookings where only the organizer needs to check in:

1. On QR Verification Page, enter QR code
2. Click **"Quick"** button (instead of "Next")
3. Immediate check-in without student form
4. Works like the old system

---

## 🎯 Quick Test Checklist

- [ ] Create booking with expectedAttendees: 100
- [ ] Admin approves booking
- [ ] See QR code on booking card
- [ ] Copy QR URL
- [ ] Student 1 checks in → See "1/100"
- [ ] Student 2 checks in → See "2/100"
- [ ] Student 3 checks in → See "3/100"
- [ ] Try duplicate (Student 1 again) → See warning
- [ ] View attendance list → See all 3 students
- [ ] Booking card shows "3/100 checked in"

---

## 💡 Tips

- **Time Window**: Check-in opens 15 minutes before booking start time
- **Refresh**: If count doesn't update, refresh the bookings page
- **Multiple Devices**: Test with different browsers or devices for realistic simulation
- **Attendance Mode**: 
  - "Next" button → Multi-student check-in
  - "Quick" button → Single check-in (equipment)

---

Happy Testing! 🎓✅
