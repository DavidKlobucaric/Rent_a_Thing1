import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { BackHandler } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function Index() {
    const router = useRouter();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors, scheme), [colors, scheme]);

    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
            return () => sub.remove();
        }, [])
    );




    return (
        <>
            <StatusBar barStyle="light-content" translucent />
            <LinearGradient colors={['#097F8C', '#00646F']}  style={{ flex: 1 }}>
                <SafeAreaView style={styles.container}>
                    <View style={styles.top}>
                        <Image
                            source={require('@/assets/images/Logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.titleText}>Rent-a-Thing</Text>
                        <Text style={styles.subtitle}>Rent anything you need</Text>
                    </View>

                    <View style={styles.bottom}>
                        <TouchableOpacity
                            style={styles.btnPrimary}
                            onPress={() => router.push('/sign_in')}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.btnPrimaryText}>Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.btnSecondary}
                            onPress={() => router.push('/log_in')}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.btnSecondaryText}>Log In</Text>
                        </TouchableOpacity>

                        <Text style={styles.footer}>TRUSTED BY 5,000+ NEIGHBORS</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </>
    );
}

const makeStyles = (colors: typeof Colors.light, scheme: 'light' | 'dark') => StyleSheet.create({
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
        marginBottom: 24,
    },

    titleText: {
        fontSize: 42,
        fontWeight: '800',
        // ✅ Na gradientu uvijek bijelo za čitljivost, u dark modeu možeš koristiti colors.text
        color: '#FFFFFF',
        letterSpacing: 0.5,
        marginTop: 4,
        textAlign: 'center',
    },

    subtitle: {
        fontSize: 17,
        // ✅ Koristi theme varijablu s prilagođenom opacity za gradient
        color: scheme === 'dark' ? colors.textMuted + 'CC' : 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 24,
        marginTop: 12,
        paddingHorizontal: 20,
    },

    bottom: {
        width: '100%',
        gap: 12,
    },

    // ✅ PRIMARY GUMB: koristi colors.surface
    btnPrimary: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: colors.surface, // #FFFFFF (light) | #424242 (dark)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },

    // ✅ TEKST NA PRIMARY GUMBU: colors.primary (light) | colors.text (dark)
    btnPrimaryText: {
        color: scheme === 'dark' ? colors.text : colors.primary,
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.2,
    },

    // ✅ SECONDARY GUMB: transparent pozadina, border iz teme
    btnSecondary: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: scheme === 'dark' ? colors.border : colors.primary, // #424242 | #00646F
    },

    // ✅ TEKST NA SECONDARY GUMBU: colors.text
    btnSecondaryText: {
        color: colors.text,
        fontWeight: '600',
        fontSize: 16,
        letterSpacing: 0.2,
    },

    // ✅ FOOTER: colors.textMuted iz teme
    footer: {
        color: colors.textMuted,
        fontSize: 11,
        letterSpacing: 1.8,
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '500',
    },
});