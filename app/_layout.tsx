import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { LanguageProvider } from "@/src/context/languageContext";

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from "@/src/context/authContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <LanguageProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                        <Stack>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade', animationDuration: 950 }} />
                            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                            <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade', animationDuration: 350 }} />
                            <Stack.Screen name="sign-in" options={{ headerShown: false, animation: 'fade', animationDuration: 350 }} />
                            <Stack.Screen name="log-in" options={{ headerShown: false, animation: 'fade', animationDuration: 350 }} />
                            <Stack.Screen name="verification" options={{ headerShown: false, animation: 'fade', animationDuration: 350 }} />
                            <Stack.Screen name="saved-items" options={{ title: 'Saved Items', animation: 'fade', animationDuration: 350 }} />
                            <Stack.Screen name="settings" options={{ title: 'Settings', animation: 'fade', animationDuration: 350 }} />
                            <Stack.Screen name="chat" options={{ headerShown: false, animation: 'fade', animationDuration: 350 }} />
                            <Stack.Screen name="support" options={{ title: 'Support', animation: 'fade', animationDuration: 350 }} />
                            <Stack.Screen name="privacy" options={{ title: 'Privacy', animation: 'slide_from_right', animationDuration: 350 }} />
                            <Stack.Screen name="terms" options={{ title: 'Terms', animation: "slide_from_right", animationDuration: 350 }} />

                        </Stack>
                        <StatusBar style="auto" />
                    </ThemeProvider>
                </LanguageProvider>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}