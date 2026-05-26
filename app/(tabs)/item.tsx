import React, { useState, useMemo } from 'react';
import * as Linking from 'expo-linking';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Alert,
    Dimensions,
    Share,
    Platform,
    StatusBar
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Listing = {
    listingId: number;
    name: string;
    description: string;
    category: string;
    price: number;
    securityDeposit?: number;
    location: string;
    imageUrls: string;
    userName: string;
    userAvatar?: string;
    userRating?: number;
    isAvailable: boolean;
};

const MOCK_LISTINGS: Record<number, Listing> = {
    101: {
        listingId: 101,
        name: 'Professional Drill Set',
        description: 'High-quality cordless drill with 20+ attachments. Perfect for home improvement projects, furniture assembly, and light construction work. Includes carrying case, multiple drill bits, screwdriver heads, and two rechargeable batteries. Barely used, in excellent condition.',
        category: 'TOOLS',
        price: 45,
        securityDeposit: 100,
        location: 'San Francisco, CA',
        imageUrls: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=800,https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800,https://images.unsplash.com/photo-1581147036324-c17ac41f0a15?w=800',
        userName: 'Mike Johnson',
        userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        userRating: 4.8,
        isAvailable: true,
    }
};

export default function ListingDetailScreen() {
    const router = useRouter();
    const { listingId } = useLocalSearchParams<{ listingId: string }>();

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const isDark = scheme === 'dark';
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const listing = MOCK_LISTINGS[Number(listingId)] || MOCK_LISTINGS[101];

    const images = useMemo(() => {
        if (!listing.imageUrls) return [];
        return listing.imageUrls.split(',').map(url => url.trim()).filter(Boolean);
    }, [listing.imageUrls]);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    const [calendarVisible, setCalendarVisible] = useState(false);
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

    const subtotal = listing.price * numberOfDays;
    const deposit = listing.securityDeposit || 0;
    const total = subtotal + deposit;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Select date';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const resetDates = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectingStart(true);
    };

    const handleDayPress = (day: { dateString: string }) => {
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
    };

    const markedDates = useMemo(() => {
        const marked: any = {};
        if (startDate) {
            marked[startDate] = {
                startingDay: true,
                color: colors.primary,
                textColor: colors.iconColorInverse,
            };
        }
        if (endDate) {
            marked[endDate] = {
                endingDay: true,
                color: colors.primary,
                textColor: colors.iconColorInverse,
            };
        }
        if (startDate && endDate) {
            let current = new Date(startDate);
            const end = new Date(endDate);
            current.setDate(current.getDate() + 1);
            while (current < end) {
                const dateStr = current.toISOString().split('T')[0];
                marked[dateStr] = {
                    color: colors.primary + '30',
                    textColor: colors.text,
                };
                current.setDate(current.getDate() + 1);
            }
        }
        return marked;
    }, [startDate, endDate, colors]);

    const handleContactHost = () => {
        router.push({
            pathname: '/chat',
            params: {
                conversation: JSON.stringify({
                    id: listing.listingId,
                    name: listing.userName,
                    itemName: listing.name,
                    avatar: listing.userAvatar || '',
                    isOnline: false,
                }),
            },
        });
    };

    const handleBook = () => {
        if (!startDate || !endDate) {
            Alert.alert('Select Dates', 'Please select your rental dates first.');
            return;
        }
        Alert.alert(
            'Confirm Booking',
            `Book ${listing.name} for ${numberOfDays} day${numberOfDays > 1 ? 's' : ''}?\n\nTotal: $${total}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        Alert.alert('🎉 Booking Confirmed!', 'The host will contact you shortly.');
                        router.back();
                    },
                },
            ]
        );
    };

    const handleShare = async () => {
        try {
            const appUrl = Linking.createURL('/item', {
                queryParams: { listingId: listing.listingId.toString() },
            });
            if (Platform.OS === 'ios') {
                await Share.share({
                    title: listing.name,
                    url: appUrl,
                    message: `${listing.name}\n\n💰 $${listing.price}/day\n📍 ${listing.location}`,
                });
            } else {
                await Share.share({
                    title: listing.name,
                    message: `📦 ${listing.name}\n\n💰 $${listing.price}/day\n📍 ${listing.location}\n\n👉 ${appUrl}`,
                });
            }
        } catch (error: any) {
            Alert.alert('Share Error', error.message || 'Could not share this listing.');
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ─── IMAGE GALLERY ─── */}
                <View style={styles.imageGallery}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const index = Math.round(
                                e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                            );
                            setActiveImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                    >
                        {images.map((url, index) => (
                            <Image
                                key={index}
                                source={{ uri: url }}
                                style={styles.galleryImage}
                                contentFit="cover"
                            />
                        ))}
                    </ScrollView>


                    <View style={styles.headerOverlay}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={22} color={colors.text} />
                        </TouchableOpacity>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                                <Ionicons name="share-outline" size={20} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => setIsFavorite(!isFavorite)}
                            >
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
                            <Text style={styles.imageCounterText}>
                                {activeImageIndex + 1} / {images.length}
                            </Text>
                        </View>
                    )}

                    {!listing.isAvailable && (
                        <View style={styles.unavailableBadge}>
                            <Text style={styles.unavailableText}>Currently Unavailable</Text>
                        </View>
                    )}
                </View>

                {/* ─── CONTENT ─── */}
                <View style={styles.contentContainer}>
                    <View style={styles.topInfoRow}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{listing.category}</Text>
                        </View>
                        {listing.userRating && (
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={16} color={colors.rating} />
                                <Text style={styles.ratingText}>{listing.userRating}</Text>
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
                        <Text style={styles.perDay}>/day</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{listing.description}</Text>

                    <View style={styles.divider} />

                    {/* Hosted By */}
                    <Text style={styles.sectionTitle}>Hosted by</Text>
                    <View style={styles.hostCard}>
                        <View style={styles.hostInfo}>
                            <Image
                                source={{ uri: listing.userAvatar || 'https://i.pravatar.cc/150' }}
                                style={styles.hostAvatar}
                            />
                            <View style={styles.hostTextContainer}>
                                <Text style={styles.hostName}>{listing.userName}</Text>
                                <View style={styles.hostBadges}>
                                    <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                                    <Text style={styles.hostVerified}>Verified Host</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={handleContactHost}
                        >
                            <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                            <Text style={styles.contactButtonText}>Contact</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    {/* Booking Section */}
                    <Text style={styles.sectionTitle}>Select Dates</Text>

                    <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setCalendarVisible(true)}
                        disabled={!listing.isAvailable}
                    >
                        <View style={styles.dateColumn}>
                            <Text style={styles.dateLabel}>CHECK-IN</Text>
                            <Text style={styles.dateValue}>
                                {formatDate(startDate)}
                            </Text>
                        </View>
                        <View style={styles.dateDivider} />
                        <View style={styles.dateColumn}>
                            <Text style={styles.dateLabel}>CHECK-OUT</Text>
                            <Text style={styles.dateValue}>
                                {formatDate(endDate)}
                            </Text>
                        </View>
                        <Ionicons name="calendar-outline" size={22} color={colors.primary} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>

                    {(startDate || endDate) && (
                        <TouchableOpacity style={styles.resetButton} onPress={resetDates}>
                            <Text style={styles.resetButtonText}>Reset dates</Text>
                        </TouchableOpacity>
                    )}

                    {/* Price Breakdown */}
                    {numberOfDays > 0 && (
                        <View style={styles.priceBreakdown}>
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>
                                    ${listing.price} × {numberOfDays} day{numberOfDays > 1 ? 's' : ''}
                                </Text>
                                <Text style={styles.breakdownValue}>${subtotal}</Text>
                            </View>
                            {deposit > 0 && (
                                <View style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>Security deposit</Text>
                                    <Text style={styles.breakdownValue}>${deposit}</Text>
                                </View>
                            )}
                            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                                <Text style={styles.breakdownTotalLabel}>Total</Text>
                                <Text style={styles.breakdownTotalValue}>${total}</Text>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* Usklađen i prostraniji Sticky Bottom Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomPriceInfo}>
                    <Text style={styles.bottomPrice}>${listing.price}</Text>
                    <Text style={styles.bottomPerDay}>/day</Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.bookButton,
                        !listing.isAvailable && styles.bookButtonDisabled,
                    ]}
                    onPress={handleBook}
                    disabled={!listing.isAvailable}
                >
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.iconColorInverse} />
                    <Text style={styles.bookButtonText}>
                        {listing.isAvailable ? 'Book Now' : 'Unavailable'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Calendar Modal */}
            <Modal
                visible={calendarVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setCalendarVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectingStart ? 'Select Check-in' : 'Select Check-out'}
                            </Text>
                            <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                                <Ionicons name="close" size={26} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Calendar
                            style={styles.calendar}
                            minDate={today}
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
                                <Text style={styles.modalResetText}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalDoneButton,
                                    (!startDate || !endDate) && styles.modalDoneButtonDisabled,
                                ]}
                                onPress={() => setCalendarVisible(false)}
                                disabled={!startDate || !endDate}
                            >
                                <Text style={styles.modalDoneText}>
                                    {startDate && endDate
                                        ? `Done (${numberOfDays} ${numberOfDays === 1 ? 'day' : 'days'})`
                                        : 'Done'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    imageGallery: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 0.85,
        position: 'relative',
    },
    galleryImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 0.85,
    },
    headerOverlay: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 16 : 24,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 10,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
    },
    imageCounter: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
    imageCounterText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    unavailableBadge: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 72 : 80,
        left: 16,
        backgroundColor: colors.danger,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    unavailableText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    topInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: colors.border,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        color: colors.textSecondary,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: -0.4,
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    locationText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    price: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
    },
    perDay: {
        fontSize: 15,
        color: colors.textMuted,
        marginLeft: 4,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    hostCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    hostInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    hostAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.background,
        marginRight: 12,
    },
    hostTextContainer: {
        flex: 1,
        gap: 2,
    },
    hostName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    hostBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    hostVerified: {
        fontSize: 12,
        color: colors.success,
        fontWeight: '500',
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: colors.border,
    },
    contactButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dateColumn: {
        flex: 1,
        gap: 3,
    },
    dateLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
        letterSpacing: 0.4,
    },
    dateValue: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    dateDivider: {
        width: 1,
        height: 32,
        backgroundColor: colors.border,
        marginHorizontal: 14,
    },
    resetButton: {
        alignSelf: 'flex-end',
        paddingVertical: 6,
        paddingHorizontal: 8,
        marginTop: 4,
    },
    resetButtonText: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '600',
    },
    priceBreakdown: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
        marginTop: 12,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    breakdownLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    breakdownValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    breakdownTotal: {
        paddingTop: 12,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    breakdownTotalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    breakdownTotalValue: {
        fontSize: 19,
        fontWeight: '700',
        color: colors.primary,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: Platform.OS === 'ios' ? 14 : 18,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    bottomPriceInfo: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    bottomPrice: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
    },
    bottomPerDay: {
        fontSize: 14,
        color: colors.textMuted,
        marginLeft: 3,
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 26,
        borderRadius: 14,
    },
    bookButtonDisabled: {
        backgroundColor: colors.textMuted,
        opacity: 0.5,
    },
    bookButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.iconColorInverse,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: colors.text,
    },
    calendar: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 14,
    },
    modalResetButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    modalResetText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textMuted,
    },
    modalDoneButton: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalDoneButtonDisabled: {
        backgroundColor: colors.border,
        opacity: 0.5,
    },
    modalDoneText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.iconColorInverse,
    },
});