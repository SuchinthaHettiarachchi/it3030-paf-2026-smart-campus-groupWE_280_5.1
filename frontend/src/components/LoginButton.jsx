import { useAuth } from '../context/AuthContext';
import { LogOut, LogIn } from 'lucide-react';

export const LoginButton = () => {
    const { user, logout, loginAsDev } = useAuth();

    const handleGoogleLogin = () => {
        // Determine backend URL based on current hostname
        const hostname = window.location.hostname;
        const backendURL = (hostname === 'localhost' || hostname === '127.0.0.1') 
            ? 'http://localhost:8080' 
            : `http://${hostname}:8080`;
        
        // Redirect to Google OAuth login
        window.location.href = `${backendURL}/oauth2/authorization/google`;
    };

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {user.avatarUrl && (
                        <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
                    )}
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">{user.role}</span>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-3">
            {/* Google Sign-In Button (Requires Setup) */}
            <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-3 px-6 py-2.5 bg-white border-2 border-gray-300 hover:border-gray-400 hover:shadow-md rounded-lg transition-all font-medium text-gray-700"
                title="Requires Google OAuth setup - see GOOGLE_SIGNIN_SETUP.md"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
            </button>

            {/* Dev Mode Buttons (for testing) */}
            <div className="flex gap-2 border-l-2 border-gray-300 pl-3">
                <button
                    onClick={() => loginAsDev('ADMIN')}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm"
                    title="Dev Mode: Login as Admin"
                >
                    <LogIn className="w-4 h-4" />
                    Admin
                </button>
                <button
                    onClick={() => loginAsDev('USER')}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                    title="Dev Mode: Login as User"
                >
                    <LogIn className="w-4 h-4" />
                    User
                </button>
                <button
                    onClick={() => loginAsDev('TECHNICIAN')}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors shadow-sm"
                    title="Dev Mode: Login as Technician"
                >
                    <LogIn className="w-4 h-4" />
                    Tech
                </button>
            </div>
        </div>
    );
};
