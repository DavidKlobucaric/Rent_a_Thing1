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
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => { return response;
    },
    (error) => {
        if(__DEV__){
            console.warn('[itemsApi] Error: ', error.response?.status, error.config?.url, error.response?.data);
        }
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
            return { success: false, urls: [], message: text || 'Image upload failed.' };
        }
        const urls = await response.json();
        return { success: true, urls };
    } catch (error) {
        return { success: false, urls: [], message: error.message || 'Image upload failed.' };
    }
};

export const searchListings = async (query) => {
    try {
        const response = await api.get("/listings/search", { params: { query } });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "Search failed." };
    }
};

export const getRecommendedListings = async () => {
    try {
        const response = await api.get("/listings/recommended");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "Could not load recommended listings." };
    }
};

export const createListing = async ({ thingId, price, securityDeposit, location }) => {
    try {
        const response = await api.post("/listings", { thingId, price, securityDeposit, location });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "Failed to create listing." };
    }
};

export const createThing = async ({ name, category, description, imageUrls }) => {
    try {
        const response = await api.post("/things", { name, category, description, imageUrls });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, message: error.response?.data?.message || "Failed to create item." };
    }
};