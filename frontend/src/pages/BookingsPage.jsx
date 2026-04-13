import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, X as XIcon, Calendar, Clock, Filter, Users, Copy, CheckCheck, Trash2 } from 'lucide-react';
import { BookingForm } from '../components/BookingForm';

export const BookingsPage = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingBookingId, setRejectingBookingId] = useState(null);
    const [copiedQR, setCopiedQR] = useState(null);
    const [attendanceCounts, setAttendanceCounts] = useState({});
    const [viewingAttendance, setViewingAttendance] = useState(null);
    const [attendanceList, setAttendanceList] = useState([]);

    // For Admin and Technician, fetch all. For User, fetch my-bookings.
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const url = (user.role === 'ADMIN' || user.role === 'TECHNICIAN')
                ? '/api/bookings'
                : '/api/bookings/my-bookings';

            const res = await axios.get(url, { withCredentials: true });
            setBookings(res.data);
            
            // Fetch attendance counts for each approved booking
            const counts = {};
            for (const booking of res.data) {
                if (booking.status === 'APPROVED') {
                    try {
                        const attendanceRes = await axios.get(`/api/bookings/${booking.id}/attendance`, { withCredentials: true });
                        counts[booking.id] = attendanceRes.data.totalAttendees || 0;
                    } catch (err) {
                        counts[booking.id] = 0;
                    }
                }
            }
            setAttendanceCounts(counts);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [user.role]);
    
    // Separate effect for auto-refresh - fetch counts every 5 seconds
    useEffect(() => {
        const fetchAttendanceCountsInterval = async () => {
            try {
                const url = (user.role === 'ADMIN' || user.role === 'TECHNICIAN')
                    ? '/api/bookings'
                    : '/api/bookings/my-bookings';

                console.log('🔄 Fetching bookings from:', url);
                const res = await axios.get(url, { withCredentials: true });
                console.log('📦 Total bookings:', res.data.length);
                
                const counts = {};
                let approvedCount = 0;
                
                for (const booking of res.data) {
                    if (booking.status === 'APPROVED') {
                        approvedCount++;
                        try {
                            console.log(`  📊 Fetching attendance for ${booking.resourceName} (ID: ${booking.id})`);
                            const attendanceRes = await axios.get(`/api/bookings/${booking.id}/attendance`, { withCredentials: true });
                            const newCount = attendanceRes.data.totalAttendees || 0;
                            counts[booking.id] = newCount;
                            console.log(`     Result: ${newCount}/${booking.expectedAttendees}`);
                        } catch (err) {
                            console.error(`     ❌ Failed to fetch attendance for ${booking.id}:`, err.response?.data || err.message);
                            counts[booking.id] = 0;
                        }
                    }
                }
                
                console.log(`✅ Processed ${approvedCount} approved bookings`);
                
                setAttendanceCounts(prevCounts => {
                    // Log changes
                    const bookingIds = new Set([...Object.keys(prevCounts), ...Object.keys(counts)]);
                    let changesDetected = false;
                    bookingIds.forEach(id => {
                        if (prevCounts[id] !== counts[id]) {
                            const booking = res.data.find(b => b.id === id);
                            console.log(`🔔 ATTENDANCE CHANGED for ${booking?.resourceName || id}: ${prevCounts[id] || 0} → ${counts[id]}/${booking?.expectedAttendees || '?'}`);
                            changesDetected = true;
                        }
                    });
                    if (!changesDetected) {
                        console.log('   No changes detected');
                    }
                    return counts;
                });
            } catch (error) {
                console.error("❌ Failed to refresh attendance counts:", error.response?.data || error.message);
            }
        };
        
        // Run immediately on mount
        console.log('🚀 Starting attendance auto-refresh');
        fetchAttendanceCountsInterval();
        
        // Set up interval for auto-refresh every 5 seconds
        const intervalId = setInterval(() => {
            console.log('\n⏰ Auto-refresh triggered (5s interval)');
            fetchAttendanceCountsInterval();
        }, 5000);
        
        return () => {
            console.log('🛑 Stopping auto-refresh');
            clearInterval(intervalId);
        };
    }, [user.role]);

    useEffect(() => {
        // Apply filters
        if (filterStatus === 'ALL') {
            setFilteredBookings(bookings);
        } else {
            setFilteredBookings(bookings.filter(b => b.status === filterStatus));
        }
    }, [bookings, filterStatus]);

    const handleStatusUpdate = async (id, status, reason = '') => {
        try {
            if (status === 'CANCELLED') {
                await axios.patch(`/api/bookings/${id}/cancel`, {}, { withCredentials: true });
            } else {
                const payload = { status };
                if (status === 'REJECTED' && reason) {
                    payload.rejectionReason = reason;
                }
                await axios.put(`/api/bookings/${id}/approve`, payload, { withCredentials: true });
            }
            setRejectingBookingId(null);
            setRejectionReason('');
            fetchBookings();
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleRejectClick = (bookingId) => {
        setRejectingBookingId(bookingId);
    };

    const confirmReject = () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        handleStatusUpdate(rejectingBookingId, 'REJECTED', rejectionReason);
    };

    const copyQRCode = (qrData, bookingId) => {
        // Copy the full URL, not just the token
        const qrUrl = `${import.meta.env.VITE_NETWORK_URL || window.location.origin}/verify-qr?qrData=${encodeURIComponent(qrData)}`;
        console.log('Copying QR URL:', qrUrl);
        
        // Try modern clipboard API first, fallback to textarea method
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(qrUrl)
                .then(() => {
                    console.log('✅ QR URL copied successfully (Clipboard API)');
                    setCopiedQR(bookingId);
                    setTimeout(() => setCopiedQR(null), 2000);
                })
                .catch(err => {
                    console.error('❌ Clipboard API failed:', err);
                    fallbackCopy(qrUrl, bookingId);
                });
        } else {
            // Fallback for non-secure contexts (HTTP)
            fallbackCopy(qrUrl, bookingId);
        }
    };

    const fallbackCopy = (text, bookingId) => {
        // Create temporary textarea
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('✅ QR URL copied successfully (fallback method)');
                setCopiedQR(bookingId);
                setTimeout(() => setCopiedQR(null), 2000);
            } else {
                console.error('❌ Fallback copy failed');
                alert('Failed to copy. Please copy manually from the box above.');
            }
        } catch (err) {
            console.error('❌ Fallback copy error:', err);
            alert('Failed to copy. Please copy manually from the box above.');
        } finally {
            document.body.removeChild(textArea);
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) {
            return;
        }
        try {
            await axios.delete(`/api/bookings/${bookingId}`, { withCredentials: true });
            fetchBookings();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete booking');
        }
    };
    
    const viewAttendance = async (bookingId) => {
        try {
            const res = await axios.get(`/api/bookings/${bookingId}/attendance`, { withCredentials: true });
            setAttendanceList(res.data.attendanceList || []);
            setViewingAttendance(res.data);
        } catch (error) {
            alert('Failed to fetch attendance data');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">
                    {user.role === 'ADMIN' ? 'Manage Bookings' : 
                     user.role === 'TECHNICIAN' ? 'All Bookings' : 'My Bookings'}
                </h1>
                {user.role === 'USER' && (
                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                        <Plus className="w-5 h-5" />
                        New Booking
                    </button>
                )}
            </div>

            {/* QR Verification Info Banner for Admin only */}
            {user.role === 'ADMIN' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="bg-purple-500 rounded-full p-2 flex-shrink-0">
                            <QRCodeSVG value="demo" size={24} className="opacity-0" />
                            <span className="absolute text-white text-xl">📱</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 mb-1">QR Code Verification</h3>
                            <p className="text-sm text-gray-600">
                                Go to <span className="font-bold text-purple-700">Verify QR</span> page to scan or enter QR code data for approved bookings. 
                                All booking details will be displayed for check-in validation.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
                </div>
                <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                    <option value="ALL">All Bookings</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
                <span className="text-sm text-gray-500">
                    Showing {filteredBookings.length} of {bookings.length} bookings
                </span>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBookings.map(booking => (
                        <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{booking.resourceName}</h3>
                                    <p className="text-sm text-gray-500">Booked by {booking.userName}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-6 flex-grow">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(booking.startTime).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {booking.expectedAttendees && (
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Users className="w-4 h-4" />
                                            <span>
                                                {booking.status === 'APPROVED' && attendanceCounts[booking.id] !== undefined ? (
                                                    <>
                                                        <span className="font-bold text-blue-600">{attendanceCounts[booking.id]}</span>
                                                        <span className="text-gray-400"> / </span>
                                                        <span>{booking.expectedAttendees}</span>
                                                        <span className="text-gray-500"> checked in</span>
                                                    </>
                                                ) : (
                                                    <span>{booking.expectedAttendees} attendees</span>
                                                )}
                                            </span>
                                        </div>
                                        {booking.status === 'APPROVED' && attendanceCounts[booking.id] > 0 && (
                                            <button
                                                onClick={() => viewAttendance(booking.id)}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
                                            >
                                                View List
                                            </button>
                                        )}
                                    </div>
                                )}
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                    <span className="font-semibold">Purpose:</span> {booking.purpose}
                                </p>
                                {booking.rejectionReason && (
                                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                        <p className="text-xs text-red-700">
                                            <span className="font-semibold">Rejection Reason:</span> {booking.rejectionReason}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons & QR Code */}
                            <div className="border-t border-gray-100 pt-4 mt-auto">
                                {/* User actions */}
                                {user.role === 'USER' && (
                                    <div className="flex gap-2">
                                        {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                                            <>
                                                <button onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')} className="text-red-600 text-sm font-medium hover:text-red-700">
                                                    Cancel Booking
                                                </button>
                                                <span className="text-gray-300">|</span>
                                            </>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteBooking(booking.id)} 
                                            className="flex items-center gap-1 text-red-700 text-sm font-medium hover:text-red-900"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                )}

                                {/* Admin actions */}
                                {user.role === 'ADMIN' && (
                                    <div className="space-y-2">
                                        {booking.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleStatusUpdate(booking.id, 'APPROVED')} className="flex items-center gap-1 flex-1 justify-center px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition">
                                                    <Check className="w-4 h-4" /> Approve
                                                </button>
                                                <button onClick={() => handleRejectClick(booking.id)} className="flex items-center gap-1 flex-1 justify-center px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 transition">
                                                    <XIcon className="w-4 h-4" /> Reject
                                                </button>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteBooking(booking.id)} 
                                            className="flex items-center gap-1 justify-center w-full px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 transition text-sm font-medium"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Booking
                                        </button>
                                    </div>
                                )}

                                {/* QR Code generation for approved bookings */}
                                {booking.status === 'APPROVED' && booking.qrValidationData && (
                                    <div className="mt-4 flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                        <span className="text-xs text-gray-600 mb-2 uppercase font-bold tracking-wide">Verification QR Code</span>
                                        <div className="bg-white p-3 rounded-lg shadow-md">
                                            <QRCodeSVG 
                                                value={`${import.meta.env.VITE_NETWORK_URL || window.location.origin}/verify-qr?qrData=${encodeURIComponent(booking.qrValidationData)}`}
                                                size={120} 
                                                level="M" 
                                            />
                                        </div>
                                        <div className="mt-3 w-full">
                                            <p className="text-xs text-blue-600 mb-2 font-semibold text-center">📱 Scan with your phone to check in</p>
                                            <p className="text-xs text-gray-500 mb-1 font-semibold">For mobile access, open:</p>
                                            <div className="bg-white px-3 py-2 rounded border border-gray-300 text-xs text-gray-700 break-all mb-2">
                                                {(() => {
                                                    const hostname = window.location.hostname;
                                                    const port = window.location.port;
                                                    return hostname === 'localhost' || hostname === '127.0.0.1'
                                                        ? `http://[YOUR_COMPUTER_IP]:${port}/verify-qr?qrData=${booking.qrValidationData}`
                                                        : `${window.location.origin}/verify-qr?qrData=${encodeURIComponent(booking.qrValidationData)}`;
                                                })()}
                                            </div>
                                            <p className="text-xs text-gray-400 italic text-center">Check-in opens 15 min before booking time</p>
                                            <button
                                                onClick={() => copyQRCode(booking.qrValidationData, booking.id)}
                                                className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
                                            >
                                                {copiedQR === booking.id ? (
                                                    <>
                                                        <CheckCheck className="w-4 h-4" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        Copy QR Code
                                                    </>
                                                )}
                                            </button>
                                            <p className="text-xs text-gray-400 mt-2 italic text-center">Go to "Verify QR" to check-in</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredBookings.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            {filterStatus !== 'ALL' ? `No ${filterStatus.toLowerCase()} bookings found.` : 'No bookings found.'}
                        </div>
                    )}
                </div>
            )}

            {/* Rejection Reason Modal */}
            {rejectingBookingId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Reject Booking</h3>
                            <p className="text-sm text-gray-500 mt-1">Please provide a reason for rejection</p>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="E.g., Resource unavailable, conflict with scheduled maintenance..."
                                rows="4"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            ></textarea>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => { setRejectingBookingId(null); setRejectionReason(''); }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReject}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                            >
                                Reject Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <BookingForm onClose={() => { setIsFormOpen(false); fetchBookings(); }} />
            )}
            
            {/* Attendance List Modal */}
            {viewingAttendance && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-gray-800">Attendance List</h3>
                                <button
                                    onClick={() => setViewingAttendance(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">{viewingAttendance.booking?.resourceName}</p>
                            <div className="mt-3 flex items-center gap-3 text-sm">
                                <Users className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-blue-600 text-lg">
                                    {viewingAttendance.totalAttendees} / {viewingAttendance.expectedAttendees}
                                </span>
                                <span className="text-gray-600">students checked in</span>
                            </div>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            {attendanceList.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No students have checked in yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {attendanceList.map((attendance, index) => (
                                        <div key={attendance.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">{attendance.userName}</p>
                                                {attendance.studentId && (
                                                    <p className="text-xs text-blue-600 font-medium">🆔 {attendance.studentId}</p>
                                                )}
                                                {attendance.userEmail && (
                                                    <p className="text-xs text-gray-500">📧 {attendance.userEmail}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Checked in at</p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {new Date(attendance.checkedInAt).toLocaleTimeString([], { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setViewingAttendance(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
