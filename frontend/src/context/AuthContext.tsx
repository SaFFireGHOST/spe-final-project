import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { api } from '../api/client';

interface User {
    id: string;
    name: string;
    phone: string;
    role: 'RIDER' | 'DRIVER';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (phone: string, password: string) => Promise<void>;
    signup: (data: any) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('token');
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    const login = async (phone: string, password: string) => {
        try {
            const response = await api.login({ phone, password });
            const { user, token } = response.data;
            setUser(user);
            setToken(token);
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    };

    const signup = async (data: any) => {
        try {
            const response = await api.signup(data);
            // Auto login or just redirect? 
            // The backend signup returns the user object but not a token usually unless we change it.
            // Gateway signup returns `jsonify(MessageToDict(resp.user))`. No token.
            // So we probably need to ask user to login, or we can just set the user and assume no token needed for now?
            // But `login` sets the token.
            // Let's just return and let the UI redirect to login.
            return response.data;
        } catch (error) {
            console.error('Signup failed', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
