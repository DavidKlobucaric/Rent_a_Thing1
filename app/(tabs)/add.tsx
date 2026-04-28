import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Image, Modal, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { uploadImages, createThing, createListing } from '@/src/api/itemsApi';

export default function AddScreen() {
    const categories = ['Tools', 'Camping', 'Tech', 'Games', 'Sports', 'Clothes'];

    const [title, setTitle]                     = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tools');
    const [description, setDescription]         = useState('');
    const [dailyRate, setDailyRate]             = useState('');
    const [securityDeposit, setSecurityDeposit] = useState('');
    const [location, setLocation]               = useState('');
    const [images, setImages]                   = useState<string[]>([]);
    const [modalVisible, setModalVisible]       = useState(false);
    const [publishing, setPublishing]           = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handlePublish = async () => {
        if (!title.trim()) {
            Alert.alert('Missing info', 'Please enter an item title.');
            return;
        }
        if (!dailyRate || isNaN(Number(dailyRate))) {
            Alert.alert('Missing info', 'Please enter a valid daily rate.');
            return;
        }
        if (!location.trim()) {
            Alert.alert('Missing info', 'Please enter a location.');
            return;
        }

        setPublishing(true);
        try {
            let imageUrlsCsv = '';
            if (images.length > 0) {
                const uploadResult = await uploadImages(images);
                if (!uploadResult.success) {
                    Alert.alert('Upload failed', uploadResult.message);
                    return;
                }
                imageUrlsCsv = uploadResult.urls.join(',');
            }

            const thingPayload = {
                name: title.trim(),
                category: selectedCategory.toLowerCase(),
                description: description.trim(),
                imageUrls: imageUrlsCsv,
            };
            const thingResult = await createThing(thingPayload);

            if (!thingResult.success) {
                Alert.alert('Error', thingResult.message);
                return;
            }

            const listingPayload = {
                thingId: thingResult.data.thingId,
                price: Number(dailyRate),
                securityDeposit: securityDeposit ? Number(securityDeposit) : 0,
                location: location.trim(),
            };
            const listingResult = await createListing(listingPayload);

            if (!listingResult.success) {
                Alert.alert('Error', listingResult.message);
                return;
            }

            Alert.alert('Uspješno! 🎉', 'Vaš predmet je objavljen i vidljiv zajednici.');
            setTitle(''); setDescription(''); setDailyRate('');
            setSecurityDeposit(''); setLocation(''); setImages([]);
            setSelectedCategory('Tools');

        } catch (e: any) {
            Alert.alert('Error', 'Something went wrong: ' + e?.message);
        } finally {
            setPublishing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.titleText}>List your thing</Text>
                    <Text style={styles.bodyText}>Share your items with the community and start earning.</Text>
                </View>

                {/* BASIC INFO */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="info" size={24} color="#097F8C" />
                        <Text style={styles.sectionTitle}>Basic info</Text>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.labelText}>ITEM TITLE</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Bosch Drill"
                            placeholderTextColor="#9CA3AF"
                            value={title}
                            onChangeText={setTitle}
                        />
                        <View style={styles.hint}>
                            <MaterialIcons name="lightbulb-outline" size={14} color="#097F8C" />
                            <Text style={styles.hintText}>Titles with brands often get 20% more clicks.</Text>
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.labelText}>CATEGORY</Text>
                        <TouchableOpacity style={styles.dropdownButton} onPress={() => setModalVisible(true)}>
                            <Text style={styles.dropdownText}>{selectedCategory}</Text>
                            <MaterialIcons name="keyboard-arrow-down" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <Modal visible={modalVisible} transparent animationType="fade">
                        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                            <View style={styles.modalContent}>
                                {categories.map((cat, index) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.modalItem, index === categories.length - 1 && styles.modalItemLast]}
                                        onPress={() => { setSelectedCategory(cat); setModalVisible(false); }}
                                    >
                                        <Text style={styles.modalItemText}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.labelText}>DESCRIPTION</Text>
                        <TextInput
                            style={styles.descriptionInput}
                            multiline
                            numberOfLines={4}
                            placeholder="Describe your item..."
                            placeholderTextColor="#9CA3AF"
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>
                </View>

                {/* PHOTOS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="photo-camera" size={24} color="#097F8C" />
                        <Text style={styles.sectionTitle}>Photos</Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        style={styles.imageScroll}
                        contentContainerStyle={styles.imageScrollContent}
                    >
                        <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                            <MaterialIcons name="add-a-photo" size={42} color="#097F8C" />
                            <Text style={styles.addImageText}>Add Photo</Text>
                        </TouchableOpacity>

                        {images.length === 0 && (
                            <View style={styles.placeholderImage}>
                                <MaterialIcons name="image" size={32} color="#9CA3AF" />
                                <Text style={styles.placeholderText}>Preview</Text>
                            </View>
                        )}
                        {images.map((uri, i) => (
                            <View key={i} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.imageThumb} />
                                <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(i)}>
                                    <MaterialIcons name="close" size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}

                    </ScrollView>

                    <View style={styles.hint}>
                        <MaterialIcons name="star-outline" size={14} color="#097F8C" />
                        <Text style={styles.hintText}>High-quality daylight photos perform best.</Text>
                    </View>
                </View>

                {/* PRICING */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="monetization-on" size={24} color="#097F8C" />
                        <Text style={styles.sectionTitle}>Pricing</Text>
                    </View>

                    <View style={styles.pricingRow}>
                        <View style={styles.pricingField}>
                            <Text style={styles.labelText}>DAILY RATE</Text>
                            <View style={styles.priceInputContainer}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="number-pad"
                                    value={dailyRate}
                                    onChangeText={setDailyRate}
                                />
                            </View>
                        </View>
                        <View style={styles.pricingField}>
                            <Text style={styles.labelText}>SECURITY DEPOSIT</Text>
                            <View style={styles.priceInputContainer}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="number-pad"
                                    value={securityDeposit}
                                    onChangeText={setSecurityDeposit}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.hint}>
                        <MaterialIcons name="lightbulb-outline" size={14} color="#097F8C" />
                        <Text style={styles.hintText}>Deposit is returned after the item is safely returned.</Text>
                    </View>
                </View>

                {/* LOCATION */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="location-pin" size={24} color="#097F8C" />
                        <Text style={styles.sectionTitle}>Location</Text>
                    </View>

                    <View style={styles.fieldGroup}>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Zagreb"
                            placeholderTextColor="#9CA3AF"
                            value={location}
                            onChangeText={setLocation}
                        />
                        <View style={styles.hint}>
                            <MaterialIcons name="lock-outline" size={14} color="#097F8C" />
                            <Text style={styles.hintText}>Your exact address is only shared after a booking is confirmed.</Text>
                        </View>
                    </View>
                </View>

                {/* ACTIONS */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.publishButton, publishing && { opacity: 0.7 }]}
                        onPress={handlePublish}
                        disabled={publishing}
                    >
                        {publishing
                            ? <ActivityIndicator color="white" />
                            : <>
                                <Text style={styles.publishButtonText}>Publish Listing</Text>
                                <MaterialIcons name="rocket-launch" size={15} color="white" />
                            </>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.publishButton, styles.draftButton]}>
                        <Text style={[styles.publishButtonText, { color: '#097F8C' }]}>Save as draft</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 32,
    },


    header: {
        paddingTop: 8,
        paddingBottom: 8,
        alignItems: 'center',
    },
    titleText: {
        fontSize: 32,
        fontWeight: '500',
        letterSpacing: -0.5,
        textAlign: 'center',
        color: '#1F2937',
    },
    bodyText: {
        fontSize: 15,
        fontWeight: '400',
        paddingTop: 6,
        color: '#3E4949',
        textAlign: 'center',
        lineHeight: 22,
    },


    section: {
        paddingTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },


    fieldGroup: {
        paddingTop: 4,
        paddingBottom: 8,
    },
    labelText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        paddingBottom: 8,
        letterSpacing: 0.3,
    },


    input: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
        fontSize: 14,
        color: '#1F2937',
    },
    descriptionInput: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
        fontSize: 14,
        color: '#1F2937',
        height: 120,
        textAlignVertical: 'top',
    },
    dropdownButton: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 14,
        color: '#1F2937',
    },


    hint: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
        gap: 6,
    },
    hintText: {
        fontStyle: 'italic',
        fontSize: 13,
        color: '#6B7280',
        flex: 1,
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
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalItemLast: {
        borderBottomWidth: 0,
    },
    modalItemText: {
        fontSize: 14,
        color: '#1F2937',
    },


    imageScroll: {
        marginTop: 4,
    },
    imageScrollContent: {
        gap: 12,
        paddingRight: 20,
    },

    placeholderImage: {
        width: 150,
        height: 150,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '400',
        marginTop: 6,
        textAlign: 'center',
    },

    imageWrapper: {
        position: 'relative',
    },
    imageThumb: {
        width: 150,
        height: 150,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
    },
    removeButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 9999,
        padding: 4,
    },
    addImageButton: {
        width: 150,
        height: 150,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#097F8C',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0FAFA',
        gap:4

    },
    addImageText: {
        color: '#097F8C',
        fontSize: 13,
        fontWeight: '500',

        textAlign: 'center',
    },


    pricingRow: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 4,
    },
    pricingField: {
        flex: 1,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
        borderRadius: 14,
        paddingHorizontal: 16,
    },
    currencySymbol: {
        fontSize: 14,
        color: '#6B7280',
        marginRight: 4,
    },
    priceInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#1F2937',
    },


    actions: {
        paddingTop: 24,
        gap: 12,
    },
    publishButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        backgroundColor: '#097F8C',
        borderWidth: 0.5,
        borderColor: '#097F8C',
    },
    draftButton: {
        backgroundColor: '#FFFFFF',
        borderColor: '#BDC9C8',
    },
    publishButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },

});