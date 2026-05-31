import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, Redirect, Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from "@/src/context/languageContext";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from "@/src/context/authContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { getAuthToken, deleteAuthToken } from "@/src/storage/storageTokens";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';

export const unstable_settings = {
    anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function isJWTExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        return Date.now() >= exp;
    } catch {
        return true;
    }
}

function RootNavigation() {
    const { token, isLoading, refreshAuth } = useAuth();
    const segments = useSegments();
    const [isReady, setIsReady] = useState(false);

    // Animirane točkice
    const dot1 = useSharedValue(0.3);
    const dot2 = useSharedValue(0.3);
    const dot3 = useSharedValue(0.3);

    useEffect(() => {
        dot1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, false);
        setTimeout(() => { dot2.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, false); }, 200);
        setTimeout(() => { dot3.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, false); }, 400);
    }, []);

    const d1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
    const d2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
    const d3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

    // Inicijalizacija auth-a
    useEffect(() => {
        const init = async () => {
            try {
                if (refreshAuth) await refreshAuth();
                const savedToken = await getAuthToken();
                if (savedToken && isJWTExpired(savedToken)) {
                    console.log('[AUTH] Token istekao - brisanje...');
                    await deleteAuthToken();
                    if (refreshAuth) await refreshAuth();
                }
            } catch (error) {
                console.error('[AUTH] Init error:', error);
            } finally {
                setIsReady(true);
                await SplashScreen.hideAsync();
            }
        };
        init();
    }, []);

    // Loading overlay
    if (!isReady || isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#097F8C" />
                    <View style={styles.loadingTextContainer}>
                        <Animated.View style={[styles.loadingDot, d1]} />
                        <Animated.View style={[styles.loadingDot, d2]} />
                        <Animated.View style={[styles.loadingDot, d3]} />
                    </View>
                </View>
            </View>
        );
    }

    // ✅ ISPRAVLJENO: Kastiramo segments[0] u string da izbjegnemo TS2367 grešku
    // typedRoutes generira strogi union tip, pa "(auth)" i "index" nisu prepoznati
    const currentSegment = segments[0] as string;

    const inAuthGroup = currentSegment === '(auth)' ||
        currentSegment === 'index' ||
        currentSegment === 'log-in' ||
        currentSegment === 'sign-in';

    const inAppGroup = currentSegment === '(tabs)' ||
        currentSegment === 'item' ||
        currentSegment === 'chat' ||
        currentSegment === 'settings' ||
        currentSegment === 'saved-items' ||
        currentSegment === 'support' ||
        currentSegment === 'privacy' ||
        currentSegment === 'terms';

    // 🔹 Slučaj 1: Nema tokena, ali pokušavaš ući u app → Login
    if (!token && inAppGroup) {
        console.log('[AUTH] 🔐 Nema tokena u app grupi → redirect na login');
        return <Redirect href={"/" as Href} />;
    }

    // 🔹 Slučaj 2: Imaš token, ali si na auth ekranima → Home
    if (token && inAuthGroup) {
        console.log('[AUTH] 🚀 Imaš token na auth ekranu → redirect na home');
        return <Redirect href={"/(tabs)/home" as Href} />;
    }

    // 🔹 Slučaj 3: Inače → DOPUSTI NORMALNU NAVIGACIJU
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade', animationDuration: 250 }} />
            <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade', animationDuration: 250 }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false, animation: 'fade', animationDuration: 250 }} />
            <Stack.Screen name="log-in" options={{ headerShown: false, animation: 'fade', animationDuration: 250 }} />
            <Stack.Screen name="Auth/verification" options={{ headerShown: false, animation: 'fade', animationDuration: 250 }} />
            <Stack.Screen name="saved-items" options={{ title: 'Saved Items', animation: 'fade', animationDuration: 250 }} />
            <Stack.Screen name="settings" options={{ title: 'Settings', animation: 'fade', animationDuration: 250 }} />
            <Stack.Screen name="chat" options={{ headerShown: false, animation: 'fade', animationDuration: 250 }} />
            <Stack.Screen name="support" options={{ title: 'Support', animation: 'fade', animationDuration: 250 }} />
            <Stack.Screen name="privacy" options={{ title: 'Privacy', animation: 'slide_from_right', animationDuration: 250 }} />
            <Stack.Screen name="terms" options={{ title: 'Terms', animation: 'slide_from_right', animationDuration: 250 }} />
            <Stack.Screen name="item" options={{ headerShown: false, animation: 'slide_from_right', animationDuration: 250 }} />
        </Stack>
    );
}

export default function RootLayout() {
    const colorScheme = useColorScheme();
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <LanguageProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                        <BottomSheetModalProvider>
                            <RootNavigation />
                            <StatusBar style="auto" />
                        </BottomSheetModalProvider>
                    </ThemeProvider>
                </LanguageProvider>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    loadingContent: {
        alignItems: 'center',
        gap: 24,
    },
    loadingTextContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#097F8C',
    },
});