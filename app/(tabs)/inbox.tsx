import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Alert
} from 'react-native';
import { Image } from 'expo-image'; // ✅ expo-image umjesto RN Image (brže, s cachingom)
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fontisto, Ionicons } from "@expo/vector-icons";
import React, { useState, useMemo, useRef, useCallback } from "react";
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Swipeable } from 'react-native-gesture-handler';
import { useLanguage } from '@/src/context/languageContext';
import * as Haptics from 'expo-haptics';

type Conversation = {
    id: number;
    name: string;
    itemName: string;
    lastMessage: string;
    timeAgo: string;
    avatar: string;
    isOnline?: boolean;
    isUnread?: boolean;
    isArchived?: boolean;
};

const MOCK_CONVERSATIONS: Conversation[] = [
    { id: 1, name: 'Sarah Miller', itemName: 'Sony Alpha Camera', lastMessage: 'Is the camera still available for this weekend?', timeAgo: '2m ago', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', isOnline: true, isUnread: true, isArchived: false },
    { id: 2, name: 'James Davies', itemName: 'Mountain Bike Pro', lastMessage: 'Thanks again for the bike! It handles great', timeAgo: '1h ago', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', isOnline: false, isUnread: true, isArchived: false },
    { id: 3, name: 'Elena Lopez', itemName: 'KitchenAid Mixer', lastMessage: 'I noticed a small scratch on the side', timeAgo: '3h ago', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', isOnline: false, isUnread: false, isArchived: false },
    { id: 4, name: 'Marcus Thompson', itemName: 'Camping Tent 4-Person', lastMessage: 'The tent is all cleaned and packed', timeAgo: 'Yesterday', avatar: 'https://randomuser.me/api/portraits/men/75.jpg', isOnline: false, isUnread: false, isArchived: true },
    { id: 5, name: 'Alice Wong', itemName: 'Electric Pressure Washer', lastMessage: 'Perfect! See you at 5 PM', timeAgo: '2d ago', avatar: 'https://randomuser.me/api/portraits/women/90.jpg', isOnline: false, isUnread: false, isArchived: true },
];

export default function Inbox() {
    const { t } = useLanguage();
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [searchText, setSearchText] = useState('');
    const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
    const swipeableRefs = useRef<Record<number, Swipeable | null>>({});

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];

    // ✅ Stabilan styles - ovisi o scheme (primitive), ne o colors objektu
    const styles = useMemo(() => makeStyles(colors), [scheme]);

    // ✅ useMemo za counts - ne računaj pri svakom renderu
    const unreadCount = useMemo(
        () => conversations.filter(c => c.isUnread && !c.isArchived).length,
        [conversations]
    );
    const archivedCount = useMemo(
        () => conversations.filter(c => c.isArchived).length,
        [conversations]
    );

    // ✅ KRITIČNO: useMemo za filteredConversations
    // Inače se filter vrti na svakom scrollu ili renderu!
    const filteredConversations = useMemo(() => {
        const lowerSearch = searchText.toLowerCase();
        return conversations.filter((conv) => {
            const matchesSearch =
                conv.name.toLowerCase().includes(lowerSearch) ||
                conv.itemName.toLowerCase().includes(lowerSearch) ||
                conv.lastMessage.toLowerCase().includes(lowerSearch);
            if (activeCategory === 'Unread') return conv.isUnread && !conv.isArchived && matchesSearch;
            if (activeCategory === 'Archived') return conv.isArchived && matchesSearch;
            return !conv.isArchived && matchesSearch;
        });
    }, [conversations, searchText, activeCategory]);

    // ✅ Memoizirani handleri - stabilne reference za child komponente
    const openChat = useCallback((conv: Conversation) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        swipeableRefs.current[conv.id]?.close();
        setConversations(prev =>
            prev.map(c => c.id === conv.id ? { ...c, isUnread: false } : c)
        );
        router.push({
            pathname: '/chat',
            params: {
                conversation: JSON.stringify({
                    id: conv.id,
                    name: conv.name,
                    itemName: conv.itemName,
                    avatar: conv.avatar,
                    isOnline: conv.isOnline,
                }),
            },
        });
    }, []);

    const archiveConversation = useCallback((id: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setConversations(prev =>
            prev.map(c => c.id === id ? { ...c, isArchived: true, isUnread: false } : c)
        );
    }, []);

    const unarchiveConversation = useCallback((id: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setConversations(prev =>
            prev.map(c => c.id === id ? { ...c, isArchived: false } : c)
        );
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
                        setConversations(prev => prev.filter(c => c.id !== id));
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

    // ✅ Memoiziran Swipeable handler
    const handleSwipeableWillOpen = useCallback((convId: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Object.entries(swipeableRefs.current).forEach(([id, ref]) => {
            if (Number(id) !== convId && ref) {
                ref.close();
            }
        });
    }, []);

    const renderRightActions = useCallback((conv: Conversation) => (
        <View style={styles.swipeActions}>
            {!conv.isArchived ? (
                <TouchableOpacity
                    style={styles.archiveBtn}
                    onPress={() => {
                        swipeableRefs.current[conv.id]?.close();
                        archiveConversation(conv.id);
                    }}
                >
                    <Ionicons name="archive-outline" size={22} color={colors.iconColorInverse} />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.unarchiveBtn}
                    onPress={() => {
                        swipeableRefs.current[conv.id]?.close();
                        unarchiveConversation(conv.id);
                    }}
                >
                    <Ionicons name="arrow-undo-outline" size={22} color={colors.iconColorInverse} />
                </TouchableOpacity>
            )}
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                    swipeableRefs.current[conv.id]?.close();
                    deleteConversation(conv.id);
                }}
            >
                <Ionicons name="trash-outline" size={22} color={colors.iconColorInverse} />
            </TouchableOpacity>
        </View>
    ), [archiveConversation, unarchiveConversation, deleteConversation, colors, styles]);

    const filterLabels: Record<string, string> = {
        'All': t('inbox', 'all'),
        'Unread': t('inbox', 'unread'),
        'Archived': t('inbox', 'archived'),
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                                style={[
                                    styles.CategoryButton,
                                    isActive && styles.CategoryButtonActive
                                ]}
                                onPress={() => handleCategoryPress(name)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    isActive && styles.categoryTextActive
                                ]}>
                                    {filterLabels[name]}
                                    {count > 0 && ` (${count})`}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* CONVERSATION LIST */}
                <View style={styles.conversationList}>
                    {filteredConversations.length === 0 ? (
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
                        filteredConversations.map((conv) => (
                            <View
                                key={conv.id}
                                style={[
                                    styles.swipeWrapper,
                                    conv.isUnread && styles.swipeWrapperUnread
                                ]}
                            >
                                <Swipeable
                                    ref={(ref) => {
                                        if (ref) swipeableRefs.current[conv.id] = ref;
                                    }}
                                    renderRightActions={() => renderRightActions(conv)}
                                    overshootRight={false}
                                    overshootLeft={false}
                                    friction={1.5}
                                    rightThreshold={40}
                                    overshootFriction={5}
                                    onSwipeableWillOpen={() => handleSwipeableWillOpen(conv.id)}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.conversationItem,
                                            conv.isUnread && styles.conversationItemUnread
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() => openChat(conv)}
                                    >
                                        <View style={styles.avatarWrapper}>
                                            {/* ✅ expo-image s cachePolicy za instant učitavanje avatara */}
                                            <Image
                                                source={{ uri: conv.avatar }}
                                                style={styles.avatar}
                                                cachePolicy="memory-disk"
                                                transition={200}
                                            />
                                            {conv.isOnline && <View style={styles.onlineDot} />}
                                        </View>
                                        <View style={styles.convContent}>
                                            <View style={styles.convHeader}>
                                                <Text
                                                    style={[
                                                        styles.convName,
                                                        conv.isUnread && styles.convNameUnread
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {conv.name}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.timeAgo,
                                                        conv.isUnread && styles.timeAgoUnread
                                                    ]}
                                                >
                                                    {conv.timeAgo}
                                                </Text>
                                            </View>
                                            <View style={styles.messageRow}>
                                                <Ionicons name="pricetag" size={11} color={colors.primary} />
                                                <Text style={styles.itemName} numberOfLines={1}>
                                                    {conv.itemName}
                                                </Text>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.lastMessage,
                                                    conv.isUnread && styles.lastMessageUnread
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {conv.lastMessage}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </Swipeable>
                            </View>
                        ))
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
    categoryTextActive: { color: colors.activeTabText, fontWeight: '600' },
    conversationList: {},
    swipeWrapper: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
    swipeWrapperUnread: { borderColor: colors.primary + '30' },
    conversationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.card, borderLeftWidth: 0, borderLeftColor: 'transparent' },
    conversationItemUnread: { backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: colors.primary },
    avatarWrapper: { position: 'relative', marginRight: 12 },
    avatar: { width: 50, height: 50, borderRadius: 9999, backgroundColor: colors.border },
    onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 14, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.card },
    convContent: { flex: 1, gap: 3 },
    convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    convName: { fontSize: 15, fontWeight: '500', color: colors.text, flex: 1, marginRight: 8 },
    convNameUnread: { fontWeight: '700' },
    timeAgo: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
    timeAgoUnread: { color: colors.primary, fontWeight: '600' },
    messageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 4 },
    itemName: { fontSize: 11, fontWeight: '600', color: colors.primary, letterSpacing: 0.4, flex: 1 },
    lastMessage: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
    lastMessageUnread: { color: colors.text, fontWeight: '500' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 8 },
    emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
    swipeActions: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-end' },
    archiveBtn: { width: 75, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    unarchiveBtn: { width: 75, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center' },
    deleteBtn: { width: 75, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' },
});