import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState } from "react";
import * as ImagePicker from 'expo-image-picker';

export default function AddScreen() {

    const categories = ['Tools', 'Camping', 'Tech', 'Games', 'Sports', 'Clothes'];
    const [selectedCategory, setSelectedCategory] = useState('Tools');
    const [modalVisible, setModalVisible] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            const uris = result.assets.map(a => a.uri);
            setImages(prev => [...prev, ...uris]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}

            >

                <View style={{ paddingTop: 10 }}>
                    <Text style={styles.titleText}>List your thing</Text>
                    <Text style={styles.bodyText}>Share your items with the community and start earning.</Text>
                </View>

                {/* BASIC INFO */}
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="info" size={24} color="#097F8C" />
                    <Text style={styles.sectionTitle}>Basic info</Text>
                </View>


                <View style={{ paddingTop: 20 }}>
                    <Text style={styles.smallText}>ITEM TITLE</Text>
                    <TextInput style={styles.input} placeholder="e.g. Bosch Drill" placeholderTextColor="#9CA3AF" />
                    <View style={styles.hint}>
                        <MaterialIcons name="lightbulb-outline" size={14} color="#097F8C" />
                        <Text style={styles.hintText}>Titles with brands often get 20% more clicks.</Text>
                    </View>
                </View>


                <View style={{ paddingTop: 20 }}>
                    <Text style={styles.smallText}>CATEGORY</Text>
                    <TouchableOpacity style={styles.dropdownButton} onPress={() => setModalVisible(true)}>
                        <Text style={styles.dropdownText}>{selectedCategory}</Text>
                        <MaterialIcons name="keyboard-arrow-down" size={24} color="#6B7280" />
                    </TouchableOpacity>
                    <Modal visible={modalVisible} transparent animationType="fade">
                        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                            <View style={styles.modalContent}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={styles.modalItem}
                                        onPress={() => {
                                            setSelectedCategory(cat);
                                            setModalVisible(false);
                                        }}
                                    >
                                        <Text style={styles.modalItemText}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </View>


                <View style={{ paddingTop: 20 }}>
                    <Text style={styles.smallText}>DESCRIPTION</Text>
                    <TextInput
                        style={styles.descriptionInput}
                        multiline
                        numberOfLines={4}
                        placeholder="Describe your item..."
                        placeholderTextColor="#9CA3AF"
                        textAlignVertical="top"
                    />
                </View>

                {/* PHOTOS */}
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="photo-camera" size={24} color="#097F8C" />
                    <Text style={styles.sectionTitle}>Photos</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    style={{ marginTop: 10, marginHorizontal: -20 }}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                >
                    {images.map((uri, i) => (
                        <View key={i} style={{ position: 'relative' }}>
                            <Image source={{ uri }} style={styles.imageThumb} />
                            <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(i)}>
                                <MaterialIcons name="close" size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                        <MaterialIcons name="add-a-photo" size={28} color="#097F8C" />
                        <Text style={styles.addImageText}>Add Photo</Text>
                    </TouchableOpacity>
                </ScrollView>

                <View style={styles.hint}>
                    <Text style={styles.hintText}>High-quality daylight photos perform best.</Text>
                </View>


                {/* PRICING */}
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="monetization-on" size={24} color="#097F8C" />
                    <Text style={styles.sectionTitle}>Pricing</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 30, paddingTop: 20, }}>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.smallText}>Daily Rate</Text>
                        <View style={styles.priceInputContainer}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.priceInput}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.smallText}>Security Deposit</Text>
                        <View style={styles.priceInputContainer}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.priceInput}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>

                </View>

                <View style={styles.hint}>
                    <MaterialIcons name="lightbulb-outline" size={14} color="#097F8C" />
                    <Text style={styles.hintText}>Deposit is returned after the item is safely returned.</Text>
                </View>


                {/* LOCATION */}
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="location-pin" size={24} color="#097F8C" />
                    <Text style={styles.sectionTitle}>Location</Text>
                </View>

                <View style={{ paddingTop: 10 }}>
                    <TextInput style={styles.input} placeholder="e.g. Zagreb" placeholderTextColor="#9CA3AF" />
                    <View style={styles.hint}>
                        <MaterialIcons name="lock" size={14} color="#097F8C" />
                        <Text style={styles.hintText}>Your exact address is only shared after a booking is confirmed. </Text>
                    </View>
                </View>


                <TouchableOpacity style={styles.buttonPublish}>
                    <Text style={{color:"white", fontWeight:"500",fontSize:15}}> Publish Listing</Text>
                    <MaterialIcons name="rocket-launch" size={15} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.buttonPublish,{backgroundColor:"white",borderColor: '#BDC9C8',marginTop:20}]}>
                    <Text style={{color:"#097F8C", fontWeight:"500",fontSize:15}}> Save as draft</Text>

                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    titleText: {
        fontSize: 26,
        fontWeight: '600',
    },
    bodyText: {
        fontSize: 16,
        paddingTop: 6,
        color: '#6B7280',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 20,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    smallText: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    hint: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8,
        gap: 5,
    },
    hintText: {
        fontStyle: 'italic',
        fontSize: 13,
        color: '#6B7280',
    },
    input: {
        width: '100%',
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
        fontSize: 16,
        color: 'black',
    },
    descriptionInput: {
        width: '100%',
        marginTop: 8,
        paddingHorizontal: 16,
        paddingTop: 14,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
        fontSize: 16,
        color: 'black',
        height: 120,
    },
    dropdownButton: {
        width: '100%',
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
        color: '#1F2937',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 14,
        overflow: 'hidden',
    },
    modalItem: {
        padding: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
    },
    modalItemText: {
        fontSize: 16,
        color: '#1F2937',
    },
    imageThumb: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    removeButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 99,
        padding: 3,
    },
    addImageButton: {
        width: 100,
        height: 100,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#097F8C',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0FAFA',
    },
    addImageText: {
        color: '#097F8C',
        fontSize: 12,
        marginTop: 4,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: '#ffffff',
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
        borderRadius: 14,
        paddingHorizontal: 14,
    },
    currencySymbol: {
        fontSize: 16,
        color: '#6B7280',
        marginRight: 4,
    },
    priceInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: 'black',
    },

    buttonPublish:{
        width: '100%',
        flexDirection:"row",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
        paddingVertical: 13,
        paddingHorizontal: 20,
        borderRadius:  14,
        backgroundColor: "#097F8C",
        marginTop: 30,
        borderWidth: 0.5,
        borderColor: '#097F8C',

    }
});