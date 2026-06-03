import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verifyCode, resendCode } from "@/src/api/authApi";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import * as Haptics from 'expo-haptics';

export default function VerificationScreen() {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const { email = 'user@example.com' } = useLocalSearchParams<{email: string}>();

    const { t } = useLanguage();
    const router = useRouter();

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];


    const styles = useMemo(() => makeStyles(colors), [colors]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);


    const handleChange = useCallback((text: string, index: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);
        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    }, [code]);


    const handleKeyPress = useCallback((key: string, index: number) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            inputRefs.current[index - 1]?.focus();
        }
    }, [code]);


    const handleVerify = useCallback(async () => {
        const verificationCode = code.join('');
        if (verificationCode.length !== 6) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setVerifying(true);
        const result = await verifyCode(email, verificationCode);
        setVerifying(false);

        if(result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                t('auth', 'accountVerified'),
                t('auth', 'verifyAccount') + ' ✓',
                [{ text: t('auth', 'logIn'), onPress: () => router.replace('/Auth/log-in')}]
            );
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('auth', 'verificationFailed'), result.message);
            setCode(['','','','','','']);
            inputRefs.current[0]?.focus();
        }
    }, [code, email, router, t]);


    const handleResend = useCallback(async () => {
        if (!canResend || resending) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setResending(true);
        const result = await resendCode(email);
        setResending(false);

        if(result.success){
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimer(60);
            setCanResend(false);
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            Alert.alert(t('auth', 'codeSent'), t('auth', 'sentCode') + ' ' + email);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('common', 'error'), result.message);
        }
    }, [canResend, resending, email, t]);


    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);


    const handleChangeEmail = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    }, [router]);

    const codeComplete = code.join('').length === 6;

    return (
        <SafeAreaView style={styles.MainPage}>

            {/* HEADER */}
            <View style={styles.titleContainer}>
                <View style={styles.verificationIcon}>
                    <MaterialIcons name="verified-user" size={40} color={colors.iconColor} />
                </View>
                <Text style={styles.titleText}>{t('auth', 'verifyAccount')}</Text>
            </View>

            {/* SUBTITLE */}
            <View style={styles.textContainer}>
                <Text style={styles.TextStyle}>
                    {t('auth', 'sentCode')}{'\n'}
                    <Text style={[styles.emailText, { color: colors.text }]}>{email}</Text>
                </Text>
            </View>

            {/* CARD */}
            <View style={styles.card}>

                {/* CODE INPUTS */}
                <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref: TextInput | null) => { inputRefs.current[index] = ref }}
                            style={[
                                styles.codeInput,
                                {
                                    borderColor: digit ? colors.primary : colors.border,
                                    backgroundColor: colors.surface,
                                    color: colors.text,
                                }
                            ]}
                            maxLength={1}
                            keyboardType="number-pad"
                            value={digit}
                            onChangeText={(text) => handleChange(text, index)}
                            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                            textAlign="center"
                            autoFocus={index === 0}
                            placeholderTextColor={colors.placeholder}
                        />
                    ))}
                </View>

                {/* RESEND */}
                <View style={styles.resendContainer}>
                    <Text style={[styles.resendLabel]}>
                        {t('auth', 'didntReceive')}
                    </Text>
                    <TouchableOpacity
                        onPress={handleResend}
                        disabled={!canResend || resending}
                    >
                        {resending
                            ? <ActivityIndicator color={colors.primary} size="small" />
                            : <Text style={[ styles.resendText,
                                { color: canResend ? colors.primary : colors.textMuted }]}>{canResend ? t('auth', 'resendCode') : `${t('auth', 'resendIn')} ${formatTime(timer)}`}</Text>
                        }
                    </TouchableOpacity>
                </View>

                {/* VERIFY BUTTON */}
                <TouchableOpacity
                    style={[
                        styles.SignInButton,
                        { opacity: codeComplete && !verifying ? 1 : 0.6 }
                    ]}
                    onPress={handleVerify}
                    disabled={!codeComplete || verifying}
                >
                    {verifying
                        ? <ActivityIndicator color={colors.iconColorInverse} />
                        : <Text style={styles.verifyButtonText}>{t('auth', 'verify')}</Text>
                    }
                </TouchableOpacity>

                {/* CHANGE EMAIL */}
                <View style={[styles.resendContainer, { marginBottom: 0, marginTop: 30 }]}>
                    <Text style={[styles.resendLabel, { color: colors.textMuted }]}>{t('auth', 'wrongEmail')}</Text>
                    <TouchableOpacity onPress={handleChangeEmail}>
                        <Text style={[styles.changeText, { color: colors.primary }]}>{t('common', 'change')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* TRUST BADGES */}
            <View style={styles.trustContainer}>
                <View style={styles.badgeRow}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="security" size={24} color={colors.textMuted} />
                    </View>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="timer" size={24} color={colors.textMuted} />
                    </View>
                </View>
                <View style={styles.badgeLabels}>
                    <Text style={styles.badgeText}>{t('auth', 'encrypted')}</Text>
                    <Text style={styles.badgeText}>{t('auth', 'expires')}</Text>
                </View>
            </View>

        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({

    MainPage: {
        flex: 1,
        backgroundColor: colors.background,
    },

    titleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 30,
        paddingBottom: 20,
    },

    titleText: {
        fontSize: 32,
        fontWeight: "500",
        marginTop: 20,
        color: colors.text,
    },

    verificationIcon: {
        width: 80,
        height: 80,
        borderRadius: 9999,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.iconCircleBorder,
    },

    TextStyle: {
        fontSize: 16,
        fontWeight: "400",
        textAlign: "center",
        lineHeight: 24,
        color: colors.textSecondary,
    },

    emailText: {
        fontWeight: "500",
    },

    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },

    card: {
        width: '100%',
        padding: 24,
        alignSelf: 'center',
    },

    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginVertical: 10,
        padding: 5,
    },

    codeInput: {
        width: "15%",
        height: 60,
        borderRadius: 14,
        borderWidth: 1,
        fontSize: 24,
        fontWeight: '500',
        textAlign: "center",
    },

    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        marginTop: 20,
        marginBottom: 24,
    },

    resendLabel: {
        fontSize: 13,
    },

    resendText: {
        fontSize: 14,
        fontWeight: "500",
    },

    changeText: {
        fontSize: 14,
        fontWeight: "500",
    },

    SignInButton: {
        width: '100%',
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: colors.primary,
        marginTop: 8,
    },

    verifyButtonText: {
        color: colors.iconColorInverse,
        fontSize: 18,
        fontWeight: "500",
    },

    trustContainer: {
        alignItems: "center",
        marginTop: 30,
    },

    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 80,
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
        alignItems: "center",
        flexDirection: "row",
        gap: 30,
    },

    badgeText: {
        fontSize: 11,
        color: colors.textMuted,
    },
});