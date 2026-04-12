
import React from 'react';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';


import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image, Animated,
} from 'react-native';

import MaterialIcons from "@expo/vector-icons/MaterialIcons";


import ScrollView = Animated.ScrollView;


export default function SignInScreen() {
    const [agreed, setAgreed] = useState(false);

    return (



        <SafeAreaView style={styles.MainPage}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

            <View style={styles.titleContainer}>
                <Text style={{fontSize: 35, fontWeight: "bold"}}>Create Account</Text>
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.TextStyle}>Join your neighbors and start sharing
                    everything you need.</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.textContainers}>
                    <TouchableOpacity style={styles.button}>
                        <Image
                            source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}}
                            style={styles.googleIcon}
                        />
                        <Text style={{fontSize: 14, fontWeight: "500"}}>Sign up with Google</Text>
                    </TouchableOpacity>
                </View>

                <View style={{flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10}}>
                    <View style={styles.line}/>
                    <Text style={{fontSize: 11}}>OR WITH EMAIL</Text>
                    <View style={styles.line}/>
                </View>


                <View>
                    <Text style={[styles.SignInText,{paddingTop:10}]}> USERNAME</Text>

                    <TextInput style={styles.SignInTextField} placeholder={"Joe Doe"}>

                    </TextInput>

                    <Text style={styles.SignInText}> EMAIL ADRESS</Text>

                    <TextInput style={styles.SignInTextField} placeholder={"Joe@example.com"}>

                    </TextInput>

                    <Text style={styles.SignInText}>PASSWORD</Text>

                    <TextInput style={styles.SignInTextField} placeholder={"********"}>

                    </TextInput>


                </View>

                <TouchableOpacity
                    style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, marginTop:20}}
                    onPress={() => setAgreed(!agreed)}
                >
                    <Text style={{fontSize: 18}}>{agreed ? '✅' : '☐'}</Text>
                    <Text style={{fontSize: 13, color: '#6B7280', flex: 1, lineHeight: 18}}>
                        I agree to the Terms of Service and Privacy Policy.
                    </Text>
                </TouchableOpacity>



                <TouchableOpacity style={styles.SignInButton}>
                    <Text style={{color:"white",fontSize:18}}> Sign Up</Text>
                </TouchableOpacity>
            </View>

            <View style={{flexDirection:"row", alignItems:"center", justifyContent: "center", paddingTop:25}}>
                <Text style={{fontSize:15}}> Already have an account?</Text>
                <Text style={{color:"#614D9B", fontSize: 15, fontWeight:"bold"}}> Log In</Text>
            </View>

                <View style={{alignItems:"center"}}>

                        <View style={{flexDirection:"row", alignItems: "center", justifyContent: "center", paddingTop:20, gap:50} }>

                            <View style={styles.iconCircle}>
                                <MaterialIcons name="shield" size={25} color="#614D9B" />

                            </View>
                            <View style={styles.iconCircle}>


                                <MaterialIcons name="groups" size={35} color="#614D9B" />
                            </View>


                        </View>

                            <View style={{alignItems: "center", justifyContent: "center", flexDirection:"row",gap:30 }}>
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
            paddingTop: 40,
            paddingBottom: 10,

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
            paddingHorizontal: 30,
            paddingBottom: 20,

        },

        textContainers:{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 20,
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
            paddingBottom: 10,
            paddingTop: 10,
            borderRadius: 9999,
            backgroundColor: "white",
            borderWidth: 0.5,
            borderColor: "black",

        },

        SignInButton: {
            width: '100%',
            flexDirection:"row",
            alignItems: "center",
            gap: 8,
            justifyContent: "center",
            paddingBottom: 10,
            paddingTop: 10,
            borderRadius: 9999,
            backgroundColor: "#097F8C",
            borderWidth: 0.5,
            borderColor: "black",

        },

        SignInTextField:{
            width: '100%',
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            justifyContent: "center",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 9999,
            backgroundColor: "#E7E8E9",
            borderWidth: 0.5,
            borderColor: "black",



        },

        googleIcon: {
            width: 22,
            height: 22,
        },

        line: {
            width: 100,
            height: 1,
            backgroundColor: '#e0e0e0',
            marginVertical: 24,

        },

        iconCircle: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#ffffff',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 5,


        }
    });
