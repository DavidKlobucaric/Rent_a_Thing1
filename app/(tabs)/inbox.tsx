import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fontisto, Ionicons } from "@expo/vector-icons";
import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Swipeable } from 'react-native-gesture-handler';
import { useLanguage } from '@/src/context/languageContext';
import * as Haptics from 'expo-haptics';
import {
    getMyConversations,
    type Conversation as ApiConversation,
} from '@/src/api/chatApi';

/** Deterministic avatar from a user id — same helper used in chat.tsx */
const avatarUri = (userId: number) => `https://i.pravatar.cc/150?u=${userId}`;

/** Human-readable relative time (e.g. "2m ago", "3h ago", "Yesterday") */
function timeAgo(isoString: string | null): string {
    if (!isoString) return '';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
}

export default function Inbox() {
    const { t } = useLanguage();
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [searchText, setSearchText] = useState('');
    const [conversations, setConversations] = useState<ApiConversation[]>([]);
    const [archivedIds, setArchivedIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const swipeableRefs = useRef<Record<number, Swipeable | null>>({});

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [scheme]);

    // ── fetch conversations ──────────────────────────────────────────────────
    const loadConversations = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
        setError('');
        const result = await getMyConversations();
        if (result.success) {
            setConversations(result.data ?? []);
        } else {
            setError(result.message);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    // Reload every time the tab comes into focus (e.g. after sending a message)
    useFocusEffect(
        useCallback(() => {
            loadConversations();
        }, [loadConversations])
    );

    // ── derived counts ───────────────────────────────────────────────────────
    const unreadCount = useMemo(
        () => conversations.filter(c => !archivedIds.has(c.conversationId) && c.unreadCount > 0).length,
        [conversations, archivedIds]
    );
    const archivedCount = useMemo(
        () => archivedIds.size,
        [archivedIds]
    );

    // ── filtered list ────────────────────────────────────────────────────────
    const filteredConversations = useMemo(() => {
        const lowerSearch = searchText.toLowerCase();
        return conversations.filter((conv) => {
            const isArchived = archivedIds.has(conv.conversationId);
            const matchesSearch =
                conv.otherUserName.toLowerCase().includes(lowerSearch) ||
                conv.listingName.toLowerCase().includes(lowerSearch) ||
                (conv.lastMessage ?? '').toLowerCase().includes(lowerSearch);

            if (activeCategory === 'Unread') return !isArchived && conv.unreadCount > 0 && matchesSearch;
            if (activeCategory === 'Archived') return isArchived && matchesSearch;
            return !isArchived && matchesSearch;
        });
    }, [conversations, searchText, activeCategory, archivedIds]);

    // ── navigation ───────────────────────────────────────────────────────────
    const openChat = useCallback((conv: ApiConversation) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        swipeableRefs.current[conv.conversationId]?.close();

        // Optimistically clear unread badge
        setConversations(prev =>
            prev.map(c =>
                c.conversationId === conv.conversationId ? { ...c, unreadCount: 0 } : c
            )
        );

        router.push({
            pathname: '/chat',
            params: {
                conversationId: String(conv.conversationId),
                listingId: String(conv.listingId),
                ownerId: String(conv.otherUserId),
                ownerName: conv.otherUserName,
                itemName: conv.listingName,
            },
        });
    }, []);

    // ── archive / delete ─────────────────────────────────────────────────────
    const archiveConversation = useCallback((id: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setArchivedIds(prev => new Set([...prev, id]));
    }, []);

    const unarchiveConversation = useCallback((id: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setArchivedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const deleteConversation = useCallback((id: number) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            t('inbox', 'deleteConversation'),
            t('inbox', 'cannotUndo'),
            [
                { text: t('common', 'cancel'), style: 'cancel' },
                {
                    text: t('common', 'delete'),
                    style: 'destructive',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setConversations(prev => prev.filter(c => c.conversationId !== id));
                        setArchivedIds(prev => {
                            const next = new Set(prev);
                            next.delete(id);
                            return next;
                        });
                    }
                }
            ]
        );
    }, [t]);

    const clearSearch = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSearchText('');
    }, []);

    const handleCategoryPress = useCallback((name: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveCategory(name);
    }, []);

    const handleSwipeableWillOpen = useCallback((convId: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Object.entries(swipeableRefs.current).forEach(([id, ref]) => {
            if (Number(id) !== convId && ref) ref.close();
        });
    }, []);

    const renderRightActions = useCallback((conv: ApiConversation) => {
        const isArchived = archivedIds.has(conv.conversationId);
        return (
            <View style={styles.swipeActions}>
                {!isArchived ? (
                    <TouchableOpacity
                        style={styles.archiveBtn}
                        onPress={() => {
                            swipeableRefs.current[conv.conversationId]?.close();
                            archiveConversation(conv.conversationId);
                        }}
                    >
                        <Ionicons name="archive-outline" size={22} color={colors.iconColorInverse} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.unarchiveBtn}
                        onPress={() => {
                            swipeableRefs.current[conv.conversationId]?.close();
                            unarchiveConversation(conv.conversationId);
                        }}
                    >
                        <Ionicons name="arrow-undo-outline" size={22} color={colors.iconColorInverse} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                        swipeableRefs.current[conv.conversationId]?.close();
                        deleteConversation(conv.conversationId);
                    }}
                >
                    <Ionicons name="trash-outline" size={22} color={colors.iconColorInverse} />
                </TouchableOpacity>
            </View>
        );
    }, [archiveConversation, unarchiveConversation, deleteConversation, colors, styles, archivedIds]);

    const filterLabels: Record<string, string> = {
        'All': t('inbox', 'all'),
        'Unread': t('inbox', 'unread'),
        'Archived': t('inbox', 'archived'),
    };

    // ── render ───────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadConversations(true)}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* SEARCH BAR */}
                <View style={styles.searchBar}>
                    <Fontisto name="search" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('inbox', 'search')}
                        placeholderTextColor={colors.placeholder}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* FILTER TABS */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
                    {(['All', 'Unread', 'Archived'] as string[]).map((name) => {
                        const isActive = activeCategory === name;
                        const count = name === 'Unread' ? unreadCount : name === 'Archived' ? archivedCount : 0;
                        return (
                            <TouchableOpacity
                                key={name}
                                style={[styles.CategoryButton, isActive && styles.CategoryButtonActive]}
                                onPress={() => handleCategoryPress(name)}
                            >
                                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                                    {filterLabels[name]}
                                    {count > 0 && ` (${count})`}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* CONVERSATION LIST */}
                <View style={styles.conversationList}>
                    {loading ? (
                        <View style={styles.emptyContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : error ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="alert-circle-outline" size={56} color={colors.danger} />
                            <Text style={styles.emptyTitle}>Could not load messages</Text>
                            <Text style={styles.emptySubtitle}>{error}</Text>
                            <TouchableOpacity onPress={() => loadConversations()} style={styles.retryBtn}>
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : filteredConversations.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name={
                                    activeCategory === 'Archived' ? 'archive-outline' :
                                        activeCategory === 'Unread' ? 'mail-unread-outline' :
                                            'chatbubbles-outline'
                                }
                                size={56}
                                color={colors.textMuted}
                            />
                            <Text style={styles.emptyTitle}>
                                {searchText
                                    ? t('inbox', 'noResults')
                                    : activeCategory === 'Archived'
                                        ? t('inbox', 'noArchived')
                                        : activeCategory === 'Unread'
                                            ? t('inbox', 'allCaught')
                                            : t('inbox', 'noConversations')}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {searchText
                                    ? t('inbox', 'tryDifferent')
                                    : activeCategory === 'Archived'
                                        ? t('inbox', 'archivedHere')
                                        : activeCategory === 'Unread'
                                            ? t('inbox', 'noUnread')
                                            : t('inbox', 'startChatting')}
                            </Text>
                        </View>
                    ) : (
                        filteredConversations.map((conv) => {
                            const isUnread = conv.unreadCount > 0;
                            return (
                                <View
                                    key={conv.conversationId}
                                    style={[styles.swipeWrapper, isUnread && styles.swipeWrapperUnread]}
                                >
                                    <Swipeable
                                        ref={(ref) => {
                                            if (ref) swipeableRefs.current[conv.conversationId] = ref;
                                        }}
                                        renderRightActions={() => renderRightActions(conv)}
                                        overshootRight={false}
                                        overshootLeft={false}
                                        friction={1.5}
                                        rightThreshold={40}
                                        overshootFriction={5}
                                        onSwipeableWillOpen={() => handleSwipeableWillOpen(conv.conversationId)}
                                    >
                                        <TouchableOpacity
                                            style={[styles.conversationItem, isUnread && styles.conversationItemUnread]}
                                            activeOpacity={0.7}
                                            onPress={() => openChat(conv)}
                                        >
                                            <View style={styles.avatarWrapper}>
                                                <Image
                                                    source={{ uri: avatarUri(conv.otherUserId) }}
                                                    style={styles.avatar}
                                                    cachePolicy="memory-disk"
                                                    transition={200}
                                                />
                                            </View>
                                            <View style={styles.convContent}>
                                                <View style={styles.convHeader}>
                                                    <Text
                                                        style={[styles.convName, isUnread && styles.convNameUnread]}
                                                        numberOfLines={1}
                                                    >
                                                        {conv.otherUserName}
                                                    </Text>
                                                    <Text style={[styles.timeAgo, isUnread && styles.timeAgoUnread]}>
                                                        {timeAgo(conv.lastMessageAt)}
                                                    </Text>
                                                </View>
                                                <View style={styles.messageRow}>
                                                    <Ionicons name="pricetag" size={11} color={colors.primary} />
                                                    <Text style={styles.itemName} numberOfLines={1}>
                                                        {conv.listingName}
                                                    </Text>
                                                    {conv.unreadCount > 0 && (
                                                        <View style={styles.unreadBadge}>
                                                            <Text style={styles.unreadBadgeText}>
                                                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text
                                                    style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
                                                    numberOfLines={1}
                                                >
                                                    {conv.lastMessage ?? t('inbox', 'noResults') ?? 'No messages yet'}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    </Swipeable>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: 16, paddingVertical: 16 },
    searchBar: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 16, paddingHorizontal: 15, paddingVertical: 5, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
    searchIcon: { fontSize: 16, color: colors.textMuted, marginRight: 8 },
    searchInput: { flex: 1, height: 45, fontSize: 16, color: colors.text },
    categoryContent: { gap: 8, alignItems: 'center', marginTop: 5, marginBottom: 16 },
    CategoryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 9999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    CategoryButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    categoryText: { fontSize: 14, color: colors.text, fontWeight: '500' },
    categoryTextActive: { color: (colors as any).activeTabText ?? '#fff', fontWeight: '600' },
    conversationList: {},
    swipeWrapper: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
    swipeWrapperUnread: { borderColor: colors.primary + '30' },
    conversationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.card },
    conversationItemUnread: { backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: colors.primary },
    avatarWrapper: { position: 'relative', marginRight: 12 },
    avatar: { width: 50, height: 50, borderRadius: 9999, backgroundColor: colors.border },
    convContent: { flex: 1, gap: 3 },
    convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    convName: { fontSize: 15, fontWeight: '500', color: colors.text, flex: 1, marginRight: 8 },
    convNameUnread: { fontWeight: '700' },
    timeAgo: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
    timeAgoUnread: { color: colors.primary, fontWeight: '600' },
    messageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 4 },
    itemName: { fontSize: 11, fontWeight: '600', color: colors.primary, letterSpacing: 0.4, flex: 1 },
    unreadBadge: { backgroundColor: colors.primary, borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
    unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    lastMessage: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
    lastMessageUnread: { color: colors.text, fontWeight: '500' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 8 },
    emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
    retryBtn: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 9999 },
    retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    swipeActions: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-end' },
    archiveBtn: { width: 75, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    unarchiveBtn: { width: 75, backgroundColor: (colors as any).success, justifyContent: 'center', alignItems: 'center' },
    deleteBtn: { width: 75, backgroundColor: (colors as any).danger, justifyContent: 'center', alignItems: 'center' },
});
