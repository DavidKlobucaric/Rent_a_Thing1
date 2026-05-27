import axios from "axios";
import { saveAuthData, AuthUser } from "@/src/storage/storageTokens";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const BASE_URL = API_BASE_URL;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

// Response types

interface AuthSuccess<T = undefined> {
    success: true;
    message: string;
    data?: T;
}

interface AuthFailure {
    success: false;
    message: string;
}

type AuthResult<T = undefined> = AuthSuccess<T> | AuthFailure;

interface LoginData {
    token: string;
    user: AuthUser;
}

// Endpoints

export const registerUser = async (
    username: string,
    email: string,
    password: string
): Promise<AuthResult> => {
    try {
        const response = await api.post("auth/signup", { username, email, password });
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Verification code sent to your email.",
        };
    } catch (error: unknown) {
        const message =
            axios.isAxiosError(error)
                ? error.response?.data?.message ?? "Registration failed. Please try again."
                : "Registration failed. Please try again.";
        return { success: false, message };
    }
};

export const verifyCode = async (
    email: string,
    code: string
): Promise<AuthResult> => {
    try {
        const response = await api.post("auth/verify", {
            email,
            verificationCode: code,
        });
        return {
            success: true,
            message: response.data,
        };
    } catch (error: unknown) {
        const message = axios.isAxiosError(error)
            ? error.response?.data?.message ?? error.response?.data ?? "Verification failed."
            : "Verification failed.";
        return { success: false, message };
    }
};

export const loginUser = async (
    email: string,
    password: string
): Promise<AuthResult<LoginData>> => {
    try {
        const response = await api.post("auth/login", { email, password });
        const { token, userId, username, email: userEmail } = response.data;

        await saveAuthData(token, { userId, username, email: userEmail });

        return {
            success: true,
            message: "Login successful.",
            data: {
                token,
                user: { userId, username, email: userEmail },
            },
        };
    } catch (error: unknown) {
        const message = axios.isAxiosError(error)
            ? error.response?.data?.message ?? "Login failed. Please check your email and password and try again."
            : "Login failed. Please check your email and password and try again.";
        return { success: false, message };
    }
};

export const resendCode = async (email: string): Promise<AuthResult> => {
    try {
        const response = await api.post(
            `auth/resend?email=${encodeURIComponent(email)}`
        );
        return {
            success: true,
            message: response.data.message || "Verification code sent.",
        };
    } catch (error: unknown) {
        const message = axios.isAxiosError(error)
            ? error.response?.data?.message ?? "Something went wrong. Please try again."
            : "Something went wrong. Please try again.";
        return { success: false, message };
    }
};
