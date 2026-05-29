import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { uploadImages, createThing, createListing } from '@/src/api/itemsApi';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

const DRAFT_KEY = '@listing_draft';
const categories = ['Tools', 'Camping', 'Tech', 'Games', 'Sports', 'Clothes'];

type DraftData = {
    title: string;
    category: string;
    description: string;
    rate: string;
    deposit: string;
    location: string;
    images: string[];
};

export default function AddScreen() {
    const router = useRouter();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const { t } = useLanguage();

    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tools');
    const [description, setDescription] = useState('');
    const [dailyRate, setDailyRate] = useState('');
    const [securityDeposit, setSecurityDeposit] = useState('');
    const [location, setLocation] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [publishing, setPublishing] = useState(false);

    // Bottom Sheet ref
    const categorySheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['45%'], []);

    // Load draft on mount
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(DRAFT_KEY);
                if (saved) {
                    const d: DraftData = JSON.parse(saved);
                    setTitle(d.title || '');
                    setSelectedCategory(d.category || 'Tools');
                    setDescription(d.description || '');
                    setDailyRate(d.rate || '');
                    setSecurityDeposit(d.deposit || '');
                    setLocation(d.location || '');
                    setImages(d.images || []);
                }
            } catch (e) {
                console.log('Draft load error:', e);
            }
        })();
    }, []);

    // Save draft with debounce
    useEffect(() => {
        const save = async () => {
            const hasData = title || description || dailyRate || location || images.length > 0;
            if (!hasData) {
                await AsyncStorage.removeItem(DRAFT_KEY);
                return;
            }
            const draft: DraftData = {
                title,
                category: selectedCategory,
                description,
                rate: dailyRate,
                deposit: securityDeposit,
                location,
                images,
            };
            try {
                await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            } catch (e) {
                console.log('Draft save error:', e);
            }
        };
        const timeout = setTimeout(save, 800);
        return () => clearTimeout(timeout);
    }, [title, selectedCategory, description, dailyRate, securityDeposit, location, images]);

    const pickImage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            quality: 0.8,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
        if (!result.canceled) {
            setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
        }
    };

    const removeImage = (index: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handlePublish = async () => {
        if (!title.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('common', 'error'), t('add', 'missingTitle'));
            return;
        }
        if (!dailyRate || isNaN(Number(dailyRate))) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('common', 'error'), t('add', 'missingRate'));
            return;
        }
        if (!location.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('common', 'error'), t('add', 'missingLocation'));
            return;
        }
        setPublishing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            let imageUrls: string[] = [];
            if (images.length > 0) {
                const uploadResult = await uploadImages(images);
                if (!uploadResult.success) {
                    Alert.alert(t('common', 'error'), uploadResult.message);
                    return;
                }
                imageUrls = uploadResult.urls;
            }
            const thingPayload = {
                name: title.trim(),
                category: selectedCategory.toLowerCase(),
                description: description.trim(),
                imageUrls,
            };
            const thingResult = await createThing(thingPayload);
            if (!thingResult.success) {
                Alert.alert(t('common', 'error'), thingResult.message);
                return;
            }
            const thingId: number = thingResult.data?.thingId ?? thingResult.data?.id;
            const listingPayload = {
                thingId,
                price: Number(dailyRate),
                securityDeposit: Number(securityDeposit) || 0,
                location: location.trim(),
            };
            const listingResult = await createListing(listingPayload);
            if (!listingResult.success) {
                Alert.alert(t('common', 'error'), listingResult.message);
                return;
            }
            await AsyncStorage.removeItem(DRAFT_KEY);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('🎉', t('add', 'publishSuccess') || 'Your listing is live!', [
                { text: t('common', 'ok') || 'OK', onPress: () => router.replace('/home') },
            ]);
        } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('common', 'error'), e.message || 'Something went wrong.');
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
                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.titleText}>{t('add', 'listThing')}</Text>
                    <Text style={styles.bodyText}>{t('add', 'subtitle')}</Text>
                </View>

                {/* BASIC INFO */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="info" size={22} color={colors.primary} />
                        <Text style={styles.sectionTitle}>{t('add', 'basicInfo')}</Text>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.labelText}>{t('add', 'itemTitle')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('add', 'titlePlaceholder')}
                            placeholderTextColor={colors.textMuted}
                            value={title}
                            onChangeText={setTitle}
                        />
                        <View style={styles.hint}>
                            <MaterialIcons name="lightbulb-outline" size={13} color={colors.primary} />
                            <Text style={styles.hintText}>{t('add', 'titleHint')}</Text>
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.labelText}>{t('add', 'category')}</Text>
                        <TouchableOpacity
                            style={styles.dropdownButton}
                            onPress={() => {
                                categorySheetRef.current?.expand();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <Text style={styles.dropdownText}>{selectedCategory}</Text>
                            <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.labelText}>{t('add', 'description')}</Text>
                        <TextInput
                            style={styles.descriptionInput}
                            multiline
                            numberOfLines={4}
                            placeholder={t('add', 'descPlaceholder')}
                            placeholderTextColor={colors.textMuted}
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                            maxLength={500}
                        />
                        <Text style={styles.charCount}>{description.length}/500</Text>
                    </View>
                </View>

                {/* PHOTOS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="photo-camera" size={22} color={colors.primary} />
                        <Text style={styles.sectionTitle}>{t('add', 'photos')}</Text>
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
                            <Text style={styles.addImageText}>{t('add', 'addPhoto')}</Text>
                        </TouchableOpacity>
                        {images.length === 0 && (
                            <View style={styles.placeholderImage}>
                                <MaterialIcons name="image" size={30} color={colors.textMuted} />
                                <Text style={styles.placeholderText}>{t('add', 'preview')}</Text>
                            </View>
                        )}
                        {images.map((uri, i) => (
                            <View key={i} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.imageThumb} />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeImage(i)}
                                >
                                    <MaterialIcons name="close" size={13} color="white" />
                                </TouchableOpacity>
                                {i === 0 && (
                                    <View style={styles.coverBadge}>
                                        <Text style={styles.coverBadgeText}>{t('add', 'cover')}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                    {images.length > 1 && (
                        <TouchableOpacity
                            style={styles.removeAllBtn}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setImages([]);
                            }}
                        >
                            <MaterialIcons name="delete-sweep" size={18} color={colors.danger} />
                            <Text style={styles.removeAllText}>{t('add', 'removeAll')}</Text>
                        </TouchableOpacity>
                    )}
                    <View style={styles.hint}>
                        <MaterialIcons name="star-outline" size={13} color={colors.primary} />
                        <Text style={styles.hintText}>{t('add', 'photoHint')}</Text>
                    </View>
                </View>

                {/* PRICING */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="monetization-on" size={22} color={colors.primary} />
                        <Text style={styles.sectionTitle}>{t('add', 'pricing')}</Text>
                    </View>
                    <View style={styles.pricingRow}>
                        <View style={styles.pricingField}>
                            <Text style={styles.labelText}>{t('add', 'dailyRate')}</Text>
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
                            <Text style={styles.labelText}>{t('add', 'securityDeposit')} </Text>
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
                        <Text style={styles.hintText}>{t('add', 'depositHint')}</Text>
                    </View>
                </View>

                {/* LOCATION */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="location-pin" size={22} color={colors.primary} />
                        <Text style={styles.sectionTitle}>{t('add', 'location')}</Text>
                    </View>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.labelText}>{t('add', 'city')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('add', 'locationPlaceholder')}
                            placeholderTextColor={colors.textMuted}
                            value={location}
                            onChangeText={setLocation}
                        />
                        <View style={styles.hint}>
                            <MaterialIcons name="lock-outline" size={13} color={colors.primary} />
                            <Text style={styles.hintText}>{t('add', 'locationHint')}</Text>
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
                                <Text style={styles.publishButtonText}>{t('add', 'publish')}</Text>
                                <MaterialIcons name="rocket-launch" size={15} color="white" />
                            </>
                        }
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* CATEGORY BOTTOM SHEET */}
            <BottomSheet
                ref={categorySheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backgroundStyle={{
                    backgroundColor: colors.card,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                }}
                handleIndicatorStyle={{
                    backgroundColor: colors.textMuted,
                    width: 40,
                }}
            >
                <BottomSheetView style={styles.sheetContent}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>{t('add', 'category')}</Text>
                    </View>
                    <View style={styles.sheetList}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.sheetItem,
                                    selectedCategory === cat && styles.sheetItemActive,
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedCategory(cat);
                                    categorySheetRef.current?.close();
                                }}
                            >
                                <Text style={[
                                    styles.sheetItemText,
                                    selectedCategory === cat && styles.sheetItemTextActive,
                                ]}>
                                    {cat}
                                </Text>
                                {selectedCategory === cat && (
                                    <MaterialIcons name="check" size={22} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 0 },
    header: { paddingTop: 20, paddingBottom: 28, alignItems: 'center', gap: 6 },
    titleText: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center', color: colors.text },
    bodyText: { fontSize: 15, fontWeight: '400', color: colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
    section: { marginBottom: 4, paddingTop: 20, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
    fieldGroup: { marginBottom: 20 },
    labelText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, letterSpacing: 0.6, textTransform: 'uppercase' },
    input: { width: '100%', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text },
    descriptionInput: { width: '100%', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text, height: 116, textAlignVertical: 'top' },
    charCount: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
    dropdownButton: { width: '100%', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownText: { fontSize: 15, color: colors.text },
    hint: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 9, gap: 5 },
    hintText: { fontStyle: 'italic', fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 17 },
    imageScroll: { marginBottom: 4 },
    imageScrollContent: { gap: 10, paddingRight: 4 },
    placeholderImage: { width: 130, height: 130, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 6 },
    placeholderText: { color: colors.textMuted, fontSize: 12, fontWeight: '500', textAlign: 'center' },
    imageWrapper: { position: 'relative' },
    imageThumb: { width: 130, height: 130, borderRadius: 12, backgroundColor: colors.surface },
    removeButton: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 9999, padding: 4 },
    coverBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    coverBadgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
    removeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, marginTop: 12, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: 'rgba(255, 59, 48, 0.1)' },
    removeAllText: { fontSize: 13, fontWeight: '600', color: '#FF3B30' },
    addImageButton: { width: 130, height: 130, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, gap: 6 },
    addImageText: { color: colors.primary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    pricingRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
    pricingField: { flex: 1 },
    priceInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14 },
    currencySymbol: { fontSize: 15, fontWeight: '600', color: colors.textMuted, marginRight: 4 },
    priceInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.text },
    actions: { marginTop: 28, gap: 10 },
    publishButton: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary },
    publishButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    // Bottom Sheet styles
    sheetContent: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
    sheetHeader: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    sheetList: { gap: 8 },
    sheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 14,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sheetItemActive: {
        backgroundColor: colors.primary + '15',
        borderColor: colors.primary,
    },
    sheetItemText: { fontSize: 16, fontWeight: '500', color: colors.text },
    sheetItemTextActive: { color: colors.primary, fontWeight: '700' },
});