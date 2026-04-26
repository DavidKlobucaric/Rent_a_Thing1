import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Keyboard,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verifyCode, resendCode } from "@/src/api/authApi";


export default function VerificationScreen(/*{ navigation, route }: any*/) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const { email = 'user@example.com' } = useLocalSearchParams<{email: string}>(); //sad koristi iz sing-ina

    const router = useRouter();

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

    const handleChange = (text: string, index: number) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);


        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (text: string) => {
        const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
        const newCode = [...code];
        for (let i = 0; i < digits.length; i++) {
            newCode[i] = digits[i];
        }
        setCode(newCode);

        const lastIndex = Math.min(digits.length - 1, 5);
        inputRefs.current[lastIndex]?.focus();
    };

    const handleVerify = async () => {
        const verificationCode = code.join('');
        if (verificationCode.length !== 6) return;

        setVerifying(true);
        const result = await verifyCode(email, verificationCode);
        setVerifying(false);

        if(result.success) {
            Alert.alert("Account verified", "Your account has been verified. Please log in.",
                [{ text: "Log in", onPress: () => router.replace('/(tabs)/log_in')}]
                );
        } else{
            Alert.alert("Verification failed", result.message);
            setCode(['','','','','',''])
            inputRefs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (!canResend || resending) return

        setResending(true);
        const result = await resendCode(email);
        setResending(false);

        if(result.success){
            setTimer(60);
            setCanResend(false);
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            Alert.alert('Code sent', 'A new verification code has been sent to your email.')
        } else{
            Alert.alert('Error', result.message);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const codeComplete = code.join('').length === 6;

    return (
        <SafeAreaView style={styles.MainPage}>



                <View style={styles.titleContainer}>
                    <View style={styles.verificationIcon}>
                        <MaterialIcons name="verified-user" size={40} color="#3E4949" />
                    </View>
                    <Text style={{fontSize: 32, fontWeight: "500", marginTop: 20}}>Verify Your Account</Text>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.TextStyle}>
                        We sent a 6-digit code to{'\n'}
                        <Text style={{fontWeight: "500", color: "#1F2937"}}>{email}</Text>
                    </Text>
                </View>

                <View style={styles.card}>

                    <View style={styles.codeContainer}>
                        {code.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref: TextInput | null) => {inputRefs.current[index] = ref}}
                                style={[
                                    styles.codeInput,
                                    { borderColor: digit ? '#097F8C' : '#BDC9C8' }
                                ]}
                                maxLength={1}
                                keyboardType="number-pad"
                                value={digit}
                                onChangeText={(text) => handleChange(text, index)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                //
                                textAlign="center"
                                autoFocus={index === 0}
                            />
                        ))}
                    </View>


                    <View style={styles.resendContainer}>
                        <Text style={{fontSize: 13, color: '#6B7280'}}>
                            Didn{"'"}t receive the code?{' '}
                        </Text>
                        <TouchableOpacity
                            onPress={handleResend}
                            disabled={!canResend || resending}
                        >
                            {resending
                                ? <ActivityIndicator color="#097F8C" size="small" />
                                : <Text style={[
                                    styles.resendText,
                                    { color: canResend ? '#097F8C' : '#9CA3AF' }
                                ]}>
                                    {canResend ? 'Resend Code' : `Resend in ${formatTime(timer)}`}
                                </Text>
                            }
                        </TouchableOpacity>
                    </View>


                    <TouchableOpacity
                        style={[
                            styles.SignInButton,
                            { opacity: codeComplete && !verifying ? 1 : 0.6 }
                        ]}
                        onPress={handleVerify}
                        disabled={!codeComplete || verifying}
                    >
                    {verifying
                        ? <ActivityIndicator color="white" />
                        : <Text style={{color:"white", fontSize: 18, fontWeight: "500"}}>
                            Verify Account
                        </Text>
                    }
                    </TouchableOpacity>


            <View style={[styles.resendContainer,{marginBottom: 0, marginTop:30}]}>

                        <Text style={{fontSize: 13, color: '#6B7280'}}>
                            Wrong email?{' '}
                        </Text>
                            <TouchableOpacity

                                onPress={() => router.back()}
                            >
                                    <Text style={{color: '#097F8C', fontWeight: "500"}}>
                                        Change
                                    </Text>
                            </TouchableOpacity>
            </View>


                </View>


                <View style={{alignItems:"center", marginTop: 30}}>
                    <View style={{flexDirection:"row", alignItems: "center", justifyContent: "center", gap: 80}}>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="security" size={24} color="#3E4949" />
                        </View>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="timer" size={24} color="#3E4949" />
                        </View>
                    </View>
                    <View style={{alignItems: "center", flexDirection:"row", gap: 30}}>
                        <Text style={{fontSize: 11,}}>End-to-End Encrypted</Text>
                        <Text style={{fontSize: 11,}}>Code Expires in 10min</Text>
                    </View>
                </View>


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    MainPage: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    titleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 30,
        paddingBottom: 20,
    },
    verificationIcon: {
        width: 80,
        height: 80,
        borderRadius: 9999,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    TextStyle:{
        fontSize: 16,
        fontWeight: "400",
        textAlign:"center",
        lineHeight: 24,
        color: "#3E4949"
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


    },
    codeInput: {
        width:"15%",
        height: 60,
        borderRadius: 14,
        borderWidth: 1,
        backgroundColor: '#F9FAFB',
        fontSize: 24,
        fontWeight: '500',
        color: 'black',

    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        marginTop: 20,
        marginBottom: 24,
    },
    resendText: {
        fontSize: 14,
        fontWeight: "500",
    },
    SignInButton: {
        width: '100%',
        flexDirection:"row",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: "#097F8C",
        marginTop: 8,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    }
});