import { Image } from 'expo-image';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    ScrollView, TouchableOpacity, FlatList, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fontisto, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    searchListings,
    getRecommendedListings,
    addFavourite,
    removeFavourite,
    getFavourites,
    getAllListings,
} from '@/src/api/itemsApi';
import { useAuth } from '@/src/context/authContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { router, useFocusEffect } from 'expo-router';
import { useLanguage } from '@/src/context/languageContext';
import * as Haptics from 'expo-haptics';
import ShimmerPlaceholder from "react-native-shimmer-placeholder";

type Category = {
    id: string;
    label: string;
    activeIcon: React.ComponentProps<typeof Ionicons>['name'];
    inactiveIcon: React.ComponentProps<typeof Ionicons>['name'];
};

const CATEGORIES: Category[] = [
    { id: 'all',     label: 'ALL',     activeIcon: 'apps',            inactiveIcon: 'apps-outline' },
    { id: 'tools',   label: 'TOOLS',   activeIcon: 'construct',       inactiveIcon: 'construct-outline' },
    { id: 'camping', label: 'CAMPING', activeIcon: 'bonfire',         inactiveIcon: 'bonfire-outline' },
    { id: 'tech',    label: 'TECH',    activeIcon: 'laptop',          inactiveIcon: 'laptop-outline' },
    { id: 'games',   label: 'GAMES',   activeIcon: 'game-controller', inactiveIcon: 'game-controller-outline' },
    { id: 'sports',  label: 'SPORTS',  activeIcon: 'football',        inactiveIcon: 'football-outline' },
    { id: 'clothes', label: 'CLOTHES', activeIcon: 'shirt',           inactiveIcon: 'shirt-outline' },
];

const PLACEHOLDER_IMAGE = 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png';

type Listing = {
    listingId: number;
    price: number;
    location: string;
    isAvailable: boolean;
    name: string;
    category: string;
    description: string;
    imageUrls: string[];
    userName: string;
};

