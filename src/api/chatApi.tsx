import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.100.8:8080') + '/api';

export type MessageType =
    | 'text'
    | 'booking_request'
    | 'booking_confirmed'
    | 'booking_declined'
    | 'booking_expired'
    | 'pickup_pin'
    | 'pickup_confirmed'
    | 'return_confirmed'
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

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('auth-token');
    return { Authorization: `Bearer ${token}` };
};

export async function getMyConversations() {
    try {
        const headers = await getHeaders();
        const res = await axios.get(`${API_URL}/conversations`, { headers });
        return { success: true, data: res.data as Conversation[] };
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
        return { success: true, data: res.data as Conversation };
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
        // ⭐ Osiguraj da data nikad nije undefined
        return { success: true, data: (res.data ?? []) as ChatMessage[] };
    } catch (e: any) {
        console.error('getMessages error:', e.response?.status, e.response?.data || e.message);
        return {
            success: false,
            message: e.response?.data?.message || e.message || 'Failed to load messages',
        };
    }
}

export async function sendMessage(conversationId: number, content: string, type: MessageType = 'text') {
    try {
        const headers = await getHeaders();
        const res = await axios.post(
            `${API_URL}/conversations/${conversationId}/messages`,
            { content, type },
            { headers }
        );
        return { success: true, data: res.data as ChatMessage };
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

// ─── BOOKING ACTIONS ────────────────────────────────────────────────

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
        const res = await axios.post(
            `${API_URL}/bookings/${bookingId}/${action}`,
            {},
            { headers }
        );
        return { success: true, data: res.data as ChatMessage };
    } catch (e: any) {
        return { success: false, message: e.response?.data?.message || 'Action failed' };
    }
}

export async function confirmPickup(bookingId: number, pin: string) {
    try {
        const headers = await getHeaders();
        const res = await axios.post(
            `${API_URL}/bookings/${bookingId}/pickup`,
            { pin },
            { headers }
        );
        return { success: true, data: res.data as ChatMessage };
    } catch (e: any) {
        return { success: false, message: e.response?.data?.message || 'Invalid PIN' };
    }
}

export async function confirmReturn(bookingId: number) {
    try {
        const headers = await getHeaders();
        const res = await axios.post(
            `${API_URL}/bookings/${bookingId}/return`,
            {},
            { headers }
        );
        return { success: true, data: res.data as ChatMessage };
    } catch (e: any) {
        return { success: false, message: e.response?.data?.message || 'Return confirmation failed' };
    }
}

export async function cancelBooking(bookingId: number) {
    try {
        const headers = await getHeaders();
        const res = await axios.post(
            `${API_URL}/bookings/${bookingId}/cancel`,
            {},
            { headers }
        );
        return { success: true, data: res.data };
    } catch (e: any) {
        return { success: false, message: e.response?.data?.message || 'Cancellation failed' };
    }
}