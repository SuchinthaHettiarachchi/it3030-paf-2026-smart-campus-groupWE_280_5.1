import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check if using dev mode (stored in localStorage)
            const devUser = localStorage.getItem('devUser');
            if (devUser) {
                setUser(JSON.parse(devUser));
                setLoading(false);
                return;
            }

            // Otherwise try OAuth authentication
            const res = await axios.get('/api/auth/me', {
                withCredentials: true
            });
            
            // 204 No Content means not authenticated
            if (res.status === 204 || !res.data) {
                setUser(null);
            } else {
                setUser(res.data);
            }
        } catch (err) {
            console.log('No active session');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Clear dev mode
            localStorage.removeItem('devUser');
            
            // Try OAuth logout
            await axios.post('/api/auth/logout', {}, { withCredentials: true });
        } catch (err) {
            console.log('Logout completed');
        } finally {
            setUser(null);
            window.location.href = '/';
        }
    };

    const loginAsDev = (role) => {
        const devUsers = {
            ADMIN: { id: 'dev-admin-123', name: 'Dev Admin', email: 'admin@dev.local', role: 'ADMIN' },
            USER: { id: 'dev-user-456', name: 'Dev Student', email: 'student@dev.local', role: 'USER' },
            TECHNICIAN: { id: 'dev-tech-789', name: 'Dev Technician', email: 'tech@dev.local', role: 'TECHNICIAN' }
        };
        const selectedUser = devUsers[role];
        localStorage.setItem('devUser', JSON.stringify(selectedUser));
        setUser(selectedUser);
        window.location.href = '/';
    };

    const loginWithEmailPassword = async (email, password) => {
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            setUser(res.data);
            localStorage.setItem('devUser', JSON.stringify(res.data));
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, checkAuth, logout, loginAsDev, loginWithEmailPassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
