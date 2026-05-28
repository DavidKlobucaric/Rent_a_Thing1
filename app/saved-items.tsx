import { Image } from 'expo-image';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity, Alert,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { getFavourites, removeFavourite } from '@/src/api/itemsApi';
import type { Listing } from '@/src/api/itemsApi';
import { useRouter } from 'expo-router';

const PLACEHOLDER_IMAGE = 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png';

export default function SavedItemsScreen() {
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const { t } = useLanguage();
    const router = useRouter();

    const [savedItems, setSavedItems] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadFavourites = useCallback(async () => {
        const result = await getFavourites();
        if (result.success) {
            setSavedItems(result.data);
            setError('');
        } else {
            setError(result.message);
        }
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await loadFavourites();
            setLoading(false);
        })();
    }, [loadFavourites]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadFavourites();
        setRefreshing(false);
    }, [loadFavourites]);

    const handleRemove = (id: number) => {
        Alert.alert(
            t('saved', 'removeSaved'),
            t('saved', 'removeConfirm'),
            [
                { text: t('common', 'cancel'), style: 'cancel' },
                {
                    text: t('common', 'remove'),
                    style: 'destructive',
                    onPress: async () => {
                        setSavedItems(prev => prev.filter(item => item.listingId !== id));
                        await removeFavourite(id);
                    },
                },
            ]
        );
    };

    const getFirstImage = (imageUrls: string[] | string | undefined) => {
        if (!imageUrls) return PLACEHOLDER_IMAGE;
        if (Array.isArray(imageUrls)) return imageUrls[0] || PLACEHOLDER_IMAGE;
        return imageUrls.split(',')[0].trim() || PLACEHOLDER_IMAGE;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (savedItems.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="heart-outline" size={44} color={colors.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>{t('saved', 'noSaved')}</Text>
                    <Text style={styles.emptyText}>{t('saved', 'noSavedSub')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <FlatList
                data={savedItems}
                keyExtractor={(item) => item.listingId.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
                                    tintColor={colors.primary} />
                }
                ListHeaderComponent={
                    <Text style={styles.headerSubtitle}>
                        {savedItems.length} {t('saved', 'header')}
                    </Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push({ pathname: '/(tabs)/item', params: { listingId: item.listingId.toString() } })}
                        activeOpacity={0.85}
                    >
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: getFirstImage(item.imageUrls) }}
                                style={styles.itemImage}
                                contentFit="cover"
                                transition={200}
                            />
                            {!item.isAvailable && (
                                <View style={styles.unavailableBadge}>
                                    <Text style={styles.unavailableText}>{t('saved', 'unavailable')}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.cardContent}>
                            <View style={styles.titleRow}>
                                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                <TouchableOpacity
                                    onPress={() => handleRemove(item.listingId)}
                                    style={styles.removeButton}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                >
                                    <Ionicons name="heart" size={22} color={colors.danger} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={14} color={colors.textMuted} style={{ marginRight: 3 }} />
                                <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                            </View>

                            <View style={styles.footer}>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.price}>${item.price}</Text>
                                    <Text style={styles.perDay}>{t('saved', 'perDay')}</Text>
                                </View>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryText}>{item.category}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyIconCircle: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: colors.textMuted + '15',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: 'center', color: colors.textMuted, lineHeight: 20 },
    headerSubtitle: {
        fontSize: 14, fontWeight: '600', color: colors.textMuted,
        paddingHorizontal: 16, paddingBottom: 10, paddingTop: 14,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    listContent: { paddingHorizontal: 16, paddingBottom: 24 },
    card: {
        flexDirection: 'row', borderRadius: 16,
        backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
        marginBottom: 14, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    },
    imageContainer: { width: 115, height: 115, backgroundColor: colors.background },
    itemImage: { width: '100%', height: '100%' },
    unavailableBadge: {
        position: 'absolute', bottom: 8, left: 8,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    },
    unavailableText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
    cardContent: { flex: 1, padding: 14, justifyContent: 'space-between' },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
    removeButton: { padding: 4 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    locationText: { fontSize: 13, color: colors.textMuted, flex: 1 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
    price: { fontSize: 18, fontWeight: '700', color: colors.text },
    perDay: { fontSize: 13, color: colors.textMuted, marginLeft: 2 },
    categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.primary + '15' },
    categoryText: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.3 },
});
