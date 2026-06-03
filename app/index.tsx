import React, { useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { useAuth } from '@/src/context/authContext';
import { Image } from 'expo-image';

export default function Index() {
    const router = useRouter();
    const { token, isLoading } = useAuth();
    const langContext = useLanguage();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const isDark = scheme === 'dark';

    const gradientColors: [string, string] = isDark
        ? ['#121212', '#0f2b2f']
        : ['#097F8C', '#00646F'];


    useEffect(() => {
        if (!isLoading && token) {
            console.log('[INDEX] 🚀 User već prijavljen - redirect na Home');
            router.replace('/(tabs)/home');
        }
    }, [token, isLoading]);


    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
            return () => sub.remove();
        }, [])
    );


    if (isLoading) {
        return (
            <LinearGradient colors={gradientColors} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </LinearGradient>
        );
    }


    if (token) {
        return (
            <LinearGradient colors={gradientColors} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </LinearGradient>
        );
    }

    if (!langContext) {
        return (
            <LinearGradient colors={gradientColors} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </LinearGradient>
        );
    }

    const { t } = langContext;
    const styles = makeStyles(colors, isDark);

    return (
        <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.top}>
                    <Image
                        source={require('@/assets/images/Logo.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                    <Text style={styles.titleText}>Rent-a-Thing</Text>
                    <Text style={styles.subtitle}>{t('index', 'subtitle')}</Text>
                </View>
                <View style={styles.bottom}>
                    <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={() => router.push('/Auth/sign-in')}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.btnPrimaryText}>{t('index', 'signIn')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={() => router.push('/Auth/log-in')}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.btnSecondaryText}>{t('index', 'logIn')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.footer}>{t('index', 'trusted')}</Text>
                </View>
            </View>
        </LinearGradient>
    );
}

const makeStyles = (colors: typeof Colors.light, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            paddingHorizontal: 28,
            paddingBottom: 32,
            justifyContent: 'space-between',
        },

        top: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },

        logo: {
            width: 300,
            height: 220,
            marginBottom: 34,
        },

        titleText: {
            fontSize: 42,
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: 0.5,
            marginTop: 4,
            textAlign: 'center',
        },

        subtitle: {
            fontSize: 17,
            color: colors.activeTabText,
            textAlign: 'center',
            lineHeight: 24,
            marginTop: 10,
            paddingHorizontal: 20,
            opacity: 0.8,
        },

        bottom: {
            width: '100%',
            gap: 12,
        },

        btnPrimary: {
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
        },

        btnPrimaryText: {
            color: isDark ? '#FFFFFF' : colors.primary,
            fontWeight: '600',
            fontSize: 16,
            letterSpacing: 0.2,
        },

        btnSecondary: {
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            borderRadius: 14,
            backgroundColor: 'transparent',
            borderWidth: 0.5,
            borderColor: colors.activeTabBg,
        },

        btnSecondaryText: {
            color: colors.activeTabText,
            fontWeight: '600',
            fontSize: 16,
            letterSpacing: 0.2,
        },

        footer: {
            color: colors.activeTabText,
            fontSize: 11,
            letterSpacing: 1.8,
            marginTop: 8,
            textAlign: 'center',
            fontWeight: '500',
            opacity: 0.8,
        },
    });