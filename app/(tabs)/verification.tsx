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
} from 'react-native';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ScrollView = Animated.ScrollView;

export default function VerificationScreen({ navigation, route }: any) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const { email = 'user@example.com' } = route?.params || {};


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

    const handleVerify = () => {
        const verificationCode = code.join('');
        if (verificationCode.length === 6) {

            console.log('Verifying code:', verificationCode);

        }
    };

    const handleResend = () => {
        if (canResend) {
            setTimer(60);
            setCanResend(false);
            setCode(['', '', '', '', '', '']);

            console.log('Resending code to:', email);
            inputRefs.current[0]?.focus();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.MainPage}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">


                <View style={styles.titleContainer}>
                    <View style={styles.verificationIcon}>
                        <MaterialIcons name="verified-user" size={40} color="#614D9B" />
                    </View>
                    <Text style={{fontSize: 32, fontWeight: "bold", marginTop: 20}}>Verify Your Account</Text>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.TextStyle}>
                        We sent a 6-digit code to{'\n'}
                        <Text style={{fontWeight: "600", color: "#1F2937"}}>{email}</Text>
                    </Text>
                </View>

                <View style={styles.card}>

                    <View style={styles.codeContainer}>
                        {code.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={ref => inputRefs.current[index] = ref}
                                style={[
                                    styles.codeInput,
                                    { borderColor: digit ? '#614D9B' : '#E5E7EB' }
                                ]}
                                maxLength={1}
                                keyboardType="number-pad"
                                value={digit}
                                onChangeText={(text) => handleChange(text, index)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                onPaste={({ nativeEvent }: any) => handlePaste(nativeEvent.text)}
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
                            disabled={!canResend}
                        >
                            <Text style={[
                                styles.resendText,
                                { color: canResend ? '#614D9B' : '#9CA3AF' }
                            ]}>
                                {canResend ? 'Resend Code' : `Resend in ${formatTime(timer)}`}
                            </Text>
                        </TouchableOpacity>
                    </View>


                    <TouchableOpacity
                        style={[
                            styles.SignInButton,
                            { opacity: code.join('').length === 6 ? 1 : 0.6 }
                        ]}
                        onPress={handleVerify}
                        disabled={code.join('').length !== 6}
                    >
                        <Text style={{color:"white", fontSize: 18, fontWeight: "600"}}>
                            Verify Account
                        </Text>
                    </TouchableOpacity>


                    <TouchableOpacity
                        style={{alignItems: "center", marginTop: 16}}
                        onPress={() => navigation?.goBack()}
                    >
                        <Text style={{fontSize: 13, color: '#6B7280'}}>
                            Wrong email?{' '}
                            <Text style={{color: '#614D9B', fontWeight: "600"}}>
                                Change
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>


                <View style={{alignItems:"center", marginTop: 30}}>
                    <View style={{flexDirection:"row", alignItems: "center", justifyContent: "center", gap: 80}}>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="security" size={24} color="#614D9B" />
                        </View>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="timer" size={24} color="#614D9B" />
                        </View>
                    </View>
                    <View style={{alignItems: "center", flexDirection:"row", gap: 35, marginTop: 8}}>
                        <Text style={{fontSize: 10, color: '#6B7280'}}>End-to-End Encrypted</Text>
                        <Text style={{fontSize: 10, color: '#6B7280'}}>Code Expires in 10min</Text>
                    </View>
                </View>

            </ScrollView>
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
        paddingTop: 40,
        paddingBottom: 20,
    },
    verificationIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
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
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        width: '90%',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        alignSelf: 'center',
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginVertical: 10,
    },
    codeInput: {
        width: 50,
        height: 60,
        borderRadius: 16,
        borderWidth: 2,
        backgroundColor: '#F9FAFB',
        fontSize: 24,
        fontWeight: '600',
        color: '#1F2937',
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
        fontWeight: "600",
    },
    SignInButton: {
        width: '100%',
        flexDirection:"row",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 9999,
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
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    }
});