export default function HomeScreen() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const shimmerColors = scheme === 'dark'
        ? ['#2A2A2A', '#3A3A3A', '#2A2A2A']
        : ['#E0E0E0', '#F5F5F5', '#E0E0E0'];

    const [searchText, setSearchText] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [favouriteIds, setFavouriteIds] = useState<Set<number>>(new Set());
    const [searchResults, setSearchResults] = useState<Listing[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [recommended, setRecommended] = useState<Listing[]>([]);
    const [recLoading, setRecLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadRecommended = useCallback(async () => {
        setRecLoading(true);
        const result = await getRecommendedListings();
        if (result.success) {
            setRecommended(Array.isArray(result.data) ? result.data : []);
        }
        setRecLoading(false);
    }, []);

    const loadFavourites = useCallback(async () => {
        const result = await getFavourites();
        if (result.success) {
            const ids = new Set(result.data.map((l: Listing) => l.listingId));
            setFavouriteIds(ids);
        }
    }, []);

    const loadSearchResults = useCallback(async (query: string, category: string) => {
        setSearchLoading(true);
        setSearchError('');

        try {
            let result;
            const trimmedQuery = query.trim();

            if (trimmedQuery) {
                result = await searchListings(trimmedQuery);
            } else if (category === 'all') {
                result = await getAllListings();
            } else {
                result = await searchListings(category);
            }

            if (result.success) {
                const data = Array.isArray(result.data) ? result.data : [];
                const filtered = trimmedQuery || category === 'all'
                    ? data
                    : data.filter(
                        (item: Listing) =>
                            item.category?.toLowerCase() === category.toLowerCase()
                    );
                setSearchResults(filtered);
            } else {
                setSearchError(result.message);
                setSearchResults([]);
            }
        } catch (error: any) {
            setSearchError(error.message || 'Search failed');
            setSearchResults([]);
        }

        setSearchLoading(false);
    }, []);

    useEffect(() => {
        loadRecommended();
    }, [token, loadRecommended]);

    useFocusEffect(
        useCallback(() => {
            loadFavourites();
        }, [loadFavourites])
    );

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadSearchResults(searchText, activeCategory);
        }, 400);
        return () => clearTimeout(timeout);
    }, [searchText, activeCategory, loadSearchResults]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        await Promise.all([
            loadRecommended(),
            loadFavourites(),
            loadSearchResults(searchText, activeCategory),
        ]);

        setRefreshing(false);
    }, [searchText, activeCategory, loadRecommended, loadFavourites, loadSearchResults]);

    const toggleFavourite = async (id: number) => {
        const isCurrentlyFav = favouriteIds.has(id);
        if (isCurrentlyFav) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        setFavouriteIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyFav) next.delete(id);
            else next.add(id);
            return next;
        });
        if (isCurrentlyFav) await removeFavourite(id);
        else await addFavourite(id);
    };

    const getFirstImage = (imageUrls: string[]) => {
        if (!imageUrls || imageUrls.length === 0) return PLACEHOLDER_IMAGE;
        return imageUrls[0] || PLACEHOLDER_IMAGE;
    };

    const renderSearchItem = useCallback(({ item }: { item: Listing }) => {
        return (
            <TouchableOpacity
                style={styles.itemCard}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                        pathname: '/item',
                        params: { listingId: item.listingId.toString() }
                    });
                }}
                activeOpacity={0.9}
            >
                <Image
                    source={{ uri: getFirstImage(item.imageUrls) }}
                    style={styles.itemImage}
                    cachePolicy="memory-disk"
                    transition={200}
                    contentFit="cover"
                />
                <View style={styles.itemCardContent}>
                    {/* 🆕 MODERNIJI RASPORED - veći font, bolji razmaci */}
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>

                    <View style={styles.itemLocationRow}>
                        <Ionicons name="location" size={12} color={colors.textMuted} />
                        <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                    </View>

                    <View style={styles.itemDivider} />

                    <View style={styles.itemPriceRow}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>${item.price}</Text>
                            <Text style={styles.perDay}>{t('home', 'perDay')}</Text>
                        </View>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{item.category}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [router, t, styles, colors]);

    const keyExtractor = useCallback((item: Listing) => item.listingId.toString(), []);

    const getCategoryLabel = () => {
        const cat = CATEGORIES.find(c => c.id === activeCategory);
        return cat?.label || activeCategory.toUpperCase();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                        progressBackgroundColor={colors.surface}
                    />
                }
            >
                {/* SEARCH BAR */}
                <View style={styles.searchBar}>
                    <Fontisto name="search" style={[styles.searchIcon, { color: colors.primarySecondary }]} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('home', 'search')}
                        placeholderTextColor={colors.placeholder}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSearchText('');
                        }}>
                            <Text style={[styles.clearBtn, { color: colors.textMuted }]}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* CATEGORY TABS */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                    nestedScrollEnabled={true}
                >
                    {CATEGORIES.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={styles.tab}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setActiveCategory(cat.id);
                                    setSearchText('');
                                }}
                            >
                                <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                                    <Ionicons
                                        name={isActive ? cat.activeIcon : cat.inactiveIcon}
                                        size={24}
                                        color={isActive ? colors.activeTabText : colors.iconColor}
                                    />
                                </View>
                                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* SEARCH RESULTS */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    decelerationRate={0.92}
                >
                    <View style={styles.listContainer}>
                        {searchLoading ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {[1, 2, 3].map((i) => (
                                    <ShimmerPlaceholder
                                        key={i}
                                        LinearGradient={LinearGradient}
                                        style={{
                                            width: 200,
                                            height: 290,
                                            borderRadius: 18,
                                            marginTop: 8,
                                            marginBottom: 8,
                                            marginRight: 14,
                                            marginLeft: 12,
                                        }}
                                        shimmerColors={shimmerColors}
                                    />
                                ))}
                            </ScrollView>
                        ) : searchError ? (
                            <Text style={styles.emptyText}>{searchError}</Text>
                        ) : searchResults.length === 0 ? (
                            <Text style={styles.emptyText}>
                                {searchText.trim()
                                    ? `${t('home', 'noResults')} "${searchText}"`
                                    : activeCategory === 'all'
                                        ? t('home', 'noItems')
                                        : `${t('home', 'noItemsCategory')} "${getCategoryLabel()}"`}
                            </Text>
                        ) : (
                            <FlatList
                                data={searchResults}
                                keyExtractor={keyExtractor}
                                scrollEnabled={false}
                                horizontal={true}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 12 }}
                                renderItem={renderSearchItem}
                                removeClippedSubviews={true}
                                maxToRenderPerBatch={5}
                                windowSize={5}
                            />
                        )}
                    </View>
                </ScrollView>

                {/* RECOMMENDED */}
                <Text style={styles.sectionTitle}>{t('home', 'recommended')}</Text>
                {recLoading ? (
                    <View style={{ paddingHorizontal: 20, gap: 10 }}>
                        {[1, 2, 3].map((i) => (
                            <ShimmerPlaceholder
                                key={i}
                                LinearGradient={LinearGradient}
                                style={{ height: 95, borderRadius: 14, marginHorizontal: 0 }}
                                shimmerColors={shimmerColors}
                            />
                        ))}
                    </View>
                ) : recommended.length === 0 ? (
                    <Text style={[styles.emptyText, { marginHorizontal: 20 }]}>
                        {t('home', 'noRecommendations')}
                    </Text>
                ) : (
                    recommended.map((item) => (
                        <TouchableOpacity
                            key={item.listingId}
                            style={styles.card}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push({
                                    pathname: '/item',
                                    params: { listingId: item.listingId.toString() }
                                });
                            }}
                            activeOpacity={0.9}
                        >
                            <Image
                                source={{ uri: getFirstImage(item.imageUrls) }}
                                style={styles.thumbnail}
                                cachePolicy="memory-disk"
                                transition={200}
                                contentFit="cover"
                            />
                            <View style={styles.cardContent}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                                    <View style={styles.recLocationRow}>
                                        <Ionicons name="location" size={11} color={colors.textMuted} />
                                        <Text style={styles.distanceText} numberOfLines={1}>{item.location}</Text>
                                    </View>
                                    <View style={styles.recPriceRow}>
                                        <Text style={styles.price}>${item.price}</Text>
                                        <Text style={styles.perDay}>{t('home', 'perDay')}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        toggleFavourite(item.listingId);
                                    }}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                    style={styles.favoriteButton}
                                >
                                    <Ionicons
                                        name={favouriteIds.has(item.listingId) ? 'heart' : 'heart-outline'}
                                        size={22}
                                        color={favouriteIds.has(item.listingId) ? colors.danger : colors.border}
                                    />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 12, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
    searchIcon: { fontSize: 18, marginRight: 10 },
    searchInput: { flex: 1, height: 44, fontSize: 15, color: colors.text },
    clearBtn: { fontSize: 20, fontWeight: '600', padding: 4 },
    tabsContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    tab: { alignItems: 'center', minWidth: 60, paddingHorizontal: 6 },
    iconCircle: { width: 52, height: 52, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, justifyContent: 'center', alignItems: 'center' },
    iconCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabLabel: { fontSize: 11, paddingTop: 6, color: colors.textMuted, textAlign: 'center', fontWeight: '500', letterSpacing: 0.3 },
    tabLabelActive: { color: colors.primary, fontWeight: '600' },
    listContainer: { marginTop: 4, marginBottom: 12 },

    // 🎯 MODERNIJE HORIZONTALNE KARTICE - veći font, bolji raspored
    itemCard: {
        backgroundColor: colors.card,
        borderRadius: 18,
        marginTop: 8,
        marginBottom: 8,
        marginRight: 14,
        marginLeft: 12,
        borderWidth: 1,
        borderColor: colors.border,
        width: 200,
        overflow: 'hidden',
    },
    itemImage: {
        width: '100%',
        height: 160,
        backgroundColor: colors.border,
    },
    itemCardContent: {
        padding: 14,
        paddingTop: 12,
    },
    itemName: {
        fontWeight: '700',
        fontSize: 16,
        color: colors.text,
        marginBottom: 6,
        lineHeight: 20,
        letterSpacing: -0.2,
    },
    itemLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 10,
    },
    locationText: {
        fontSize: 13,
        color: colors.textMuted,
        flex: 1,
    },
    itemDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: 10,
    },
    itemPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontWeight: '700',
        fontSize: 17,
        color: colors.primarySecondary,
        letterSpacing: -0.3,
    },
    perDay: {
        color: colors.textMuted,
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '500',
    },
    categoryBadge: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    categoryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    emptyText: { textAlign: 'center', color: colors.textMuted, paddingVertical: 24, fontSize: 14, marginHorizontal: 20 },
    sectionTitle: { marginTop: 24, marginLeft: 20, marginBottom: 12, fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },

    // 🎯 MANJE RECOMMENDED KARTICE - kompaktnije
    card: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        marginHorizontal: 20,
        marginVertical: 6,
        borderRadius: 14,
        alignItems: 'stretch',
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        height: 95,
    },
    thumbnail: {
        width: 95,
        height: '100%',
        backgroundColor: colors.border,
    },
    cardContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemTitle: {
        fontWeight: '700',
        fontSize: 15,
        color: colors.text,
        marginBottom: 3,
        letterSpacing: -0.2,
    },
    recLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginBottom: 4,
    },
    distanceText: {
        fontSize: 12,
        color: colors.textMuted,
        flex: 1,
    },
    recPriceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    favoriteButton: {
        padding: 4,
        marginLeft: 6,
    },
});