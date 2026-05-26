import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Keyboard,
    Platform,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';

type Message = {
    id: string;
    text: string;
    senderId: 'me' | 'them';
    createdAt?: Date;
};

type ConversationParams = {
    id: number;
    name: string;
    itemName: string;
    avatar: string;
    isOnline?: boolean;
};

export default function Chat() {
    const { conversation } = useLocalSearchParams();
    const conv: ConversationParams = typeof conversation === 'string'
        ? JSON.parse(conversation)
        : { id: 1, name: 'User', itemName: 'Item', avatar: '', isOnline: false };

    const { t } = useLanguage();
    const insets = useSafeAreaInsets();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [keyboardOffset, setKeyboardOffset] = useState(0);

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors ), [colors]);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => { setMessages([]); }, [conv.id]);

    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                const height = e.endCoordinates?.height ?? 0;
                setKeyboardOffset(height > 0 ? height : 0);
            }
        );

        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardOffset(0)
        );

        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [
            ...prev,
            { id: `me_${Date.now()}`, text: input.trim(), senderId: 'me', createdAt: new Date() }
        ]);
        setInput('');
        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                {
                    id: `them_${Date.now()}`,
                    text: t('chat', 'autoReply'),
                    senderId: 'them',
                    createdAt: new Date()
                }
            ]);
        }, 1500);
    };

    const formatTime = (date?: Date) =>
        date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
        <SafeAreaView
            style={[styles.container, { marginBottom: keyboardOffset }]}
            edges={['top']}
        >
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={26} color={colors.text} />
                </TouchableOpacity>
                <Image source={{ uri: conv.avatar }} style={styles.avatar} />
                <View style={styles.headerText}>
                    <Text style={styles.headerName} numberOfLines={1}>{conv.name}</Text>
                    <Text style={styles.headerItem} numberOfLines={1}>{conv.itemName}</Text>
                </View>
                <TouchableOpacity style={styles.headerIcon}>
                    <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* MESSAGES */}
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
                removeClippedSubviews={false}
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
                        const isMe = msg.senderId === 'me';
                        return (
                            <View
                                key={msg.id}
                                style={isMe ? styles.messageRowMe : styles.messageRowThem}
                            >
                                <View style={[
                                    styles.messageBubble,
                                    isMe ? styles.messageBubbleMe : styles.messageBubbleThem
                                ]}>
                                    <Text style={[
                                        styles.messageText,
                                        isMe ? styles.messageTextMe : styles.messageTextThem
                                    ]}>
                                        {msg.text}
                                    </Text>
                                    {msg.createdAt && (
                                        <Text style={[
                                            styles.messageTime,
                                            isMe ? styles.messageTimeMe : styles.messageTimeThem
                                        ]}>
                                            {formatTime(msg.createdAt)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

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
                    style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                    disabled={!input.trim()}
                >
                    <Ionicons
                        name="send"
                        size={24}
                        color={input.trim() ? '#fff' : colors.placeholder}
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light ) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
    },

    messageBubble: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 20,
        maxWidth: '85%',
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
        color: colors.activeTabText ?? '#fff',
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