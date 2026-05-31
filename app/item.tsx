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
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
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
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png';
const TODAY = new Date().toISOString().split('T')[0];

export default function ListingDetailScreen() {
    const router = useRouter();
    const { listingId } = useLocalSearchParams<{ listingId: string }>();
    const { t } = useLanguage();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const isDark = scheme === 'dark';
    const styles = useMemo(() => makeStyles(colors), [colors]);

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
    const snapPoints = useMemo(() => ['75%', '90%'], []);

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

    // ✅ POJEDNOSTAVLJENA LOGIKA - podržava 1 dan
    const handleDayPress = useCallback((day: { dateString: string }) => {
        Haptics.selectionAsync();

        if (selectingStart) {
            // Prvi klik - postavi start date
            setStartDate(day.dateString);
            setEndDate(null);
            setSelectingStart(false);
        } else {
            // Drugi klik
            if (startDate && day.dateString >= startDate) {
                // Datum je nakon ili jednak start date - postavi end date
                setEndDate(day.dateString);
                setSelectingStart(true);
            } else {
                // Datum je prije start date - resetiraj i postavi novi start
                setStartDate(day.dateString);
                setEndDate(null);
            }
        }
    }, [selectingStart, startDate]);

    // ✅ PERIOD MARKING - stabilniji i jednostavniji
    const markedDates = useMemo(() => {
        const marked: any = {};

        // Blokirani periodi
        blockedPeriods.forEach(({ startDate: s, endDate: e }) => {
            let current = new Date(s);
            const end = new Date(e);
            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                marked[dateStr] = {
                    disabled: true,
                    disableTouchEvent: true,
                    color: colors.danger + '40',
                    textColor: colors.danger,
                };
                current.setDate(current.getDate() + 1);
            }
        });

        // Odabrani period
        if (startDate && endDate) {
            marked[startDate] = {
                startingDay: true,
                color: colors.primary,
                textColor: colors.iconColorInverse
            };
            marked[endDate] = {
                endingDay: true,
                color: colors.primary,
                textColor: colors.iconColorInverse
            };

            // Dani između
            let current = new Date(startDate);
            const end = new Date(endDate);
            current.setDate(current.getDate() + 1);
            while (current < end) {
                const dateStr = current.toISOString().split('T')[0];
                marked[dateStr] = {
                    color: colors.primary + '40',
                    textColor: colors.text
                };
                current.setDate(current.getDate() + 1);
            }
        } else if (startDate) {
            // Samo start date odabran
            marked[startDate] = {
                selected: true,
                color: colors.primary,
                textColor: colors.iconColorInverse
            };
        }

        return marked;
    }, [startDate, endDate, colors, blockedPeriods]);

    const handleContactHost = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!listing) return;
        router.push({
            pathname: '/chat',
            params: {
                listingId: listing.listingId.toString(),
                ownerId: (listing.userId ?? 0).toString(),
                ownerName: listing.userName,
                itemName: listing.name,
            },
        });
    }, [listing, router]);

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
            `Book ${listing.name} for ${numberOfDays} ${dayWord}?\n\n${t('listing', 'total')}: $${total}`,
            [
                { text: t('common', 'cancel'), style: 'cancel' },
                {
                    text: t('common', 'confirm'),
                    onPress: async () => {
                        setBooking(true);
                        const convResult = await getOrCreateConversation(listing.listingId);

                        if (!convResult.success || !convResult.data) {
                            setBooking(false);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert(t('common', 'error'), convResult.message || 'Failed to start conversation');
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
                            Alert.alert(
                                '🎉 ' + t('listing', 'requestSent'),
                                t('listing', 'requestSentSub'),
                                [
                                    { text: t('listing', 'goToInbox'), onPress: () => router.replace('/(tabs)/inbox') },
                                    { text: t('common', 'ok'), onPress: () => router.back() },
                                ]
                            );
                        } else {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert(t('common', 'error'), bookingResult.message);
                        }
                    },
                },
            ]
        );
    }, [listing, startDate, endDate, numberOfDays, total, t, router]);

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
            Alert.alert(t('common', 'error'), error.message || 'Could not share this listing.');
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
                            <TouchableOpacity style={styles.headerButton} onPress={handleToggleFavourite}>
                                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? colors.danger : colors.text} />
                            </TouchableOpacity>
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

                    {/* DATE PICKER */}
                    <Text style={styles.sectionTitle}>{t('listing', 'selectDates')}</Text>
                    <TouchableOpacity style={styles.datePickerButton} onPress={openCalendar} disabled={!listing.isAvailable}>
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
                    {numberOfDays > 0 && (
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
                    <View style={{ height: 140 }} />
                </View>
            </ScrollView>

            {/* STICKY BOTTOM BAR */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomPriceInfo}>
                    <Text style={styles.bottomPrice}>${listing.price}</Text>
                    <Text style={styles.bottomPerDay}>{t('listing', 'perDay')}</Text>
                </View>
                <TouchableOpacity style={[styles.bookButton, (!listing.isAvailable || booking) && styles.bookButtonDisabled]} onPress={handleBook} disabled={!listing.isAvailable || booking}>
                    <Text style={styles.bookButtonText}>{t('listing', 'bookNow')}</Text>
                </TouchableOpacity>
            </View>

            {/* KALENDAR */}
            <BottomSheet
                ref={calendarSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backgroundStyle={{
                    backgroundColor: colors.card,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24
                }}
                handleIndicatorStyle={{
                    backgroundColor: colors.textMuted,
                    width: 40
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

                    {/* INFO BAR */}
                    <View style={styles.calendarInfoBar}>
                        <View style={styles.calendarInfoItem}>
                            <Text style={styles.calendarInfoLabel}>{t('listing', 'checkIn')}</Text>
                            <Text style={styles.calendarInfoValue}>{formatDateShort(startDate)}</Text>
                        </View>
                        <View style={styles.calendarInfoDivider} />
                        <View style={styles.calendarInfoItem}>
                            <Text style={styles.calendarInfoLabel}>{t('listing', 'checkOut')}</Text>
                            <Text style={styles.calendarInfoValue}>{formatDateShort(endDate)}</Text>
                        </View>
                        {numberOfDays > 0 && (
                            <>
                                <View style={styles.calendarInfoDivider} />
                                <View style={styles.calendarInfoItem}>
                                    <Text style={styles.calendarInfoLabel}>
                                        {numberOfDays === 1 ? t('listing', 'day') : t('listing', 'days')}
                                    </Text>
                                    <Text style={[styles.calendarInfoValue, { color: colors.primary }]}>
                                        {numberOfDays}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* KALENDAR - PERIOD MARKING */}
                    <View style={styles.calendarWrapper}>
                        <Calendar
                            current={currentMonth}
                            minDate={TODAY}
                            onDayPress={handleDayPress}
                            onMonthChange={(month) => setCurrentMonth(month.dateString)}
                            markedDates={markedDates}
                            markingType="period"
                            hideExtraDays={true}
                            enableSwipeMonths={true}
                            theme={{
                                calendarBackground: colors.card,
                                dayTextColor: colors.text,
                                monthTextColor: colors.text,
                                todayTextColor: colors.primary,
                                arrowColor: colors.primary,
                                textMonthFontWeight: '700',
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 13,
                                textDayHeaderFontWeight: '600',
                                textDayFontSize: 16,
                            }}
                        />
                    </View>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.modalResetButton} onPress={resetDates}>
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
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>
            </BottomSheet>
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
    headerOverlay: { position: 'absolute', top: Platform.OS === 'ios' ? 44 : 24, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 10 },
    headerRight: { flexDirection: 'row', gap: 12 },
    headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    imageCounter: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
    imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    contentContainer: { paddingHorizontal: 20, paddingTop: 24 },
    topInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    categoryBadge: { backgroundColor: colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    categoryText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
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
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 15 : 0 },
    bottomPriceInfo: { flexDirection: 'row', alignItems: 'baseline' },
    bottomPrice: { fontSize: 22, fontWeight: '700', color: colors.text },
    bottomPerDay: { fontSize: 13, color: colors.textMuted, marginLeft: 2 },
    bookButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    bookButtonDisabled: { opacity: 0.5 },
    bookButtonText: { color: colors.iconColorInverse, fontSize: 15, fontWeight: '600' },
    sheetContent: { flex: 1, paddingHorizontal: 20, gap: 12 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    calendarInfoBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    calendarInfoItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    calendarInfoLabel: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    calendarInfoValue: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    calendarInfoDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.border,
    },
    calendarWrapper: {
        flex: 1,
        marginTop: 8,
    },
    modalFooter: { flexDirection: 'row', gap: 12, marginTop: 12, paddingBottom: 8 },
    modalResetButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    modalResetText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
    modalDoneButton: { flex: 2, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    modalDoneButtonDisabled: { opacity: 0.5 },
    modalDoneText: { fontSize: 15, fontWeight: '600', color: colors.iconColorInverse },
});