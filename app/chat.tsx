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
                    setMessages((prevMessages) => {
                        const newMessages = msgResult.data ?? [];

                        if (newMessages.length !== prevMessages.length) {
                            return newMessages;
                        }

                        const prevLastBooking = [...prevMessages].reverse().find(m => m.bookingDetails)?.bookingDetails?.status;
                        const newLastBooking = [...newMessages].reverse().find(m => m.bookingDetails)?.bookingDetails?.status;

                        if (prevLastBooking !== newLastBooking) {
                            return newMessages;
                        }

                        return prevMessages;
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
                    <Ionicons name="time-outline" size={14} color={colors.danger} />
                    <Text style={[styles.countdownText, { color: colors.danger }]}>
                        {String(t('chat', 'expired'))}
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
                    {String(t('chat', 'autoDeclinesIn'))} {pad(timeLeft.hours)}:
                    {pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
                </Text>
            </View>
        );
    };

    const renderBookingCard = (msg: ChatMessage, booking: BookingDetails) => {
        const isRenter = booking.myRole === 'renter';
        const isOwner = booking.myRole === 'owner';
        const otherPerson = isRenter ? booking.ownerName : booking.renterName;

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
                            ? String(t('chat', 'bookingRequested'))
                            : String(booking.listingName || '')}
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
                            {String(booking.listingName || '')}
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
                            {booking.numberOfDays === 1 ? String(t('chat', 'day')) : String(t('chat', 'days'))}
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
                        <Text style={styles.bookingTotalLabel}>{String(t('chat', 'totalCost'))}</Text>
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
                            ? String(t('chat', 'expired'))
                            : String(booking.status.charAt(0).toUpperCase() + booking.status.slice(1))}
                    </Text>
                </View>

                {booking.status === 'pending' && isOwner && (
                    <>
                        <View style={styles.ownerWarningBox}>
                            <Ionicons name="information-circle" size={16} color={colors.primary} />
                            <Text style={styles.ownerWarningText}>
                                {String(t('chat', 'ownerWarning'))}
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
                                        {String(t('chat', 'declineBooking'))}
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
                                    {String(t('chat', 'confirmBooking'))}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {booking.status === 'pending' && isRenter && (
                    <View style={styles.bookingWaitingBox}>
                        <ActivityIndicator size="small" color={cfg.color} />
                        <Text style={styles.bookingWaitingText}>
                            {String(t('chat', 'waitingForConfirmation'))}
                        </Text>
                        <Text style={styles.bookingWaitingSubtext}>
                            {String(t('chat', 'willAutoDecline'))}
                        </Text>
                        <TouchableOpacity
                            style={styles.bookingCancelLink}
                            onPress={() => handleCancelBooking(booking.bookingId)}
                        >
                            <Text style={styles.bookingCancelText}>
                                {String(t('chat', 'cancelBooking'))}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {booking.status === 'expired' && (
                    <View style={styles.bookingExpiredBox}>
                        <Ionicons name="time-outline" size={28} color={colors.textMuted} />
                        <Text style={styles.bookingExpiredTitle}>
                            {String(t('chat', 'requestExpired'))}
                        </Text>
                        <Text style={styles.bookingExpiredText}>
                            {isRenter ? String(t('chat', 'expiredRenter')) : String(t('chat', 'expiredOwner'))}
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
                                    {String(t('chat', 'tryAgain'))}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {booking.status === 'confirmed' && isOwner && pin && (
                    <View style={styles.bookingPinBox}>
                        <View style={styles.bookingPinHeader}>
                            <Ionicons name="key" size={18} color={colors.primary} />
                            <Text style={styles.bookingPinTitle}>
                                {String(t('chat', 'pinGenerated'))}
                            </Text>
                        </View>
                        <Text style={styles.bookingPinSubtitle}>
                            {`${String(t('chat', 'sharePinWith'))} ${booking.renterName} ${String(t('chat', 'atPickup'))}`}
                        </Text>
                        <View style={styles.bookingPinDisplay}>
                            <Text style={styles.bookingPinCode}>{pin}</Text>
                        </View>
                    </View>
                )}

                {booking.status === 'confirmed' && isOwner && !pin && (
                    <View style={styles.bookingWaitingBox}>
                        <Ionicons name="key-outline" size={20} color={colors.primary} />
                        <Text style={styles.bookingWaitingText}>
                            PIN will be generated automatically. Share it with the renter at pickup.
                        </Text>
                    </View>
                )}

                {booking.status === 'confirmed' && isRenter && (
                    <View style={styles.bookingPinBox}>
                        <View style={styles.bookingPinHeader}>
                            <Ionicons name="key-outline" size={18} color={colors.primary} />
                            <Text style={styles.bookingPinTitle}>
                                {String(t('chat', 'yourPickupPin'))}
                            </Text>
                        </View>
                        <Text style={styles.bookingPinSubtitle}>
                            {String(t('chat', 'askOwnerForPin'))}
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
                                {String(t('chat', 'confirmPickup'))}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {booking.status === 'active' && (
                    <View style={styles.bookingActiveBox}>
                        <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                        <Text style={styles.bookingActiveText}>
                            {isRenter ? String(t('chat', 'itemInUse')) : String(t('chat', 'waitingForReturn'))}
                        </Text>
                        {isOwner && (
                            <TouchableOpacity
                                style={styles.bookingReturnBtn}
                                onPress={() => handleMarkReturned(booking.bookingId)}
                                disabled={actionLoading}
                            >
                                <Ionicons name="checkmark-done" size={18} color="white" />
                                <Text style={styles.bookingReturnBtnText}>
                                    {String(t('chat', 'markReturned'))}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {booking.status === 'completed' && (
                    <View style={styles.bookingCompletedBox}>
                        <Ionicons name="checkmark-done-circle" size={24} color={colors.success} />
                        <Text style={styles.bookingCompletedText}>
                            {String(t('chat', 'returnConfirmed'))}
                        </Text>
                    </View>
                )}

                {booking.status === 'declined' && (
                    <View style={styles.bookingDeclinedBox}>
                        <Ionicons name="close-circle" size={24} color={colors.danger} />
                        <Text style={styles.bookingDeclinedText}>
                            {isRenter ? String(t('chat', 'ownerDeclined')) : String(t('chat', 'youDeclined'))}
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
                        <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
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
                    <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
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
                            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
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
                            <Ionicons name="send" size={20} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <BottomSheet
                ref={pickupSheetRef}
                index={-1}
                snapPoints={['40%']}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: colors.background }}
                handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
            >
                <BottomSheetView style={styles.sheetContent}>
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
            paddingHorizontal: 16,
            alignSelf: 'center',
            backgroundColor: colors.surface,
            paddingVertical: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border
        },
        historyUpdateText: {
            fontSize: 12,
            color: colors.textMuted,
            marginLeft: 4,
        },

        systemMessageRow: { width: '100%', marginVertical: 12, alignItems: 'center' },
        bookingCard: { width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
        bookingCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
        bookingCardTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 8 },
        bookingItemRow: { flexDirection: 'row', marginBottom: 16 },
        bookingItemImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: colors.background },
        bookingItemInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
        bookingItemName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
        bookingDateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
        bookingDateText: { fontSize: 12, color: colors.textMuted, marginLeft: 6 },
        bookingPriceBox: { backgroundColor: colors.background, borderRadius: 12, padding: 12, marginBottom: 14 },
        bookingPriceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
        bookingPriceLabel: { fontSize: 13, color: colors.textMuted },
        bookingPriceValue: { fontSize: 13, fontWeight: '500', color: colors.text },
        bookingPriceTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 4, marginBottom: 0 },
        bookingTotalLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
        bookingTotalValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
        bookingStatusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
        bookingStatusText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },

        bookingActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
        bookingBtn: { flex: 1, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
        bookingBtnDecline: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
        bookingBtnDeclineText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
        bookingBtnConfirm: { backgroundColor: colors.primary },
        bookingBtnConfirmText: { color: 'white', fontWeight: '600', fontSize: 14 },
        ownerWarningBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, backgroundColor: colors.primary + '10', padding: 10, borderRadius: 10 },
        ownerWarningText: { flex: 1, fontSize: 12, color: colors.primary, lineHeight: 16 },
        bookingWaitingBox: { alignItems: 'center', paddingVertical: 8 },
        bookingWaitingText: { fontSize: 14, fontWeight: '500', color: colors.text, marginTop: 6, textAlign: 'center' },
        bookingWaitingSubtext: { fontSize: 12, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
        bookingCancelLink: { marginTop: 10, padding: 4 },
        bookingCancelText: { fontSize: 13, color: colors.danger, fontWeight: '500' },
        bookingExpiredBox: { alignItems: 'center', paddingVertical: 12 },
        bookingExpiredTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 8 },
        bookingExpiredText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 4, paddingHorizontal: 16 },
        bookingRetryBtn: { marginTop: 12, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
        bookingRetryBtnText: { color: 'white', fontWeight: '600', fontSize: 13 },
        bookingPinBox: { backgroundColor: colors.primary + '08', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.primary + '20', alignItems: 'center' },
        bookingPinHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
        bookingPinTitle: { fontSize: 14, fontWeight: '600', color: colors.primary },
        bookingPinSubtitle: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: 10 },
        bookingPinDisplay: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary + '30', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
        bookingPinCode: { fontSize: 22, fontWeight: '700', color: colors.primary, letterSpacing: 4 },
        bookingPickupBtn: { width: '100%', height: 40, backgroundColor: colors.primary, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
        bookingPickupBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
        bookingActiveBox: { alignItems: 'center', paddingVertical: 4 },
        bookingActiveText: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
        bookingReturnBtn: { width: '100%', height: 40, backgroundColor: colors.success, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
        bookingReturnBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
        bookingCompletedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 },
        bookingCompletedText: { fontSize: 14, fontWeight: '600', color: colors.success },
        bookingDeclinedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 },
        bookingDeclinedText: { fontSize: 14, fontWeight: '600', color: colors.danger },

        countdownContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginBottom: 12, alignSelf: 'flex-start' },
        countdownText: { fontSize: 12, fontWeight: '600' },
        countdownExpired: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },

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
            marginBottom:3
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

        sheetContent: { flex: 1, padding: 24, alignItems: 'center' },
        sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
        sheetSubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
        pinContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 24,
        },
        pinDigit: {
            width: 56,
            height: 64,
            borderWidth: 2,
            borderColor: colors.border,
            borderRadius: 12,
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            backgroundColor: colors.surface,
            textAlign: 'center',
            textAlignVertical: 'center',
            padding: 0,
            includeFontPadding: false,
        },
        pinDigitFilled: {
            borderColor: colors.primary,
            backgroundColor: colors.primary + '10',
        },
        pinInput: {
            width: '100%',
            height: '100%',
            textAlign: 'center',
            textAlignVertical: 'center',
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
            padding: 0,
            paddingHorizontal: 0,
            includeFontPadding: false,
        },
        sheetBtn: { backgroundColor: colors.primary, width: '100%', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
        sheetBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
    });