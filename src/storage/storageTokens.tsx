import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';
const REMEMBERED_EMAIL_KEY = '@remembered_email';

export interface AuthUser {
    userId: number;
    username: string;
    email: string;
}

export const getAuthToken = async (): Promise<string | null> => {
    try {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        console.log('[STORAGE] getAuthToken called:', {
            hasToken: !!token,
            tokenLength: token?.length ?? 0,
        });
        return token;
    } catch (error) {
        console.error('[STORAGE] Error getting token:', error);
        return null;
    }
};

export const saveAuthToken = async (token: string): Promise<void> => {
    try {
        console.log('[STORAGE] Saving token:', {
            tokenLength: token.length,
            tokenPreview: `${token.substring(0, 20)}...`,
        });
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
        console.error('[STORAGE] Error saving token:', error);
    }
};

export const deleteAuthToken = async (): Promise<void> => {
    try {
        console.log('[STORAGE] Deleting token and user data');
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
    } catch (error) {
        console.error('[STORAGE] Error deleting token:', error);
    }
};

export const getAuthUser = async (): Promise<AuthUser | null> => {
    try {
        const userStr = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (userStr) {
            return JSON.parse(userStr) as AuthUser;
        }
        return null;
    } catch (error) {
        console.error('[STORAGE] Error getting user:', error);
        return null;
    }
};

export const saveAuthData = async (token: string, user: AuthUser): Promise<void> => {
    try {
        console.log('[STORAGE] Saving auth data:', {
            tokenLength: token.length,
            userId: user.userId,
        });
        await AsyncStorage.multiSet([
            [AUTH_TOKEN_KEY, token],
            [AUTH_USER_KEY, JSON.stringify(user)],
        ]);
    } catch (error) {
        console.error('[STORAGE] Error saving auth data:', error);
    }
};

export const saveRememberedEmail = async (email: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } catch (error) {
        console.error('[STORAGE] Error saving remembered email:', error);
    }
};

export const getRememberedEmail = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
    } catch (error) {
        console.error('[STORAGE] Error getting remembered email:', error);
        return null;
    }
};

export const deleteRememberedEmail = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
    } catch (error) {
        console.error('[STORAGE] Error deleting remembered email:', error);
    }
};