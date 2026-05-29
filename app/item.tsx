import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import * as Linking from 'expo-linking';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, Dimensions, Share, Platform, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import  ShimmerPlaceholder  from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { getListingById, addFavourite, removeFavourite, checkFavourite } from '@/src/api/itemsApi';
import type { Listing } from '@/src/api/itemsApi';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png';

// ✅ Memoiziran izvan komponente - ne mijenja se
const TODAY = new Date().toISOString().split('T')[0];

export default function ListingDetailScreen() {
    const router = useRouter();
    const { listingId } = useLocalSearchParams<{ listingId: string }>();
    const { t } = useLanguage();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const isDark = scheme === 'dark';

    // ✅ Stabilan styles - ovisi o scheme (primitive), ne o colors objektu
    const styles = useMemo(() => makeStyles(colors), [scheme]);

    // ✅ Shimmer boje ovisno o temi
    const shimmerColors = useMemo(() =>
            scheme === 'dark'
                ? ['#2A2A2A', '#3A3A3A', '#2A2A2A']
                : ['#E0E0E0', '#F5F5F5', '#E0E0E0'],
        [scheme]);

    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Bottom Sheet ref
    const calendarSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['65%', '85%'], []);

    // ✅ Spojena dva useEffect u jedan - manje API poziva, manje re-renders
    useEffect(() => {
        if (!listingId) return;
        let isActive = true;

        (async () => {
            setLoading(true);
            setError('');

            const [listingResult, favouriteResult] = await Promise.all([
                getListingById(Number(listingId)),
                checkFavourite(Number(listingId)),
            ]);

            if (!isActive) return;

            if (listingResult.success) {
                setListing(listingResult.data);
            } else {
                setError(listingResult.message);
            }

            setIsFavorite(favouriteResult);
            setLoading(false);
        })();

        return () => { isActive = false; };
    }, [listingId]);

    const images = useMemo(() => {
        if (!listing?.imageUrls || listing.imageUrls.length === 0) return [PLACEHOLDER_IMAGE];
        return listing.imageUrls;
    }, [listing?.imageUrls]);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    // ✅ Memoiziran handler za scroll - spriječava rekreiranje funkcije
    const handleGalleryScroll = useCallback((e: any) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveImageIndex(index);
    }, []);

    // ✅ Memoiziran toggle favourite handler
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

    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [selectingStart, setSelectingStart] = useState(true);

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

    // ✅ Memoiziran formatDate - ne rekreira se pri svakom renderu
    const formatDate = useCallback((dateStr: string | null) => {
        if (!dateStr) return t('listing', 'selectDate');
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }, [t]);

    // ✅ Memoiziran resetDates handler
    const resetDates = useCallback(() => {
        setStartDate(null);
        setEndDate(null);
        setSelectingStart(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    // ✅ Memoiziran handleDayPress - ključno za Calendar performansu
    const handleDayPress = useCallback((day: { dateString: string }) => {
        Haptics.selectionAsync();
        if (selectingStart) {
            setStartDate(day.dateString);
            setEndDate(null);
            setSelectingStart(false);
        } else {
            if (startDate && new Date(day.dateString) >= new Date(startDate)) {
                setEndDate(day.dateString);
            } else {
                setStartDate(day.dateString);
                setEndDate(null);
            }
        }
    }, [selectingStart, startDate]);

    const markedDates = useMemo(() => {
        const marked: any = {};
        if (startDate) {
            marked[startDate] = { startingDay: true, color: colors.primary, textColor: colors.iconColorInverse };
        }
        if (endDate) {
            marked[endDate] = { endingDay: true, color: colors.primary, textColor: colors.iconColorInverse };
        }
        if (startDate && endDate) {
            let current = new Date(startDate);
            const end = new Date(endDate);
            current.setDate(current.getDate() + 1);
            while (current < end) {
                const dateStr = current.toISOString().split('T')[0];
                marked[dateStr] = { color: colors.primary + '30', textColor: colors.text };
                current.setDate(current.getDate() + 1);
            }
        }
        return marked;
    }, [startDate, endDate, colors]);

    // ✅ Memoiziran handleContactHost
    const handleContactHost = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!listing) return;
        router.push({
            pathname: '/chat',
            params: {
                conversation: JSON.stringify({
                    id: listing.listingId,
                    name: listing.userName,
                    itemName: listing.name,
                    avatar: '',
                    isOnline: false,
                }),
            },
        });
    }, [listing, router]);

    // ✅ Memoiziran handleBook
    const handleBook = useCallback(() => {
        if (!listing) return;
        if (!startDate || !endDate) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert(t('listing', 'selectDates'), t('listing', 'selectDatesFirst'));
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const dayWord = numberOfDays === 1 ? t('listing', 'day') : t('listing', 'days');
        Alert.alert(
            t('listing', 'confirmBooking'),
            `Book ${listing.name} for ${numberOfDays} ${dayWord}?\n${t('listing', 'total')}: $${total}`,
            [
                { text: t('common', 'cancel'), style: 'cancel' },
                {
                    text: t('common', 'confirm'),
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert('🎉 ' + t('listing', 'bookingConfirmed'), t('listing', 'hostContact'));
                        router.back();
                    },
                },
            ]
        );
    }, [listing, startDate, endDate, numberOfDays, total, t, router]);

    // ✅ Memoiziran handleShare
    const handleShare = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!listing) return;
        try {
            const appUrl = Linking.createURL('/item', {
                queryParams: { listingId: listing.listingId.toString() },
            });
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
            Alert.alert(t('common', 'error'), error.message || 'Could not share this listing.');
        }
    }, [listing, t]);

    // ✅ Memoiziran back handler
    const handleBack = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    }, [router]);

    // ✅ Memoiziran open calendar handler
    const openCalendar = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        calendarSheetRef.current?.expand();
    }, []);

    // ✅ Memoiziran close calendar handler
    const closeCalendar = useCallback(() => {
        calendarSheetRef.current?.close();
    }, []);

    // ✅ Memoiziran done calendar handler
    const handleCalendarDone = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        calendarSheetRef.current?.close();
    }, []);

    // ═══════════════════════════════════════════════════════════════
    // ✨ SHIMMER LOADING STATE - premium UX
    // ═══════════════════════════════════════════════════════════════
    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Hero Image Skeleton */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85 }}
                        shimmerColors={shimmerColors}
                    />
                    {/* Content Skeletons */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 14 }}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '30%', height: 20, borderRadius: 6 }}
                            shimmerColors={shimmerColors}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '85%', height: 28, borderRadius: 8, marginBottom: 4 }}
                            shimmerColors={shimmerColors}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '50%', height: 16, borderRadius: 6 }}
                            shimmerColors={shimmerColors}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '35%', height: 30, borderRadius: 8, marginTop: 8 }}
                            shimmerColors={shimmerColors}
                        />
                        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <ShimmerPlaceholder
                                key={i}
                                LinearGradient={LinearGradient}
                                style={{ width: i === 5 ? '70%' : '100%', height: 16, borderRadius: 4 }}
                                shimmerColors={shimmerColors}
                            />
                        ))}
                        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '40%', height: 18, borderRadius: 6 }}
                            shimmerColors={shimmerColors}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '100%', height: 70, borderRadius: 16, marginTop: 8 }}
                            shimmerColors={shimmerColors}
                        />
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* IMAGE GALLERY */}
                <View style={styles.imageGallery}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleGalleryScroll}
                        scrollEventThrottle={16}
                    >
                        {images.map((url, index) => (
                            <Image
                                key={index}
                                source={{ uri: url }}
                                style={styles.galleryImage}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                                transition={200}
                            />
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
                            <TouchableOpacity style={styles.headerButton} onPress={handleToggleFavourite}>
                                <Ionicons
                                    name={isFavorite ? 'heart' : 'heart-outline'}
                                    size={22}
                                    color={isFavorite ? colors.danger : colors.text}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {images.length > 1 && (
                        <View style={styles.imageCounter}>
                            <Text style={styles.imageCounterText}>{activeImageIndex + 1} / {images.length}</Text>
                        </View>
                    )}
                    {!listing.isAvailable && (
                        <View style={styles.unavailableBadge}>
                            <Text style={styles.unavailableText}>{t('listing', 'currentlyUnavailable')}</Text>
                        </View>
                    )}
                </View>

                {/* CONTENT */}
                <View style={styles.contentContainer}>
                    <View style={styles.topInfoRow}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{listing.category}</Text>
                        </View>
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
                    <Text style={styles.sectionTitle}>{t('listing', 'hostedBy')}</Text>
                    <View style={styles.hostCard}>
                        <View style={styles.hostInfo}>
                            <Image
                                source={{ uri: 'https://i.pravatar.cc/150' }}
                                style={styles.hostAvatar}
                                cachePolicy="memory-disk"
                                transition={200}
                            />
                            <View style={styles.hostTextContainer}>
                                <Text style={styles.hostName}>{listing.userName}</Text>
                                <View style={styles.hostBadges}>
                                    <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                                    <Text style={styles.hostVerified}>{t('listing', 'verifiedHost')}</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.contactButton} onPress={handleContactHost}>
                            <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                            <Text style={styles.contactButtonText}>{t('listing', 'contact')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>{t('listing', 'selectDates')}</Text>
                    <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={openCalendar}
                        disabled={!listing.isAvailable}
                    >
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

                    {(startDate || endDate) && (
                        <TouchableOpacity style={styles.resetButton} onPress={resetDates}>
                            <Text style={styles.resetButtonText}>{t('listing', 'resetDates')}</Text>
                        </TouchableOpacity>
                    )}

                    {numberOfDays > 0 && (
                        <View style={styles.priceBreakdown}>
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>
                                    ${listing.price} × {numberOfDays} {numberOfDays === 1 ? t('listing', 'day') : t('listing', 'days')}
                                </Text>
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
                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* Sticky Bottom Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomPriceInfo}>
                    <Text style={styles.bottomPrice}>${listing.price}</Text>
                    <Text style={styles.bottomPerDay}>{t('listing', 'perDay')}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.bookButton, !listing.isAvailable && styles.bookButtonDisabled]}
                    onPress={handleBook}
                    disabled={!listing.isAvailable}
                >
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.iconColorInverse} />
                    <Text style={styles.bookButtonText}>
                        {listing.isAvailable ? t('listing', 'bookNow') : t('listing', 'unavailable')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* CALENDAR BOTTOM SHEET */}
            <BottomSheet
                ref={calendarSheetRef}
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
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {selectingStart ? t('listing', 'checkIn') : t('listing', 'checkOut')}
                        </Text>
                        <TouchableOpacity onPress={closeCalendar}>
                            <Ionicons name="close" size={26} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Calendar
                        style={styles.calendar}
                        minDate={TODAY}
                        onDayPress={handleDayPress}
                        markedDates={markedDates}
                        markingType="period"
                        theme={{
                            backgroundColor: colors.card,
                            calendarBackground: colors.card,
                            textSectionTitleColor: colors.textMuted,
                            selectedDayBackgroundColor: colors.primary,
                            selectedDayTextColor: colors.iconColorInverse,
                            todayTextColor: colors.primary,
                            dayTextColor: colors.text,
                            textDisabledColor: colors.border,
                            dotColor: colors.primary,
                            monthTextColor: colors.text,
                            indicatorColor: colors.primary,
                            textDayFontWeight: '500',
                            textMonthFontWeight: '700',
                            textDayHeaderFontWeight: '600',
                            textDayFontSize: 15,
                            textMonthFontSize: 17,
                            textDayHeaderFontSize: 12,
                        }}
                    />
                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.modalResetButton} onPress={resetDates}>
                            <Text style={styles.modalResetText}>{t('common', 'reset')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modalDoneButton,
                                (!startDate || !endDate) && styles.modalDoneButtonDisabled,
                            ]}
                            onPress={handleCalendarDone}
                            disabled={!startDate || !endDate}
                        >
                            <Text style={styles.modalDoneText}>
                                {startDate && endDate
                                    ? `${t('common', 'done')} (${numberOfDays} ${numberOfDays === 1 ? t('listing', 'day') : t('listing', 'days')})`
                                    : t('common', 'done')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 20 },
    backButton: { margin: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    errorText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 15 },
    imageGallery: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85, position: 'relative' },
    galleryImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.85 },
    headerOverlay: { position: 'absolute', top: Platform.OS === 'ios' ? 16 : 24, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 10 },
    headerRight: { flexDirection: 'row', gap: 12 },
    headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 },
    imageCounter: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
    imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    unavailableBadge: { position: 'absolute', top: Platform.OS === 'ios' ? 72 : 80, left: 16, backgroundColor: colors.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    unavailableText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    contentContainer: { paddingHorizontal: 20, paddingTop: 24 },
    topInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    categoryBadge: { backgroundColor: colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    categoryText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    title: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.4, marginBottom: 8 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    locationText: { fontSize: 14, color: colors.textMuted },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
    price: { fontSize: 28, fontWeight: '700', color: colors.text },
    perDay: { fontSize: 15, color: colors.textMuted, marginLeft: 4 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
    description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    hostCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    hostInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    hostAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.background, marginRight: 12 },
    hostTextContainer: { flex: 1, gap: 2 },
    hostName: { fontSize: 15, fontWeight: '600', color: colors.text },
    hostBadges: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    hostVerified: { fontSize: 12, color: colors.success, fontWeight: '500' },
    contactButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.border },
    contactButtonText: { fontSize: 13, fontWeight: '700', color: colors.text },
    datePickerButton: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    dateColumn: { flex: 1, gap: 3 },
    dateLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.4 },
    dateValue: { fontSize: 15, fontWeight: '600', color: colors.text },
    dateDivider: { width: 1, height: 32, backgroundColor: colors.border, marginHorizontal: 14 },
    resetButton: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 8, marginTop: 4 },
    resetButtonText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    priceBreakdown: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12, marginTop: 12 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    breakdownLabel: { fontSize: 14, color: colors.textSecondary },
    breakdownValue: { fontSize: 14, fontWeight: '600', color: colors.text },
    breakdownTotal: { paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.border },
    breakdownTotalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    breakdownTotalValue: { fontSize: 19, fontWeight: '700', color: colors.primary },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: Platform.OS === 'ios' ? 14 : 18, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
    bottomPriceInfo: { flexDirection: 'row', alignItems: 'baseline' },
    bottomPrice: { fontSize: 22, fontWeight: '700', color: colors.text },
    bottomPerDay: { fontSize: 14, color: colors.textMuted, marginLeft: 3 },
    bookButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 26, borderRadius: 14 },
    bookButtonDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
    bookButtonText: { fontSize: 15, fontWeight: '700', color: colors.iconColorInverse },
    sheetContent: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 36 : 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 19, fontWeight: '700', color: colors.text },
    calendar: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
    modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14 },
    modalResetButton: { paddingVertical: 12, paddingHorizontal: 16 },
    modalResetText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
    modalDoneButton: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    modalDoneButtonDisabled: { backgroundColor: colors.border, opacity: 0.5 },
    modalDoneText: { fontSize: 15, fontWeight: '700', color: colors.iconColorInverse },
});