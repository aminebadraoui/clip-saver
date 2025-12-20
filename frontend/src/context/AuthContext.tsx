import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/config';

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
    renameSpace: (spaceId: string, name: string) => Promise<Space>;
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
            const response = await fetch(`${API_URL}/api/spaces/`, {
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
        setToken(newToken);

        // We set the initial partial user, but immediately fetch the full profile
        // to ensure we have subscription status etc.
        setUser(newUser);

        // Load full user profile (including subscription) and spaces
        await Promise.all([
            refreshUser(newToken),
            refreshSpaces(newToken)
        ]);

        navigate('/dashboard');
    };

    const logout = () => {
        // Clear storage
        localStorage.removeItem('clipcoba_token');
        localStorage.removeItem('clipcoba_user');
        localStorage.removeItem('clipcoba_space_id');

        // Force full page reload to landing page
        // This avoids any ProtectedRoute race conditions and ensures a clean state
        window.location.href = '/';
    };

    const createSpace = async (name: string): Promise<Space> => {
        if (!token) throw new Error("No token");
        const response = await fetch(`${API_URL}/api/spaces/?name=${encodeURIComponent(name)}`, {
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

    const renameSpace = async (spaceId: string, name: string): Promise<Space> => {
        if (!token) throw new Error("No token");
        const response = await fetch(`${API_URL}/api/spaces/${spaceId}?name=${encodeURIComponent(name)}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to rename space");
        }

        const updatedSpace = await response.json();
        setSpaces(prev => prev.map(s => s.id === spaceId ? updatedSpace : s));

        // Update current space if it was the one renamed
        if (currentSpace?.id === spaceId) {
            setCurrentSpace(updatedSpace);
        }

        return updatedSpace;
    };

    const deleteSpace = async (spaceId: string) => {
        if (!token) throw new Error("No token");
        const response = await fetch(`${API_URL}/api/spaces/${spaceId}`, {
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
            spaces, currentSpace, setCurrentSpace, refreshSpaces, createSpace, renameSpace, deleteSpace
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
