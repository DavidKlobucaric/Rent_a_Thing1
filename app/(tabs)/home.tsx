import { Image } from 'expo-image';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    ScrollView, TouchableOpacity, RefreshControl,
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
    userId?: number;
};

export default function HomeScreen() {
    const { token, user } = useAuth();
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
        await new Promise(resolve => setTimeout(resolve, 400));
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
        } finally {
            setSearchLoading(false);
        }
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
            (async () => {
                setRecLoading(true);
                await new Promise(resolve => setTimeout(resolve, 400));
                const result = await getRecommendedListings();
                if (result.success) {
                    setRecommended(Array.isArray(result.data) ? result.data : []);
                }
                setRecLoading(false);
            })(),
            loadFavourites(),
            loadSearchResults(searchText, activeCategory),
        ]);
        setRefreshing(false);
    }, [searchText, activeCategory, loadFavourites, loadSearchResults]);

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
        const isOwn = user?.userId !== undefined && item.userId === user.userId;
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
                activeOpacity={0.92}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: getFirstImage(item.imageUrls) }}
                        style={styles.itemImage}
                        cachePolicy="memory-disk"
                        transition={200}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
                        style={styles.imageGradient}
                    />
                    {isOwn && (
                        <View style={styles.ownBadge}>
                            <Ionicons name="person" size={10} color="#fff" />
                            <Text style={styles.ownBadgeText}>YOU</Text>
                        </View>
                    )}
                    {!isOwn && (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                toggleFavourite(item.listingId);
                            }}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={styles.favOverlay}
                        >
                            <Ionicons
                                name={favouriteIds.has(item.listingId) ? 'heart' : 'heart-outline'}
                                size={22}
                                color={favouriteIds.has(item.listingId) ? colors.danger : '#FFFFFF'}
                            />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.itemCardContent}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.itemLocationRow}>
                        <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                    </View>
                    {item.description ? (
                        <Text style={styles.itemDescription} numberOfLines={2}>
                            {item.description}
                        </Text>
                    ) : (
                        <View style={styles.itemOwnerRow}>
                            <Ionicons name="person-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.ownerText} numberOfLines={1}>
                                {item.userName || 'Verified Owner'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.itemPriceRow}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>${item.price}</Text>
                            <Text style={styles.perDay}>/day</Text>
                        </View>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{item.category}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [router, t, styles, colors, favouriteIds, toggleFavourite, user?.userId]);

    const getCategoryLabel = () => {
        const cat = CATEGORIES.find(c => c.id === activeCategory);
        return cat?.label || activeCategory.toUpperCase();
    };

    const renderHorizontalShimmer = useCallback((isFirst: boolean = false) => (
        <View style={[styles.itemCard]}>
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={styles.shimmerItemImage}
                shimmerColors={shimmerColors}
            />
            <View style={styles.itemCardContent}>
                <View style={styles.shimmerTitleContainer}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.shimmerTitleLine1}
                        shimmerColors={shimmerColors}
                    />
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.shimmerTitleLine2}
                        shimmerColors={shimmerColors}
                    />
                </View>
                <View style={styles.shimmerLocationRow}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.shimmerLocationIcon}
                        shimmerColors={shimmerColors}
                    />
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.shimmerLocationText}
                        shimmerColors={shimmerColors}
                    />
                </View>
                <View style={styles.shimmerDescriptionContainer}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.shimmerDescriptionLine1}
                        shimmerColors={shimmerColors}
                    />
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.shimmerDescriptionLine2}
                        shimmerColors={shimmerColors}
                    />
                </View>
                <View style={styles.shimmerPriceRow}>
                    <View style={styles.shimmerPriceContainer}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerPrice}
                            shimmerColors={shimmerColors}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerPerDay}
                            shimmerColors={shimmerColors}
                        />
                    </View>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={styles.shimmerCategoryBadge}
                        shimmerColors={shimmerColors}
                    />
                </View>
            </View>
        </View>
    ), [shimmerColors, styles]);

    const renderRecommendedShimmer = useCallback(() => (
        <View style={styles.card}>
            <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={styles.shimmerThumbnail}
                shimmerColors={shimmerColors}
            />
            <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                    <View style={styles.shimmerRecTopRow}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerRecTitle}
                            shimmerColors={shimmerColors}
                        />
                        <View style={styles.favoriteButton}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={styles.shimmerRecHeart}
                                shimmerColors={shimmerColors}
                            />
                        </View>
                    </View>
                    <View style={styles.shimmerRecLocationRow}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerRecLocationIcon}
                            shimmerColors={shimmerColors}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerRecLocationText}
                            shimmerColors={shimmerColors}
                        />
                    </View>
                    <View style={styles.shimmerRecBottomRow}>
                        <View style={styles.shimmerRecPriceContainer}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={styles.shimmerRecPrice}
                                shimmerColors={shimmerColors}
                            />
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={styles.shimmerRecPerDay}
                                shimmerColors={shimmerColors}
                            />
                        </View>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerRecCategoryBadge}
                            shimmerColors={shimmerColors}
                        />
                    </View>
                </View>
            </View>
        </View>
    ), [shimmerColors, styles]);

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
                <View style={styles.searchBar}>
                    <Fontisto name="search" style={[styles.searchIcon, { color: colors.textMuted }]} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('home', 'search')}
                        placeholderTextColor={colors.placeholder}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSearchText('');
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
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
                                        size={22}
                                        color={isActive ? '#FFFFFF' : colors.iconColor}
                                    />
                                </View>
                                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled={true}
                    decelerationRate={0.92}
                    contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
                >
                    {searchLoading ? (
                        [1, 2, 3].map((i) => (
                            <View key={i}>
                                {renderHorizontalShimmer(i === 1)}
                            </View>
                        ))
                    ) : searchError ? (
                        <View style={{ width: 250, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={styles.emptyText}>{searchError}</Text>
                        </View>
                    ) : searchResults.length === 0 ? (
                        <View style={{ width: 250, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={styles.emptyText}>
                                {searchText.trim()
                                    ? `${t('home', 'noResults')} "${searchText}"`
                                    : activeCategory === 'all'
                                        ? t('home', 'noItems')
                                        : `${t('home', 'noItemsCategory')} "${getCategoryLabel()}"`}
                            </Text>
                        </View>
                    ) : (
                        searchResults.map((item) => (
                            <React.Fragment key={item.listingId}>
                                {renderSearchItem({ item })}
                            </React.Fragment>
                        ))
                    )}
                </ScrollView>
                <Text style={styles.sectionTitle}>{t('home', 'recommended')}</Text>
                {recLoading ? (
                    <View>
                        {[1, 2, 3].map((i) => (
                            <View key={i}>
                                {renderRecommendedShimmer()}
                            </View>
                        ))}
                    </View>
                ) : recommended.length === 0 ? (
                    <Text style={[styles.emptyText, { marginHorizontal: 20 }]}>
                        {t('home', 'noRecommendations')}
                    </Text>
                ) : (
                    recommended.map((item) => {
                        const isOwn = user?.userId !== undefined && item.userId === user.userId;
                        return (
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
                                activeOpacity={0.92}
                            >
                                <View style={{ position: 'relative' }}>
                                    <Image
                                        source={{ uri: getFirstImage(item.imageUrls) }}
                                        style={styles.thumbnail}
                                        cachePolicy="memory-disk"
                                        transition={200}
                                        contentFit="cover"
                                    />
                                    {isOwn && (
                                        <View style={styles.ownBadgeRec}>
                                            <Ionicons name="person" size={9} color="#fff" />
                                            <Text style={styles.ownBadgeRecText}>YOU</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.cardContent}>
                                    <View style={styles.cardInfo}>
                                        <View style={styles.recTopRow}>
                                            <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                                            {!isOwn && (
                                                <TouchableOpacity
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        toggleFavourite(item.listingId);
                                                    }}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                    style={styles.favoriteButton}
                                                >
                                                    <Ionicons
                                                        name={favouriteIds.has(item.listingId) ? 'heart' : 'heart-outline'}
                                                        size={22}
                                                        color={favouriteIds.has(item.listingId) ? colors.danger : colors.text}
                                                    />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <View style={styles.recLocationRow}>
                                            <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                                            <Text style={styles.distanceText} numberOfLines={1}>{item.location}</Text>
                                        </View>
                                        <View style={styles.recBottomRow}>
                                            <View style={styles.recPriceContainer}>
                                                <Text style={styles.recPrice}>${item.price}</Text>
                                                <Text style={styles.recPerDay}>/day</Text>
                                            </View>
                                            <View style={styles.recCategoryBadge}>
                                                <Text style={styles.recCategoryBadgeText}>{item.category}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        borderRadius: 12,
    },
    searchIcon: { fontSize: 16, marginRight: 10 },
    searchInput: {
        flex: 1,
        height: 24,
        fontSize: 15,
        color: colors.text,
        paddingVertical: 0,
    },
    tabsContainer: { paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
    tab: { alignItems: 'center', minWidth: 60, paddingHorizontal: 4 },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircleActive: {
        backgroundColor: colors.primary,
    },
    tabLabel: {
        fontSize: 10,
        paddingTop: 6,
        color: colors.textMuted,
        textAlign: 'center',
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    tabLabelActive: { color: colors.primary },
    itemCard: {
        backgroundColor: colors.card,
        borderRadius: 18,
        marginTop: 8,
        marginBottom: 8,
        marginRight: 14,
        width: 220,
        height: 310,
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 160,
    },
    itemImage: {
        width: '100%',
        height: 160,
        backgroundColor: colors.border,
    },
    imageGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    // ✅ PROMIJENJENO: left: 10 → right: 10
    ownBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: colors.primary,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        zIndex: 5,
    },
    ownBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    // ✅ PROMIJENJENO: left: 8 → right: 8
    ownBadgeRec: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: colors.primary,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        zIndex: 5,
    },
    ownBadgeRecText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    favOverlay: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 18,
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemCardContent: {
        flex: 1,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 12,
    },
    itemName: {
        fontWeight: '600',
        fontSize: 16,
        color: colors.text,
        marginBottom: 4,
        lineHeight: 21,
        letterSpacing: -0.3,
    },
    itemLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    locationText: {
        fontSize: 13,
        color: colors.textMuted,
        flex: 1,
    },
    itemDescription: {
        fontSize: 13,
        color: colors.textMuted,
        lineHeight: 16,
        marginBottom: 6,
    },
    itemOwnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    ownerText: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '500',
        flex: 1,
    },
    itemPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontWeight: '700',
        fontSize: 20,
        color: colors.text,
        letterSpacing: -0.5,
    },
    perDay: {
        color: colors.textMuted,
        marginLeft: 2,
        fontSize: 12,
        fontWeight: '500',
    },
    categoryBadge: {
        backgroundColor: colors.primary + '18',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    emptyText: { textAlign: 'center', color: colors.textMuted, paddingVertical: 24, fontSize: 14, marginHorizontal: 20 },
    sectionTitle: {
        marginTop: 24,
        marginLeft: 20,
        marginBottom: 12,
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMuted,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 16,
        alignItems: 'stretch',
        overflow: 'hidden',
        height: 115,
    },
    thumbnail: {
        width: 115,
        height: '100%',
        backgroundColor: colors.border,
    },
    cardContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    cardInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    recTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemTitle: {
        fontWeight: '600',
        fontSize: 15,
        color: colors.text,
        letterSpacing: -0.2,
        flex: 1,
        marginRight: 8,
    },
    favoriteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginBottom: 6,
    },
    distanceText: {
        fontSize: 13,
        color: colors.textMuted,
        flexShrink: 1,
    },
    recBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recPriceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    recPrice: {
        fontWeight: '700',
        fontSize: 16,
        color: colors.text,
    },
    recPerDay: {
        color: colors.textMuted,
        fontSize: 11,
        marginLeft: 2,
    },
    recCategoryBadge: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    recCategoryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary,
        textTransform: 'uppercase',
    },
    shimmerItemImage: {
        width: '100%',
        height: 160,
        backgroundColor: colors.border,
    },
    shimmerTitleContainer: {
        gap: 6,
        marginBottom: 8,
    },
    shimmerTitleLine1: {
        width: '90%',
        height: 16,
        borderRadius: 4,
        backgroundColor: colors.border,
    },
    shimmerTitleLine2: {
        width: '70%',
        height: 16,
        borderRadius: 4,
        backgroundColor: colors.border,
    },
    shimmerLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    shimmerLocationIcon: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.border,
    },
    shimmerLocationText: {
        width: '60%',
        height: 12,
        borderRadius: 3,
        backgroundColor: colors.border,
    },
    shimmerDescriptionContainer: {
        gap: 4,
        marginBottom: 6,
    },
    shimmerDescriptionLine1: {
        width: '100%',
        height: 12,
        borderRadius: 3,
        backgroundColor: colors.border,
    },
    shimmerDescriptionLine2: {
        width: '80%',
        height: 12,
        borderRadius: 3,
        backgroundColor: colors.border,
    },
    shimmerPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    shimmerPriceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    shimmerPrice: {
        width: 40,
        height: 18,
        borderRadius: 4,
        backgroundColor: colors.border,
    },
    shimmerPerDay: {
        width: 24,
        height: 10,
        borderRadius: 2,
        backgroundColor: colors.border,
    },
    shimmerCategoryBadge: {
        width: 50,
        height: 20,
        borderRadius: 6,
        backgroundColor: colors.border,
    },
    shimmerThumbnail: {
        width: 115,
        height: '100%',
        backgroundColor: colors.border,
    },
    shimmerRecTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    shimmerRecTitle: {
        width: '70%',
        height: 15,
        borderRadius: 4,
        backgroundColor: colors.border,
    },
    shimmerRecHeart: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.border,
    },
    shimmerRecLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginBottom: 6,
    },
    shimmerRecLocationIcon: {
        width: 11,
        height: 11,
        borderRadius: 5.5,
        backgroundColor: colors.border,
    },
    shimmerRecLocationText: {
        width: '50%',
        height: 13,
        borderRadius: 3,
        backgroundColor: colors.border,
    },
    shimmerRecBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    shimmerRecPriceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    shimmerRecPrice: {
        width: 36,
        height: 16,
        borderRadius: 4,
        backgroundColor: colors.border,
    },
    shimmerRecPerDay: {
        width: 20,
        height: 9,
        borderRadius: 2,
        marginLeft: 2,
        backgroundColor: colors.border,
    },
    shimmerRecCategoryBadge: {
        width: 48,
        height: 14,
        borderRadius: 4,
        backgroundColor: colors.border,
    },
});