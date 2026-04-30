import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    ScrollView, TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fontisto, Ionicons } from '@expo/vector-icons';
import { searchListings, getRecommendedListings } from '@/src/api/itemsApi';
import { useAuth } from '@/src/context/authContext';

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

    const [searchText, setSearchText]         = useState('');
    const [activeCategory, setActiveCategory] = useState('tools');
    const [favorites, setFavorites]           = useState<number[]>([]);

    const [searchResults, setSearchResults]   = useState<Listing[]>([]);
    const [searchLoading, setSearchLoading]   = useState(false);
    const [searchError, setSearchError]       = useState('');

    const [recommended, setRecommended]       = useState<Listing[]>([]);
    const [recLoading, setRecLoading]         = useState(true);

    // Reload recommended whenever the token changes (e.g. after login)
    useEffect(() => {
        (async () => {
            setRecLoading(true);
            const result = await getRecommendedListings();
            if (result.success) {
                setRecommended(Array.isArray(result.data) ? result.data : []);
            }
            setRecLoading(false);
        })();
    }, [token]); // ← re-runs when user logs in or out

    // Search whenever text or category changes (debounced 400ms)
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
                    <Fontisto name="search" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        placeholderTextColor="#9CA3AF"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Text style={styles.clearBtn}>✕</Text>
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
                                        color={isActive ? '#fff' : '#6B7280'}
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
                        <ActivityIndicator color="#097F8C" style={{ marginVertical: 16 }} />
                    ) : searchError ? (
                        <Text style={styles.emptyText}>{searchError}</Text>
                    ) : searchResults.length === 0 ? (
                        <Text style={styles.emptyText}>
                            {searchText
                                ? `No results for: "${searchText}"`
                                : `No items in category:  "${activeCategory}"`}
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
                                <View style={styles.itemCard}>
                                    <Image
                                        source={{ uri: getFirstImage(item.imageUrls) }}
                                        style={styles.itemImage}
                                    />
                                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.locationText} numberOfLines={1}>📍 {item.location}</Text>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={styles.price}>${item.price}</Text>
                                        <Text style={styles.perDay}>/day</Text>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </View>

                {/* RECOMMENDED */}
                <Text style={styles.sectionTitle}>Recommended for You</Text>

                {recLoading ? (
                    <ActivityIndicator color="#097F8C" style={{ marginVertical: 16 }} />
                ) : recommended.length === 0 ? (
                    <Text style={[styles.emptyText, { marginHorizontal: 20 }]}>
                        No recommendations for now.
                    </Text>
                ) : (
                    recommended.map((item) => (
                        <View key={item.listingId} style={styles.card}>
                            <Image
                                source={{ uri: getFirstImage(item.imageUrls) }}
                                style={styles.thumbnail}
                            />
                            <View style={styles.cardContent}>
                                <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.distanceText} numberOfLines={1}>📍 {item.location}</Text>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.price}>${item.price}</Text>
                                    <Text style={styles.perDay}>/day</Text>
                                </View>
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => toggleFavorite(item.listingId)}>
                                    <Ionicons
                                        name={favorites.includes(item.listingId) ? 'heart' : 'heart-outline'}
                                        size={24}
                                        color={favorites.includes(item.listingId) ? '#e74c3c' : '#ccc'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',

    },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        marginTop: 10,
        marginBottom: 10,
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: '#ffff',
        borderWidth: 0.5,
        borderColor: "#BDC9C8",
        borderRadius: 12,
    },

    searchIcon: {
        fontSize: 16,
        color: '#888',
        marginRight: 8,
    },

    searchInput: {
        flex: 1,
        height: 45,
        fontSize: 16,
        color: '#333',
    },

    clearBtn: {
        color: '#999',
    },

    locationText: {
        fontSize: 12,
        color: '#888',
        paddingTop: 2
    },

    tabsContainer: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        paddingRight: 30,

    },

    tab: {
        alignItems: 'center',
        marginHorizontal: 4,
        minWidth: 56,
        paddingHorizontal: 4,
    },

    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 9999,
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderColor: "#BDC9C8",
        justifyContent: 'center',
        alignItems: 'center',


    },

    iconCircleActive: {
        backgroundColor: '#097F8C',
    },

    tabLabel: {
        fontSize: 11,
        paddingTop:2,
        color: '#999',
        textAlign: 'center',
    },

    tabLabelActive: {
        color: '#097F8C',
    },

    listContainer: {
        marginTop: 8,

    },

    itemCard: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 8,
        marginRight: 12,
        marginLeft: 0,

    },

    itemName: {
        fontWeight:"600",
        fontSize: 16,
        paddingTop: 10,

    },

    emptyText: {
        textAlign: 'center',
        color: '#bbb',
    },

    sectionTitle: {
        marginTop: 24,
        marginLeft:20,
        marginBottom: 12,
        fontSize: 16,
        fontWeight: '700',
    },

    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 8,
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',

    },

    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 10,
    },

    cardContent: {
        flex: 1,
        paddingHorizontal: 20,
        gap:2
    },

    itemTitle: {
        fontWeight: '600',


    },

    distanceText: {
        fontSize: 12,
        color: '#888',

    },

    price: {
        fontWeight: '600',
        color: '#097F8C',
    },

    perDay: {
        color: '#999',
        marginLeft: 5,
    },

    actions: {
        alignItems: 'flex-end',
        gap: 20,
    },

    itemImage: {
        width: 160,
        height: 160,
        borderRadius: 10,
        backgroundColor: 'white',

    },

});