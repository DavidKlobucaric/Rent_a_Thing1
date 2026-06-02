import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator,
    Modal, Animated, Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { uploadImages, updateThing, updateListing, getListingById } from '@/src/api/itemsApi';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';

const categories = ['Tools', 'Camping', 'Tech', 'Games', 'Sports', 'Clothes'];

// ────────────────────────────────────────────────────────────────────────────
// 🎨 CUSTOM MODAL TYPES
// ────────────────────────────────────────────────────────────────────────────
type ModalType = 'success' | 'error' | 'warning' | 'info';

interface CustomModalConfig {
    visible: boolean;
    type: ModalType;
    title: string;
    message: string;
    primaryLabel: string;
    primaryDestructive?: boolean;
    onPrimaryPress: () => void;
    secondaryLabel?: string;
    onSecondaryPress?: () => void;
}

const DEFAULT_MODAL: CustomModalConfig = {
    visible: false,
    type: 'info',
    title: '',
    message: '',
    primaryLabel: 'OK',
    onPrimaryPress: () => {},
};

// ────────────────────────────────────────────────────────────────────────────
// 🎨 CUSTOM MODAL COMPONENT
// ────────────────────────────────────────────────────────────────────────────
function CustomModal({
                         config,
                         colors,
                         styles,
                         onDismiss,
                     }: {
    config: CustomModalConfig;
    colors: typeof Colors.light;
    styles: any;
    onDismiss: () => void;
}) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        if (config.visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 80,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.85,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [config.visible]);

    if (!config.visible) return null;

    const modalConfig = {
        success: {
            icon: 'check-circle' as const,
            gradientColors: ['#10B981', '#059669'] as [string, string],
            iconBg: '#10B98120',
        },
        error: {
            icon: 'error' as const,
            gradientColors: ['#EF4444', '#DC2626'] as [string, string],
            iconBg: '#EF444420',
        },
        warning: {
            icon: 'warning' as const,
            gradientColors: ['#F59E0B', '#D97706'] as [string, string],
            iconBg: '#F59E0B20',
        },
        info: {
            icon: 'info' as const,
            gradientColors: [colors.primary, colors.primary] as [string, string],
            iconBg: colors.primary + '20',
        },
    }[config.type];

    return (
        <Modal
            visible={config.visible}
            transparent
            animationType="none"
            onRequestClose={onDismiss}
            statusBarTranslucent
        >
            <Animated.View
                style={[
                    styles.modalOverlay,
                    { opacity: fadeAnim },
                ]}
            >
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onDismiss}
                />
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            transform: [
                                { scale: scaleAnim },
                                { translateY: slideAnim },
                            ],
                        },
                    ]}
                >
                    <View style={[styles.modalIconWrapper, { backgroundColor: modalConfig.iconBg }]}>
                        <LinearGradient
                            colors={modalConfig.gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.modalIconGradient}
                        >
                            <MaterialIcons name={modalConfig.icon} size={32} color="#FFFFFF" />
                        </LinearGradient>
                    </View>

                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                        {config.title}
                    </Text>
                    <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                        {config.message}
                    </Text>

                    <View style={styles.modalButtons}>
                        {config.secondaryLabel && config.onSecondaryPress && (
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.modalButtonSecondary,
                                    { borderColor: colors.border, backgroundColor: colors.surface },
                                ]}
                                onPress={config.onSecondaryPress}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                                    {config.secondaryLabel}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                styles.modalButtonPrimary,
                                { flex: 1 },
                                {
                                    backgroundColor: config.primaryDestructive
                                        ? colors.danger
                                        : modalConfig.gradientColors[0],
                                },
                            ]}
                            onPress={config.onPrimaryPress}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                                {config.primaryLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// 📝 EDIT LISTING SCREEN
// ────────────────────────────────────────────────────────────────────────────
export default function EditListingScreen() {
    const router = useRouter();
    const { listingId } = useLocalSearchParams<{ listingId: string }>();
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
    const [originalImages, setOriginalImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [thingId, setThingId] = useState<number | null>(null);

    const [modal, setModal] = useState<CustomModalConfig>(DEFAULT_MODAL);

    const categorySheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['45%'], []);

    const shimmerColors = useMemo(() =>
            scheme === 'dark'
                ? ['#2A2A2A', '#3A3A3A', '#2A2A2A']
                : ['#E0E0E0', '#F5F5F5', '#E0E0E0'],
        [scheme]
    );

    const showModal = (cfg: Omit<CustomModalConfig, 'visible'>) => {
        setModal({ ...cfg, visible: true });
    };

    const hideModal = () => {
        setModal(prev => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        if (!listingId) return;
        let isActive = true;
        (async () => {
            setLoading(true);
            const result = await getListingById(Number(listingId));
            if (!isActive) return;
            if (result.success && result.data) {
                const l = result.data;
                setTitle(l.name || '');
                setSelectedCategory(l.category ? l.category.charAt(0).toUpperCase() + l.category.slice(1) : 'Tools');
                setDescription(l.description || '');
                setDailyRate(l.price?.toString() || '');
                setSecurityDeposit(l.securityDeposit?.toString() || '');
                setLocation(l.location || '');
                const urls = l.imageUrls || [];
                setImages(urls);
                setOriginalImages(urls);
                setThingId(l.thingId ?? null);
            } else {
                showModal({
                    type: 'error',
                    title: t('common', 'error'),
                    message: (result as any).message || 'Could not load listing.',
                    primaryLabel: t('common', 'ok') || 'OK',
                    onPrimaryPress: () => {
                        hideModal();
                        router.back();
                    },
                });
            }
            setLoading(false);
        })();
        return () => { isActive = false; };
    }, [listingId]);

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

    const handleSave = async () => {
        if (!title.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showModal({
                type: 'warning',
                title: t('common', 'error'),
                message: t('add', 'missingTitle'),
                primaryLabel: t('common', 'ok') || 'OK',
                onPrimaryPress: hideModal,
            });
            return;
        }
        if (!dailyRate || isNaN(Number(dailyRate)) || Number(dailyRate) <= 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showModal({
                type: 'warning',
                title: t('common', 'error'),
                message: t('add', 'missingRate'),
                primaryLabel: t('common', 'ok') || 'OK',
                onPrimaryPress: hideModal,
            });
            return;
        }
        if (securityDeposit && (isNaN(Number(securityDeposit)) || Number(securityDeposit) < 0)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showModal({
                type: 'warning',
                title: t('common', 'error'),
                message: 'Security deposit cannot be negative.',
                primaryLabel: t('common', 'ok') || 'OK',
                onPrimaryPress: hideModal,
            });
            return;
        }
        if (!location.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showModal({
                type: 'warning',
                title: t('common', 'error'),
                message: t('add', 'missingLocation'),
                primaryLabel: t('common', 'ok') || 'OK',
                onPrimaryPress: hideModal,
            });
            return;
        }
        if (!thingId) {
            showModal({
                type: 'error',
                title: t('common', 'error'),
                message: 'Listing data is incomplete.',
                primaryLabel: t('common', 'ok') || 'OK',
                onPrimaryPress: hideModal,
            });
            return;
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            let finalImageUrls: string[] = [];

            const existingUrls = images.filter(img => img.startsWith('http'));
            const newLocalUris = images.filter(img => !img.startsWith('http'));

            finalImageUrls = [...existingUrls];

            if (newLocalUris.length > 0) {
                const uploadResult = await uploadImages(newLocalUris);
                if (uploadResult.success === false) {
                    setSaving(false);
                    showModal({
                        type: 'error',
                        title: t('common', 'error'),
                        message: (uploadResult as any).message || 'Upload failed.',
                        primaryLabel: t('common', 'ok') || 'OK',
                        onPrimaryPress: hideModal,
                    });
                    return;
                }
                finalImageUrls = [...finalImageUrls, ...uploadResult.urls];
            }

            const thingPayload = {
                name: title.trim(),
                category: selectedCategory.toLowerCase(),
                description: description.trim(),
                imageUrls: finalImageUrls,
            };

            const thingResult = await updateThing(thingId, thingPayload);
            if (thingResult.success === false) {
                setSaving(false);
                showModal({
                    type: 'error',
                    title: t('common', 'error'),
                    message: (thingResult as any).message || 'Failed to update item.',
                    primaryLabel: t('common', 'ok') || 'OK',
                    onPrimaryPress: hideModal,
                });
                return;
            }

            const listingPayload = {
                thingId,
                price: Number(dailyRate),
                securityDeposit: Math.max(0, Number(securityDeposit) || 0),
                location: location.trim(),
            };

            const listingResult = await updateListing(Number(listingId), listingPayload);
            if (listingResult.success === false) {
                setSaving(false);
                showModal({
                    type: 'error',
                    title: t('common', 'error'),
                    message: (listingResult as any).message || 'Failed to update listing.',
                    primaryLabel: t('common', 'ok') || 'OK',
                    onPrimaryPress: hideModal,
                });
                return;
            }

            setSaving(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            showModal({
                type: 'success',
                title: t('edit', 'saveSuccess') || 'Listing Updated!',
                message: 'Your changes have been saved successfully and are now live.',
                primaryLabel: t('common', 'ok') || 'Great!',
                onPrimaryPress: () => {
                    hideModal();
                    setTimeout(() => router.back(), 200);
                },
            });
        } catch (e: any) {
            setSaving(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showModal({
                type: 'error',
                title: t('common', 'error'),
                message: e.message || 'Something went wrong.',
                primaryLabel: t('common', 'ok') || 'OK',
                onPrimaryPress: hideModal,
            });
        }
    };

    const handleDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showModal({
            type: 'warning',
            title: t('edit', 'deleteListing') || 'Delete Listing?',
            message: t('edit', 'deleteConfirm') || 'This will permanently remove your listing. This action cannot be undone.',
            primaryLabel: t('common', 'delete'),
            primaryDestructive: true,
            onPrimaryPress: async () => {
                hideModal();
                setSaving(true);
                try {
                    const { deleteListing } = await import('@/src/api/itemsApi');
                    const result = await deleteListing(Number(listingId));
                    if (result.success) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        showModal({
                            type: 'success',
                            title: t('edit', 'deleteSuccess') || 'Listing Deleted',
                            message: 'Your listing has been permanently removed.',
                            primaryLabel: t('common', 'ok') || 'OK',
                            onPrimaryPress: () => {
                                hideModal();
                                setTimeout(() => router.back(), 200);
                            },
                        });
                    } else {
                        showModal({
                            type: 'error',
                            title: t('common', 'error'),
                            message: (result as any).message || 'Failed to delete listing.',
                            primaryLabel: t('common', 'ok') || 'OK',
                            onPrimaryPress: hideModal,
                        });
                    }
                } catch (e: any) {
                    showModal({
                        type: 'error',
                        title: t('common', 'error'),
                        message: e.message || 'Failed to delete listing.',
                        primaryLabel: t('common', 'ok') || 'OK',
                        onPrimaryPress: hideModal,
                    });
                } finally {
                    setSaving(false);
                }
            },
            secondaryLabel: t('common', 'cancel'),
            onSecondaryPress: hideModal,
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '60%', height: 30, borderRadius: 8 }} shimmerColors={shimmerColors} />
                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '80%', height: 16, borderRadius: 6, marginTop: 8 }} shimmerColors={shimmerColors} />
                    </View>
                    <View style={styles.section}>
                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '100%', height: 50, borderRadius: 12, marginBottom: 16 }} shimmerColors={shimmerColors} />
                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '100%', height: 50, borderRadius: 12, marginBottom: 16 }} shimmerColors={shimmerColors} />
                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '100%', height: 116, borderRadius: 12 }} shimmerColors={shimmerColors} />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.scrollContent}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <View style={{ flex:1, alignContent:'center'}}>
                            <Text style={styles.titleText}>{t('edit', 'editListing') || 'Edit Listing'}</Text>
                        </View>
                    </View>
                    <Text style={styles.bodyText}>{t('edit', 'subtitle') || 'Update your listing details below.'}</Text>
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
                        {images.map((uri, i) => (
                            <View key={`${uri}-${i}`} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.imageThumb} contentFit="cover" />
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
                            <Text style={styles.labelText}>{t('add', 'securityDeposit')}</Text>
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
                    </View>
                </View>

                {/* ACTIONS */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.saveButton, saving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving
                            ? <ActivityIndicator color="white" />
                            : <>
                                <Text style={styles.saveButtonText}>{t('edit', 'saveChanges') || 'Save Changes'}</Text>
                                <MaterialIcons name="check-circle" size={18} color="white" />
                            </>
                        }
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDelete}
                        disabled={saving}
                    >
                        <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
                        <Text style={styles.deleteButtonText}>{t('edit', 'deleteListing') || 'Delete Listing'}</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ height: 40 }} />
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

            {/* ✨ CUSTOM MODAL */}
            <CustomModal
                config={modal}
                colors={colors}
                styles={styles}
                onDismiss={hideModal}
            />
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, gap: 0 },
    header: { paddingTop: 12, paddingBottom: 20, alignItems: 'center', gap: 6 },
    headerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 4, marginBottom: 6 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    titleText: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center', color: colors.text },
    bodyText: { fontSize: 14, fontWeight: '400', color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
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
    imageScroll: { marginBottom: 4 },
    imageScrollContent: { gap: 10, paddingRight: 4 },
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
    saveButton: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, backgroundColor: colors.primary },
    saveButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    deleteButton: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, backgroundColor: colors.danger + '12', borderWidth: 1, borderColor: colors.danger + '30' },
    deleteButtonText: { fontSize: 15, fontWeight: '600', color: colors.danger },
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

    // ─── ✨ CUSTOM MODAL STYLES ─────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    modalIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    modalIconGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    modalMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonPrimary: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    modalButtonSecondary: {
        borderWidth: 1,
    },
    modalButtonText: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});