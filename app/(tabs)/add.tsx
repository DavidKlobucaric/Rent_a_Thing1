
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,


} from 'react-native';

import{
    SafeAreaView
}from 'react-native-safe-area-context';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import {Input} from "postcss";

export default function HomeScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View>
                    <Text style={styles.titleText}>List your thing</Text>
                    <Text style={styles.bodyText}>Share your items with the community and start
                        earning.</Text>
            </View>

            <View style={styles.category}>
                <MaterialIcons name="info-outline" size={30} color="#097F8C" />
                <Text style={[styles.titleText, {fontSize:20} ]}>Basic info</Text>
            </View>

            <View style={{paddingTop:10}}>
                <Text style={styles.smallText }>Item Title</Text>
                <TextInput style={styles.categoryInput}></TextInput>

                <View style={[styles.category,{paddingTop:10, gap:5,}]}>
                    <MaterialIcons name="lightbulb-outline" size={16} color="#097F8C" />
                    <Text style={{fontStyle:"italic"}}>Titles with brands often get 20% more clicks.</Text>
                </View>
            </View>

            <View style={{paddingTop:30}}>
                <Text style={styles.smallText }>Category</Text>

            </View>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({


    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',

    },

    titleContainer: {
        alignItems: 'center',
        fontSize:16,
    },

    titleText:{
        fontSize:26,
        marginLeft:10,
        fontWeight:500,
    },

    bodyText:{
        fontSize:18,
        paddingTop:10,
        paddingHorizontal:10,
        fontWeight:400

    },

    smallText:{
        fontSize:16,
        paddingTop:5,
        paddingHorizontal:10,
        fontWeight:400
    },

    category:{
        flexDirection:'row',
        alignItems: 'center',
        paddingTop:30,
        paddingHorizontal:10,
    },

    categoryInput:{
        width: '96%',
        marginTop:5,
        paddingHorizontal: 20,
        borderRadius: 14,
        backgroundColor: "#ffff",
        borderWidth: 0.5,
        borderColor: "#BDC9C8",
        fontSize: 16,
        alignSelf: 'center',

    },
});
