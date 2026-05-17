import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

// ─────────────────────────────────────────────────────
// MOCK PODACI
// ─────────────────────────────────────────────────────
const MOCK_SAVED_ITEMS = [
    {
        listingId: 101,
        name: 'Professional Drill Set',
        location: 'San Francisco, CA',
        price: 45,
        category: 'TOOLS',
        description: 'High-quality cordless drill with 20+ attachments',
        imageUrls: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=400',
        userName: 'Mike Johnson',
        isAvailable: true,
    },
    {
        listingId: 102,
        name: '4-Person Camping Tent',
        location: 'Portland, OR',
        price: 35,
        category: 'CAMPING',
        description: 'Waterproof tent, easy setup, sleeps 4 comfortably',
        imageUrls: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400',
        userName: 'Sarah Williams',
        isAvailable: true,
    },
    {
        listingId: 103,
        name: 'Gaming Mechanical Keyboard',
        location: 'Austin, TX',
        price: 25,
        category: 'TECH',
        description: 'RGB backlit, Cherry MX switches, perfect for gaming',
        imageUrls: 'https://i.extremetech.com/imagery/content-types/00hygCJbhhvWfYz79pKTe4x/hero-image.fit_lim.size_1600x900.v1678673392.jpg',
        userName: 'Alex Chen',
        isAvailable: false,
    },
    {
        listingId: 104,
        name: 'Mountain Bike - 29"',
        location: 'Denver, CO',
        price: 60,
        category: 'SPORTS',
        description: 'Full suspension, 21-speed, great for trails',
        imageUrls: 'https://asset.scott-sports.com/Cro/CrossCountry_Bike_Discipline_Banner_MTB_2263079.jpg?signature=3c8b8e92f5dfac7af082ab68808cc46521e217a2b1757b49ae560c814136a0ac',
        userName: 'Emma Davis',
        isAvailable: true,
    },
    {
        listingId: 105,
        name: 'Winter Jacket - Premium',
        location: 'Seattle, WA',
        price: 30,
        category: 'CLOTHES',
        description: 'Insulated, waterproof, size L, barely used',
        imageUrls: 'https://images.unsplash.com/photo-1551489186-cf8726f514f8?w=400',
        userName: 'Chris Martinez',
        isAvailable: true,
    },
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

type SavedItemsScreenProps = {
    favorites?: number[];
    onRemoveFavorite?: (id: number) => void;
    onSelectItem?: (item: Listing) => void;
};

export default function SavedItemsScreen({
                                             favorites = [],
                                             onRemoveFavorite,
                                             onSelectItem
                                         }: SavedItemsScreenProps) {

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const savedItems = useMemo(() => {
        if (favorites.length === 0) return MOCK_SAVED_ITEMS;
        return MOCK_SAVED_ITEMS.filter(item => favorites.includes(item.listingId));
    }, [favorites]);

    const handleRemove = (id: number) => {
        Alert.alert(
            'Remove from Saved',
            'Are you sure you want to remove this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => onRemoveFavorite?.(id)
                }
            ]
        );
    };

    const getFirstImage = (imageUrls: string) => {
        if (!imageUrls) return PLACEHOLDER_IMAGE;
        const first = imageUrls.split(',')[0].trim();
        return first || PLACEHOLDER_IMAGE;
    };

    // ───────── EMPTY STATE ─────────
    if (savedItems.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="heart-dislike-outline" size={80} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Saved Items</Text>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        Tap ♡ on any item to save it here
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ───────── LISTA ─────────
    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <FlatList
                data={savedItems}
                keyExtractor={(item) => item.listingId.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                        {savedItems.length} {savedItems.length === 1 ? 'item' : 'items'}
                    </Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => onSelectItem?.(item)}
                        activeOpacity={0.7}
                    >
                        {/* SLIKA */}
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: getFirstImage(item.imageUrls) }}
                                style={styles.itemImage}
                                contentFit="cover"
                                transition={200}
                            />
                            {!item.isAvailable && (
                                <View style={styles.unavailableBadge}>
                                    <Text style={styles.unavailableText}>Unavailable</Text>
                                </View>
                            )}
                        </View>

                        {/* SADRŽAJ */}
                        <View style={styles.cardContent}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => handleRemove(item.listingId)}
                                    style={styles.removeButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="close-circle" size={22} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
                                <Ionicons name="location-outline" size={14} color={colors.textMuted} /> {item.location}
                            </Text>

                            <View style={styles.footer}>
                                <View style={styles.priceContainer}>
                                    <Text style={[styles.price, { color: colors.text }]}>${item.price}</Text>
                                    <Text style={[styles.perDay, { color: colors.textMuted }]}>/day</Text>
                                </View>
                                <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
                                    <Text style={[styles.categoryText, { color: colors.iconColorInverse }]}>{item.category}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}


const makeStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },


    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 10,
        color: colors.textMuted,
        lineHeight: 22,
    },


    headerSubtitle: {
        fontSize: 15,
        paddingHorizontal: 16,
        paddingBottom: 14,
        paddingTop: 14,
    },


    listContent: {
        paddingHorizontal: 14,
        paddingBottom: 14,
    },


    card: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    imageContainer: {
        width: 110,
        height: 110,
        position: 'relative',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    unavailableBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: "#000000B3",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
    },
    unavailableText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },


    cardContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    removeButton: {
        padding: 2,
    },
    locationText: {
        fontSize: 13,
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },


    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: 18,
        fontWeight: '600',
    },
    perDay: {
        fontSize: 12,
        marginLeft: 2,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 18,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
});