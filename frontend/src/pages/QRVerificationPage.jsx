import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import { QrCode, CheckCircle2, XCircle, Scan, AlertTriangle, Lock } from 'lucide-react';

export const QRVerificationPage = () => {
    const [searchParams] = useSearchParams();
    const [qrData, setQrData] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Auto-verify if QR code is in URL parameter
    useEffect(() => {
        const qrParam = searchParams.get('qr');
        if (qrParam && !verificationResult) {
            setQrData(qrParam);
            verifyQRCode(qrParam);
        }
    }, [searchParams]);

    const verifyQRCode = async (dataToVerify) => {
        const qrValue = dataToVerify || qrData;
        if (!qrValue.trim()) return;

        setLoading(true);
        try {
            const res = await axios.get(`/api/bookings/verify-qr?qrData=${encodeURIComponent(qrValue)}`);
            
            // Success - valid booking with check-in
            setVerificationResult({
                type: 'SUCCESS',
                data: res.data
            });
        } catch (error) {
            const errorData = error.response?.data;
            const errorType = errorData?.error;
            
            if (errorType === 'ACCESS_DENIED') {
                setVerificationResult({
                    type: 'ACCESS_DENIED',
                    message: errorData.message
                });
            } else if (errorType === 'ALREADY_CHECKED_IN') {
                setVerificationResult({
                    type: 'ALREADY_CHECKED_IN',
                    message: errorData.message,
                    checkedInAt: errorData.checkedInAt,
                    booking: errorData.booking
                });
            } else if (errorType === 'NOT_ALLOWED') {
                setVerificationResult({
                    type: 'NOT_ALLOWED',
                    message: errorData.message,
                    status: errorData.status
                });
            } else if (errorType === 'TOO_EARLY' || errorType === 'EXPIRED') {
                setVerificationResult({
                    type: 'TIME_ERROR',
                    message: errorData.message,
                    errorType: errorType
                });
            } else if (errorType === 'INVALID_QR') {
                setVerificationResult({
                    type: 'INVALID_QR',
                    message: errorData.message
                });
            } else {
                setVerificationResult({
                    type: 'INVALID_QR',
                    message: error.response?.data?.message || 'This QR code is not recognized.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        verifyQRCode();
    };

    const resetForm = () => {
        setQrData('');
        setVerificationResult(null);
    };

    const renderResult = () => {
        if (!verificationResult) return null;

        switch (verificationResult.type) {
            case 'SUCCESS':
                const booking = verificationResult.data.booking;
                const checkedInAt = verificationResult.data.checkedInAt;
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <CheckCircle2 className="w-20 h-20 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-green-600 mb-2">✅ Check-in Successful</h2>
                        <p className="text-lg text-gray-600 mb-8">Access granted for this booking</p>

                        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 text-left max-w-lg mx-auto border-2 border-green-200 shadow-lg">
                            <h3 className="font-bold text-xl text-gray-800 mb-4 pb-3 border-b border-green-200">Booking Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">QR Code:</span>
                                    <p className="font-bold text-lg text-blue-600 font-mono break-all">{booking.qrValidationData}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Booking ID:</span>
                                    <p className="font-semibold text-gray-800 font-mono">BK-{booking.id.substring(0, 8).toUpperCase()}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Resource:</span>
                                    <p className="font-bold text-xl text-gray-900">{booking.resourceName}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Date & Time:</span>
                                    <p className="font-semibold text-gray-800">
                                        {new Date(booking.startTime).toLocaleDateString('en-CA')}, {new Date(booking.startTime).toLocaleTimeString('en-US', { 
                                            hour: '2-digit', minute: '2-digit', hour12: false 
                                        })}–{new Date(booking.endTime).toLocaleTimeString('en-US', { 
                                            hour: '2-digit', minute: '2-digit', hour12: false 
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Booked by:</span>
                                    <p className="font-semibold text-gray-800">{booking.userName}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Purpose:</span>
                                    <p className="font-semibold text-gray-800">{booking.purpose}</p>
                                </div>
                                <div className="pt-3 border-t border-green-200">
                                    <span className="text-sm font-medium text-gray-500">Status:</span>
                                    <p className="inline-block px-3 py-1 bg-green-600 text-white rounded-full text-sm font-bold ml-2">
                                        CHECKED_IN
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Checked-in at:</span>
                                    <p className="font-bold text-green-600">
                                        {new Date(checkedInAt).toLocaleTimeString('en-US', {
                                            hour: 'numeric', minute: '2-digit', hour12: true
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-green-200">
                                <p className="text-sm text-green-700 italic flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Notification sent to user
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'ALREADY_CHECKED_IN':
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <AlertTriangle className="w-20 h-20 text-yellow-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-yellow-600 mb-2">⚠️ Already Checked In</h2>
                        <p className="text-lg text-gray-600 mb-8">This booking has already been verified</p>

                        <div className="bg-yellow-50 rounded-xl p-6 text-center max-w-md mx-auto border-2 border-yellow-200">
                            <div className="mb-4">
                                <span className="text-sm font-medium text-gray-600">QR Code:</span>
                                <p className="font-bold text-lg text-blue-600 font-mono break-all">{verificationResult.booking?.qrValidationData || qrData}</p>
                            </div>
                            <div className="mb-4">
                                <span className="text-sm font-medium text-gray-600">Checked-in at:</span>
                                <p className="font-bold text-3xl text-yellow-700 mt-2">
                                    {new Date(verificationResult.checkedInAt).toLocaleTimeString('en-US', {
                                        hour: 'numeric', minute: '2-digit', hour12: true
                                    })}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Status:</span>
                                <p className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-full text-sm font-bold ml-2 mt-2">
                                    CHECKED_IN
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'INVALID_QR':
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <XCircle className="w-20 h-20 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-red-600 mb-2">❌ Invalid QR Code</h2>
                        <div className="bg-red-50 rounded-xl p-6 max-w-md mx-auto border-2 border-red-200 mt-6">
                            <p className="text-lg text-gray-700">{verificationResult.message}</p>
                        </div>
                    </div>
                );

            case 'NOT_ALLOWED':
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <XCircle className="w-20 h-20 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-red-600 mb-2">❌ Not Allowed</h2>
                        <div className="bg-red-50 rounded-xl p-6 max-w-md mx-auto border-2 border-red-200 mt-6">
                            <p className="text-lg font-semibold text-gray-800 mb-2">Reason:</p>
                            <p className="text-lg text-gray-700">{verificationResult.message}</p>
                            {verificationResult.status && (
                                <p className="mt-3 text-sm text-gray-600">Booking Status: <span className="font-bold">{verificationResult.status}</span></p>
                            )}
                        </div>
                    </div>
                );

            case 'TIME_ERROR':
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <XCircle className="w-20 h-20 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-red-600 mb-2">❌ Not Allowed</h2>
                        <div className="bg-red-50 rounded-xl p-6 max-w-md mx-auto border-2 border-red-200 mt-6">
                            <p className="text-lg text-gray-700">{verificationResult.message}</p>
                        </div>
                    </div>
                );

            case 'ACCESS_DENIED':
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <Lock className="w-20 h-20 text-purple-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-purple-600 mb-2">🔒 Access Denied</h2>
                        <div className="bg-purple-50 rounded-xl p-6 max-w-md mx-auto border-2 border-purple-200 mt-6">
                            <p className="text-lg text-gray-700">{verificationResult.message}</p>
                            <p className="text-sm text-gray-600 mt-3">Please login with appropriate permissions.</p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="p-8 w-full max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">QR Code Verification</h1>
                <p className="text-gray-600">Scan or enter QR code to verify booking check-in</p>
            </div>

            {!verificationResult ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                            <QrCode className="w-12 h-12 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Enter QR Code Data</h2>
                        <p className="text-sm text-gray-500">Paste the QR code content below to verify</p>
                    </div>

                    <form onSubmit={handleVerify} className="max-w-md mx-auto space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                QR Code Data
                            </label>
                            <textarea
                                value={qrData}
                                onChange={e => setQrData(e.target.value)}
                                placeholder="Paste QR code data here..."
                                rows="4"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
                                required
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !qrData.trim()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition disabled:opacity-50"
                        >
                            <Scan className="w-5 h-5" />
                            {loading ? 'Verifying...' : 'Verify QR Code'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                    {renderResult()}
                    
                    <div className="flex justify-center mt-8 gap-4">
                        <button
                            onClick={resetForm}
                            className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition shadow-md"
                        >
                            {verificationResult.type === 'SUCCESS' ? 'Done' : verificationResult.type === 'ALREADY_CHECKED_IN' ? 'Back' : 'Try Again'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
