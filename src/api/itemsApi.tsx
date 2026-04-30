import axios from "axios";
import { getAuthToken } from "@/src/storage/storageTokens";

const BASE_URL = "http://192.168.100.8:8080";

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

api.interceptors.request.use(async (config) => {
    const token = await getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (__DEV__) {
            console.warn('[itemsApi] Error: ', error.response?.status, error.config?.url, error.response?.data);
        }
        return Promise.reject(error);
    }
);

// --- TYPES ---

type ApiResult<T = undefined> =
    | { success: true; data: T }
    | { success: false; message: string };

type UploadResult =
    | { success: true; urls: string[] }
    | { success: false; urls: []; message: string };

type Listing = {
    listingId: number;
    price: number;
    location: string;
    isAvailable: boolean;
    name: string;
    category: string;
    description: string;
    imageUrls: string;
    userName: string;
};

type CreateListingParams = {
    thingId: number;
    price: number;
    securityDeposit: number;
    location: string;
};

type CreateThingParams = {
    name: string;
    category: string;
    description: string;
    imageUrls: string;
};

// --- API CALLS ---

export const uploadImages = async (uris: string[]): Promise<UploadResult> => {
    if (uris.length === 0) return { success: true, urls: [] };
    try {
        const token = await getAuthToken();
        const formData = new FormData();
        uris.forEach((uri, index) => {
            const fileName = uri.split('/').pop() || `image_${index}.jpg`;
            const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
            formData.append('files', { uri, name: fileName, type: fileType } as any);
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
        const urls: string[] = await response.json();
        return { success: true, urls };
    } catch (error: any) {
        return { success: false, urls: [], message: error.message || 'Image upload failed.' };
    }
};

export const searchListings = async (query: string): Promise<ApiResult<Listing[]>> => {
    try {
        const response = await api.get<Listing[]>("/listings/search", { params: { query } });
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Search failed." };
    }
};

export const getRecommendedListings = async (): Promise<ApiResult<Listing[]>> => {
    try {
        const response = await api.get<Listing[]>("/listings/recommended");
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Could not load recommended listings." };
    }
};

export const createListing = async (params: CreateListingParams): Promise<ApiResult<Listing>> => {
    try {
        const response = await api.post<Listing>("/listings", params);
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Failed to create listing." };
    }
};

export const createThing = async (params: CreateThingParams): Promise<ApiResult<any>> => {
    try {
        const response = await api.post("/things", params);
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Failed to create item." };
    }
};