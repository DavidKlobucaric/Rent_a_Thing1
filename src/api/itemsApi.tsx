import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken, deleteAuthToken } from '@/src/storage/storageTokens';

// ─── Backend URL ───────────────────────────────────────────────────────────

const getBackendURL = () => {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (API_BASE_URL) return API_BASE_URL;
    const debuggerHost = Constants.expoConfig?.hostUri;
    const ip = debuggerHost ? debuggerHost.split(':')[0] : null;
    if (Platform.OS === 'android') {
        return ip ? `http://${ip}:8080` : 'http://10.0.2.2:8080';
    }
    return ip ? `http://${ip}:8080` : 'http://localhost:8080';
};

const BASE_URL = getBackendURL() + '/api';
console.log('[API_CONNECT] Spajam se na backend na adresi:', BASE_URL);

export const resolveImageUrl = (url: string | undefined | null): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http://localhost:8080') || url.startsWith('http://127.0.0.1:8080')) {
        return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):8080/, getBackendURL());
    }
    return url;
};

// ─── Axios instance ────────────────────────────────────────────────────────

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 6000,
});

api.interceptors.request.use(async (config) => {
    const token = await getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.message || '';
        if (status === 401 || (status === 403 && errorMessage.toLowerCase().includes('expired'))) {
            console.warn('[AUTH] Token expired or invalid - logging out user');
            await deleteAuthToken();
            favouriteCache.clear();
        }
        if (__DEV__) {
            console.warn('[itemsApi] Error:', status, error.config?.url, error.response?.data);
        }
        return Promise.reject(error);
    }
);

// ─── Types ─────────────────────────────────────────────────────────────────

type ApiResult<T = undefined> =
    | { success: true; data: T }
    | { success: false; message: string };

type UploadResult =
    | { success: true; urls: string[] }
    | { success: false; urls: []; message: string };

export type Listing = {
    listingId: number;
    price: number;
    location: string;
    isAvailable: boolean;
    name: string;
    category: string;
    description: string;
    imageUrls: string[];
    securityDeposit?: number;
    userName: string;
    userId?: number;
    thingId?: number;
    createdAt?: string;
};

type CreateListingParams = {
    thingId: number;
    price: number;
    securityDeposit?: number;
    location: string;
    latitude?: number;
    longitude?: number;
};

type CreateThingParams = {
    name: string;
    category: string;
    description: string;
    imageUrls: string[];
};

export type MapMarker = {
    listingId: number;
    location: string;
    name: string;
    category: string;
    price: number;
    thumbnailUrl: string | null;
    isAvailable: boolean;
    userId?: number;
    userName?: string;
    userRating?: number;
    latitude?: number;
    longitude?: number;
};

export type BlockedPeriod = {
    startDate: string;
    endDate: string;
};

export type UserProfile = {
    id: number;
    username: string;
    email: string;
    rating: number;
    ratingCount: number;
    favouriteCount: number;
    listingCount: number;
    avatarUrl?: string;
};

// ─── Normalizacija ─────────────────────────────────────────────────────────

const normalizeListing = (raw: any): Listing => ({
    ...raw,
    price: Number(raw.price ?? 0),
    securityDeposit: raw.securityDeposit != null ? Number(raw.securityDeposit) : undefined,
    isAvailable: Boolean(raw.isAvailable),
    imageUrls: Array.isArray(raw.imageUrls)
        ? raw.imageUrls.map(resolveImageUrl).filter(Boolean) as string[]
        : [],
});

const normalizeMapMarker = (raw: any): MapMarker => ({
    ...raw,
    price: Number(raw.price ?? 0),
    isAvailable: Boolean(raw.isAvailable),
    userRating: raw.userRating != null ? Number(raw.userRating) : undefined,
    thumbnailUrl: resolveImageUrl(raw.thumbnailUrl) ?? null,
});

// ─── Favourite cache ───────────────────────────────────────────────────────

