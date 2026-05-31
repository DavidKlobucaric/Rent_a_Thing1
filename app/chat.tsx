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
    getBookingPin, // ✅ NOVI IMPORT
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

// ── COUNTDOWN HOOK ──────────────────────────────────────────────────
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
    const [pinInput, setPinInput] = useState('');

    // ✅ NOVO: Stanje za PIN kodove po bookingId-u
    const [pins, setPins] = useState<Record<number, string>>({});

    // ── keyboard handling ──
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

    // ✅ NOVO: Automatsko dohvaćanje PIN kodova za vlasnika
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
    }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // ── BOOKING ACTION HANDLERS ──
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

    const handleConfirmPickup = async (bookingId: number) => {
        console.log('=== PICKUP DEBUG ===');
        console.log('bookingId:', bookingId);
        console.log('pinInput:', pinInput);
        console.log('pinInput length:', pinInput.length);
        if (pinInput.length !== 4) {
            Alert.alert(t('common', 'error'), 'PIN must be 4 digits');
            return;
        }
        setActionLoading(true);
        const result = await confirmPickup(bookingId, pinInput);
        console.log('result:', JSON.stringify(result));
        setActionLoading(false);
        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            pickupSheetRef.current?.close();
            setPinInput('');
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

    // ── COUNTDOWN COMPONENT ──
    const CountdownTimer = ({ expiresAt }: { expiresAt: string }) => {
        const timeLeft = useCountdown(expiresAt);
        if (!timeLeft) return null;
        if (timeLeft.total <= 0) {
            return (
                <View style={styles.countdownExpired}>
                    <Ionicons name="time-outline" size={14} color={colors.danger} />
                    <Text style={[styles.countdownText, { color: colors.danger }]}>
                        {t('chat', 'expired')}
                    </Text>
                </View>
            );
        }
        const urgencyColor =
            timeLeft.hours >= 12
                ? '#34C759'
                : timeLeft.hours >= 6
                    ? '#FF9500'
                    : '#FF3B30';
        const pad = (n: number) => n.toString().padStart(2, '0');
        return (
            <View style={[styles.countdownContainer, { borderColor: urgencyColor + '40' }]}>
                <Ionicons name="time" size={14} color={urgencyColor} />
                <Text style={[styles.countdownText, { color: urgencyColor }]}>
                    {t('chat', 'autoDeclinesIn')} {pad(timeLeft.hours)}:
                    {pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
                </Text>
            </View>
        );
    };

    // ── RENDER BOOKING CARD (✅ AŽURIRANO) ──
    const renderBookingCard = (msg: ChatMessage, booking: BookingDetails) => {
        const isRenter = booking.myRole === 'renter';
        const isOwner = booking.myRole === 'owner';
        const otherPerson = isRenter ? booking.ownerName : booking.renterName;

        // ✅ Spajanje PIN-a iz poruke i onog povučenog sa servera
        const pin = booking.pickupPin || pins[booking.bookingId];

        const statusConfig = {
            pending: { color: '#FF9500', bg: '#FF950015', icon: 'time-outline' as const },
            confirmed: { color: '#34C759', bg: '#34C75915', icon: 'checkmark-circle' as const },
            active: { color: '#007AFF', bg: '#007AFF15', icon: 'swap-horizontal' as const },
            completed: { color: '#8E8E93', bg: '#8E8E9315', icon: 'checkmark-done' as const },
            declined: { color: '#FF3B30', bg: '#FF3B3015', icon: 'close-circle' as const },
            cancelled: { color: '#FF3B30', bg: '#FF3B3015', icon: 'close-circle' as const },
            expired: { color: '#8E8E93', bg: '#8E8E9315', icon: 'time-outline' as const },
        };
        const cfg = statusConfig[booking.status];

        return (
            <View style={styles.bookingCard}>
                <View style={styles.bookingCardHeader}>
                    <Ionicons name="calendar" size={18} color={colors.primary} />
                    <Text style={styles.bookingCardTitle}>
                        {booking.status === 'pending'
                            ? t('chat', 'bookingRequested')
                            : booking.listingName}
                    </Text>
                </View>

                <View style={styles.bookingItemRow}>
                    <Image
                        source={{ uri: booking.listingImage }}
                        style={styles.bookingItemImage}
                        contentFit="cover"
                    />
                    <View style={styles.bookingItemInfo}>
                        <Text style={styles.bookingItemName} numberOfLines={1}>
                            {booking.listingName}
                        </Text>
                        <View style={styles.bookingDateRow}>
                            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.bookingDateText}>
                                {formatDateShort(booking.startDate)} →{' '}
                                {formatDateShort(booking.endDate)}
                            </Text>
                        </View>
                        <View style={styles.bookingDateRow}>
                            <Ionicons name="person-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.bookingDateText}>
                                {isRenter ? `From ${otherPerson}` : `To ${otherPerson}`}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bookingPriceBox}>
                    <View style={styles.bookingPriceRow}>
                        <Text style={styles.bookingPriceLabel}>
                            ${booking.dailyRate} × {booking.numberOfDays}{' '}
                            {booking.numberOfDays === 1 ? t('chat', 'day') : t('chat', 'days')}
                        </Text>
                        <Text style={styles.bookingPriceValue}>
                            ${booking.dailyRate * booking.numberOfDays}
                        </Text>
                    </View>
                    {booking.deposit > 0 && (
                        <View style={styles.bookingPriceRow}>
                            <Text style={styles.bookingPriceLabel}>Deposit</Text>
                            <Text style={styles.bookingPriceValue}>${booking.deposit}</Text>
                        </View>
                    )}
                    <View style={[styles.bookingPriceRow, styles.bookingPriceTotal]}>
                        <Text style={styles.bookingTotalLabel}>{t('chat', 'totalCost')}</Text>
                        <Text style={styles.bookingTotalValue}>${booking.totalPrice}</Text>
                    </View>
                </View>

                {booking.status === 'pending' && booking.expiresAt && (
                    <CountdownTimer expiresAt={booking.expiresAt} />
                )}

                <View style={[styles.bookingStatusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                    <Text style={[styles.bookingStatusText, { color: cfg.color }]}>
                        {booking.status === 'expired'
                            ? t('chat', 'expired')
                            : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                </View>

                {/* PENDING - Owner */}
                {booking.status === 'pending' && isOwner && (
                    <>
                        <View style={styles.ownerWarningBox}>
                            <Ionicons name="information-circle" size={16} color={colors.primary} />
                            <Text style={styles.ownerWarningText}>
                                {t('chat', 'ownerWarning')}
                            </Text>
                        </View>
                        <View style={styles.bookingActions}>
                            <TouchableOpacity
                                style={[styles.bookingBtn, styles.bookingBtnDecline]}
                                onPress={() => handleDeclineBooking(booking.bookingId)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator size="small" />
                                ) : (
                                    <Text style={styles.bookingBtnDeclineText}>
                                        {t('chat', 'declineBooking')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.bookingBtn, styles.bookingBtnConfirm]}
                                onPress={() => handleConfirmBooking(booking.bookingId)}
                                disabled={actionLoading}
                            >
                                <Ionicons name="checkmark" size={18} color="white" />
                                <Text style={styles.bookingBtnConfirmText}>
                                    {t('chat', 'confirmBooking')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* PENDING - Renter */}
                {booking.status === 'pending' && isRenter && (
                    <View style={styles.bookingWaitingBox}>
                        <ActivityIndicator size="small" color={cfg.color} />
                        <Text style={styles.bookingWaitingText}>
                            {t('chat', 'waitingForConfirmation')}
                        </Text>
                        <Text style={styles.bookingWaitingSubtext}>
                            {t('chat', 'willAutoDecline')}
                        </Text>
                        <TouchableOpacity
                            style={styles.bookingCancelLink}
                            onPress={() => handleCancelBooking(booking.bookingId)}
                        >
                            <Text style={styles.bookingCancelText}>
                                {t('chat', 'cancelBooking')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* EXPIRED */}
                {booking.status === 'expired' && (
                    <View style={styles.bookingExpiredBox}>
                        <Ionicons name="time-outline" size={28} color={colors.textMuted} />
                        <Text style={styles.bookingExpiredTitle}>
                            {t('chat', 'requestExpired')}
                        </Text>
                        <Text style={styles.bookingExpiredText}>
                            {isRenter ? t('chat', 'expiredRenter') : t('chat', 'expiredOwner')}
                        </Text>
                        {isRenter && (
                            <TouchableOpacity
                                style={styles.bookingRetryBtn}
                                onPress={() => {
                                    router.push({
                                        pathname: '/item',
                                        params: { listingId: booking.listingId.toString() },
                                    });
                                }}
                            >
                                <Text style={styles.bookingRetryBtnText}>
                                    {t('chat', 'tryAgain')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* ✅ CONFIRMED - Owner vidi PIN kod (iz servera ili iz poruke) */}
                {booking.status === 'confirmed' && isOwner && pin && (
                    <View style={styles.bookingPinBox}>
                        <View style={styles.bookingPinHeader}>
                            <Ionicons name="key" size={18} color={colors.primary} />
                            <Text style={styles.bookingPinTitle}>
                                {t('chat', 'pinGenerated')}
                            </Text>
                        </View>
                        <Text style={styles.bookingPinSubtitle}>
                            {`${t('chat', 'sharePinWith')} ${booking.renterName} ${t('chat', 'atPickup')}`}
                        </Text>
                        <View style={styles.bookingPinDisplay}>
                            <Text style={styles.bookingPinCode}>{pin}</Text>
                        </View>
                    </View>
                )}

                {/* ✅ CONFIRMED - Owner čeka PIN generiranje (Fallback) */}
                {booking.status === 'confirmed' && isOwner && !pin && (
                    <View style={styles.bookingWaitingBox}>
                        <Ionicons name="key-outline" size={20} color={colors.primary} />
                        <Text style={styles.bookingWaitingText}>
                            PIN will be generated automatically. Share it with the renter at pickup.
                        </Text>
                    </View>
                )}

                {/* CONFIRMED - Renter vidi samo gumb za unos PINa */}
                {booking.status === 'confirmed' && isRenter && (
                    <View style={styles.bookingPinBox}>
                        <View style={styles.bookingPinHeader}>
                            <Ionicons name="key-outline" size={18} color={colors.primary} />
                            <Text style={styles.bookingPinTitle}>
                                {t('chat', 'yourPickupPin')}
                            </Text>
                        </View>
                        <Text style={styles.bookingPinSubtitle}>
                            {t('chat', 'askOwnerForPin')}
                        </Text>
                        <TouchableOpacity
                            style={styles.bookingPickupBtn}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                pickupSheetRef.current?.expand();
                            }}
                        >
                            <Ionicons name="checkmark-circle" size={18} color="white" />
                            <Text style={styles.bookingPickupBtnText}>
                                {t('chat', 'confirmPickup')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ACTIVE */}
                {booking.status === 'active' && (
                    <View style={styles.bookingActiveBox}>
                        <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                        <Text style={styles.bookingActiveText}>
                            {isRenter ? t('chat', 'itemInUse') : t('chat', 'waitingForReturn')}
                        </Text>
                        {isOwner && (
                            <TouchableOpacity
                                style={styles.bookingReturnBtn}
                                onPress={() => handleMarkReturned(booking.bookingId)}
                                disabled={actionLoading}
                            >
                                <Ionicons name="checkmark-done" size={18} color="white" />
                                <Text style={styles.bookingReturnBtnText}>
                                    {t('chat', 'markReturned')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* COMPLETED */}
                {booking.status === 'completed' && (
                    <View style={styles.bookingCompletedBox}>
                        <Ionicons name="checkmark-done-circle" size={24} color={colors.success} />
                        <Text style={styles.bookingCompletedText}>
                            {t('chat', 'returnConfirmed')}
                        </Text>
                    </View>
                )}

                {/* DECLINED */}
                {booking.status === 'declined' && (
                    <View style={styles.bookingDeclinedBox}>
                        <Ionicons name="close-circle" size={24} color={colors.danger} />
                        <Text style={styles.bookingDeclinedText}>
                            {isRenter ? t('chat', 'ownerDeclined') : t('chat', 'youDeclined')}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    // ── RENDER MESSAGE ──
    const renderMessage = (msg: ChatMessage) => {
        const isMe = msg.senderId === myId;
        const isBookingType = msg.type !== 'text' && msg.bookingDetails;

        if (isBookingType) {
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
                        {msg.content}
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
                    <Ionicons name="arrow-back" size={26} color={colors.text} />
                </TouchableOpacity>
                <Image
                    source={{ uri: avatarUri(params.ownerId ?? '0') }}
                    style={styles.avatar}
                    cachePolicy="memory-disk"
                    transition={200}
                />
                <View style={styles.headerText}>
                    <Text style={styles.headerName} numberOfLines={1}>
                        {params.ownerName ?? 'User'}
                    </Text>
                    <Text style={styles.headerItem} numberOfLines={1}>
                        {params.itemName ?? ''}
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
                    <Text style={styles.emptyText}>{error}</Text>
                </View>
            ) : (
                <ScrollView
                    ref={scrollRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    onContentSizeChange={() => {
                        scrollRef.current?.scrollToEnd({ animated: true });
                    }}
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons
                                name="chatbubble-ellipses-outline"
                                size={56}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.emptyText}>
                                {t('chat', 'noMessages')}
                                {'\n'}
                                {t('chat', 'startConv')}
                            </Text>
                        </View>
                    ) : (
                        messages.map((msg) => (
                            <React.Fragment key={msg.id}>
                                {renderMessage(msg)}
                            </React.Fragment>
                        ))
                    )}
                </ScrollView>
            )}

            <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
                <TextInput
                    style={styles.input}
                    placeholder={t('chat', 'typeMessage')}
                    placeholderTextColor={colors.textSecondary}
                    value={input}
                    onChangeText={setInput}
                    multiline
                    maxLength={500}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                />
                <TouchableOpacity
                    onPress={handleSend}
                    style={[
                        styles.sendButton,
                        (!input.trim() || sending) && styles.sendButtonDisabled,
                    ]}
                    disabled={!input.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons
                            name="send"
                            size={24}
                            color={input.trim() ? '#fff' : colors.placeholder}
                        />
                    )}
                </TouchableOpacity>
            </View>

            <BottomSheet
                ref={pickupSheetRef}
                index={-1}
                snapPoints={['40%']}
                enablePanDownToClose
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
                    <Text style={styles.sheetTitle}>{t('chat', 'enterPickupPin')}</Text>
                    <Text style={styles.sheetSubtitle}>{t('chat', 'askOwnerForPin')}</Text>
                    <TextInput
                        style={styles.pinInput}
                        value={pinInput}
                        onChangeText={(text) =>
                            setPinInput(text.replace(/[^0-9]/g, '').slice(0, 4))
                        }
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="• • • •"
                        placeholderTextColor={colors.textMuted}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sheetBtn,
                            pinInput.length !== 4 && styles.sheetBtnDisabled,
                        ]}
                        onPress={() => {
                            const bookingMsg = [...messages]
                                .reverse()
                                .find((m) => m.bookingDetails?.status === 'confirmed');
                            if (bookingMsg?.bookingDetails) {
                                handleConfirmPickup(bookingMsg.bookingDetails.bookingId);
                            }
                        }}
                        disabled={pinInput.length !== 4 || actionLoading}
                    >
                        {actionLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.sheetBtnText}>{t('chat', 'confirmPickup')}</Text>
                        )}
                    </TouchableOpacity>
                </BottomSheetView>
            </BottomSheet>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.border,
            gap: 14,
        },
        backButton: { padding: 6 },
        avatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.border,
        },
        headerText: { flex: 1, gap: 2 },
        headerName: { fontSize: 18, fontWeight: '600', color: colors.text },
        headerItem: { fontSize: 12, color: colors.textMuted },
        messagesContainer: { flex: 1, backgroundColor: colors.background },
        messagesContent: {
            flexGrow: 1,
            justifyContent: 'flex-end',
            padding: 18,
            paddingBottom: 24,
            gap: 12,
        },
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
        },
        emptyText: {
            textAlign: 'center',
            fontSize: 16,
            lineHeight: 22,
            color: colors.textMuted,
        },
        messageRowMe: { flexDirection: 'row', justifyContent: 'flex-end' },
        messageRowThem: {
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            gap: 8,
        },
        msgAvatar: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.border,
            marginBottom: 2,
        },
        messageBubble: {
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 20,
            maxWidth: '80%',
            gap: 6,
        },
        messageBubbleMe: {
            alignSelf: 'flex-end',
            borderBottomRightRadius: 8,
            backgroundColor: colors.primary,
        },
        messageBubbleThem: {
            alignSelf: 'flex-start',
            borderBottomLeftRadius: 8,
            borderWidth: 0.5,
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
        messageText: { fontSize: 16, lineHeight: 22 },
        messageTextMe: { color: (colors as any).activeTabText ?? '#fff' },
        messageTextThem: { color: colors.text },
        messageTime: { fontSize: 12, alignSelf: 'flex-end' },
        messageTimeMe: { color: 'rgba(255, 255, 255, 0.85)' },
        messageTimeThem: { color: colors.textMuted },
        systemMessageRow: { alignItems: 'center', marginVertical: 8 },
        bookingCard: {
            width: '100%',
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
        },
        bookingCardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        bookingCardTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.text,
            flex: 1,
        },
        bookingItemRow: { flexDirection: 'row', gap: 12 },
        bookingItemImage: {
            width: 70,
            height: 70,
            borderRadius: 12,
            backgroundColor: colors.surface,
        },
        bookingItemInfo: { flex: 1, gap: 4, justifyContent: 'center' },
        bookingItemName: { fontSize: 16, fontWeight: '700', color: colors.text },
        bookingDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
        bookingDateText: { fontSize: 13, color: colors.textMuted },
        bookingPriceBox: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 12,
            gap: 6,
        },
        bookingPriceRow: { flexDirection: 'row', justifyContent: 'space-between' },
        bookingPriceLabel: { fontSize: 13, color: colors.textSecondary },
        bookingPriceValue: { fontSize: 13, fontWeight: '600', color: colors.text },
        bookingPriceTotal: {
            paddingTop: 8,
            marginTop: 4,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        bookingTotalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
        bookingTotalValue: { fontSize: 17, fontWeight: '700', color: colors.primary },
        bookingStatusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 8,
        },
        bookingStatusText: {
            fontSize: 12,
            fontWeight: '700',
            textTransform: 'capitalize',
        },
        bookingActions: { flexDirection: 'row', gap: 10 },
        bookingBtn: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 12,
            borderRadius: 12,
        },
        bookingBtnDecline: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
        },
        bookingBtnDeclineText: { fontSize: 14, fontWeight: '600', color: colors.text },
        bookingBtnConfirm: { backgroundColor: colors.primary },
        bookingBtnConfirmText: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.iconColorInverse,
        },
        bookingWaitingBox: { alignItems: 'center', gap: 8, paddingVertical: 8 },
        bookingWaitingText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
        bookingWaitingSubtext: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
        bookingCancelLink: { paddingVertical: 4, paddingHorizontal: 8 },
        bookingCancelText: { fontSize: 13, color: colors.danger, fontWeight: '600' },
        bookingExpiredBox: {
            alignItems: 'center',
            gap: 8,
            paddingVertical: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
        },
        bookingExpiredTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
        bookingExpiredText: {
            fontSize: 13,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 18,
            paddingHorizontal: 12,
        },
        bookingRetryBtn: {
            marginTop: 4,
            paddingVertical: 8,
            paddingHorizontal: 20,
            backgroundColor: colors.primary,
            borderRadius: 10,
        },
        bookingRetryBtnText: {
            color: colors.iconColorInverse,
            fontWeight: '700',
            fontSize: 13,
        },
        bookingPinBox: { gap: 8 },
        bookingPinHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        bookingPinTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
        bookingPinSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
        bookingPinDisplay: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.primary + '40',
            borderStyle: 'dashed',
        },
        bookingPinCode: {
            fontSize: 32,
            fontWeight: '900',
            color: colors.primary,
            letterSpacing: 8,
        },
        bookingPickupBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: colors.primary,
            paddingVertical: 12,
            borderRadius: 12,
        },
        bookingPickupBtnText: {
            color: colors.iconColorInverse,
            fontWeight: '700',
            fontSize: 14,
        },
        bookingActiveBox: { alignItems: 'center', gap: 8, paddingVertical: 8 },
        bookingActiveText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
        bookingReturnBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginTop: 4,
        },
        bookingReturnBtnText: {
            color: colors.iconColorInverse,
            fontWeight: '700',
            fontSize: 14,
        },
        bookingCompletedBox: { alignItems: 'center', gap: 8, paddingVertical: 8 },
        bookingCompletedText: { fontSize: 14, fontWeight: '600', color: colors.success },
        bookingDeclinedBox: { alignItems: 'center', gap: 8, paddingVertical: 8 },
        bookingDeclinedText: { fontSize: 13, color: colors.danger, textAlign: 'center' },
        ownerWarningBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.primary + '10',
            padding: 10,
            borderRadius: 8,
        },
        ownerWarningText: {
            fontSize: 12,
            color: colors.textSecondary,
            flex: 1,
            lineHeight: 16,
        },
        countdownContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: colors.surface,
            borderRadius: 10,
            borderWidth: 1,
        },
        countdownText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
        countdownExpired: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 12,
            paddingHorizontal: 18,
            paddingVertical: 14,
        },
        input: {
            flex: 1,
            fontSize: 17,
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderRadius: 28,
            borderWidth: 0.5,
            borderColor: colors.border,
            maxHeight: 140,
            backgroundColor: colors.surface,
            color: colors.text,
        },
        sendButton: {
            width: 50,
            height: 50,
            borderRadius: 25,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.primary,
        },
        sendButtonDisabled: { backgroundColor: colors.border },
        sheetContent: {
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 32,
            gap: 12,
        },
        sheetTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            marginTop: 8,
        },
        sheetSubtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
        },
        pinInput: {
            fontSize: 28,
            fontWeight: '700',
            textAlign: 'center',
            backgroundColor: colors.surface,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            paddingVertical: 16,
            letterSpacing: 12,
            marginTop: 8,
        },
        sheetBtn: {
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 8,
        },
        sheetBtnDisabled: {
            opacity: 0.5
        },
        sheetBtnText: {
            color: colors.iconColorInverse,
            fontWeight: '700',
            fontSize: 15,
        },
    });