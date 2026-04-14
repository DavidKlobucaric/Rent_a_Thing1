
import React from 'react';
import { useState } from 'react';



import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image, ScrollView,
} from 'react-native';

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import {registerUser} from "@/src/api/authApi";

export default function SignInScreen({navigation}:any) {
    const [agreed, setAgreed] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignUp = async () => {
        if (!agreed) {
            alert("Please agree with the terms and conditions.");
            return;
        }
        console.log("Sending request...");

        const register = await registerUser(username, email, password);

        console.log("RESPONSE:", register);
        if (register.success) {
            alert("User registered successfully!");
            navigation.navigate("index");
        }
        else{
            alert(register.message);
        }
    }

    return (

        <SafeAreaView style={styles.MainPage }>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} >

            <View style={styles.titleContainer}>
                <Text style={styles.TitleText}>Create Account</Text>
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.TextStyle}>Join your neighbors and start sharing
                    everything you need.</Text>
            </View>

            <View style={styles.card}>

                <View>
                    <Text style={[styles.SignInText,{paddingTop:10}]}> USERNAME</Text>

                    <TextInput
                        style={styles.SignInTextField}
                        placeholder={"Joe Doe"}
                        value={username}
                        onChangeText={setUsername}>
                    </TextInput>

                    <Text style={styles.SignInText}> EMAIL ADRESS</Text>

                    <TextInput
                        style={styles.SignInTextField}
                        placeholder={"Joe@example.com"}
                        value={email}
                        onChangeText={setEmail}>
                    </TextInput>

                    <Text style={styles.SignInText}>PASSWORD</Text>

                    <TextInput
                        style={styles.SignInTextField}
                        placeholder={"********"}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={true}>

                    </TextInput>



                </View>

                <TouchableOpacity
                    style={styles.Checkbox}
                    onPress={() => setAgreed(!agreed)}
                >
                    <Text style={styles.BigText}>{agreed ? '✅' : '☐'}</Text>
                    <Text style={styles.TermsText}>
                        I agree to the Terms of Service and Privacy Policy.
                    </Text>
                </TouchableOpacity>



                <TouchableOpacity style={styles.SignInButton} onPress={handleSignUp}>
                    <Text style={[styles.BigText,{color:"white", fontWeight: "600"}]}> Sign Up</Text>
                </TouchableOpacity>


                <View style={[styles.centerContainer,{ gap: 10}]}>
                    <View style={styles.line}/>
                    <Text style={styles.SmallText}>OR WITH GOOGLE</Text>
                    <View style={styles.line}/>
                </View>

                <View style={[styles.textContainers, { paddingVertical: 0 }]}>
                    <TouchableOpacity style={styles.button}>
                        <Image
                            source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}}
                            style={styles.googleIcon}
                        />
                        <Text style={[styles.MediumText,{ fontWeight: "500"}]}>Sign up with Google</Text>
                    </TouchableOpacity>
                </View>



            </View>

            <View style={[styles.centerContainer,{ paddingTop:25}]}>
                <Text style={styles.MediumText}> Already have an account?</Text>
                <Text style={[styles.MediumText,{color:"#614D9B", fontWeight:"bold"}]}> Log In</Text>
            </View>

                <View style={{alignItems:"center"}}>
                        <View style={[styles.centerContainer,{ paddingTop:20, gap:50}]}>
                            <View style={styles.iconCircle}>
                                <MaterialIcons name="shield" size={25} color="#614D9B" />

                            </View>
                            <View style={styles.iconCircle}>
                                <MaterialIcons name="groups" size={35} color="#614D9B" />
                            </View>
                        </View>

                        <View style={[styles.centerContainer,{ gap:30 }]}>
                                <Text style={styles.SmallText}>Secure & Private</Text>
                                <Text style={styles.SmallText}>Community Trust</Text>
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
    TitleText:{
        fontSize: 35,
        fontWeight: "bold"
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

    Checkbox:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
        marginTop:20
    },

    BigText:{
        fontSize:18,
    },

    MediumText:{
        fontSize:15,
    },
    SmallText:{
        fontSize:10,
    },

    TermsText:{
        fontSize: 13,
        color: '#6B7280',
        flex: 1,
        lineHeight: 18,
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

    centerContainer:{
        flexDirection:"row",
        alignItems: "center",
        justifyContent: "center",
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