const favouriteCache = {
    ids: new Set<number>(),
    loaded: false,

    clear() {
        this.ids.clear();
        this.loaded = false;
    },

    set(ids: number[]) {
        this.ids = new Set(ids);
        this.loaded = true;
    },

    has(id: number): boolean {
        return this.ids.has(id);
    },

    add(id: number) {
        this.ids.add(id);
    },

    remove(id: number) {
        this.ids.delete(id);
    },
};

// ─── Geolocation cache ─────────────────────────────────────────────────────

const GEO_STORAGE_KEY = 'geo_cache_v1';

type GeoCoords = { latitude: number; longitude: number } | null;

const geoCache = {
    map: new Map<string, GeoCoords>(),
    hydrated: false,

    async hydrate() {
        if (this.hydrated) return;
        try {
            const raw = await AsyncStorage.getItem(GEO_STORAGE_KEY);
            if (raw) {
                const entries: [string, GeoCoords][] = JSON.parse(raw);
                entries.forEach(([k, v]) => this.map.set(k, v));
            }
        } catch {

        }
        this.hydrated = true;
    },

    async set(location: string, coords: GeoCoords) {
        this.map.set(location, coords);
        try {
            const entries = [...this.map.entries()].slice(-200);
            await AsyncStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(entries));
        } catch {

        }
    },

    get(location: string): GeoCoords | undefined {
        return this.map.get(location);
    },

    has(location: string): boolean {
        return this.map.has(location);
    },
};

// ─── Geocoding ─────────────────────────────────────────────────────────────

