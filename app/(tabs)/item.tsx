import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Alert,
    Dimensions,
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

// Mock podaci - zamijeni s pravim API pozivom
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
    },
    102: {
        listingId: 102,
        name: '4-Person Camping Tent',
        description: 'Waterproof tent, easy setup, sleeps 4 comfortably. Perfect for weekend camping trips. Includes rain fly, stakes, and carrying bag. Used only twice.',
        category: 'CAMPING',
        price: 35,
        securityDeposit: 75,
        location: 'Portland, OR',
        imageUrls: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800',
        userName: 'Sarah Williams',
        userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        userRating: 4.9,
        isAvailable: true,
    },
    103: {
        listingId: 103,
        name: 'Gaming Mechanical Keyboard',
        description: 'RGB backlit, Cherry MX switches, perfect for gaming. Full-size layout with dedicated media controls and USB passthrough.',
        category: 'TECH',
        price: 25,
        securityDeposit: 50,
        location: 'Austin, TX',
        imageUrls: 'https://i.extremetech.com/imagery/content-types/00hygCJbhhvWfYz79pKTe4x/hero-image.fit_lim.size_1600x900.v1678673392.jpg',
        userName: 'Alex Chen',
        userAvatar: 'https://randomuser.me/api/portraits/men/75.jpg',
        userRating: 4.7,
        isAvailable: false,
    },
};

export default function ListingDetailScreen() {
    const router = useRouter();
    const { listingId } = useLocalSearchParams<{ listingId: string }>();

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);

    // Dohvati listing (mock - zamijeni s API pozivom)
    const listing = MOCK_LISTINGS[Number(listingId)] || MOCK_LISTINGS[101];

    // State za slike
    const images = useMemo(() => {
        if (!listing.imageUrls) return [];
        return listing.imageUrls.split(',').map(url => url.trim()).filter(Boolean);
    }, [listing.imageUrls]);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    // State za kalendar
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [selectingStart, setSelectingStart] = useState(true);

    // Izračun broja dana i cijene
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

    // Formatiranje datuma
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Select date';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Reset kalendara
    const resetDates = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectingStart(true);
    };

    // Odabir datuma u kalendaru
    const handleDayPress = (day: { dateString: string }) => {
        if (selectingStart) {
            setStartDate(day.dateString);
            setEndDate(null);
            setSelectingStart(false);
        } else {
            if (startDate && new Date(day.dateString) >= new Date(startDate)) {
                setEndDate(day.dateString);
            } else {
                // Ako je novi datum prije startnog, resetiraj i postavi novi start
                setStartDate(day.dateString);
                setEndDate(null);
            }
        }
    };

    // Označeni dani u kalendaru
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
        // Označi dane između
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

    // Navigacija na chat
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

    // Booking
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

    const today = new Date().toISOString().split('T')[0];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ─── HEADER ─── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.headerButton}>
                            <Ionicons name="share-outline" size={22} color={colors.text} />
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

                    {/* Image counter */}
                    {images.length > 1 && (
                        <View style={styles.imageCounter}>
                            <Text style={styles.imageCounterText}>
                                {activeImageIndex + 1} / {images.length}
                            </Text>
                        </View>
                    )}

                    {/* Unavailable badge */}
                    {!listing.isAvailable && (
                        <View style={styles.unavailableBadge}>
                            <Text style={styles.unavailableText}>Currently Unavailable</Text>
                        </View>
                    )}
                </View>

                {/* ─── CONTENT ─── */}
                <View style={styles.contentContainer}>
                    {/* Category + Rating */}
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

                    {/* Title */}
                    <Text style={styles.title}>{listing.name}</Text>

                    {/* Location */}
                    <View style={styles.locationRow}>
                        <Ionicons name="location" size={16} color={colors.textMuted} />
                        <Text style={styles.locationText}>{listing.location}</Text>
                    </View>

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>${listing.price}</Text>
                        <Text style={styles.perDay}>/day</Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Description */}
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{listing.description}</Text>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Host Card */}
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
                            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                            <Text style={styles.contactButtonText}>Contact</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
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
                        <Ionicons name="calendar-outline" size={22} color={colors.primary} />
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

                    {/* Spacer za sticky bottom bar */}
                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* ─── STICKY BOTTOM BAR ─── */}
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
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.bookButtonText}>
                        {listing.isAvailable ? 'Book Now' : 'Unavailable'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ─── CALENDAR MODAL ─── */}
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
                                <Ionicons name="close" size={28} color={colors.text} />
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
                                textDayFontSize: 16,
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 13,
                            }}
                        />

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalResetButton}
                                onPress={resetDates}
                            >
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
                                        ? `Done (${numberOfDays} day${numberOfDays > 1 ? 's' : ''})`
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

    // ─── HEADER ───
    header: {
        position: 'absolute',
        top: 50,
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
        gap: 8,
    },

    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },

    // ─── IMAGE GALLERY ───
    imageGallery: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 0.85,
        position: 'relative',
    },

    galleryImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 0.85,
    },

    imageCounter: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
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
        top: 16,
        left: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },

    unavailableText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    // ─── CONTENT ───
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },

    topInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },

    categoryBadge: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },

    categoryText: {
        color: colors.primary,
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
        letterSpacing: -0.3,
        marginBottom: 8,
    },

    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 16,
    },

    locationText: {
        fontSize: 14,
        color: colors.textMuted,
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 20,
    },

    price: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.primary,
    },

    perDay: {
        fontSize: 16,
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
        marginBottom: 12,
        letterSpacing: -0.2,
    },

    description: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 22,
    },

    // ─── HOST CARD ───
    hostCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        backgroundColor: colors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },

    hostInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    hostAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.border,
        marginRight: 12,
    },

    hostTextContainer: {
        flex: 1,
        gap: 3,
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
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: colors.primary + '15',
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },

    contactButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },

    // ─── DATE PICKER ───
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 10,
    },

    dateColumn: {
        flex: 1,
        gap: 4,
    },

    dateLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
        letterSpacing: 0.5,
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
        marginHorizontal: 16,
    },

    resetButton: {
        alignSelf: 'flex-end',
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginBottom: 16,
    },

    resetButtonText: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '600',
    },

    // ─── PRICE BREAKDOWN ───
    priceBreakdown: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
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
        paddingTop: 10,
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
        fontSize: 20,
        fontWeight: '700',
        color: colors.primary,
    },

    // ─── BOTTOM BAR ───
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
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
        marginLeft: 4,
    },

    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 14,
    },

    bookButtonDisabled: {
        backgroundColor: colors.textMuted,
        opacity: 0.6,
    },

    bookButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },

    // ─── CALENDAR MODAL ───
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },

    modalContent: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
        paddingBottom: 30,
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },

    calendar: {
        borderRadius: 0,
        padding: 10,
    },

    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
    },

    modalResetButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },

    modalResetText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },

    modalDoneButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: 'center',
    },

    modalDoneButtonDisabled: {
        opacity: 0.5,
    },

    modalDoneText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});