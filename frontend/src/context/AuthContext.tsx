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

export interface Space {
    id: string;
    name: string;
    createdAt: number;
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

    // Spaces
    spaces: Space[];
    currentSpace: Space | null;
    setCurrentSpace: (space: Space | null) => void;
    refreshSpaces: () => Promise<void>;
    createSpace: (name: string) => Promise<Space>;
    deleteSpace: (spaceId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('clipcoba_token'));
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    const [spaces, setSpaces] = useState<Space[]>([]);
    const [currentSpace, setCurrentSpaceState] = useState<Space | null>(null);

    const setCurrentSpace = (space: Space | null) => {
        setCurrentSpaceState(space);
        if (space) {
            localStorage.setItem('clipcoba_space_id', space.id);
        } else {
            localStorage.removeItem('clipcoba_space_id');
        }
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

    const refreshSpaces = async (overrideToken?: string) => {
        const tokenToUse = overrideToken || token;
        if (!tokenToUse) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/spaces/`, {
                headers: {
                    'Authorization': `Bearer ${tokenToUse}`
                }
            });

            if (response.ok) {
                const spacesData: Space[] = await response.json();
                setSpaces(spacesData);

                // Determine current space
                const storedSpaceId = localStorage.getItem('clipcoba_space_id');
                let selectedSpace = spacesData.find(s => s.id === storedSpaceId);

                if (!selectedSpace && spacesData.length > 0) {
                    // Default to first space if none selected or invalid
                    selectedSpace = spacesData[0];
                }

                setCurrentSpace(selectedSpace || null);
            }
        } catch (error) {
            console.error('Failed to refresh spaces:', error);
        }
    };

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
                await Promise.all([
                    refreshUser(storedToken),
                    refreshSpaces(storedToken)
                ]);
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (newToken: string, newUser: User) => {
        localStorage.setItem('clipcoba_token', newToken);
        localStorage.setItem('clipcoba_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);

        // Load spaces immediately after login
        await refreshSpaces(newToken);

        navigate('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('clipcoba_token');
        localStorage.removeItem('clipcoba_user');
        localStorage.removeItem('clipcoba_space_id');
        setToken(null);
        setUser(null);
        setSpaces([]);
        setCurrentSpace(null);
        navigate('/');
    };

    const createSpace = async (name: string): Promise<Space> => {
        if (!token) throw new Error("No token");
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/spaces/?name=${encodeURIComponent(name)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error("Failed to create space");
        const newSpace = await response.json();
        setSpaces(prev => [...prev, newSpace]);
        setCurrentSpace(newSpace); // Switch to new space automatically
        return newSpace;
    };

    const deleteSpace = async (spaceId: string) => {
        if (!token) throw new Error("No token");
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/spaces/${spaceId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to delete space");
        }

        const newSpaces = spaces.filter(s => s.id !== spaceId);
        setSpaces(newSpaces);
        if (currentSpace?.id === spaceId) {
            // Switch to another space
            setCurrentSpace(newSpaces.length > 0 ? newSpaces[0] : null);
        }
    };

    const isSubscribed = user?.subscription_status === 'active' || user?.subscription_status === 'trialing';

    return (
        <AuthContext.Provider value={{
            user, token, login, logout, isAuthenticated: !!token, isSubscribed, refreshUser, isLoading,
            spaces, currentSpace, setCurrentSpace, refreshSpaces, createSpace, deleteSpace
        }}>
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
