import axios from "axios";
import { saveAuthData } from "@/src/storage/storageTokens";
//BASE_URL -> u cmd-u upišeš ipconfig i pod IPv4 Address prepises brojke
//                      "http://xxx.xxx.xxx.xxx:8080"   -> umjesto x-eva idu brojke
const BASE_URL = "http://192.168.178.100:8080";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000,
});

//ENDPOINTS:

/*Register:
    Poziva se kad se klikne gumb "Sign Up".
*/
export const registerUser = async (username, email, password) => {
    try{
        const response = await api.post("auth/signup", {
            username,
            email,
            password
        });
        return { //Sve na engleski prepravit.
            success: true,
            data: response.data,
            message: response.data.message || "Verifikacijski kod poslan na Mail"
        };
    } catch (error) {
        const message =
            error.response?.data?.message ||
            "Registracija korisnika nije uspjela.";
        return{
            success: false,
            message
        };
    }
};

/* Verifikacija koda:
    kad se u verify screenu klikne verify code.
 */

export const verifyCode = async (email, code) => {
    try {
        const response = await api.post("auth/verify", {
            email,
            verificationCode: code
        });
        return {
            success: true,
            message: response.data,
        };
    } catch (error) {

        return {
            success: false,
            message: error.response?.data?.message || error.response?.data || "Verifikacija nije uspjela.",
        };
    }
};

/* Login:
    Kad korinsik klikne Log In.
 */
export const loginUser = async (email, password) => {
    try {
        const response = await api.post("auth/login", {
            email,
            password
        });
        const { token, userId, username, email: userEmail } = response.data;

        await saveAuthData(token, { userId, username, email: userEmail });

        return {
            success: true,
            token,
            user: { userId, username, email: userEmail },
        }
    } catch (error) {
        const message =
            error.response?.data?.message || "Login nije uspio. Molim Vas provjerite Email i/ili Password te pokušajte ponovno!";

        return {
            success: false,
            message
        }
    }
}

export const resendCode = async (email) => {
    try{
        const response = await api.post(`auth/resend?email=${encodeURIComponent(email)}`)
        return {
            success: true,
            message: response.data.message || "Verifikacijski kod je poslan."
        };
    } catch (error) {
        const message =
            error.response?.data?.message || "Nešto je pošlo po krivu, molim Vas pokušajte ponovno.";

        return {
            success: false,
            message
        }
    }
}

