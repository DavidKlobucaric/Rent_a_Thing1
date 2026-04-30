import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuthToken, getStoredUser, clearAuth } from '@/src/storage/storageTokens';

const BASE_URL = "http://192.168.100.8:8080";

type User = {
    userId: number;
    username: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: true,
    isLoggedIn: false,
    logout: async () => {},
    refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        refreshAuth();
    }, []);

    const refreshAuth = async () => {
        try {
            const [savedToken, savedUser] = await Promise.all([
                getAuthToken(),
                getStoredUser(),
            ]);

            if (!savedToken) {
                setToken(null);
                setUser(null);
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/listings/recommended`, {
                    headers: { Authorization: `Bearer ${savedToken}` },
                });

                if (response.status === 401 || response.status === 403) {
                    // Token rejected — clear everything and treat as logged out
                    await clearAuth();
                    setToken(null);
                    setUser(null);
                    return;
                }
            } catch {
            }
            setToken(savedToken);
            setUser(savedUser);
        } catch {
            setToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await clearAuth();
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user, token, isLoading,
            isLoggedIn: !!token,
            logout, refreshAuth,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
