import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from "@/src/context/languageContext";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from "@/src/context/authContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { getAuthToken, deleteAuthToken } from "@/src/storage/storageTokens";

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
    const colorScheme = useColorScheme();

    // Auth initialization
    useEffect(() => {
        const init = async () => {
            try {
                if (refreshAuth) await refreshAuth();
                const savedToken = await getAuthToken();
                if (savedToken && isJWTExpired(savedToken)) {
                    await deleteAuthToken();
                    if (refreshAuth) await refreshAuth();
                }
            } catch (error) {
                console.error('[AUTH] Init error:', error);
            } finally {
                setIsReady(true);
            }
        };
        init();
    }, [refreshAuth]);

    // 🌟 Dok se auth učitava, prikaži splash holder (nema flasha)
    if (!isReady || isLoading) {
        return <View style={colorScheme === 'dark' ? styles.splashHolderDark : styles.splashHolderLight} />;
    }

    // Auth je spreman - provjeri gdje je korisnik trenutno
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
        currentSegment === 'edit-listing' ||
        currentSegment === 'my-listings';

    // 🌟 Ako korisnik treba redirect, prikaži Redirect UNUTAR splash holdera
    // Tako splash ostaje vidljiv dok se ruta mijenja u pozadini
    if (!token && inAppGroup) {
        return (
            <View style={colorScheme === 'dark' ? styles.splashHolderDark : styles.splashHolderLight}>
                <Redirect href="/" />
            </View>
        );
    }

    if (token && inAuthGroup) {
        return (
            <View style={colorScheme === 'dark' ? styles.splashHolderDark : styles.splashHolderLight}>
                <Redirect href="/(tabs)/home" />
            </View>
        );
    }

    // 🌟 Korisnik je na pravoj ruti - prikaži Stack i sakrij splash kad se layouta
    return (
        <View
            style={{ flex: 1 }}
            onLayout={() => {
                // Sakrij splash tek kad se prava ruta stvarno pojavi na ekranu
                SplashScreen.hideAsync();
            }}
        >
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
                <Stack.Screen name="edit-listing" options={{ title: 'Edit Listing', animation: 'slide_from_right', animationDuration: 250 }} />
                <Stack.Screen name="my-listings" options={{ title: 'My Listings', animation: 'slide_from_right', animationDuration: 250 }} />
            </Stack>
        </View>
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
    splashHolderLight: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    splashHolderDark: {
        flex: 1,
        backgroundColor: '#000000',
    },
});