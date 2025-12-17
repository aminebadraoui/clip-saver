import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
    id: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('clipcoba_token'));
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('clipcoba_token');
        const storedUser = localStorage.getItem('clipcoba_user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('clipcoba_token', newToken);
        localStorage.setItem('clipcoba_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        navigate('/');
    };

    const logout = () => {
        localStorage.removeItem('clipcoba_token');
        localStorage.removeItem('clipcoba_user');
        setToken(null);
        setUser(null);
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
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
