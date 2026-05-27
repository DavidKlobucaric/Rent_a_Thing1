import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
    TOKEN: "auth-token",
    USER: "auth_user",
} as const;

export interface AuthUser {
    userId: number | string;
    username: string;
    email: string;
}

export const saveAuthData = async (
    token: string,
    user: AuthUser
): Promise<void> => {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const getAuthToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(KEYS.TOKEN);
};

export const getStoredUser = async (): Promise<AuthUser | null> => {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
};

export const clearAuth = async (): Promise<void> => {
    await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER]);
};
