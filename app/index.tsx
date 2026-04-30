import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { BackHandler } from 'react-native';
import { useCallback } from 'react';

export default function Index() {
    const router = useRouter();


    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener('hardwareBackPress', () => {
                return true;
            });
            return () => sub.remove();
        }, [])
    );


    return (

        <LinearGradient
            colors={['#097F8C', '#00646F']}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={styles.container}>

                {/* LOGO + TEKST — gornji dio */}
                <View style={styles.top}>
                    <Image
                        source={require('@/assets/images/Logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.titleText}>Rent-a-Thing</Text>
                    <Text style={styles.subtitle}>Rent anything you need</Text>
                </View>

                {/* GUMBI — donji dio */}
                <View style={styles.bottom}>
                    <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={() => router.push('/sign_in')}
                    >
                        <Text style={styles.btnPrimaryText}>Sign In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={() => router.push('/Auth/log_in')}
                    >
                        <Text style={styles.btnSecondaryText}>Log In</Text>
                    </TouchableOpacity>

                    <Text style={styles.footer}>TRUSTED BY 5,000+ NEIGHBORS</Text>
                </View>

            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingBottom: 32,
        justifyContent: 'space-between', // logo gore, gumbi dolje
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
        color: '#ffffff',
        letterSpacing: 0.5,
        marginTop: 4,
    },

    subtitle: {
        fontSize: 17,
        color: 'rgba(255,255,255,0.70)',
        textAlign: 'center',
        lineHeight: 24,
        marginTop: 12,
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
        backgroundColor: '#ffffff',
    },

    btnPrimaryText: {
        color: '#097F8C',
        fontWeight: '700',
        fontSize: 16,
    },

    btnSecondary: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.45)',
    },

    btnSecondaryText: {
        color: '#ffffff',
        fontWeight: '500',
        fontSize: 16,
    },

    footer: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 11,
        letterSpacing: 1.8,
        marginTop: 8,
        textAlign: 'center',
    },
});