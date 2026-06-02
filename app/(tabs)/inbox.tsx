import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Alert, RefreshControl
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useMemo, useRef, useCallback } from "react";
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Swipeable } from 'react-native-gesture-handler';
import { useLanguage } from '@/src/context/languageContext';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import {
    getMyConversations,
    type Conversation as ApiConversation,
} from '@/src/api/chatApi';

const avatarUri = (userId: number) => `https://i.pravatar.cc/150?u=${userId}`;

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

type ParsedMessage = {
    icon?: keyof typeof Ionicons.glyphMap;
    color?: string;
    bgColor?: string;
    text: string;
    isSystem?: boolean;
};

function parseLastMessage(msg: string | null | undefined, scheme: 'light' | 'dark'): ParsedMessage {
    if (!msg) return { text: 'No messages yet' };

    const palette = {
        warning: {
            main: '#FF9500',
            bg: scheme === 'dark' ? '#FF950025' : '#FF950015'
        },
        success: {
            main: '#34C759',
            bg: scheme === 'dark' ? '#34C75925' : '#34C75915'
        },
        error: {
            main: '#FF3B30',
            bg: scheme === 'dark' ? '#FF3B3025' : '#FF3B3015'
        },
        info: {
            main: '#007AFF',
            bg: scheme === 'dark' ? '#007AFF25' : '#007AFF15'
        },
        neutral: {
            main: '#8E8E93',
            bg: scheme === 'dark' ? '#8E8E9325' : '#8E8E9315'
        },
    };

    if (msg.includes('📅') || msg.includes('Booking Request') || msg.includes('Booking request')) {
        return { icon: 'calendar-outline', color: palette.warning.main, bgColor: palette.warning.bg, text: 'Booking Request', isSystem: true };
    }
    if (msg.includes('🎉') || msg.includes('Booking Confirmed') || msg.toLowerCase().includes('booking confirmed')) {
        return { icon: 'checkmark-circle-outline', color: palette.success.main, bgColor: palette.success.bg, text: 'Booking Confirmed', isSystem: true };
    }
    if (msg.includes('❌') || msg.includes('Booking Declined') || msg.toLowerCase().includes('declined')) {
        return { icon: 'close-circle-outline', color: palette.error.main, bgColor: palette.error.bg, text: 'Booking Declined', isSystem: true };
    }
    if (msg.includes('⏰') || msg.toLowerCase().includes('expired')) {
        return { icon: 'timer-outline', color: palette.error.main, bgColor: palette.error.bg, text: 'Request Expired', isSystem: true };
    }
    if (msg.includes('🚫') || msg.includes('Booking Cancelled') || msg.toLowerCase().includes('cancelled')) {
        return { icon: 'ban-outline', color: palette.error.main, bgColor: palette.error.bg, text: 'Booking Cancelled', isSystem: true };
    }
    if (msg.includes('🤝') || msg.toLowerCase().includes('picked up')) {
        return { icon: 'hand-left-outline', color: palette.info.main, bgColor: palette.info.bg, text: 'Item Picked Up', isSystem: true };
    }
    if (msg.includes('✅') || msg.toLowerCase().includes('returned successfully') || msg.toLowerCase().includes('item returned')) {
        return { icon: 'ribbon-outline', color: palette.success.main, bgColor: palette.success.bg, text: 'Item Returned', isSystem: true };
    }

    return { text: msg };
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

    const shimmerColors = scheme === 'dark'
        ? ['#2A2A2A', '#3A3A3A', '#2A2A2A']
        : ['#E0E0E0', '#F5F5F5', '#E0E0E0'];

    const loadConversations = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
        setError('');

        await new Promise(resolve => setTimeout(resolve, 400));

        const result = await getMyConversations();
        if (result.success) {
            setConversations(result.data ?? []);
        } else {
            setError(result.message || 'Failed to load conversations');
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadConversations();
        }, [loadConversations])
    );

    const unreadCount = useMemo(
        () => conversations.filter(c => !archivedIds.has(c.conversationId) && c.unreadCount > 0).length,
        [conversations, archivedIds]
    );
    const archivedCount = useMemo(
        () => archivedIds.size,
        [archivedIds]
    );

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

    const openChat = useCallback((conv: ApiConversation) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        swipeableRefs.current[conv.conversationId]?.close();

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
                        <Ionicons name="arrow-undo-circle-outline" size={22} color={colors.iconColorInverse} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                        swipeableRefs.current[conv.conversationId]?.close();
                        deleteConversation(conv.conversationId);
                    }}
                >
                    <Ionicons name="trash-bin-outline" size={22} color={colors.iconColorInverse} />
                </TouchableOpacity>
            </View>
        );
    }, [archiveConversation, unarchiveConversation, deleteConversation, colors, styles, archivedIds]);

    const filterLabels: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
        'All': { label: t('inbox', 'all'), icon: 'chatbubbles-outline' },
        'Unread': { label: t('inbox', 'unread'), icon: 'mail-unread-outline' },
        'Archived': { label: t('inbox', 'archived'), icon: 'archive-outline' },
    };

    const renderConversationShimmer = useCallback(() => (
        <View style={styles.shimmerWrapper}>
            <View style={styles.shimmerItem}>
                <View style={styles.shimmerAvatarWrapper}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.shimmerAvatar}
                        shimmerColors={shimmerColors}
                    />
                </View>
                <View style={styles.shimmerContent}>
                    <View style={styles.shimmerHeader}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerName}
                            shimmerColors={shimmerColors}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerTime}
                            shimmerColors={shimmerColors}
                        />
                    </View>
                    <View style={styles.shimmerMessageRow}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerItemIcon}
                            shimmerColors={shimmerColors}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerItemName}
                            shimmerColors={shimmerColors}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerBadge}
                            shimmerColors={shimmerColors}
                        />
                    </View>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.shimmerLastMessage}
                        shimmerColors={shimmerColors}
                    />
                </View>
            </View>
        </View>
    ), [shimmerColors, styles]);

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
                        colors={[colors.primary]}
                        progressBackgroundColor={colors.surface}
                    />
                }
            >
                {/* SEARCH BAR */}
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('inbox', 'search')}
                        placeholderTextColor={colors.placeholder}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* FILTER TABS */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
                    {(['All', 'Unread', 'Archived'] as string[]).map((name) => {
                        const isActive = activeCategory === name;
                        const count = name === 'Unread' ? unreadCount : name === 'Archived' ? archivedCount : 0;
                        const filterInfo = filterLabels[name];
                        return (
                            <TouchableOpacity
                                key={name}
                                style={[styles.CategoryButton, isActive && styles.CategoryButtonActive]}
                                onPress={() => handleCategoryPress(name)}
                            >
                                <Ionicons
                                    name={filterInfo.icon}
                                    size={16}
                                    color={isActive ? ((colors as any).activeTabText ?? '#fff') : colors.text}
                                    style={styles.categoryIcon}
                                />
                                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]} numberOfLines={1}>
                                    {filterInfo.label}
                                    {count > 0 && ` (${count})`}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* CONVERSATION LIST - 🎯 Shimmer se prikazuje i kod refresha */}
                <View style={styles.conversationList}>
                    {loading || refreshing ? (
                        <View>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <React.Fragment key={i}>
                                    {renderConversationShimmer()}
                                </React.Fragment>
                            ))}
                        </View>
                    ) : error ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cloud-offline-outline" size={56} color={colors.danger} />
                            <Text style={styles.emptyTitle}>Could not load messages</Text>
                            <Text style={styles.emptySubtitle}>{error}</Text>
                            <TouchableOpacity onPress={() => loadConversations()} style={styles.retryBtn}>
                                <Ionicons name="refresh-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : filteredConversations.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name={
                                    activeCategory === 'Archived' ? 'file-tray-outline' :
                                        activeCategory === 'Unread' ? 'mail-open-outline' :
                                            'chatbox-ellipses-outline'
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
                            const parsed = parseLastMessage(conv.lastMessage, scheme);
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
                                                    <Ionicons name="pricetag-outline" size={11} color={colors.primary} style={styles.itemIcon} />
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
                                                {parsed.isSystem && parsed.icon ? (
                                                    <View
                                                        style={[
                                                            styles.systemPill,
                                                            { backgroundColor: parsed.bgColor },
                                                        ]}
                                                    >
                                                        <Ionicons
                                                            name={parsed.icon}
                                                            size={12}
                                                            color={parsed.color}
                                                            style={styles.pillIcon}
                                                        />
                                                        <Text
                                                            style={[
                                                                styles.systemPillText,
                                                                { color: parsed.color },
                                                                isUnread && styles.systemPillTextUnread,
                                                            ]}
                                                            numberOfLines={1}
                                                        >
                                                            {parsed.text}
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <Text
                                                        style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
                                                        numberOfLines={1}
                                                    >
                                                        {parsed.text}
                                                    </Text>
                                                )}
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
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 16,
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 0 },
    categoryContent: { gap: 8, alignItems: 'center', marginTop: 5, marginBottom: 16, paddingHorizontal: 2 },
    CategoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 9999,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 6,
    },
    CategoryButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    categoryIcon: {},
    categoryText: { fontSize: 13, color: colors.text, fontWeight: '500' },
    categoryTextActive: { color: (colors as any).activeTabText ?? '#fff', fontWeight: '600' },
    conversationList: { gap: 10 },
    swipeWrapper: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    swipeWrapperUnread: { borderColor: colors.primary + '30', backgroundColor: colors.card },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.card,
        borderLeftWidth: 4,
        borderLeftColor: 'transparent',
    },
    conversationItemUnread: {
        backgroundColor: colors.card,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    avatarWrapper: {
        marginRight: 14,
        justifyContent: 'center',
    },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.border },
    convContent: { flex: 1, gap: 4, overflow: 'hidden' },
    convHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    convName: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.text,
        flexShrink: 1,
        marginRight: 8,
    },
    convNameUnread: { fontWeight: '700' },
    timeAgo: { fontSize: 12, color: colors.textMuted, fontWeight: '500', flexShrink: 0 },
    timeAgoUnread: { color: colors.primary, fontWeight: '600' },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    itemIcon: { flexShrink: 0 },
    itemName: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.primary,
        letterSpacing: 0.4,
        flexShrink: 1,
    },
    unreadBadge: {
        backgroundColor: colors.primary,
        borderRadius: 9999,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
        flexShrink: 0,
        marginLeft: 4,
    },
    unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    lastMessage: {
        fontSize: 13,
        color: colors.textSecondary,
        flexShrink: 1,
    },
    lastMessageUnread: { color: colors.text, fontWeight: '500' },
    systemPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        maxWidth: '100%',
    },
    pillIcon: { flexShrink: 0 },
    systemPillText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flexShrink: 1,
    },
    systemPillTextUnread: {
        fontWeight: '800',
    },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 8 },
    emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },
    retryBtn: {
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 24,
        backgroundColor: colors.primary,
        borderRadius: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    retryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    swipeActions: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-end' },
    archiveBtn: { width: 75, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    unarchiveBtn: { width: 75, backgroundColor: (colors as any).success, justifyContent: 'center', alignItems: 'center' },
    deleteBtn: { width: 75, backgroundColor: (colors as any).danger, justifyContent: 'center', alignItems: 'center' },

    // 🎨 IDENTICAL SHIMMER STYLES - savršeno odgovara pravim karticama
    shimmerWrapper: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom:10
    },
    shimmerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: colors.card,
        borderLeftWidth: 4,
        borderLeftColor: 'transparent',
    },
    shimmerAvatarWrapper: {
        marginRight: 14,
        justifyContent: 'center',
    },
    shimmerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    shimmerContent: {
        flex: 1,
        gap: 4,
        overflow: 'hidden',
    },
    shimmerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    shimmerName: {
        flexShrink: 1,
        height: 14,
        width: '55%',
        borderRadius: 4,
        marginRight: 8,
    },
    shimmerTime: {
        width: 40,
        height: 10,
        borderRadius: 3,
        flexShrink: 0,
    },
    shimmerMessageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    shimmerItemIcon: {
        width: 11,
        height: 11,
        borderRadius: 2,
        flexShrink: 0,
    },
    shimmerItemName: {
        flexShrink: 1,
        height: 10,
        width: '45%',
        borderRadius: 3,
    },
    shimmerBadge: {
        width: 20,
        height: 14,
        borderRadius: 7,
        flexShrink: 0,
        marginLeft: 4,
    },
    shimmerLastMessage: {
        width: '70%',
        height: 12,
        borderRadius: 3,
    },
});