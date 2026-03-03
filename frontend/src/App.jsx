import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginButton } from './components/LoginButton';
import { ResourcesPage } from './pages/ResourcesPage';
import { BookingsPage } from './pages/BookingsPage';
import { TicketsPage } from './pages/TicketsPage';
import { QRVerificationPage } from './pages/QRVerificationPage';
import { NotificationsPage } from './pages/NotificationsPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import { Bell, GraduationCap, ShieldCheck, UserCircle, Wrench } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from './api/axios';

function App() {
  const { user, loading, loginAsDev } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const res = await axios.get('/api/notifications?unreadOnly=true');
      setUnreadCount(res.data.length);
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 w-full relative">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex gap-8 items-center">
                <Link to="/" className="text-2xl font-black text-primary-600 tracking-tight">
                  SmartCampus
                </Link>
                {user && (
                  <nav className="flex gap-4">
                    <Link to="/resources" className="text-gray-600 hover:text-primary-600 font-medium">Facilities</Link>
                    <Link to="/bookings" className="text-gray-600 hover:text-primary-600 font-medium">Bookings</Link>
                    <Link to="/tickets" className="text-gray-600 hover:text-primary-600 font-medium">Maintenance</Link>
                    <Link to="/notifications" className="text-gray-600 hover:text-primary-600 font-medium relative">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    {(user.role === 'ADMIN' || user.role === 'TECHNICIAN') && (
                      <Link to="/verify-qr" className="text-gray-600 hover:text-primary-600 font-medium">Verify QR</Link>
                    )}
                  </nav>
                )}
              </div>
              <LoginButton />
            </div>
          </div>
        </header>

        <main className="w-full">
          <Routes>
            {/* Public routes */}
            <Route path="/verify-qr" element={<QRVerificationPage />} />
            <Route path="/select-role" element={<RoleSelectionPage />} />
            
            {/* Protected routes - require login */}
            {!user ? (
              <Route path="*" element={
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
                  <div className="max-w-2xl w-full">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-6 shadow-lg">
                        <GraduationCap className="w-12 h-12 text-white" />
                      </div>
                      <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">SmartCampus</h1>
                      <p className="text-gray-600 text-lg mb-2">Manage facilities, book resources, and track maintenance</p>
                      <p className="text-gray-500">Select a role to continue</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Quick Login</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={() => loginAsDev('ADMIN')}
                          className="flex flex-col items-center gap-3 p-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          <ShieldCheck className="w-10 h-10" />
                          <div className="text-center">
                            <div className="font-bold text-lg">Administrator</div>
                            <div className="text-xs opacity-90 mt-1">Full access</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => loginAsDev('USER')}
                          className="flex flex-col items-center gap-3 p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          <UserCircle className="w-10 h-10" />
                          <div className="text-center">
                            <div className="font-bold text-lg">Student</div>
                            <div className="text-xs opacity-90 mt-1">Book & view</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => loginAsDev('TECHNICIAN')}
                          className="flex flex-col items-center gap-3 p-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          <Wrench className="w-10 h-10" />
                          <div className="text-center">
                            <div className="font-bold text-lg">Technician</div>
                            <div className="text-xs opacity-90 mt-1">Maintenance</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              } />
            ) : (
              <>
                <Route path="/" element={<ResourcesPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
