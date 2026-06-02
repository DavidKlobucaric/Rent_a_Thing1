import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    Keyboard, ScrollView, Alert, ActivityIndicator, Platform, Dimensions, Share, StatusBar,
    Modal, Animated, Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Calendar, DateData } from 'react-native-calendars';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { useAuth } from '@/src/context/authContext';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import {
    getListingById,
    addFavourite,
    removeFavourite,
    checkFavourite,
    getBlockedPeriods,
} from '@/src/api/itemsApi';
import {
    getOrCreateConversation,
    createBookingRequest,
} from '@/src/api/chatApi';
import type { Listing, BlockedPeriod } from '@/src/api/itemsApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png';
const TODAY = new Date().toISOString().split('T')[0];

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
                    duration: 400,
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
                    duration: 500,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.85,
                    duration: 500,
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

export default function ListingDetailScreen() {
    const router = useRouter();
    const { listingId } = useLocalSearchParams<{ listingId: string }>();
    const { t } = useLanguage();
    const { user: me } = useAuth();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const isDark = scheme === 'dark';
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const insets = useSafeAreaInsets();
    const shimmerColors = useMemo(() =>
            scheme === 'dark'
                ? ['#2A2A2A', '#3A3A3A', '#2A2A2A']
                : ['#E0E0E0', '#F5F5F5', '#E0E0E0'],
        [scheme]
    );

    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [selectingStart, setSelectingStart] = useState(true);
    const [booking, setBooking] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(TODAY);
    const calendarSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['80%', '95%'], []);

    // ✨ Custom modal state
    const [modal, setModal] = useState<CustomModalConfig>(DEFAULT_MODAL);

    // ✨ Modal helpers
    const showModal = (cfg: Omit<CustomModalConfig, 'visible'>) => {
        setModal({ ...cfg, visible: true });
    };

    const hideModal = () => {
        setModal(prev => ({ ...prev, visible: false }));
    };

    const isOwnListing = useMemo(() => {
        if (!listing?.userId || !me?.userId) return false;
        return listing.userId === me.userId;
    }, [listing?.userId, me?.userId]);

    useEffect(() => {
        if (!listingId) return;
        let isActive = true;
        (async () => {
            setLoading(true);
            setError('');
            const [listingResult, favouriteResult, blockedResult] = await Promise.all([
                getListingById(Number(listingId)),
                checkFavourite(Number(listingId)),
                getBlockedPeriods(Number(listingId)),
            ]);
            if (!isActive) return;
            if (listingResult.success) {
                setListing(listingResult.data);
            } else {
                setError(listingResult.message);
            }
            setIsFavorite(favouriteResult);
            if (blockedResult.success) {
                setBlockedPeriods(blockedResult.data);
            }
            setLoading(false);
        })();
        return () => { isActive = false; };
    }, [listingId]);

    const images = useMemo(() => {
        if (!listing?.imageUrls || listing.imageUrls.length === 0) return [PLACEHOLDER_IMAGE];
        return listing.imageUrls;
    }, [listing?.imageUrls]);

    const handleGalleryScroll = useCallback((e: any) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveImageIndex(index);
    }, []);

    const handleToggleFavourite = useCallback(async () => {
        if (!listingId) return;
        const next = !isFavorite;
        setIsFavorite(next);
        if (next) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await addFavourite(Number(listingId));
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await removeFavourite(Number(listingId));
        }
    }, [listingId, isFavorite]);

    const numberOfDays = useMemo(() => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }, [startDate, endDate]);

    const subtotal = (listing?.price ?? 0) * numberOfDays;
    const deposit = listing?.securityDeposit || 0;
    const total = subtotal + deposit;

    const formatDate = useCallback((dateStr: string | null) => {
        if (!dateStr) return t('listing', 'selectDate');
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }, [t]);

    const formatDateShort = useCallback((dateStr: string | null) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, []);

    const resetDates = useCallback(() => {
        setStartDate(null);
        setEndDate(null);
        setSelectingStart(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const isDateBlocked = useCallback((date: string) => {
        return blockedPeriods.some(period => {
            const d = new Date(date);
            const start = new Date(period.startDate);
            const end = new Date(period.endDate);
            return d >= start && d <= end;
        });
    }, [blockedPeriods]);

    // ✅ POBOLJŠANA LOGIKA: Jedan klik za rezervaciju jednog dana, drugi klik za raspon
    const handleDayPress = useCallback((day: DateData) => {
        Haptics.selectionAsync();
        const selectedDate = day.dateString;

        if (isDateBlocked(selectedDate)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        // Ako klikne na dan koji je već startDate, postavi endDate na isti dan (rezervacija za 1 dan)
        if (startDate === selectedDate && !endDate) {
            setEndDate(selectedDate);
            setSelectingStart(true);
            return;
        }

        if (selectingStart) {
            // Prvi klik: postavi startDate i automatski endDate na isti dan (default za 1 dan)
            setStartDate(selectedDate);
            setEndDate(selectedDate); // ✅ Automatski postavi endDate na isti dan
            setSelectingStart(false); // ✅ Promijeni u false da sljedeći klik produži raspon
        } else {
            // Drugi klik: promijeni endDate
            if (startDate && selectedDate >= startDate) {
                let hasBlocked = false;
                let current = new Date(startDate);
                const end = new Date(selectedDate);
                while (current <= end) {
                    if (isDateBlocked(current.toISOString().split('T')[0])) {
                        hasBlocked = true;
                        break;
                    }
                    current.setDate(current.getDate() + 1);
                }
                if (hasBlocked) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    return;
                }
                setEndDate(selectedDate);
                setSelectingStart(true); // Resetiraj za sljedeći odabir
            } else {
                // Kliknuo na raniji dan: resetiraj i postavi novi startDate
                setStartDate(selectedDate);
                setEndDate(selectedDate); // ✅ Automatski postavi endDate
                setSelectingStart(false);
            }
        }
    }, [selectingStart, startDate, endDate, isDateBlocked]);

    // ✅ POBOLJŠANI MARKED DATES - Ljepši vizualni prikaz
    const markedDates = useMemo(() => {
        const marked: any = {};

        // Blokirani dani
        blockedPeriods.forEach(({ startDate: s, endDate: e }) => {
            let current = new Date(s);
            const end = new Date(e);
            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                marked[dateStr] = {
                    disabled: true,
                    disableTouchEvent: true,
                    marked: true,
                    dotColor: colors.danger,
                    customStyles: {
                        container: {
                            backgroundColor: colors.danger + '15',
                        },
                        text: {
                            color: colors.danger,
                            textDecorationLine: 'line-through',
                            fontWeight: '500',
                        },
                    },
                };
                current.setDate(current.getDate() + 1);
            }
        });

        // Odabrani raspon
        if (startDate && endDate) {
            if (startDate === endDate) {
                // Jedan dan
                marked[startDate] = {
                    selected: true,
                    selectedColor: colors.primary,
                    selectedTextColor: '#FFFFFF',
                    customStyles: {
                        container: {
                            backgroundColor: colors.primary,
                            borderRadius: 12,
                        },
                        text: {
                            color: '#FFFFFF',
                            fontWeight: '700',
                        },
                    },
                };
            } else {
                // Početni dan
                marked[startDate] = {
                    selected: true,
                    selectedColor: colors.primary,
                    selectedTextColor: '#FFFFFF',
                    customStyles: {
                        container: {
                            backgroundColor: colors.primary,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            borderTopLeftRadius: 12,
                            borderBottomLeftRadius: 12,
                        },
                        text: {
                            color: '#FFFFFF',
                            fontWeight: '700',
                        },
                    },
                };

                // Završni dan
                marked[endDate] = {
                    selected: true,
                    selectedColor: colors.primary,
                    selectedTextColor: '#FFFFFF',
                    customStyles: {
                        container: {
                            backgroundColor: colors.primary,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderTopRightRadius: 12,
                            borderBottomRightRadius: 12,
                        },
                        text: {
                            color: '#FFFFFF',
                            fontWeight: '700',
                        },
                    },
                };

                // Dani između
                let current = new Date(startDate);
                const end = new Date(endDate);
                current.setDate(current.getDate() + 1);
                while (current < end) {
                    const dateStr = current.toISOString().split('T')[0];
                    marked[dateStr] = {
                        selected: true,
                        selectedColor: colors.primary + '40',
                        selectedTextColor: colors.text,
                        customStyles: {
                            container: {
                                backgroundColor: colors.primary + '40',
                                borderRadius: 0,
                            },
                            text: {
                                color: colors.text,
                                fontWeight: '600',
                            },
                        },
                    };
                    current.setDate(current.getDate() + 1);
                }
            }
        } else if (startDate) {
            marked[startDate] = {
                selected: true,
                selectedColor: colors.primary,
                selectedTextColor: '#FFFFFF',
                customStyles: {
                    container: {
                        backgroundColor: colors.primary,
                        borderRadius: 12,
                    },
                    text: {
                        color: '#FFFFFF',
                        fontWeight: '700',
                    },
                },
            };
        }

        return marked;
    }, [startDate, endDate, colors, blockedPeriods]);

    const handleContactHost = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!listing) return;
        if (isOwnListing) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showModal({
                type: 'warning',
                title: t('listing', 'cannotBookOwn') || 'Your Listing',
                message: t('listing', 'cannotBookOwnSub') || 'You cannot contact yourself on your own listing.',
                primaryLabel: t('common', 'ok') || 'OK',
                onPrimaryPress: hideModal,
            });
            return;
        }
        router.push({
            pathname: '/chat',
            params: {
                listingId: listing.listingId.toString(),
                ownerId: (listing.userId ?? 0).toString(),
                ownerName: listing.userName,
                itemName: listing.name,
            },
        });
    }, [listing, router, isOwnListing, t]);

    const handleBook = useCallback(() => {
        if (!listing) return;
        if (isOwnListing) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showModal({
                type: 'warning',
                title: t('listing', 'cannotBookOwn') || 'Your Listing',
                message: t('listing', 'cannotBookOwnSub') || 'You cannot book your own listing.',
                primaryLabel: t('common', 'ok') || 'OK',
                onPrimaryPress: hideModal,
            });
            return;
        }
        if (!startDate || !endDate) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showModal({
                type: 'warning',
                title: t('listing', 'selectDates') || 'Select Dates',
                message: t('listing', 'selectDatesFirst') || 'Please select check-in and check-out dates first.',
                primaryLabel: t('common', 'ok') || 'OK',
                onPrimaryPress: hideModal,
            });
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const dayWord = numberOfDays === 1 ? t('listing', 'day') : t('listing', 'days');

        showModal({
            type: 'info',
            title: t('listing', 'confirmBooking') || 'Confirm Booking',
            message: `Book ${listing.name} for ${numberOfDays} ${dayWord}?\n${t('listing', 'total') || 'Total'}: $${total}`,
            primaryLabel: t('common', 'confirm') || 'Confirm',
            secondaryLabel: t('common', 'cancel') || 'Cancel',
            onPrimaryPress: async () => {
                hideModal();
                setBooking(true);
                const convResult = await getOrCreateConversation(listing.listingId);
                if (!convResult.success || !convResult.data) {
                    setBooking(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    showModal({
                        type: 'error',
                        title: t('common', 'error') || 'Error',
                        message: (convResult as any).message || 'Failed to start conversation',
                        primaryLabel: t('common', 'ok') || 'OK',
                        onPrimaryPress: hideModal,
                    });
                    return;
                }
                const bookingResult = await createBookingRequest(
                    convResult.data.conversationId,
                    listing.listingId,
                    startDate!,
                    endDate!
                );
                setBooking(false);
                if (bookingResult.success) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    showModal({
                        type: 'success',
                        title: '🎉 ' + (t('listing', 'requestSent') || 'Request Sent!'),
                        message: t('listing', 'requestSentSub') || 'Your booking request has been sent. The owner will confirm shortly.',
                        primaryLabel: t('listing', 'goToInbox') || 'Go to Inbox',
                        secondaryLabel: t('common', 'ok') || 'OK',
                        onPrimaryPress: () => {
                            hideModal();
                            router.replace('/(tabs)/inbox');
                        },
                        onSecondaryPress: () => {
                            hideModal();
                            router.back();
                        },
                    });
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    showModal({
                        type: 'error',
                        title: t('common', 'error') || 'Error',
                        message: (bookingResult as any).message || 'Booking failed.',
                        primaryLabel: t('common', 'ok') || 'OK',
                        onPrimaryPress: hideModal,
                    });
                }
            },
            onSecondaryPress: hideModal,
        });
    }, [listing, startDate, endDate, numberOfDays, total, t, router, isOwnListing]);

    const handleShare = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!listing) return;
        try {
            const appUrl = Linking.createURL('/item', { queryParams: { listingId: listing.listingId.toString() } });
            if (Platform.OS === 'ios') {
                await Share.share({
                    title: listing.name,
                    url: appUrl,
                    message: `${listing.name}\n💰 $${listing.price}${t('listing', 'perDay')}\n📍 ${listing.location}`,
                });
            } else {
                await Share.share({
                    title: listing.name,
                    message: `📦 ${listing.name}\n💰 $${listing.price}${t('listing', 'perDay')}\n📍 ${listing.location}\n👉 ${appUrl}`,
                });
            }
        } catch (error: any) {
            showModal({
                type: 'error',
                title: t('common', 'error') || 'Error',
                message: error.message || 'Could not share this listing.',
                primaryLabel: t('common', 'ok') || 'OK',
                onPrimaryPress: hideModal,
            });
        }
    }, [listing, t]);

    const handleBack = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    }, [router]);

    const openCalendar = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        calendarSheetRef.current?.expand();
    }, []);

    const closeCalendar = useCallback(() => {
        calendarSheetRef.current?.close();
    }, []);

    const handleCalendarDone = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        calendarSheetRef.current?.close();
    }, []);

    const handleEditListing = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!listing) return;
        router.push({
            pathname: '/edit-listing',
            params: { listingId: listing.listingId.toString() },
        });
    }, [listing, router]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85 }} shimmerColors={shimmerColors} />
                    <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 14 }}>
                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '30%', height: 20, borderRadius: 6 }} shimmerColors={shimmerColors} />
                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '85%', height: 28, borderRadius: 8 }} shimmerColors={shimmerColors} />
                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '50%', height: 16, borderRadius: 6 }} shimmerColors={shimmerColors} />
                        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
                        {[1, 2, 3].map((i) => (
                            <ShimmerPlaceholder key={i} LinearGradient={LinearGradient} style={{ width: '100%', height: 16, borderRadius: 4 }} shimmerColors={shimmerColors} />
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (error || !listing) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.errorText}>{error || 'Listing not found.'}</Text>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* IMAGE GALLERY */}
                <View style={styles.imageGallery}>
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={handleGalleryScroll} scrollEventThrottle={16}>
                        {images.map((url, index) => (
                            <Image key={index} source={{ uri: url }} style={styles.galleryImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                        ))}
                    </ScrollView>
                    <View style={styles.headerOverlay}>
                        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                            <Ionicons name="arrow-back" size={22} color={colors.text} />
                        </TouchableOpacity>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                                <Ionicons name="share-outline" size={20} color={colors.text} />
                            </TouchableOpacity>
                            {!isOwnListing && (
                                <TouchableOpacity style={styles.headerButton} onPress={handleToggleFavourite}>
                                    <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? colors.danger : colors.text} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    {images.length > 1 && (
                        <View style={styles.imageCounter}>
                            <Text style={styles.imageCounterText}>{activeImageIndex + 1} / {images.length}</Text>
                        </View>
                    )}
                </View>

                {/* MAIN CONTENT */}
                <View style={styles.contentContainer}>
                    <View style={styles.topInfoRow}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{listing.category}</Text>
                        </View>
                        {isOwnListing && (
                            <View style={styles.ownBadgePill}>
                                <Ionicons name="person" size={11} color={colors.primary} />
                                <Text style={styles.ownBadgePillText}>YOUR LISTING</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.title}>{listing.name}</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={16} color={colors.textMuted} style={{ marginRight: 4 }} />
                        <Text style={styles.locationText}>{listing.location}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>${listing.price}</Text>
                        <Text style={styles.perDay}>{t('listing', 'perDay')}</Text>
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>{t('listing', 'description')}</Text>
                    <Text style={styles.description}>{listing.description}</Text>
                    <View style={styles.divider} />

                    {/* HOST CARD */}
                    <Text style={styles.sectionTitle}>{t('listing', 'hostedBy')}</Text>
                    <View style={styles.hostCard}>
                        <View style={styles.hostInfo}>
                            <Image source={{ uri: `https://i.pravatar.cc/150?u=${listing.userId ?? listing.userName}` }} style={styles.hostAvatar} cachePolicy="memory-disk" />
                            <View style={styles.hostTextContainer}>
                                <Text style={styles.hostName}>
                                    {isOwnListing ? 'You' : listing.userName}
                                </Text>
                                <View style={styles.hostBadges}>
                                    <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                                    <Text style={styles.hostVerified}>{t('listing', 'verifiedHost')}</Text>
                                </View>
                            </View>
                        </View>
                        {!isOwnListing && (
                            <TouchableOpacity style={styles.contactButton} onPress={handleContactHost}>
                                <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                                <Text style={styles.contactButtonText}>{t('listing', 'contact')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.divider} />

                    {/* DATE PICKER */}
                    <Text style={styles.sectionTitle}>{t('listing', 'selectDates')}</Text>
                    <TouchableOpacity style={styles.datePickerButton} onPress={openCalendar} disabled={!listing.isAvailable || isOwnListing}>
                        <View style={styles.dateColumn}>
                            <Text style={styles.dateLabel}>{t('listing', 'checkIn')}</Text>
                            <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
                        </View>
                        <View style={styles.dateDivider} />
                        <View style={styles.dateColumn}>
                            <Text style={styles.dateLabel}>{t('listing', 'checkOut')}</Text>
                            <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
                        </View>
                        <Ionicons name="calendar-outline" size={22} color={colors.primary} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>

                    {/* BREAKDOWN */}
                    {numberOfDays > 0 && !isOwnListing && (
                        <View style={styles.priceBreakdown}>
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>${listing.price} × {numberOfDays} {numberOfDays === 1 ? t('listing', 'day') : t('listing', 'days')}</Text>
                                <Text style={styles.breakdownValue}>${subtotal}</Text>
                            </View>
                            {deposit > 0 && (
                                <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>{t('listing', 'securityDeposit')}</Text>
                                    <Text style={styles.breakdownValue}>${deposit}</Text>
                                </View>
                            )}
                            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                                <Text style={styles.breakdownTotalLabel}>{t('listing', 'total')}</Text>
                                <Text style={styles.breakdownTotalValue}>${total}</Text>
                            </View>
                        </View>
                    )}

                    {/* ✅ OWNER MANAGEMENT PANEL */}
                    {isOwnListing && (
                        <View style={styles.ownerPanel}>
                            <View style={styles.ownerPanelHeader}>
                                <Ionicons name="settings-outline" size={18} color={colors.primary} />
                                <Text style={styles.ownerPanelTitle}>Manage Your Listing</Text>
                            </View>
                            <View style={styles.ownerStatsRow}>
                                <View style={styles.ownerStatBox}>
                                    <Text style={styles.ownerStatValue}>${listing.price}</Text>
                                    <Text style={styles.ownerStatLabel}>Per Day</Text>
                                </View>
                                <View style={styles.ownerStatDivider} />
                                <View style={styles.ownerStatBox}>
                                    <Text style={styles.ownerStatValue}>{deposit > 0 ? `$${deposit}` : '—'}</Text>
                                    <Text style={styles.ownerStatLabel}>Deposit</Text>
                                </View>
                            </View>
                            <View style={styles.ownerInfoBox}>
                                <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                                <Text style={styles.ownerInfoText}>
                                    You cannot book or contact yourself on your own listing. Use the edit button below to make changes.
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 100 + Math.max(insets.bottom, 12) }} />
                </View>
            </ScrollView>

            {/* ✅ BOTTOM BAR */}
            {isOwnListing ? (
                <View style={[styles.bottomBar, styles.bottomBarOwn, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <View style={styles.bottomBarOwnInfo}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <Text style={styles.bottomBarOwnText}>Your Listing</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.bottomBarOwnButton}
                        onPress={handleEditListing}
                    >
                        <Ionicons name="create-outline" size={18} color="white" />
                        <Text style={styles.bottomBarOwnButtonText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <View style={styles.bottomPriceInfo}>
                        <Text style={styles.bottomPrice}>${listing.price}</Text>
                        <Text style={styles.bottomPerDay}>{t('listing', 'perDay')}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.bookButton, (!listing.isAvailable || booking) && styles.bookButtonDisabled]}
                        onPress={handleBook}
                        disabled={!listing.isAvailable || booking}
                    >
                        {booking ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.bookButtonText}>
                                {!listing.isAvailable ? t('listing', 'unavailable') : t('listing', 'bookNow')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* 🎨 POBOLJŠANI KALENDAR */}
            {/* 🎨 POBOLJŠANI KALENDAR */}
            <BottomSheet
                ref={calendarSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backgroundStyle={{
                    backgroundColor: colors.card,
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28
                }}
                handleIndicatorStyle={{
                    backgroundColor: colors.textMuted,
                    width: 40
                }}
            >
                <BottomSheetView style={styles.sheetContent}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>
                                {selectingStart ? t('listing', 'selectStartDate') : t('listing', 'selectEndDate')}
                            </Text>
                            <Text style={[styles.modalSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>
                                {selectingStart ? 'Tap a date to start your rental' : 'Tap another date to complete your range'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={closeCalendar} style={styles.closeButtonCalendar}>
                            <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </View>

                    {/* ✅ UKLONJENO ISTICANJE - bez calendarInfoItemActive */}
                    <View style={styles.calendarInfoBar}>
                        <View style={styles.calendarInfoItem}>
                            <Text style={styles.calendarInfoLabel}>
                                {t('listing', 'checkIn')}
                            </Text>
                            <Text style={styles.calendarInfoValue}>
                                {formatDateShort(startDate)}
                            </Text>
                        </View>

                        <View style={styles.calendarInfoArrow}>
                            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                        </View>

                        <View style={styles.calendarInfoItem}>
                            <Text style={styles.calendarInfoLabel}>
                                {t('listing', 'checkOut')}
                            </Text>
                            <Text style={styles.calendarInfoValue}>
                                {formatDateShort(endDate)}
                            </Text>
                        </View>
                    </View>

                    {/* Legend za blokirane dane */}
                    <View style={styles.calendarLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.danger + '40' }]} />
                            <Text style={styles.legendText}>Unavailable</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                            <Text style={styles.legendText}>Selected</Text>
                        </View>
                    </View>

                    <View style={styles.calendarWrapper}>
                        <Calendar
                            current={currentMonth}
                            minDate={TODAY}
                            onDayPress={handleDayPress}
                            onMonthChange={(month) => setCurrentMonth(month.dateString)}
                            markedDates={markedDates}
                            markingType={'custom'}
                            hideExtraDays={true}
                            enableSwipeMonths={true}
                            firstDay={1}
                            theme={{
                                backgroundColor: colors.card,
                                calendarBackground: colors.card,
                                textSectionTitleColor: colors.textMuted,
                                textSectionTitleDisabledColor: colors.textMuted + '50',
                                dayTextColor: colors.text,
                                todayTextColor: colors.primary,
                                selectedDayBackgroundColor: colors.primary,
                                selectedDayTextColor: '#FFFFFF',
                                textDisabledColor: colors.textMuted + '50',
                                monthTextColor: colors.text,
                                indicatorColor: colors.primary,
                                arrowColor: colors.primary,
                                disabledArrowColor: colors.textMuted + '50',
                                textMonthFontWeight: '700',
                                textMonthFontSize: 20,
                                textDayHeaderFontSize: 13,
                                textDayHeaderFontWeight: '600',
                                textDayFontSize: 16,
                                textDayFontWeight: '500',
                            }}
                        />
                    </View>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.modalResetButton} onPress={resetDates}>
                            <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.modalResetText}>{t('common', 'reset')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalDoneButton, (!startDate || !endDate) && styles.modalDoneButtonDisabled]}
                            onPress={handleCalendarDone}
                            disabled={!startDate || !endDate}
                        >
                            <Text style={[styles.modalDoneText, (!startDate || !endDate) && { opacity: 0.5 }]}>
                                {t('common', 'done')}
                            </Text>
                            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
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
        </View>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 20 },
    backButton: { margin: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    errorText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 15 },
    imageGallery: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85, position: 'relative' },
    galleryImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85 },
    headerOverlay: { position: 'absolute', top: Platform.OS === 'ios' ? 65 : 45, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 10 },
    headerRight: { flexDirection: 'row', gap: 12 },
    headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    imageCounter: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
    imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    contentContainer: { paddingHorizontal: 20, paddingTop: 24 },
    topInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    categoryBadge: { backgroundColor: colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    categoryText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },

    ownBadgePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.primary + '15',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    ownBadgePillText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 0.5,
    },

    title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    locationText: { fontSize: 14, color: colors.textMuted },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
    price: { fontSize: 26, fontWeight: '700', color: colors.text },
    perDay: { fontSize: 14, color: colors.textMuted, marginLeft: 4 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
    description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    hostCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    hostInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    hostAvatar: { width: 44, height: 44, borderRadius: 22 },
    hostTextContainer: { justifyContent: 'center' },
    hostName: { fontSize: 15, fontWeight: '600', color: colors.text },
    hostBadges: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    hostVerified: { fontSize: 12, color: colors.textMuted },
    contactButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.primary },
    contactButtonText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 },
    dateColumn: { flex: 1 },
    dateLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
    dateValue: { fontSize: 14, fontWeight: '500', color: colors.text },
    dateDivider: { width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: 16 },
    priceBreakdown: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 16, gap: 12 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    breakdownLabel: { fontSize: 14, color: colors.textSecondary },
    breakdownValue: { fontSize: 14, fontWeight: '600', color: colors.text },
    breakdownTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 },
    breakdownTotalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
    breakdownTotalValue: { fontSize: 18, fontWeight: '700', color: colors.primary },

    ownerPanel: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.primary + '30',
        marginTop: 16,
        gap: 14,
    },
    ownerPanelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ownerPanelTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    ownerStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    ownerStatBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ownerStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    ownerStatLabel: {
        fontSize: 10,
        color: colors.textMuted,
        fontWeight: '600',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    ownerStatDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.border,
    },
    ownerInfoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingTop: 4,
    },
    ownerInfoText: {
        flex: 1,
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 17,
    },

    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12
    },
    bottomBarOwn: {
        gap: 12,
    },
    bottomBarOwnInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bottomBarOwnText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    bottomBarOwnButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    bottomBarOwnButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    bottomPriceInfo: { flexDirection: 'row', alignItems: 'baseline' },
    bottomPrice: { fontSize: 22, fontWeight: '700', color: colors.text },
    bottomPerDay: { fontSize: 13, color: colors.textMuted, marginLeft: 2 },
    bookButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    bookButtonDisabled: { opacity: 0.5 },
    bookButtonText: { color: colors.iconColorInverse, fontSize: 15, fontWeight: '600' },

    // 🎨 KALENDAR STYLES
    sheetContent: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },

    // ✅ BIJELA BOJA ZA NASLOV KALENDARA
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF', // Bijela boja
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)', // Svijetlo bijela za podnaslov
    },

    closeButtonCalendar: { padding: 4 },

    calendarInfoBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
    },

    // ✅ UKLONJENO ISTICANJE (nema više calendarInfoItemActive)
    calendarInfoItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },

    calendarInfoLabel: {
        fontSize: 10,
        color: colors.textMuted, // Standardna boja, bez isticanja
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    calendarInfoValue: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text, // Standardna boja, bez isticanja
    },

    calendarInfoArrow: {
        paddingHorizontal: 4,
    },
    calendarInfoBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    calendarInfoBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    calendarLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        paddingVertical: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '500',
    },

    calendarWrapper: {
        flex: 1,
        marginTop: 4,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 8,
    },
    modalFooter: { flexDirection: 'row', gap: 12, marginTop: 8, paddingBottom: 8 },
    modalResetButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    modalResetText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
    modalDoneButton: {
        flex: 2,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    modalDoneButtonDisabled: { opacity: 0.5 },
    modalDoneText: { fontSize: 15, fontWeight: '600', color: colors.iconColorInverse },

    // ─── ✨ CUSTOM MODAL STYLES (Za Success, Error, Warning modale) ─────────────
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
