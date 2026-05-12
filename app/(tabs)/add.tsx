import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Image, Modal, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState, useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { uploadImages, createThing, createListing } from '@/src/api/itemsApi';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function AddScreen() {
    const categories = ['Tools', 'Camping', 'Tech', 'Games', 'Sports', 'Clothes'];
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const [title, setTitle]                       = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tools');
    const [description, setDescription]           = useState('');
    const [dailyRate, setDailyRate]               = useState('');
    const [securityDeposit, setSecurityDeposit]   = useState('');
    const [location, setLocation]                 = useState('');
    const [images, setImages]                     = useState<string[]>([]);
    const [modalVisible, setModalVisible]         = useState(false);
    const [publishing, setPublishing]             = useState(false);

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

            Alert.alert('Success', 'Item added successfully.');
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
                <View style={styles.header}>
                    <Text style={styles.titleText}>List your thing</Text>
                    <Text style={styles.bodyText}>Share your items with the community and start earning.</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="info" size={22} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Basic info</Text>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.labelText}>Item Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Bosch Drill"
                            placeholderTextColor={colors.textMuted}
                            value={title}
                            onChangeText={setTitle}
                        />
                        <View style={styles.hint}>
                            <MaterialIcons name="lightbulb-outline" size={13} color={colors.primary} />
                            <Text style={styles.hintText}>Titles with brands often get 20% more clicks.</Text>
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.labelText}>Category</Text>
                        <TouchableOpacity style={styles.dropdownButton} onPress={() => setModalVisible(true)}>
                            <Text style={styles.dropdownText}>{selectedCategory}</Text>
                            <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <Modal visible={modalVisible} transparent animationType="fade">
                        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                            <View style={styles.modalContent}>
                                {categories.map((cat, index) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.modalItem,
                                            index === categories.length - 1 && styles.modalItemLast,
                                        ]}
                                        onPress={() => { setSelectedCategory(cat); setModalVisible(false); }}
                                    >
                                        <Text style={styles.modalItemText}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.labelText}>Description</Text>
                        <TextInput
                            style={styles.descriptionInput}
                            multiline
                            numberOfLines={4}
                            placeholder="Describe your item..."
                            placeholderTextColor={colors.textMuted}
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="photo-camera" size={22} color={colors.primary} />
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
                            <MaterialIcons name="add-a-photo" size={38} color={colors.primary} />
                            <Text style={styles.addImageText}>Add Photo</Text>
                        </TouchableOpacity>

                        {images.length === 0 && (
                            <View style={styles.placeholderImage}>
                                <MaterialIcons name="image" size={30} color={colors.textMuted} />
                                <Text style={styles.placeholderText}>Preview</Text>
                            </View>
                        )}

                        {images.map((uri, i) => (
                            <View key={i} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.imageThumb} />
                                <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(i)}>
                                    <MaterialIcons name="close" size={13} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.hint}>
                        <MaterialIcons name="star-outline" size={13} color={colors.primary} />
                        <Text style={styles.hintText}>High-quality daylight photos perform best.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="monetization-on" size={22} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Pricing</Text>
                    </View>

                    <View style={styles.pricingRow}>
                        <View style={styles.pricingField}>
                            <Text style={styles.labelText}>Daily Rate</Text>
                            <View style={styles.priceInputContainer}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="0"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="number-pad"
                                    value={dailyRate}
                                    onChangeText={setDailyRate}
                                />
                            </View>
                        </View>

                        <View style={styles.pricingField}>
                            <Text style={styles.labelText}>Security Deposit</Text>
                            <View style={styles.priceInputContainer}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="0"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="number-pad"
                                    value={securityDeposit}
                                    onChangeText={setSecurityDeposit}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.hint}>
                        <MaterialIcons name="lightbulb-outline" size={13} color={colors.primary} />
                        <Text style={styles.hintText}>Deposit is returned after the item is safely returned.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="location-pin" size={22} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Location</Text>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.labelText}>City or Neighbourhood</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Zagreb"
                            placeholderTextColor={colors.textMuted}
                            value={location}
                            onChangeText={setLocation}
                        />
                        <View style={styles.hint}>
                            <MaterialIcons name="lock-outline" size={13} color={colors.primary} />
                            <Text style={styles.hintText}>Your exact address is only shared after a booking is confirmed.</Text>
                        </View>
                    </View>
                </View>

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
                        <Text style={[styles.publishButtonText, { color: colors.primary }]}>Save as draft</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 32,
        gap: 0,
    },

    header: {
        paddingTop: 20,
        paddingBottom: 28,
        alignItems: 'center',
        gap: 6,
    },
    titleText: {
        fontSize: 30,
        fontWeight: '700',
        letterSpacing: -0.5,
        textAlign: 'center',
        color: colors.text,
    },
    bodyText: {
        fontSize: 15,
        fontWeight: '400',
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    },

    section: {
        marginBottom: 4,
        paddingTop: 20,
        paddingBottom: 8,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.text,
    },

    fieldGroup: {
        marginBottom: 20,
    },
    labelText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 8,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    input: {
        width: '100%',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 15,
        color: colors.text,
    },
    descriptionInput: {
        width: '100%',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 15,
        color: colors.text,
        height: 116,
        textAlignVertical: 'top',
    },
    dropdownButton: {
        width: '100%',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 15,
        color: colors.text,
    },

    hint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 9,
        gap: 5,
    },
    hintText: {
        fontStyle: 'italic',
        fontSize: 12,
        color: colors.textMuted,
        flex: 1,
        lineHeight: 17,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '82%',
        backgroundColor: colors.card,
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalItemLast: {
        borderBottomWidth: 0,
    },
    modalItemText: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },

    imageScroll: {
        marginBottom: 4,
    },
    imageScrollContent: {
        gap: 10,
        paddingRight: 4,
    },
    placeholderImage: {
        width: 130,
        height: 130,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    placeholderText: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    imageWrapper: {
        position: 'relative',
    },
    imageThumb: {
        width: 130,
        height: 130,
        borderRadius: 12,
        backgroundColor: colors.surface,
    },
    removeButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.65)',
        borderRadius: 9999,
        padding: 4,
    },
    addImageButton: {
        width: 130,
        height: 130,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface,
        gap: 6,
    },
    addImageText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },

    pricingRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 4,
    },
    pricingField: {
        flex: 1,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    currencySymbol: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textMuted,
        marginRight: 4,
    },
    priceInput: {
        flex: 1,
        paddingVertical: 13,
        fontSize: 15,
        color: colors.text,
    },

    actions: {
        marginTop: 28,
        gap: 10,
    },
    publishButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 12,
        backgroundColor: colors.primary,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    draftButton: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    publishButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});