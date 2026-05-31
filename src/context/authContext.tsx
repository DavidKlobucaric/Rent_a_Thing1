import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthToken, getAuthUser, deleteAuthToken, AuthUser } from '@/src/storage/storageTokens';

interface AuthContextType {
    token: string | null;
    user: AuthUser | null;
    isLoading: boolean;
    refreshAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshAuth = useCallback(async () => {
        try {
            const savedToken = await getAuthToken();
            const savedUser = await getAuthUser();
            setToken(savedToken);
            setUser(savedUser);
        } catch (error) {
            console.error('[AUTH] Error refreshing auth:', error);
            setToken(null);
            setUser(null);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await deleteAuthToken();
            setToken(null);
            setUser(null);
        } catch (error) {
            console.error('[AUTH] Error logging out:', error);
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            await refreshAuth();
            setIsLoading(false);
        };
        initAuth();
    }, [refreshAuth]);

    return (
        <AuthContext.Provider value={{ token, user, isLoading, refreshAuth, logout }}>
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