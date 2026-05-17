import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from "@/src/context/authContext";

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false,  animation: 'fade', animationDuration:1050 }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                    <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade', animationDuration:550}} />
                    <Stack.Screen name="sign-in" options={{ headerShown: false, animation: 'fade', animationDuration:550 }} />
                    <Stack.Screen name="log-in" options={{ headerShown: false, animation: 'fade', animationDuration:550 }} />
                    <Stack.Screen name="verification" options={{ headerShown: false, animation: 'fade', animationDuration:550 }} />
                    <Stack.Screen name="saved-items" options={{title: 'Saved Items',animation: 'fade', animationDuration:550 }} />
                    <Stack.Screen name="settings" options={{title: 'Settings',animation: 'fade', animationDuration:550 }}/>
                </Stack>
                <StatusBar style="auto" />
            </ThemeProvider>
        </AuthProvider>
    );
}