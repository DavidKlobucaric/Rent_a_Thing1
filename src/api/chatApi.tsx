import axios from 'axios';
import { getAuthToken } from '@/src/storage/storageTokens';
import { resolveImageUrl } from './itemsApi'; // ✅ NOVO
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Isti pattern kao itemsApi — automatski dohvaća IP
const getBackendURL = () => {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (API_BASE_URL) return API_BASE_URL;
    const debuggerHost = Constants.expoConfig?.hostUri;
    const ip = debuggerHost ? debuggerHost.split(':')[0] : null;
    if (Platform.OS === 'android') {
        return ip ? `http://${ip}:8080` : 'http://10.0.2.2:8080';
    } else {
        return ip ? `http://${ip}:8080` : 'http://localhost:8080';
    }
};
const API_URL = getBackendURL() + '/api';

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type MessageType =
    | 'text'
    | 'booking_request'
    | 'booking_confirmed'
    | 'booking_declined'
    | 'booking_expired'
    | 'pickup_pin'
    | 'pickup_confirmed'
    | 'return_confirmed'
    | 'booking_cancelled'
    | 'review';

export interface BookingDetails {
    bookingId: number;
    listingId: number;
    listingName: string;
    listingImage: string;
    startDate: string;
    endDate: string;
    numberOfDays: number;
    dailyRate: number;
    deposit: number;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'active' | 'completed' | 'declined' | 'cancelled' | 'expired';
    pickupPin?: string;
    renterName: string;
    ownerName: string;
    myRole: 'renter' | 'owner';
    expiresAt?: string;
}

export interface ChatMessage {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    content: string;
    sentAt: string;
    type: MessageType;
    bookingDetails?: BookingDetails;
}

export interface Conversation {
    conversationId: number;
    listingId: number;
    listingName: string;
    listingImage?: string;
    otherUserId: number;
    otherUserName: string;
    lastMessage: string | null;
    lastMessageAt: string | null;
    lastMessageType?: MessageType;
    unreadCount: number;
    activeBooking?: BookingDetails;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const getHeaders = async () => {
    const token = await getAuthToken();
    return { Authorization: `Bearer ${token}` };
};

// ✅ AŽURIRANO: primjenjuje resolveImageUrl na listingImage
const normalizeBookingDetails = (bd: any): BookingDetails | undefined => {
    if (!bd) return undefined;
    return {
        ...bd,
        dailyRate: Number(bd.dailyRate ?? 0),
        deposit: Number(bd.deposit ?? 0),
        totalPrice: Number(bd.totalPrice ?? 0),
        status: (bd.status as string).toLowerCase() as BookingDetails['status'],
        listingImage: resolveImageUrl(bd.listingImage) ?? bd.listingImage, // ✅ NOVO
    };
};

const normalizeChatMessage = (msg: any): ChatMessage => ({
    ...msg,
    bookingDetails: normalizeBookingDetails(msg.bookingDetails),
});

const normalizeConversation = (conv: any): Conversation => ({
    ...conv,
    activeBooking: normalizeBookingDetails(conv.activeBooking),
});

// ─── CONVERSATION ENDPOINTS ──────────────────────────────────────────────────
export async function getMyConversations() {
    try {
        const headers = await getHeaders();
        const res = await axios.get(`${API_URL}/conversations`, { headers });
        const data = (res.data as any[]).map(normalizeConversation);
        return { success: true, data };
    } catch (e: any) {
        return { success: false, message: e.response?.data?.message || 'Failed to load conversations' };
    }
}

export async function getOrCreateConversation(listingId: number) {
    try {
        const headers = await getHeaders();
        const res = await axios.post(
            `${API_URL}/conversations`,
            { listingId },
            { headers }
        );
        return { success: true, data: normalizeConversation(res.data) };
    } catch (e: any) {
        console.error('getOrCreateConversation error:', e.response?.status, e.response?.data || e.message);
        return {
            success: false,
            message: e.response?.data?.message || e.message || 'Failed to create conversation',
        };
    }
}

export async function getMessages(conversationId: number) {
    try {
        const headers = await getHeaders();
        const res = await axios.get(
            `${API_URL}/conversations/${conversationId}/messages`,
            { headers }
        );
        const data = ((res.data ?? []) as any[]).map(normalizeChatMessage);
        return { success: true, data };
    } catch (e: any) {
        console.error('getMessages error:', e.response?.status, e.response?.data || e.message);
        return {
            success: false,
            message: e.response?.data?.message || e.message || 'Failed to load messages',
        };
    }
}

export async function sendMessage(conversationId: number, content: string) {
    try {
        const headers = await getHeaders();
        const res = await axios.post(
            `${API_URL}/conversations/${conversationId}/messages`,
            { content },
            { headers }
        );
        return { success: true, data: normalizeChatMessage(res.data) };
    } catch (e: any) {
        return { success: false, message: e.response?.data?.message || 'Failed to send message' };
    }
}

export async function markConversationRead(conversationId: number) {
    try {
        const headers = await getHeaders();
        await axios.post(`${API_URL}/conversations/${conversationId}/read`, {}, { headers });
        return { success: true };
    } catch (e: any) {
        return { success: false };
    }
}

// ─── BOOKING ACTIONS ─────────────────────────────────────────────────────────
export async function createBookingRequest(
    conversationId: number,
    listingId: number,
    startDate: string,
    endDate: string
) {
    try {
        const headers = await getHeaders();
        const res = await axios.post(
            `${API_URL}/bookings/request`,
            { conversationId, listingId, startDate, endDate },
            { headers }
        );
        return { success: true, data: res.data };
    } catch (e: any) {
        return { success: false, message: e.response?.data?.message || 'Booking request failed' };
    }
}

export async function respondToBooking(bookingId: number, action: 'confirm' | 'decline') {
    try {
        const headers = await getHeaders();
        await axios.post(
            `${API_URL}/bookings/${bookingId}/${action}`,
            {},
            { headers }
        );
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.response?.data?.message || 'Action failed' };
    }
}

export async function confirmPickup(bookingId: number, pin: string) {
    try {
        const headers = await getHeaders();
        console.log('Sending pickup:', { bookingId, pin, url: `${API_URL}/bookings/${bookingId}/pickup` });
        await axios.post(
            `${API_URL}/bookings/${bookingId}/pickup`,
            { pin },
            { headers }
        );
        return { success: true };
    } catch (e: any) {
        console.log('Pickup error:', e.response?.status, JSON.stringify(e.response?.data));
        return { success: false, message: e.response?.data?.message || 'Invalid PIN' };
    }
}

export async function confirmReturn(bookingId: number) {
    try {
        const headers = await getHeaders();
        await axios.post(
            `${API_URL}/bookings/${bookingId}/return`,
            {},
            { headers }
        );
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.response?.data?.message || 'Return confirmation failed' };
    }
}

export async function cancelBooking(bookingId: number) {
    try {
        const headers = await getHeaders();
        await axios.post(
            `${API_URL}/bookings/${bookingId}/cancel`,
            {},
            { headers }
        );
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.response?.data?.message || 'Cancellation failed' };
    }
}

// ✅ NOVO: Dohvaća PIN kod za vlasnika preko dedicated endpointa
export async function getBookingPin(bookingId: number): Promise<{ success: boolean; data?: string; message?: string }> {
    try {
        const headers = await getHeaders();
        const res = await axios.get<{ pin: string }>(
            `${API_URL}/bookings/${bookingId}/pin`,
            { headers }
        );
        return { success: true, data: res.data.pin };
    } catch (e: any) {
        return { success: false, message: e.response?.data?.message || 'Failed to get PIN' };
    }
}