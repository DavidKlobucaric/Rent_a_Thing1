
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
                    <Text style={styles.TextTitle}>Welcome Back!</Text>
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
                                secureTextEntry={true}/>

                            <View style={[styles.centerContainer,{justifyContent:"flex-start"}]}>

                                <TouchableOpacity onPress={() => setRememberMe(!rememberMe)}>
                                    <View style={[styles.centerContainer,{paddingTop:0}]}>
                                        <Text style={styles.BigText}>{rememberMe ? '✅' : '☐'}</Text>
                                        <Text style={[styles.SmallText,{ color: '#6B7280'}]}>Remember me</Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={{marginLeft:"auto"}}>
                                    <Text style={[styles.SmallText,{ color: '#614D9B', fontWeight: '600'}]}>
                                        Forgot password?
                                    </Text>
                                </View>



                            </View>

                         </View>

                    <TouchableOpacity
                        style={styles.SignInButton}
                    >
                        <Text style={[styles.BigText,{color:"white", fontWeight: "600"}]}>Log In</Text>
                    </TouchableOpacity>

                    <View style={[styles.centerContainer,{paddingTop:0,}]}>
                        <View style={styles.line}/>
                        <Text style={{fontSize:10}}>OR WITH GOOGLE</Text>
                        <View style={styles.line}/>
                    </View>

                    <View style={[styles.textContainers, { paddingVertical: 0 }]}>
                        <TouchableOpacity style={styles.button}>
                            <Image
                                source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}}
                                style={styles.googleIcon}
                            />
                            <Text style={[styles.MediumText,{ fontWeight: "500"}]}>Sign in with Google</Text>
                        </TouchableOpacity>

                    </View>

                </View>




                <View style={[styles.centerContainer,{paddingTop:25, gap:0}]}>
                    <Text style={styles.MediumText}> Don{"'"}t have an account?</Text>
                    <Text style={[styles.MediumText,{color:"#614D9B",fontWeight: "600"}]}> Sign Up</Text>
                </View>


                <View style={{alignItems:"center", paddingTop: 30}}>
                    <View style={[styles.centerContainer,{paddingTop:0, gap: 50}]}>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="shield" size={25} color="#614D9B" />
                        </View>
                        <View style={styles.iconCircle}>
                            <MaterialIcons name="groups" size={35} color="#614D9B" />
                        </View>
                    </View>
                    <View style={[styles.centerContainer, {gap:30,paddingTop:0}]}>
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
        paddingTop: 55,
        paddingBottom: 10,
    },
    TextStyle:{
        fontSize: 18,
        fontWeight: "normal",
        textAlign:"center",
        lineHeight: 25,
        color: "#3E4949"
    },
    TextTitle:{
        fontWeight: "bold",
        fontSize: 35,
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

    BigText:{
        fontSize:18,
    },

    MediumText:{
        fontSize:15,
    },
    SmallText:{
        fontSize:13,
    },

    centerContainer:{
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection:"row",
        paddingTop:20,
        gap:10,
    },
    button:{
        width: '100%',
        flexDirection:"row",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
        padding:10,
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
        padding:10,
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
        marginVertical: 30,
        marginBottom: 30,
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