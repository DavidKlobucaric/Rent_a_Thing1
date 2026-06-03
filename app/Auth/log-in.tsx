import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { loginUser } from "@/src/api/authApi";
import { useAuth } from "@/src/context/authContext";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import * as Haptics from 'expo-haptics';

import { getRememberedEmail } from "@/src/storage/storageTokens";

export default function LogInScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { refreshAuth } = useAuth();
    const { t } = useLanguage();

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];

    const styles = useMemo(() => makeStyles(colors), [colors]);


    useEffect(() => {
        const checkRememberedEmail = async () => {
            const savedEmail = await getRememberedEmail();
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberMe(true);
            }
        };
        checkRememberedEmail();
    }, []);


    const handleLogIn = useCallback(async () => {
        if (!email.trim() || !password.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('auth', 'missingInfo'), t('auth', 'fillAllFields'));
            return;
        }
        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);


        const result = await loginUser(email.trim(), password, rememberMe);
        setLoading(false);

        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await refreshAuth();
            router.replace('/home');
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('auth', 'loginFailed'), result.message);
        }
    }, [email, password, rememberMe, t, refreshAuth, router]);

    const toggleRememberMe = useCallback(() => {
        Haptics.selectionAsync();
        setRememberMe(prev => !prev);
    }, []);

    const handleForgotPassword = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const handleSocialPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const handleSignUpPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/Auth/sign-in');
    }, [router]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={styles.titleText}>{t('auth', 'welcomeBack')}</Text>
            </View>
            <View style={styles.subtitleContainer}>
                <Text style={styles.subtitleText}>
                    {t('auth', 'logInSubtitle')}
                </Text>
            </View>
            <View style={styles.card}>
                <Text style={styles.labelText}>{t('auth', 'email')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Joe@example.com"
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <Text style={styles.labelText}>{t('auth', 'password')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="********"
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                />
                <View style={styles.rememberRow}>
                    <TouchableOpacity
                        style={styles.rememberMeContainer}
                        onPress={toggleRememberMe}
                    >
                        <MaterialIcons
                            name={rememberMe ? "check-box" : "check-box-outline-blank"}
                            size={22}
                            color={rememberMe ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.smallText, { color: colors.textSecondary }]}>
                            {t('auth', 'rememberMe')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={[styles.smallText, { color: colors.primary, fontWeight: '600' }]}>
                            {t('auth', 'forgotPassword')}
                        </Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                    onPress={handleLogIn}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color={colors.iconColorInverse} />
                        : <Text style={styles.primaryButtonText}>{t('auth', 'logIn')}</Text>
                    }
                </TouchableOpacity>
                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>{t('auth', 'orWithGoogle')}</Text>
                    <View style={styles.dividerLine} />
                </View>
                <View style={styles.socialContainer}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={handleSocialPress}
                    >
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                            style={styles.socialIcon}
                            cachePolicy="memory-disk"
                            transition={200}
                        />
                        <Text style={[styles.mediumText, { color: colors.googleButtonText }]}>
                            {t('auth', 'signInGoogle')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.signUpContainer}>
                <Text style={styles.mediumText}>{t('auth', 'noAccount')}</Text>
                <TouchableOpacity onPress={handleSignUpPress}>
                    <Text style={[styles.mediumText, { color: colors.primary, fontWeight: "600" }]}>
                        {t('auth', 'signUp')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.trustContainer}>
                <View style={styles.badgeRow}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="shield" size={25} color={colors.textMuted} />
                    </View>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="groups" size={35} color={colors.textMuted} />
                    </View>
                </View>
                <View style={styles.badgeLabels}>
                    <Text style={styles.badgeText}>{t('auth', 'secure')}</Text>
                    <Text style={styles.badgeText}>{t('auth', 'communityTrust')}</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },

        header: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 16,
            paddingBottom: 8,
        },

        titleText: {
            fontWeight: "600",
            fontSize: 32,
            letterSpacing: -0.5,
            color: colors.text,
        },

        subtitleContainer: {
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingBottom: 20,
        },

        subtitleText: {
            fontSize: 15,
            fontWeight: "400",
            textAlign: "center",
            lineHeight: 24,
            color: colors.textSecondary,
        },

        card: {
            width: '100%',
            borderRadius: 14,
            padding: 20,
            paddingTop: 0,
            alignSelf: 'center',
        },

        labelText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.text,
            paddingTop: 16,
            paddingBottom: 8,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
        },

        input: {
            width: '100%',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 0.5,
            borderColor: colors.border,
            fontSize: 14,
            color: colors.text,
        },

        rememberRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 16,
            paddingBottom: 8,
        },

        rememberMeContainer: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },

        smallText: {
            fontSize: 13,
        },

        mediumText: {
            fontSize: 15,
            color: colors.textSecondary,
        },

        primaryButton: {
            width: '100%',
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 14,
            backgroundColor: colors.primary,
            marginTop: 20,
        },

        primaryButtonText: {
            fontSize: 16,
            fontWeight: "600",
            color: colors.iconColorInverse,
        },

        dividerContainer: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 20,
            gap: 12,
        },

        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: colors.border,
        },

        dividerText: {
            fontSize: 11,
            color: colors.textMuted,
            fontWeight: "500",
            letterSpacing: 0.5,
        },

        socialContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
        },

        socialButton: {
            width: '100%',
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            justifyContent: "center",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 0.5,
            borderColor: colors.border,
        },

        socialIcon: {
            width: 22,
            height: 22,
        },

        signUpContainer: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 24,
            gap: 6,
        },

        trustContainer: {
            alignItems: 'center',
            paddingTop: 32,
            paddingBottom: 20,
        },

        badgeRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 56,
            paddingBottom: 12,
        },

        iconCircle: {
            width: 56,
            height: 56,
            borderRadius: 9999,
            backgroundColor: colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 5,
            borderWidth: 1,
            borderColor: colors.borderLight,
        },

        badgeLabels: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
        },

        badgeText: {
            fontSize: 11,
            color: colors.textMuted,
            fontWeight: "500",
            textAlign: "center",
        },
    });