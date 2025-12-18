import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
    id: string;
    email: string;
    subscription_status?: string;
    stripe_customer_id?: string;
    cancel_at_period_end?: boolean;
    current_period_end?: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isSubscribed: boolean;
    refreshUser: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('clipcoba_token'));
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('clipcoba_token');
            const storedUser = localStorage.getItem('clipcoba_user');

            if (storedToken) {
                setToken(storedToken);
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
                // Fetch fresh data
                await refreshUser(storedToken);
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('clipcoba_token', newToken);
        localStorage.setItem('clipcoba_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        navigate('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('clipcoba_token');
        localStorage.removeItem('clipcoba_user');
        setToken(null);
        setUser(null);
        navigate('/');
    };

    const refreshUser = async (overrideToken?: string) => {
        const tokenToUse = overrideToken || token;
        if (!tokenToUse) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${tokenToUse}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                localStorage.setItem('clipcoba_user', JSON.stringify(userData));
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const isSubscribed = user?.subscription_status === 'active' || user?.subscription_status === 'trialing';

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, isSubscribed, refreshUser, isLoading }}>
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
