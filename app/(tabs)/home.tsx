import { Image } from 'expo-image';
import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    ScrollView, TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fontisto, Ionicons } from '@expo/vector-icons';
import { searchListings, getRecommendedListings } from '@/src/api/itemsApi';
import { useAuth } from '@/src/context/authContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { router } from "expo-router";
import { useLanguage } from '@/src/context/languageContext';

type Category = {
    id: string;
    label: string;
    activeIcon: React.ComponentProps<typeof Ionicons>['name'];
    inactiveIcon: React.ComponentProps<typeof Ionicons>['name'];
};

const CATEGORIES: Category[] = [
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
    imageUrls: string;
    userName: string;
};

export default function HomeScreen() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const [searchText, setSearchText] = useState('');
    const [activeCategory, setActiveCategory] = useState('tools');
    const [favorites, setFavorites] = useState<number[]>([]);

    const [searchResults, setSearchResults] = useState<Listing[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');

    const [recommended, setRecommended] = useState<Listing[]>([]);
    const [recLoading, setRecLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setRecLoading(true);
            const result = await getRecommendedListings();
            if (result.success) {
                setRecommended(Array.isArray(result.data) ? result.data : []);
            }
            setRecLoading(false);
        })();
    }, [token]);

    useEffect(() => {
        const query = searchText.trim() || activeCategory;
        const timeout = setTimeout(async () => {
            setSearchLoading(true);
            setSearchError('');
            const result = await searchListings(query);
            if (result.success) {
                const data = Array.isArray(result.data) ? result.data : [];
                const filtered = searchText.trim()
                    ? data
                    : data.filter(
                        (item: Listing) =>
                            item.category?.toLowerCase() === activeCategory.toLowerCase()
                    );
                setSearchResults(filtered);
            } else {
                setSearchError(result.message);
                setSearchResults([]);
            }
            setSearchLoading(false);
        }, 400);
        return () => clearTimeout(timeout);
    }, [searchText, activeCategory]);

    const toggleFavorite = (id: number) => {
        setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };

    const getFirstImage = (imageUrls: string) => {
        if (!imageUrls) return PLACEHOLDER_IMAGE;
        const first = imageUrls.split(',')[0].trim();
        return first || PLACEHOLDER_IMAGE;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView showsVerticalScrollIndicator={false}>

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
                        <TouchableOpacity onPress={() => setSearchText('')}>
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
                                onPress={() => { setActiveCategory(cat.id); setSearchText(''); }}
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
                <View style={styles.listContainer}>
                    {searchLoading ? (
                        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
                    ) : searchError ? (
                        <Text style={styles.emptyText}>{searchError}</Text>
                    ) : searchResults.length === 0 ? (
                        <Text style={styles.emptyText}>
                            {searchText
                                ? `${t('home', 'noResults')} "${searchText}"`
                                : `${t('home', 'noItemsCategory')} "${activeCategory}"`}
                        </Text>
                    ) : (
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item.listingId.toString()}
                            scrollEnabled={false}
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 10 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.itemCard}
                                    onPress={() => router.push({
                                        pathname: '/item',
                                        params: { listingId: item.listingId.toString() }
                                    })}
                                >
                                    <Image
                                        source={{ uri: getFirstImage(item.imageUrls) }}
                                        style={styles.itemImage}
                                    />
                                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.locationText} numberOfLines={1}>📍 {item.location}</Text>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={styles.price}>${item.price}</Text>
                                        <Text style={styles.perDay}>{t('home', 'perDay')}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>

                {/* RECOMMENDED */}
                <Text style={styles.sectionTitle}>{t('home', 'recommended')}</Text>

                {recLoading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
                ) : recommended.length === 0 ? (
                    <Text style={[styles.emptyText, { marginHorizontal: 20 }]}>
                        {t('home', 'noRecommendations')}
                    </Text>
                ) : (
                    recommended.map((item) => (
                        <TouchableOpacity
                            key={item.listingId}
                            style={styles.card}
                            onPress={() => router.push({
                                pathname: '/item',
                                params: { listingId: item.listingId.toString() }
                            })}
                        >
                            <Image
                                source={{ uri: getFirstImage(item.imageUrls) }}
                                style={styles.thumbnail}
                            />
                            <View style={styles.cardContent}>
                                <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.distanceText} numberOfLines={1}>📍 {item.location}</Text>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.price}>${item.price}</Text>
                                    <Text style={styles.perDay}>{t('home', 'perDay')}</Text>
                                </View>
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => toggleFavorite(item.listingId)}>
                                    <Ionicons
                                        name={favorites.includes(item.listingId) ? 'heart' : 'heart-outline'}
                                        size={24}
                                        color={favorites.includes(item.listingId) ? colors.danger : colors.border}
                                    />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
        marginTop: 12,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
    },

    searchIcon: {
        fontSize: 18,
        marginRight: 10,
    },

    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 15,
        color: colors.text,
    },

    clearBtn: {
        fontSize: 20,
        fontWeight: '600',
        padding: 4,
    },

    locationText: {
        fontSize: 12,
        color: colors.textMuted,
        paddingTop: 2,
    },

    tabsContainer: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },

    tab: {
        alignItems: 'center',
        minWidth: 60,
        paddingHorizontal: 6,
    },

    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },

    iconCircleActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },

    tabLabel: {
        fontSize: 11,
        paddingTop: 6,
        color: colors.textMuted,
        textAlign: 'center',
        fontWeight: '500',
        letterSpacing: 0.3,
    },

    tabLabelActive: {
        color: colors.primary,
        fontWeight: '600',
    },

    listContainer: {
        marginTop: 4,
        marginBottom: 8,
    },

    itemCard: {
        backgroundColor: colors.card,
        padding: 12,
        borderRadius: 14,
        marginTop: 8,
        marginBottom: 8,
        marginRight: 12,
        marginLeft: 10,
        borderWidth: 1,
        borderColor: colors.border,
        width: 180,
    },

    itemName: {
        fontWeight: '600',
        fontSize: 15,
        paddingTop: 10,
        color: colors.text,
    },

    emptyText: {
        textAlign: 'center',
        color: colors.textMuted,
        paddingVertical: 24,
        fontSize: 14,
        marginHorizontal: 20,
    },

    sectionTitle: {
        marginTop: 28,
        marginLeft: 20,
        marginBottom: 14,
        fontSize: 17,
        fontWeight: '600',
        color: colors.text,
        letterSpacing: -0.3,
    },

    card: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        marginHorizontal: 20,
        marginVertical: 8,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },

    thumbnail: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: colors.border,
    },

    cardContent: {
        flex: 1,
        paddingHorizontal: 16,
        gap: 4,
    },

    itemTitle: {
        fontWeight: '600',
        fontSize: 15,
        color: colors.text,
    },

    distanceText: {
        fontSize: 12,
        color: colors.textMuted,
    },

    price: {
        fontWeight: '600',
        color: colors.primary,
        fontSize: 15,
    },

    perDay: {
        color: colors.textMuted,
        marginLeft: 4,
        fontSize: 13,
    },

    actions: {
        alignItems: 'flex-end',
        gap: 4,
    },

    itemImage: {
        width: 160,
        height: 160,
        borderRadius: 12,
        backgroundColor: colors.border,
    },
});