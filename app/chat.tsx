import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Keyboard,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { useAuth } from '@/src/context/authContext';
import * as Haptics from 'expo-haptics';
import {
    getOrCreateConversation,
    getMessages,
    sendMessage as sendMessageApi,
    markConversationRead,
    type ChatMessage,
} from '@/src/api/chatApi';

type ChatParams = {
    conversationId?: string;
    listingId: string;
    ownerId: string;
    ownerName: string;
    itemName: string;
};

const avatarUri = (userId: string | number) =>
    `https://i.pravatar.cc/150?u=${userId}`;

export default function Chat() {
    const params = useLocalSearchParams<ChatParams>();
    const { t } = useLanguage();
    const { user: me } = useAuth();
    const insets = useSafeAreaInsets();

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];

    // ✅ Stabilan styles - ovisi o scheme (primitive), ne o colors objektu
    const styles = useMemo(() => makeStyles(colors), [scheme]);

    const scrollRef = useRef<ScrollView>(null);

    // ── state ────────────────────────────────────────────────────────────────
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [keyboardOffset, setKeyboardOffset] = useState(0);

    // ── keyboard handling ────────────────────────────────────────────────────
    useEffect(() => {
        const show = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardOffset(e.endCoordinates?.height ?? 0)
        );
        const hide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardOffset(0)
        );
        return () => { show.remove(); hide.remove(); };
    }, []);

    useEffect(() => {
        if (!params.listingId) return;
        let isActive = true;

        (async () => {
            setLoading(true);
            setError('');

            let cid: number;

            if (params.conversationId) {
                // Coming from inbox — conversation already exists, skip getOrCreate
                cid = Number(params.conversationId);
                setConversationId(cid);
            } else {
                // Coming from item detail — need to create/fetch conversation
                const convResult = await getOrCreateConversation(Number(params.listingId));
                if (!isActive) return;

                if (!convResult.success) {
                    setError(convResult.message);
                    setLoading(false);
                    return;
                }

                cid = convResult.data.conversationId;
                setConversationId(cid);
            }

            const msgResult = await getMessages(cid);
            if (isActive && msgResult.success) {
                setMessages(msgResult.data);
            }

            await markConversationRead(cid);
            if (isActive) setLoading(false);
        })();

        return () => { isActive = false; };
    }, [params.listingId, params.conversationId]);

    const formatTime = useCallback((iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, []);

    const handleSend = useCallback(async () => {
        if (!input.trim() || !conversationId || sending) return;
        const text = input.trim();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setInput('');
        setSending(true);

        // Optimistic update
        const optimistic: ChatMessage = {
            id: -Date.now(),
            senderId: Number(me?.userId ?? -1),
            senderName: me?.username ?? 'Me',
            content: text,
            sentAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);

        const result = await sendMessageApi(conversationId, text);
        if (result.success) {
            // Replace optimistic message with real one
            setMessages(prev =>
                prev.map(m => m.id === optimistic.id ? result.data : m)
            );
        } else {
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setInput(text); // restore input
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setSending(false);
    }, [input, conversationId, sending, me]);


    const handleBack = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    }, []);

    // ✅ Memoiziran handleOptions
    const handleOptions = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO: Implementiraj opcije (npr. block user, report, itd.)
    }, []);

    const myId = Number(me?.userId ?? -1);

    return (
        <SafeAreaView
            style={[styles.container, { marginBottom: keyboardOffset }]}
            edges={['top']}
        >
            {/* HEADER */}
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
                <TouchableOpacity style={styles.headerIcon} onPress={handleOptions}>
                    <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* MESSAGES */}
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
                    decelerationRate="normal"
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubble-ellipses-outline" size={56} color={colors.textSecondary} />
                            <Text style={styles.emptyText}>
                                {t('chat', 'noMessages')}{'\n'}{t('chat', 'startConv')}
                            </Text>
                        </View>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === myId;
                            return (
                                <View
                                    key={msg.id}
                                    style={isMe ? styles.messageRowMe : styles.messageRowThem}
                                >
                                    {!isMe && (
                                        <Image
                                            source={{ uri: avatarUri(msg.senderId) }}
                                            style={styles.msgAvatar}
                                            cachePolicy="memory-disk"
                                            transition={200}
                                        />
                                    )}
                                    <View style={[
                                        styles.messageBubble,
                                        isMe ? styles.messageBubbleMe : styles.messageBubbleThem
                                    ]}>
                                        <Text style={[
                                            styles.messageText,
                                            isMe ? styles.messageTextMe : styles.messageTextThem
                                        ]}>
                                            {msg.content}
                                        </Text>
                                        <Text style={[
                                            styles.messageTime,
                                            isMe ? styles.messageTimeMe : styles.messageTimeThem
                                        ]}>
                                            {formatTime(msg.sentAt)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}

            {/* INPUT AREA */}
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
                    style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
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
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
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
    headerName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    headerItem: {
        fontSize: 12,
        color: colors.textMuted,
    },
    headerIcon: { padding: 8 },
    messagesContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
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
    messageRowMe: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
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
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    messageTextMe: {
        color: (colors as any).activeTabText ?? '#fff',
    },
    messageTextThem: {
        color: colors.text,
    },
    messageTime: {
        fontSize: 12,
        alignSelf: 'flex-end',
    },
    messageTimeMe: {
        color: 'rgba(255, 255, 255, 0.85)',
    },
    messageTimeThem: {
        color: colors.textMuted,
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
        backgroundColor: colors.border,
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
    sendButtonDisabled: {
        backgroundColor: colors.border,
    },
});
