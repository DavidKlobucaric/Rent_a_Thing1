import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
    TOKEN: "auth-token",
     USER: "auth_user",
 }

 export const saveAuthData = async (token, user) => {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
 }

 export const getAuthToken = async () => {
    return await AsyncStorage.getItem(KEYS.TOKEN);
 }

 export const getStoredUser = async () => {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
 }

 export const clearAuth = async () => {
    await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER]);
 }