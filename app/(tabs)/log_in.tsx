
import React from 'react';
import { useState } from 'react';


import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    SafeAreaView,
    Animated,
} from 'react-native';

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ScrollView = Animated.ScrollView;

export default function SignInScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    return (
        <SafeAreaView style={styles.MainPage}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

                <View style={styles.titleContainer}>
                    <Text style={{fontSize: 35, fontWeight: "bold"}}>Welcome Back!</Text>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.TextStyle}>
                        Log in to your account and continue sharing with your community.
                    </Text>
                </View>

                <View style={styles.card}>


                    <View>
                        <Text style={[styles.SignInText,{paddingTop:10}]}>EMAIL ADDRESS</Text>
                        <TextInput
                            style={styles.SignInTextField}
                            placeholder={"Joe@example.com"}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Text style={styles.SignInText}>PASSWORD</Text>
                        <TextInput
                            style={styles.SignInTextField}
                            placeholder={"********"}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10}}
                            onPress={() => setRememberMe(!rememberMe)}
                        >
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                <Text style={{fontSize: 18}}>{rememberMe ? '✅' : '☐'}</Text>
                                <Text style={{fontSize: 13, color: '#6B7280'}}>Remember me</Text>
                            </View>
                            <Text style={{fontSize: 13, color: '#614D9B', fontWeight: '600'}}>
                                Forgot password?
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.SignInButton}
                    >
                        <Text style={{color:"white", fontSize: 18, fontWeight: "600"}}>Log In</Text>
                    </TouchableOpacity>

                    <View style={{flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10}}>
                        <View style={styles.line}/>
                        <Text style={{fontSize: 11}}>OR WITH GOOGLE</Text>
                        <View style={styles.line}/>
                    </View>

                    <View style={[styles.textContainers, { paddingVertical: 0 }]}>
                        <TouchableOpacity style={styles.button}>
                            <Image
                                source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}}
                                style={styles.googleIcon}
                            />
                            <Text style={{fontSize: 14, fontWeight: "500"}}>Sign in with Google</Text>
                        </TouchableOpacity>

                    </View>

                </View>




                <View style={{flexDirection:"row", alignItems:"center", justifyContent: "center", paddingTop:25}}>
                    <Text style={{fontSize:15}}>Don't have an account?</Text>
                    <Text style={{color:"#614D9B", fontSize: 15, fontWeight:"bold"}}> Sign Up</Text>
                </View>


                <View style={{alignItems:"center", paddingTop: 30}}>
                    <View style={{flexDirection:"row", alignItems: "center", justifyContent: "center", gap: 50}}>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="shield" size={25} color="#614D9B" />
                        </View>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="groups" size={35} color="#614D9B" />
                        </View>
                    </View>
                    <View style={{alignItems: "center", justifyContent: "center", flexDirection:"row", gap:30}}>
                        <Text style={{fontSize:10}}>Secure & Private</Text>
                        <Text style={{fontSize:10}}>Community Trust</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingTop: 50,
        paddingBottom: 30,
    },
    TextStyle:{
        fontSize: 18,
        fontWeight: "normal",
        textAlign:"center",
        lineHeight: 25,
        color: "#3E4949"
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
    SignInText:{
        fontSize: 12,
        fontWeight: "bold",
        paddingTop: 20,
        paddingBottom: 10,
    },
    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    textContainers:{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
    },
    MainPage: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    button:{
        width: '100%',
        flexDirection:"row",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 9999,
        backgroundColor: "white",
        borderWidth: 0.5,
        borderColor: "#E5E7EB",
    },
    SignInButton: {
        width: '100%',
        flexDirection:"row",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 9999,
        backgroundColor: "#097F8C",
        marginTop: 20,
    },
    SignInTextField:{
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 9999,
        backgroundColor: "#E7E8E9",
        fontSize: 14,
    },
    googleIcon: {
        width: 22,
        height: 22,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 44,
        marginBottom: 40,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    }
});