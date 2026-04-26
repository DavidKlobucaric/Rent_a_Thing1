import axios from "axios";
import { getAuthToken } from "@/src/storage/storageTokens";

const BASE_URL = "http://192.168.178.100:8080";

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

// Attach JWT token to every request + log it so we can confirm it's being sent
api.interceptors.request.use(async (config) => {
    const token = await getAuthToken();
    console.log('[itemsApi] Request:', config.method?.toUpperCase(), config.url);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[itemsApi] Token attached:', token.substring(0, 30) + '...');
    } else {
        console.warn('[itemsApi] WARNING: No token in AsyncStorage!');
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        console.log('[itemsApi] Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.log('[itemsApi] ERROR status:', error.response?.status);
        console.log('[itemsApi] ERROR url:', error.config?.url);
        console.log('[itemsApi] ERROR body:', JSON.stringify(error.response?.data));
        return Promise.reject(error);
    }
);

export const uploadImages = async (uris) => {
    if (uris.length === 0) return { success: true, urls: [] };
    try {
        const token = await getAuthToken();
        const formData = new FormData();
        uris.forEach((uri, index) => {
            const fileName = uri.split('/').pop() || `image_${index}.jpg`;
            const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
            formData.append('files', { uri, name: fileName, type: fileType });
        });
        const response = await fetch(`${BASE_URL}/images/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        if (!response.ok) {
            const text = await response.text();
            console.log('[itemsApi] Upload error:', response.status, text);
            return { success: false, urls: [], message: text || 'Upload slika nije uspio.' };
        }
        const urls = await response.json();
        return { success: true, urls };
    } catch (error) {
        console.log('[itemsApi] Upload crash:', error.message);
        return { success: false, urls: [], message: error.message || 'Upload slika nije uspio.' };
    }
};

export const searchListings = async (query) => {
    try {
        const response = await api.get("/listings/search", { params: { query } });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "Pretraga nije uspjela." };
    }
};

export const getRecommendedListings = async () => {
    try {
        const response = await api.get("/listings/recommended");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "Preporučeni listinzi nisu učitani." };
    }
};

export const createListing = async ({ thingId, price, securityDeposit, location }) => {
    try {
        const response = await api.post("/listings", { thingId, price, securityDeposit, location });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "Kreiranje listinga nije uspjelo." };
    }
};

export const createThing = async ({ name, category, description, imageUrls }) => {
    try {
        const response = await api.post("/things", { name, category, description, imageUrls });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "Kreiranje predmeta nije uspjelo." };
    }
};