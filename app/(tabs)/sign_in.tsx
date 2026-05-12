import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Image, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { registerUser } from "@/src/api/authApi";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function SignUpScreen() {
    const [agreed, setAgreed] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = makeStyles(colors);

    const handleSignUp = async () => {
        if (!agreed) {
            alert("Please agree with the terms and conditions.");
            return;
        }
        if (!username.trim() || !email.trim() || !password.trim()) {
            Alert.alert("Missing info", "Please fill in all fields");
            return;
        }
        setLoading(true);
        const result = await registerUser(username.trim(), email.trim(), password);
        setLoading(false);

        console.log("RESPONSE:", result);
        if (result.success) {
            router.push({ pathname: '/verification', params: { email: email.trim() } });
        } else {
            Alert.alert("Registration failed", result.message);
        }
    };

    return (
        <SafeAreaView style={styles.MainPage}>
            <View style={styles.titleContainer}>
                <Text style={styles.TitleText}>Create Account</Text>
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.TextStyle}>Join your neighbors and start sharing everything you need.</Text>
            </View>

            <View style={styles.card}>
                <Text style={[styles.SignInText, { paddingTop: 10 }]}>USERNAME</Text>
                <TextInput
                    style={styles.SignInTextField}
                    placeholder="Joe Doe"
                    placeholderTextColor={colors.placeholder}
                    value={username}
                    onChangeText={setUsername}
                />

                <Text style={styles.SignInText}>EMAIL ADDRESS</Text>
                <TextInput
                    style={styles.SignInTextField}
                    placeholder="Joe@example.com"
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={styles.SignInText}>PASSWORD</Text>
                <TextInput
                    style={styles.SignInTextField}
                    placeholder="********"
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.Checkbox} onPress={() => setAgreed(!agreed)}>
                    <MaterialIcons
                        name={agreed ? "check-box" : "check-box-outline-blank"}
                        size={22}
                        color={agreed ? colors.primary : colors.textSecondary}
                    />
                    <Text style={styles.TermsText}>I agree to the Terms of Service and Privacy Policy.</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.SignInButton} onPress={handleSignUp} disabled={loading}>
                    {loading
                        ? <ActivityIndicator color="white" />
                        : <Text style={styles.SignInButtonText}>Sign Up</Text>
                    }
                </TouchableOpacity>

                <View style={[styles.centerContainer, { gap: 10, marginVertical: 20 }]}>
                    <View style={styles.line} />
                    <Text style={styles.SmallText}>OR WITH GOOGLE</Text>
                    <View style={styles.line} />
                </View>

                <View style={[styles.textContainers, { paddingVertical: 0 }]}>
                    <TouchableOpacity style={styles.button}>
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                            style={styles.googleIcon}
                        />
                        <Text style={[styles.MediumText, { fontWeight: "400" }]}>Sign up with Google</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.centerContainer, { padding: 5, marginTop: 25 }]}>
                <Text style={styles.MediumText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/log_in')}>
                    <Text style={[styles.MediumText, { color: colors.primary, fontWeight: "600",marginLeft:6 }]}>
                        Log In
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center" }}>
                <View style={[styles.centerContainer, { paddingTop: 20, gap: 60 }]}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="shield" size={25} color={colors.textMuted} />
                    </View>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="groups" size={35} color={colors.textMuted} />
                    </View>
                </View>
                <View style={[styles.centerContainer, { gap: 30 }]}>
                    <Text style={styles.SmallText}>Secure & Private</Text>
                    <Text style={styles.SmallText}>Community Trust</Text>
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
        gap: 8,
        paddingTop: 0,
        paddingBottom: 10,
    },
    TitleText: {
        fontSize: 32,
        fontWeight: "500",
        letterSpacing: -0.5,
        paddingTop: 15,
        color: colors.text,
    },
    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    TextStyle: {
        fontSize: 15,
        fontWeight: "normal",
        textAlign: "center",
        lineHeight: 25,
        color: colors.textMuted,
    },
    card: {
        width: '100%',
        borderRadius: 14,
        padding: 20,
        paddingTop: 0,
        alignSelf: 'center',
    },
    SignInText: {
        fontSize: 12,
        fontWeight: "600",
        paddingTop: 15,
        paddingBottom: 10,
        color: colors.text,
    },
    SignInTextField: {
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
    SignInButton: {
        width: '100%',
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 14,
        backgroundColor: colors.primary,
        marginTop: 20,
    },
    SignInButtonText: {
        color: 'white',
        fontWeight: "600",
        fontSize: 16,
    },
    button: {
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
    Checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 24,
        marginBottom: 5,
    },
    TermsText: {
        fontSize: 13,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 18,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.borderLight,
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
    centerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",


    },
    textContainers: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
    },
    MediumText: {
        fontSize: 15,
        color: colors.textSecondary,

    },
    SmallText: {
        fontSize: 11,
        color: colors.textMuted,
    },
    BigText: {
        fontSize: 18,
        color: colors.text,
    },
    googleIcon: {
        width: 22,
        height: 22,
    },
});