export const geocodeLocation = async (location: string): Promise<GeoCoords> => {
    const trimmed = location.trim();
    if (!trimmed) return null;

    await geoCache.hydrate();

    if (geoCache.has(trimmed)) {
        return geoCache.get(trimmed) ?? null;
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1`,
            { headers: { 'User-Agent': 'RentAThing/1.0' } }
        );
        const data = await response.json();
        if (data?.length > 0) {
            const coords: GeoCoords = {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
            };
            await geoCache.set(trimmed, coords);
            return coords;
        }
        await geoCache.set(trimmed, null);
        return null;
    } catch {
        return null;
    }
};

// ─── Upload ────────────────────────────────────────────────────────────────

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
            headers: { Authorization: `Bearer ${token}` },
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

// ─── Listings ──────────────────────────────────────────────────────────────

export const searchListings = async (query: string): Promise<ApiResult<Listing[]>> => {
    try {
        const response = await api.get<any[]>('/listings/search', { params: { query } });
        return { success: true, data: response.data.map(normalizeListing) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Search failed.' };
    }
};

export const getRecommendedListings = async (): Promise<ApiResult<Listing[]>> => {
    try {
        const response = await api.get<any[]>('/listings/recommended');
        return { success: true, data: response.data.map(normalizeListing) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Could not load recommended listings.' };
    }
};

export const createListing = async (params: CreateListingParams): Promise<ApiResult<Listing>> => {
    try {
        const response = await api.post<any>('/listings', params);
        return { success: true, data: normalizeListing(response.data) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Failed to create listing.' };
    }
};

export const createThing = async (params: CreateThingParams): Promise<ApiResult<any>> => {
    try {
        const response = await api.post('/things', params);
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Failed to create item.' };
    }
};

export const getListingById = async (listingId: number): Promise<ApiResult<Listing>> => {
    try {
        const response = await api.get<any>(`/listings/${listingId}`);
        return { success: true, data: normalizeListing(response.data) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Could not load listing.' };
    }
};

export const getMyListings = async (): Promise<ApiResult<Listing[]>> => {
    try {
        const response = await api.get<any[]>('/listings/my');
        return { success: true, data: response.data.map(normalizeListing) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Could not load your listings.' };
    }
};

export const updateListing = async (listingId: number, params: CreateListingParams): Promise<ApiResult<Listing>> => {
    try {
        const response = await api.put(`/listings/${listingId}`, params);
        return { success: true, data: normalizeListing(response.data) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Failed to update listing.' };
    }
};

export const deleteListing = async (listingId: number): Promise<ApiResult<void>> => {
    try {
        await api.delete(`/listings/${listingId}`);
        return { success: true, data: undefined };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Failed to delete listing.' };
    }
};

export const getAllListings = async (): Promise<ApiResult<Listing[]>> => {
    try {
        const response = await api.get<any[]>('/listings/all');
        return { success: true, data: response.data.map(normalizeListing) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Could not load all listings.' };
    }
};

// ─── Things ────────────────────────────────────────────────────────────────

export const updateThing = async (thingId: number, params: CreateThingParams): Promise<ApiResult<any>> => {
    try {
        const response = await api.put(`/things/${thingId}`, params);
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Failed to update item.' };
    }
};

export const deleteThing = async (thingId: number): Promise<ApiResult<void>> => {
    try {
        await api.delete(`/things/${thingId}`);
        return { success: true, data: undefined };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Failed to delete item.' };
    }
};

// ─── Favourites ────────────────────────────────────────────────────────────

export const getFavourites = async (): Promise<ApiResult<Listing[]>> => {
    try {
        const response = await api.get<any[]>('/users/me/favourites');
        const listings = response.data.map(normalizeListing);
        favouriteCache.set(listings.map((l) => l.listingId));
        return { success: true, data: listings };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Could not load favourites.' };
    }
};

export const addFavourite = async (listingId: number): Promise<ApiResult<void>> => {
    try {
        await api.post(`/users/me/favourites/${listingId}`);
        favouriteCache.add(listingId);
        return { success: true, data: undefined };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Could not add favourite.' };
    }
};

export const removeFavourite = async (listingId: number): Promise<ApiResult<void>> => {
    try {
        await api.delete(`/users/me/favourites/${listingId}`);
        favouriteCache.remove(listingId);
        return { success: true, data: undefined };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Could not remove favourite.' };
    }
};

export const checkFavourite = async (listingId: number): Promise<boolean> => {
    if (favouriteCache.loaded) {
        return favouriteCache.has(listingId);
    }
    try {
        const response = await api.get<any[]>('/users/me/favourites');
        const listings = response.data.map(normalizeListing);
        favouriteCache.set(listings.map((l) => l.listingId));
        return favouriteCache.has(listingId);
    } catch {
        return false;
    }
};

export const invalidateFavouriteCache = () => favouriteCache.clear();

// ─── Profile ───────────────────────────────────────────────────────────────

export const getMyProfile = async (): Promise<ApiResult<UserProfile>> => {
    try {
        const response = await api.get<UserProfile>('/users/me');
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Could not load profile.' };
    }
};

// ─── Bookings ──────────────────────────────────────────────────────────────

export const getBlockedPeriods = async (listingId: number): Promise<ApiResult<BlockedPeriod[]>> => {
    try {
        const response = await api.get<BlockedPeriod[]>(`/bookings/listing/${listingId}/blocked`);
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Could not load availability.' };
    }
};

// ─── Map ───────────────────────────────────────────────────────────────────

export const getMapMarkers = async (category?: string): Promise<ApiResult<MapMarker[]>> => {
    try {
        const params: Record<string, string> = {};
        if (category) params.category = category;
        const response = await api.get<any[]>('/listings/map-markers', { params });

        const normalized = response.data.map(normalizeMapMarker);


        const uniqueLocations = [...new Set(normalized.map(m => m.location).filter(Boolean))];
        const coordsMap = new Map<string, GeoCoords>();

        await Promise.all(
            uniqueLocations.map(async (loc) => {
                const coords = await geocodeLocation(loc);
                coordsMap.set(loc, coords);
            })
        );

        const withCoords = normalized.map(marker => {
            const coords = coordsMap.get(marker.location);
            return coords
                ? { ...marker, latitude: coords.latitude, longitude: coords.longitude }
                : marker;
        });

        return { success: true, data: withCoords };
    } catch (error: any) {
        console.log('[AXIOS_MAP_ERROR]', error.message, error.response?.status);
        return { success: false, message: error.response?.data?.message || 'Could not load map markers.' };
    }
};