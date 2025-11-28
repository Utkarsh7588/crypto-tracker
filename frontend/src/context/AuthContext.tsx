import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import api from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    signup: (name: string, email: string, password: string) => Promise<any>;
    verifyEmail: (id: string, otp: string) => Promise<any>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error('Auth check failed', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const response = await api.post('/auth-service/login', { email, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const signup = async (name: string, email: string, password: string) => {
        const response = await api.post('/auth-service/signup', { name, email, password });
        return response.data;
    };

    const verifyEmail = async (id: string, otp: string) => {
        const response = await api.post('/auth-service/verify/email', { _id: id, otp });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, verifyEmail, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
