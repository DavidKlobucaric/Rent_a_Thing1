import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    Keyboard, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { useAuth } from '@/src/context/authContext';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import {
    getOrCreateConversation,
    getMessages,
    sendMessage as sendMessageApi,
    markConversationRead,
    respondToBooking,
    confirmPickup,
    confirmReturn,
    cancelBooking,
    getBookingPin,
    type ChatMessage,
    type BookingDetails,
} from '@/src/api/chatApi';

type ChatParams = {
    conversationId?: string;
    listingId: string;
    ownerId: string;
    ownerName: string;
    itemName: string;
};

const avatarUri = (userId: string | number) => `https://i.pravatar.cc/150?u=${userId}`;

const useCountdown = (expiresAt?: string) => {
    const [timeLeft, setTimeLeft] = useState<{
        hours: number;
        minutes: number;
        seconds: number;
        total: number;
    } | null>(null);

    useEffect(() => {
        if (!expiresAt) {
            setTimeLeft(null);
            return;
        }
        const calculateTimeLeft = () => {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
                return;
            }
            setTimeLeft({
                hours: Math.floor(diff / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
                total: diff,
            });
        };
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    return timeLeft;
};

export default function Chat() {
    const params = useLocalSearchParams<ChatParams>();
    const { t } = useLanguage();
    const { user: me } = useAuth();
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [scheme]);

    const scrollRef = useRef<ScrollView>(null);
    const pickupSheetRef = useRef<BottomSheet>(null);

    const [conversationId, setConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [keyboardOffset, setKeyboardOffset] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);
    const [pinInput, setPinInput] = useState(['', '', '', '']);
    const pinRefs = useRef<(TextInput | null)[]>([]);
    const [pins, setPins] = useState<Record<number, string>>({});

    const latestMessageIdForBooking = useMemo(() => {
        const map: Record<number, number> = {};
        messages.forEach((msg) => {
            if (msg.bookingDetails?.bookingId) {
                map[msg.bookingDetails.bookingId] = msg.id;
            }
        });
        return map;
    }, [messages]);

    useEffect(() => {
        const show = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardOffset(e.endCoordinates?.height ?? 0)
        );
        const hide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardOffset(0)
        );
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    useEffect(() => {
        if (!params.listingId) return;
        let isActive = true;
        (async () => {
            setLoading(true);
            setError('');
            let cid: number;
            if (params.conversationId) {
                cid = Number(params.conversationId);
                setConversationId(cid);
            } else {
                const convResult = await getOrCreateConversation(Number(params.listingId));
                if (!isActive) return;
                if (!convResult.success || !convResult.data) {
                    setError(convResult.message || 'Failed to start conversation');
                    setLoading(false);
                    return;
                }
                cid = convResult.data.conversationId;
                setConversationId(cid);
            }
            const msgResult = await getMessages(cid);
            if (!isActive) return;
            if (msgResult.success) {
                setMessages(msgResult.data ?? []);
            } else {
                setError(msgResult.message || 'Could not load messages');
                setLoading(false);
                return;
            }
            await markConversationRead(cid);
            if (isActive) setLoading(false);
        })();
        return () => {
            isActive = false;
        };
    }, [params.listingId, params.conversationId]);

    useEffect(() => {
        if (!conversationId) return;

        const pollMessages = async () => {
            try {
                const msgResult = await getMessages(conversationId);
                if (msgResult.success && msgResult.data) {
                    const lastId = (msgs: ChatMessage[]) => msgs[msgs.length - 1]?.id ?? -1;
                    const lastStatus = (msgs: ChatMessage[]) =>
                        [...msgs].reverse().find(m => m.bookingDetails)?.bookingDetails?.status;

                    setMessages(prev => {
                        const next = msgResult.data ?? [];
                        if (lastId(next) !== lastId(prev) || lastStatus(next) !== lastStatus(prev)) {
                            return next;
                        }
                        return prev;
                    });
                }
            } catch (err) {
                console.log("Polling error:", err);
            }
        };

        const intervalId = setInterval(pollMessages, 3000);
        return () => clearInterval(intervalId);
    }, [conversationId]);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages]);

    useEffect(() => {
        const fetchPins = async () => {
            const confirmedBookings = messages
                .filter(m => m.bookingDetails?.status === 'confirmed' && m.bookingDetails?.myRole === 'owner')
                .map(m => m.bookingDetails!.bookingId);

            const uniqueBookings = [...new Set(confirmedBookings)];

            for (const bId of uniqueBookings) {
                if (!pins[bId]) {
                    const result = await getBookingPin(bId);
                    if (result.success && result.data) {
                        setPins(prev => ({ ...prev, [bId]: result.data! }));
                    }
                }
            }
        };

        if (messages.length > 0) fetchPins();
    }, [messages]);

    const formatTime = useCallback((iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, []);

    const formatDateShort = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const handleSend = useCallback(async () => {
        if (!input.trim() || !conversationId || sending) return;
        const text = input.trim();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setInput('');
        setSending(true);
        const optimistic: ChatMessage = {
            id: -Date.now(),
            conversationId,
            senderId: Number(me?.userId ?? -1),
            senderName: me?.username ?? 'Me',
            content: text,
            sentAt: new Date().toISOString(),
            type: 'text',
        };
        setMessages((prev) => [...prev, optimistic]);
        const result = await sendMessageApi(conversationId, text);
        if (result.success && result.data) {
            setMessages((prev) =>
                prev.map((m) => (m.id === optimistic.id ? result.data! : m))
            );
        } else {
            setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
            setInput(text);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setSending(false);
    }, [input, conversationId, sending, me]);

    const handleConfirmBooking = async (bookingId: number) => {
        setActionLoading(true);
        const result = await respondToBooking(bookingId, 'confirm');
        setActionLoading(false);
        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (conversationId) {
                const msgResult = await getMessages(conversationId);
                if (msgResult.success) setMessages(msgResult.data ?? []);
            }
        } else {
            Alert.alert(t('common', 'error'), result.message);
        }
    };

    const handleDeclineBooking = async (bookingId: number) => {
        Alert.alert(t('chat', 'declineBooking'), 'Are you sure?', [
            { text: t('common', 'cancel'), style: 'cancel' },
            {
                text: t('chat', 'declineBooking'),
                style: 'destructive',
                onPress: async () => {
                    setActionLoading(true);
                    const result = await respondToBooking(bookingId, 'decline');
                    setActionLoading(false);
                    if (result.success) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        if (conversationId) {
                            const msgResult = await getMessages(conversationId);
                            if (msgResult.success) setMessages(msgResult.data ?? []);
                        }
                    } else {
                        Alert.alert(t('common', 'error'), result.message);
                    }
                },
            },
        ]);
    };

    const handleCancelBooking = async (bookingId: number) => {
        Alert.alert(t('chat', 'cancelBooking'), 'Are you sure you want to cancel?', [
            { text: t('common', 'cancel'), style: 'cancel' },
            {
                text: t('chat', 'cancelBooking'),
                style: 'destructive',
                onPress: async () => {
                    setActionLoading(true);
                    const result = await cancelBooking(bookingId);
                    setActionLoading(false);
                    if (result.success && conversationId) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        const msgResult = await getMessages(conversationId);
                        if (msgResult.success) setMessages(msgResult.data ?? []);
                    }
                },
            },
        ]);
    };

    const handlePinChange = (text: string, index: number) => {
        const newPin = [...pinInput];
        newPin[index] = text;
        setPinInput(newPin);

        if (text && index < 3) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    const handlePinKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !pinInput[index] && index > 0) {
            pinRefs.current[index - 1]?.focus();
        }
    };

    const handleConfirmPickup = async (bookingId: number) => {
        const pinString = pinInput.join('');
        if (pinString.length !== 4) {
            Alert.alert(t('common', 'error'), 'PIN must be 4 digits');
            return;
        }
        setActionLoading(true);
        const result = await confirmPickup(bookingId, pinString);
        setActionLoading(false);
        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            pickupSheetRef.current?.close();
            setPinInput(['', '', '', '']);
            if (conversationId) {
                const msgResult = await getMessages(conversationId);
                if (msgResult.success) setMessages(msgResult.data ?? []);
            }
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('common', 'error'), result.message);
        }
    };

    const handleMarkReturned = async (bookingId: number) => {
        Alert.alert(t('chat', 'markReturned'), 'Confirm the item has been returned?', [
            { text: t('common', 'cancel'), style: 'cancel' },
            {
                text: t('chat', 'markReturned'),
                onPress: async () => {
                    setActionLoading(true);
                    const result = await confirmReturn(bookingId);
                    setActionLoading(false);
                    if (result.success) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        if (conversationId) {
                            const msgResult = await getMessages(conversationId);
                            if (msgResult.success) setMessages(msgResult.data ?? []);
                        }
                    }
                },
            },
        ]);
    };

    const handleBack = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    }, []);

    const myId = Number(me?.userId ?? -1);

    const CountdownTimer = ({ expiresAt }: { expiresAt: string }) => {
        const timeLeft = useCountdown(expiresAt);
        if (!timeLeft) return null;
        if (timeLeft.total <= 0) {
            return (
                <View style={styles.countdownExpired}>
                    <View style={[styles.countdownDot, { backgroundColor: colors.danger }]} />
                    <Text style={[styles.countdownText, { color: colors.danger }]}>
                        {String(t('chat', 'expired'))}
                    </Text>
                </View>
            );
        }
        const urgencyColor =
            timeLeft.hours >= 12
                ? colors.success
                : timeLeft.hours >= 6
                    ? '#FF9500'
                    : colors.danger;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return (
            <View style={styles.countdownContainer}>
                <View style={[styles.countdownDot, { backgroundColor: urgencyColor }]} />
                <Text style={[styles.countdownLabel]}>
                    {String(t('chat', 'autoDeclinesIn'))}
                </Text>
                <Text style={[styles.countdownTime, { color: urgencyColor }]}>
                    {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
                </Text>
            </View>
        );
    };

    const renderBookingCard = (msg: ChatMessage, booking: BookingDetails) => {
        const isRenter = booking.myRole === 'renter';
        const isOwner = booking.myRole === 'owner';
        const otherPerson = isRenter ? booking.ownerName : booking.renterName;

        const pin = booking.pickupPin || pins[booking.bookingId];

        // 🎨 PROFESIONALNIJE IKONE - kontekstualno prilagođene
        const statusConfig = {
            pending: { color: '#FF9500', bg: '#FF950015', icon: 'hourglass-outline' as const },
            confirmed: { color: colors.success, bg: colors.success + '18', icon: 'shield-checkmark-outline' as const },
            active: { color: colors.primary, bg: colors.primary + '18', icon: 'play-circle-outline' as const },
            completed: { color: colors.textMuted, bg: colors.textMuted + '18', icon: 'ribbon-outline' as const },
            declined: { color: colors.danger, bg: colors.danger + '15', icon: 'close-circle-outline' as const },
            cancelled: { color: colors.danger, bg: colors.danger + '15', icon: 'ban-outline' as const },
            expired: { color: colors.textMuted, bg: colors.textMuted + '18', icon: 'timer-outline' as const },
        };
        const cfg = statusConfig[booking.status];

        return (
            <View style={styles.bookingCard}>
                <View style={styles.bookingCardTopRow}>
                    <View style={[styles.bookingStatusBadge, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                        <Text style={[styles.bookingStatusText, { color: cfg.color }]}>
                            {booking.status === 'expired'
                                ? String(t('chat', 'expired'))
                                : String(booking.status.charAt(0).toUpperCase() + booking.status.slice(1))}
                        </Text>
                    </View>
                    {booking.status === 'pending' && booking.expiresAt && (
                        <CountdownTimer expiresAt={booking.expiresAt} />
                    )}
                </View>

                <Text style={styles.bookingCardTitle}>
                    {booking.status === 'pending'
                        ? String(t('chat', 'bookingRequested'))
                        : String(booking.listingName || '')}
                </Text>
                <Text style={styles.bookingCardSubtitle}>
                    {isRenter ? `Booking from ${otherPerson}` : `Booking for ${otherPerson}`}
                </Text>

                <View style={styles.bookingItemRow}>
                    <Image
                        source={{ uri: booking.listingImage }}
                        style={styles.bookingItemImage}
                        contentFit="cover"
                    />
                    <View style={styles.bookingItemInfo}>
                        <Text style={styles.bookingItemName} numberOfLines={2}>
                            {String(booking.listingName || '')}
                        </Text>
                        <View style={styles.bookingInfoRow}>
                            <Ionicons name="calendar-clear-outline" size={13} color={colors.textMuted} />
                            <Text style={styles.bookingInfoText}>
                                {formatDateShort(booking.startDate)} → {formatDateShort(booking.endDate)}
                            </Text>
                        </View>
                        <View style={styles.bookingInfoRow}>
                            <Ionicons name="person-circle-outline" size={13} color={colors.textMuted} />
                            <Text style={styles.bookingInfoText}>
                                {isRenter ? `Owner: ${otherPerson}` : `Renter: ${otherPerson}`}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bookingPriceBox}>
                    <View style={styles.bookingPriceRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="pricetag-outline" size={13} color={colors.textMuted} />
                            <Text style={styles.bookingPriceLabel}>
                                ${booking.dailyRate} × {booking.numberOfDays} {booking.numberOfDays === 1 ? String(t('chat', 'day')) : String(t('chat', 'days'))}
                            </Text>
                        </View>
                        <Text style={styles.bookingPriceValue}>
                            ${booking.dailyRate * booking.numberOfDays}
                        </Text>
                    </View>
                    {booking.deposit > 0 && (
                        <View style={styles.bookingPriceRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="shield-outline" size={13} color={colors.textMuted} />
                                <Text style={styles.bookingPriceLabel}>Deposit</Text>
                            </View>
                            <Text style={styles.bookingPriceValue}>${booking.deposit}</Text>
                        </View>
                    )}
                    <View style={styles.bookingPriceDivider} />
                    <View style={styles.bookingPriceRow}>
                        <Text style={styles.bookingTotalLabel}>{String(t('chat', 'totalCost'))}</Text>
                        <Text style={styles.bookingTotalValue}>${booking.totalPrice}</Text>
                    </View>
                </View>

                {booking.status === 'pending' && isOwner && (
                    <View style={styles.ownerWarningBox}>
                        <View style={[styles.infoIconCircle, { backgroundColor: colors.primary + '18' }]}>
                            <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
                        </View>
                        <Text style={styles.ownerWarningText}>
                            {String(t('chat', 'ownerWarning'))}
                        </Text>
                    </View>
                )}

                {booking.status === 'pending' && isOwner && (
                    <View style={styles.bookingActions}>
                        <TouchableOpacity
                            style={styles.bookingBtnSecondary}
                            onPress={() => handleDeclineBooking(booking.bookingId)}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <ActivityIndicator size="small" color={colors.textMuted} />
                            ) : (
                                <>
                                    <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
                                    <Text style={styles.bookingBtnSecondaryText}>
                                        {String(t('chat', 'declineBooking'))}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.bookingBtnPrimary}
                            onPress={() => handleConfirmBooking(booking.bookingId)}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                                    <Text style={styles.bookingBtnPrimaryText}>
                                        {String(t('chat', 'confirmBooking'))}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {booking.status === 'pending' && isRenter && (
                    <View style={styles.bookingActionBox}>
                        <View style={[styles.actionIconCircle, { backgroundColor: '#FF950018' }]}>
                            <Ionicons name="hourglass-outline" size={22} color="#FF9500" />
                        </View>
                        <Text style={styles.actionBoxTitle}>
                            {String(t('chat', 'waitingForConfirmation'))}
                        </Text>
                        <Text style={styles.actionBoxSubtitle}>
                            {String(t('chat', 'willAutoDecline'))}
                        </Text>
                        <TouchableOpacity
                            style={styles.bookingTextBtn}
                            onPress={() => handleCancelBooking(booking.bookingId)}
                        >
                            <Ionicons name="close-circle-outline" size={14} color={colors.danger} />
                            <Text style={styles.bookingTextBtnText}>
                                {String(t('chat', 'cancelBooking'))}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {booking.status === 'expired' && (
                    <View style={styles.bookingActionBox}>
                        <View style={[styles.actionIconCircle, { backgroundColor: colors.textMuted + '18' }]}>
                            <Ionicons name="timer-outline" size={22} color={colors.textMuted} />
                        </View>
                        <Text style={styles.actionBoxTitle}>
                            {String(t('chat', 'requestExpired'))}
                        </Text>
                        <Text style={styles.actionBoxSubtitle}>
                            {isRenter ? String(t('chat', 'expiredRenter')) : String(t('chat', 'expiredOwner'))}
                        </Text>
                        {isRenter && (
                            <TouchableOpacity
                                style={styles.bookingBtnSecondary}
                                onPress={() => {
                                    router.push({
                                        pathname: '/item',
                                        params: { listingId: booking.listingId.toString() },
                                    });
                                }}
                            >
                                <Ionicons name="refresh-outline" size={18} color={colors.primary} />
                                <Text style={[styles.bookingBtnSecondaryText, { color: colors.primary }]}>
                                    {String(t('chat', 'tryAgain'))}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {booking.status === 'confirmed' && isOwner && pin && (
                    <View style={styles.bookingActionBox}>
                        <View style={[styles.actionIconCircle, { backgroundColor: colors.primary + '18' }]}>
                            <Ionicons name="keypad-outline" size={22} color={colors.primary} />
                        </View>
                        <Text style={styles.actionBoxTitle}>
                            {String(t('chat', 'pinGenerated'))}
                        </Text>
                        <Text style={styles.actionBoxSubtitle}>
                            {`Share this PIN with ${booking.renterName} at pickup`}
                        </Text>
                        <View style={styles.bookingPinDisplay}>
                            <Text style={styles.bookingPinCode}>{pin}</Text>
                        </View>
                    </View>
                )}

                {booking.status === 'confirmed' && isOwner && !pin && (
                    <View style={styles.bookingActionBox}>
                        <View style={[styles.actionIconCircle, { backgroundColor: colors.primary + '18' }]}>
                            <Ionicons name="keypad-outline" size={22} color={colors.primary} />
                        </View>
                        <Text style={styles.actionBoxTitle}>
                            Generating PIN...
                        </Text>
                        <Text style={styles.actionBoxSubtitle}>
                            Share it with the renter at pickup.
                        </Text>
                    </View>
                )}

                {booking.status === 'confirmed' && isRenter && (
                    <View style={styles.bookingActionBox}>
                        <View style={[styles.actionIconCircle, { backgroundColor: colors.primary + '18' }]}>
                            <Ionicons name="keypad-outline" size={22} color={colors.primary} />
                        </View>
                        <Text style={styles.actionBoxTitle}>
                            {String(t('chat', 'yourPickupPin'))}
                        </Text>
                        <Text style={styles.actionBoxSubtitle}>
                            {String(t('chat', 'askOwnerForPin'))}
                        </Text>
                        <TouchableOpacity
                            style={styles.bookingBtnPrimary}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                pickupSheetRef.current?.expand();
                            }}
                        >
                            <Ionicons name="checkmark-done-outline" size={18} color="white" />
                            <Text style={styles.bookingBtnPrimaryText}>
                                {String(t('chat', 'confirmPickup'))}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {booking.status === 'active' && (
                    <View style={styles.bookingActionBox}>
                        <View style={[styles.actionIconCircle, { backgroundColor: colors.primary + '18' }]}>
                            <Ionicons name="play-circle-outline" size={22} color={colors.primary} />
                        </View>
                        <Text style={styles.actionBoxTitle}>
                            {isRenter ? String(t('chat', 'itemInUse')) : String(t('chat', 'waitingForReturn'))}
                        </Text>
                        <Text style={styles.actionBoxSubtitle}>
                            {isRenter ? 'Enjoy your rental!' : 'Waiting for the renter to return the item.'}
                        </Text>
                        {isOwner && (
                            <TouchableOpacity
                                style={[styles.bookingBtnPrimary, { backgroundColor: colors.success }]}
                                onPress={() => handleMarkReturned(booking.bookingId)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <Ionicons name="return-down-back-outline" size={18} color="white" />
                                        <Text style={styles.bookingBtnPrimaryText}>
                                            {String(t('chat', 'markReturned'))}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {booking.status === 'completed' && (
                    <View style={styles.bookingActionBox}>
                        <View style={[styles.actionIconCircle, { backgroundColor: colors.success + '18' }]}>
                            <Ionicons name="ribbon-outline" size={24} color={colors.success} />
                        </View>
                        <Text style={[styles.actionBoxTitle, { color: colors.success }]}>
                            {String(t('chat', 'returnConfirmed'))}
                        </Text>
                        <Text style={styles.actionBoxSubtitle}>
                            This booking has been successfully completed.
                        </Text>
                    </View>
                )}

                {booking.status === 'declined' && (
                    <View style={styles.bookingActionBox}>
                        <View style={[styles.actionIconCircle, { backgroundColor: colors.danger + '15' }]}>
                            <Ionicons name="close-circle-outline" size={24} color={colors.danger} />
                        </View>
                        <Text style={[styles.actionBoxTitle, { color: colors.danger }]}>
                            {isRenter ? String(t('chat', 'ownerDeclined')) : String(t('chat', 'youDeclined'))}
                        </Text>
                        <Text style={styles.actionBoxSubtitle}>
                            {isRenter ? 'The owner was unable to accept your request.' : 'You have declined this booking request.'}
                        </Text>
                    </View>
                )}

                {booking.status === 'cancelled' && (
                    <View style={styles.bookingActionBox}>
                        <View style={[styles.actionIconCircle, { backgroundColor: colors.danger + '15' }]}>
                            <Ionicons name="ban-outline" size={24} color={colors.danger} />
                        </View>
                        <Text style={[styles.actionBoxTitle, { color: colors.danger }]}>
                            Booking Cancelled
                        </Text>
                        <Text style={styles.actionBoxSubtitle}>
                            This booking has been cancelled.
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const renderMessage = (msg: ChatMessage) => {
        const isMe = msg.senderId === myId;
        const isBookingType = msg.type !== 'text' && msg.bookingDetails;

        if (isBookingType) {
            const bId = msg.bookingDetails!.bookingId;

            if (latestMessageIdForBooking[bId] !== msg.id) {
                return (
                    <View key={msg.id} style={styles.historyUpdateRow}>
                        <Ionicons name="pulse-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.historyUpdateText}>
                            {String(msg.content || 'Booking status updated.')} ({formatTime(msg.sentAt)})
                        </Text>
                    </View>
                );
            }

            return (
                <View key={msg.id} style={styles.systemMessageRow}>
                    {renderBookingCard(msg, msg.bookingDetails!)}
                </View>
            );
        }

        return (
            <View key={msg.id} style={isMe ? styles.messageRowMe : styles.messageRowThem}>
                {!isMe && (
                    <Image
                        source={{ uri: avatarUri(msg.senderId) }}
                        style={styles.msgAvatar}
                        cachePolicy="memory-disk"
                        transition={200}
                    />
                )}
                <View
                    style={[
                        styles.messageBubble,
                        isMe ? styles.messageBubbleMe : styles.messageBubbleThem,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            isMe ? styles.messageTextMe : styles.messageTextThem,
                        ]}
                    >
                        {String(msg.content || '')}
                    </Text>
                    <Text
                        style={[
                            styles.messageTime,
                            isMe ? styles.messageTimeMe : styles.messageTimeThem,
                        ]}
                    >
                        {formatTime(msg.sentAt)}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView
            style={[styles.container, { marginBottom: keyboardOffset }]}
            edges={['top']}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={26} color={colors.text} />
                </TouchableOpacity>
                <Image
                    source={{ uri: avatarUri(params.ownerId ?? '0') }}
                    style={styles.avatar}
                    cachePolicy="memory-disk"
                    transition={200}
                />
                <View style={styles.headerText}>
                    <Text style={styles.headerName} numberOfLines={1}>
                        {String(params.ownerName ?? 'User')}
                    </Text>
                    <Text style={styles.headerItem} numberOfLines={1}>
                        {String(params.itemName ?? '')}
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
                    <Text style={styles.emptyText}>{String(error)}</Text>
                </View>
            ) : (
                <ScrollView
                    ref={scrollRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.length === 0 ? (
                        <View style={styles.centered}>
                            <Ionicons name="chatbox-ellipses-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>{String(t('chat', 'noMessages'))}</Text>
                        </View>
                    ) : (
                        messages.map(renderMessage)
                    )}
                </ScrollView>
            )}

            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder={String(t('chat', 'typeMessage'))}
                        placeholderTextColor={colors.textMuted}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        textAlignVertical="center"
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!input.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Ionicons name="paper-plane-outline" size={20} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <BottomSheet
                ref={pickupSheetRef}
                index={-1}
                snapPoints={['45%']}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: colors.background }}
                handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
            >
                <BottomSheetView style={styles.sheetContent}>
                    <View style={[styles.sheetIconCircle, { backgroundColor: colors.primary + '18' }]}>
                        <Ionicons name="keypad-outline" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.sheetTitle}>{String(t('chat', 'enterPickupPin'))}</Text>
                    <Text style={styles.sheetSubtitle}>
                        Ask the owner for the 4-digit code to confirm you have received the item.
                    </Text>
                    <View style={styles.pinContainer}>
                        {[0, 1, 2, 3].map((index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { pinRefs.current[index] = ref; }}
                                style={[
                                    styles.pinDigit,
                                    pinInput[index] ? styles.pinDigitFilled : null,
                                ]}
                                value={pinInput[index]}
                                onChangeText={(text) => handlePinChange(text, index)}
                                onKeyPress={(e) => handlePinKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                            />
                        ))}
                    </View>
                    <TouchableOpacity
                        style={[styles.sheetBtn, actionLoading && { opacity: 0.6 }]}
                        onPress={() => {
                            const latestBooking = messages
                                .filter((m) => m.bookingDetails?.myRole === 'renter' && m.bookingDetails?.status === 'confirmed')
                                .pop()?.bookingDetails;
                            if (latestBooking) {
                                handleConfirmPickup(latestBooking.bookingId);
                            } else {
                                Alert.alert('Error', 'No confirmed booking found.');
                            }
                        }}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.sheetBtnText}>{String(t('common', 'confirm'))}</Text>
                        )}
                    </TouchableOpacity>
                </BottomSheetView>
            </BottomSheet>
        </SafeAreaView>
    );
}

const makeStyles = (colors: any) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
        emptyText: { marginTop: 8, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
        },
        backButton: { paddingRight: 12 },
        avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface },
        headerText: { flex: 1, marginLeft: 12 },
        headerName: { fontSize: 16, fontWeight: '600', color: colors.text },
        headerItem: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
        messagesContainer: { flex: 1, backgroundColor: colors.background },
        messagesContent: { padding: 16, paddingBottom: 32 },

        messageRowMe: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
        messageRowThem: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 16 },
        msgAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, alignSelf: 'flex-end', backgroundColor: colors.surface },
        messageBubble: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxWidth: '75%' },
        messageBubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
        messageBubbleThem: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
        messageText: { fontSize: 15, lineHeight: 20 },
        messageTextMe: { color: 'white' },
        messageTextThem: { color: colors.text },
        messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
        messageTimeMe: { color: 'rgba(255,255,255,0.7)' },
        messageTimeThem: { color: colors.textMuted },

        historyUpdateRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
            alignSelf: 'center',
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 6,
        },
        historyUpdateText: {
            fontSize: 12,
            color: colors.textMuted,
        },

        systemMessageRow: { width: '100%', marginVertical: 12, alignItems: 'center' },

        bookingCard: {
            width: '100%',
            backgroundColor: colors.card,
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        bookingCardTopRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
        },
        bookingStatusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
            gap: 6,
        },
        statusDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
        },
        bookingStatusText: {
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        bookingCardTitle: {
            fontSize: 17,
            fontWeight: '700',
            color: colors.text,
            letterSpacing: -0.3,
            marginBottom: 2,
        },
        bookingCardSubtitle: {
            fontSize: 12,
            color: colors.textMuted,
            marginBottom: 14,
        },
        bookingItemRow: {
            flexDirection: 'row',
            marginBottom: 14,
            padding: 10,
            backgroundColor: colors.background,
            borderRadius: 12,
        },
        bookingItemImage: {
            width: 56,
            height: 56,
            borderRadius: 10,
            backgroundColor: colors.border,
        },
        bookingItemInfo: {
            flex: 1,
            marginLeft: 12,
            justifyContent: 'center',
        },
        bookingItemName: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 6,
            lineHeight: 18,
        },
        bookingInfoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            marginTop: 3,
        },
        bookingInfoText: {
            fontSize: 12,
            color: colors.textMuted,
        },

        bookingPriceBox: {
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
        },
        bookingPriceRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
        },
        bookingPriceLabel: {
            fontSize: 13,
            color: colors.textMuted,
        },
        bookingPriceValue: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.text,
        },
        bookingPriceDivider: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 8,
        },
        bookingTotalLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
        },
        bookingTotalValue: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.primary,
            letterSpacing: -0.3,
        },

        countdownContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        countdownDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
        },
        countdownLabel: {
            fontSize: 11,
            color: colors.textMuted,
            fontWeight: '500',
        },
        countdownTime: {
            fontSize: 12,
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
        },
        countdownExpired: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        countdownText: {
            fontSize: 12,
            fontWeight: '600',
        },

        bookingActionBox: {
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 12,
            marginTop: 4,
        },
        actionIconCircle: {
            width: 48,
            height: 48,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
        },
        actionBoxTitle: {
            fontSize: 15,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 4,
            letterSpacing: -0.2,
        },
        actionBoxSubtitle: {
            fontSize: 12,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 17,
            marginBottom: 12,
            paddingHorizontal: 8,
        },

        bookingActions: {
            flexDirection: 'row',
            gap: 10,
            marginTop: 4,
        },
        bookingBtnPrimary: {
            width: '100%',
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            gap: 6,
        },
        bookingBtnPrimaryText: {
            color: 'white',
            fontWeight: '600',
            fontSize: 14,
        },
        bookingBtnSecondary: {
            flex: 1,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            gap: 6,
        },
        bookingBtnSecondaryText: {
            color: colors.textMuted,
            fontWeight: '600',
            fontSize: 14,
        },
        bookingTextBtn: {
            paddingVertical: 6,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
        },
        bookingTextBtnText: {
            fontSize: 13,
            color: colors.danger,
            fontWeight: '600',
        },

        ownerWarningBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
            backgroundColor: colors.primary + '10',
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.primary + '25',
        },
        infoIconCircle: {
            width: 28,
            height: 28,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
        },
        ownerWarningText: {
            flex: 1,
            fontSize: 12,
            color: colors.primary,
            lineHeight: 17,
            fontWeight: '500',
        },

        bookingPinDisplay: {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.primary + '40',
            paddingHorizontal: 28,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 4,
        },
        bookingPinCode: {
            fontSize: 26,
            fontWeight: '700',
            color: colors.primary,
            letterSpacing: 8,
            fontVariant: ['tabular-nums'],
        },

        inputContainer: {
            paddingHorizontal: 16,
            paddingTop: 12,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            backgroundColor: colors.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 6,
            paddingVertical: 6,
            marginBottom: 3,
        },
        input: {
            flex: 1,
            paddingHorizontal: 16,
            paddingVertical: 12,
            maxHeight: 120,
            minHeight: 48,
            color: colors.text,
            fontSize: 16,
            lineHeight: 22,
        },
        sendButton: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 8,
        },
        sendButtonDisabled: {
            backgroundColor: colors.textMuted + '40',
        },

        sheetContent: {
            flex: 1,
            padding: 24,
            alignItems: 'center',
        },
        sheetIconCircle: {
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
        },
        sheetTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 6,
            letterSpacing: -0.3,
        },
        sheetSubtitle: {
            fontSize: 13,
            color: colors.textMuted,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 18,
            paddingHorizontal: 12,
        },
        pinContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 28,
        },
        pinDigit: {
            width: 56,
            height: 64,
            borderWidth: 1.5,
            borderColor: colors.border,
            borderRadius: 14,
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            backgroundColor: colors.surface,
            textAlign: 'center',
            textAlignVertical: 'center',
            padding: 0,
            includeFontPadding: false,
            fontVariant: ['tabular-nums'],
        },
        pinDigitFilled: {
            borderColor: colors.primary,
            backgroundColor: colors.primary + '10',
            color: colors.primary,
        },
        sheetBtn: {
            backgroundColor: colors.primary,
            width: '100%',
            height: 52,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
        },
        sheetBtnText: {
            color: 'white',
            fontWeight: '600',
            fontSize: 16,
        },
    });