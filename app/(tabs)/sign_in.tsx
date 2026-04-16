
import React from 'react';
import { useState } from 'react';



import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
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
                        placeholderTextColor={"#9CA3AF"}
                        value={username}
                        onChangeText={setUsername}>
                    </TextInput>

                    <Text style={styles.SignInText}> EMAIL ADRESS</Text>

                    <TextInput
                        style={styles.SignInTextField}
                        placeholder={"Joe@example.com"}
                        placeholderTextColor={"#9CA3AF"}
                        value={email}
                        onChangeText={setEmail}>
                    </TextInput>

                    <Text style={styles.SignInText}>PASSWORD</Text>

                    <TextInput
                        style={styles.SignInTextField}
                        placeholder={"********"}
                        placeholderTextColor={"#9CA3AF"}
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
                    <Text style={[styles.MediumText,{color:"white", fontWeight: "600"}]}> Sign Up</Text>
                </TouchableOpacity>


                <View style={[styles.centerContainer,{ gap: 10, marginVertical: 20}]}>
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

            <View style={[styles.centerContainer,{ paddingTop:5, marginTop: 30,}]}>
                <Text style={styles.MediumText}> Already have an account?</Text>
                <Text style={[styles.MediumText,{color:"#097F8C", fontWeight:"600"}]}> Log In</Text>
            </View>

                <View style={{alignItems:"center"}}>
                        <View style={[styles.centerContainer,{ paddingTop:20, gap:50}]}>
                            <View style={styles.iconCircle}>
                                <MaterialIcons name="shield" size={25} color="black" />

                            </View>
                            <View style={styles.iconCircle}>
                                <MaterialIcons name="groups" size={35} color="black" />
                            </View>
                        </View>

                        <View style={[styles.centerContainer,{ gap:30 }]}>
                                <Text style={styles.SmallText}>Secure & Private</Text>
                                <Text style={styles.SmallText}>Community Trust</Text>
                        </View>
                </View>


        </SafeAreaView>


    );
}



const styles = StyleSheet.create({
    titleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingTop: 45,
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
        fontSize: 32,
        fontWeight: "600",
        letterSpacing: -0.5,
    },
    card: {

        width: '100%',
        borderRadius: 14,
        padding: 20,
        paddingTop:0,
        alignSelf: 'center',

    },
    SignInText:{
        fontSize: 12,
        fontWeight: "600",
        paddingTop: 15,
        paddingBottom: 10,
    },
    textContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
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
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 14,
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
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius:  14,
        backgroundColor: "#097F8C",
        marginTop: 20,

    },
    SignInTextField:{
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 14,
        backgroundColor: "#ffff",
        borderWidth: 0.5,
        borderColor: "#BDC9C8",
        fontSize: 14,

    },

    Checkbox:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 24,
        marginBottom: 5,
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
        backgroundColor: '#E5E7EB',
    },

    centerContainer:{
        flexDirection:"row",
        alignItems: "center",
        justifyContent: "center",
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 9999,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    }
});
