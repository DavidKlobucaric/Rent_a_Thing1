import axios from 'axios';
import { getAuthToken } from '@/src/storage/storageTokens';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
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

// --- TYPES ---

export type ChatMessage = {
    id: number;
    senderId: number;
    senderName: string;
    content: string;
    sentAt: string; // ISO date string
};

export type Conversation = {
    conversationId: number;
    otherUserId: number;
    otherUserName: string;
    listingId: number;
    listingName: string;
    lastMessage: string | null;
    lastMessageAt: string | null;
    unreadCount: number;
};

type ApiResult<T = undefined> =
    | { success: true; data: T }
    | { success: false; message: string };

// --- API CALLS ---
export const getOrCreateConversation = async (
    listingId: number
): Promise<ApiResult<Conversation>> => {
    try {
        const response = await api.post<Conversation>('/conversations', { listingId });
        return { success: true, data: response.data };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Could not start conversation.',
        };
    }
};

export const getMessages = async (
    conversationId: number
): Promise<ApiResult<ChatMessage[]>> => {
    try {
        const response = await api.get<ChatMessage[]>(`/conversations/${conversationId}/messages`);
        return { success: true, data: response.data };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Could not load messages.',
        };
    }
};

export const sendMessage = async (
    conversationId: number,
    content: string
): Promise<ApiResult<ChatMessage>> => {
    try {
        const response = await api.post<ChatMessage>(
            `/conversations/${conversationId}/messages`,
            { content }
        );
        return { success: true, data: response.data };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Could not send message.',
        };
    }
};

export const getMyConversations = async (): Promise<ApiResult<Conversation[]>> => {
    try {
        const response = await api.get<Conversation[]>('/conversations');
        return { success: true, data: response.data };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Could not load conversations.',
        };
    }
};

export const markConversationRead = async (conversationId: number): Promise<void> => {
    try {
        await api.patch(`/conversations/${conversationId}/read`);
    } catch {
        // silently fail - not critical
    }
};
