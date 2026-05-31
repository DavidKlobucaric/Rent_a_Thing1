import { Image } from 'expo-image';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity, Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import  ShimmerPlaceholder  from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { getFavourites, removeFavourite } from '@/src/api/itemsApi';
import type { Listing } from '@/src/api/itemsApi';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const PLACEHOLDER_IMAGE = 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png';

export default function SavedItemsScreen() {
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    // ✅ Stabilan styles - ovisi o scheme (primitive), ne o colors objektu
    const styles = useMemo(() => makeStyles(colors), [scheme]);
    const { t } = useLanguage();
    const router = useRouter();

    // ✅ Shimmer boje ovisno o temi
    const shimmerColors = useMemo(() =>
            scheme === 'dark'
                ? ['#2A2A2A', '#3A3A3A', '#2A2A2A']
                : ['#E0E0E0', '#F5F5F5', '#E0E0E0'],
        [scheme]);

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

    // ✅ Memoiziran handleRemove
    const handleRemove = useCallback((id: number) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            t('saved', 'removeSaved'),
            t('saved', 'removeConfirm'),
            [
                { text: t('common', 'cancel'), style: 'cancel' },
                {
                    text: t('common', 'remove'),
                    style: 'destructive',
                    onPress: async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setSavedItems(prev => prev.filter(item => item.listingId !== id));
                        await removeFavourite(id);
                    },
                },
            ]
        );
    }, [t]);

    // ✅ Memoiziran handleItemPress
    const handleItemPress = useCallback((listingId: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/item', params: { listingId: listingId.toString() } });
    }, [router]);

    const getFirstImage = useCallback((imageUrls: string[] | string | undefined) => {
        if (!imageUrls) return PLACEHOLDER_IMAGE;
        if (Array.isArray(imageUrls)) return imageUrls[0] || PLACEHOLDER_IMAGE;
        return imageUrls.split(',')[0].trim() || PLACEHOLDER_IMAGE;
    }, []);

    // ✅ Memoiziran renderItem - ključno za FlatList performansu
    const renderItem = useCallback(({ item }: { item: Listing }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleItemPress(item.listingId)}
            activeOpacity={0.85}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: getFirstImage(item.imageUrls) }}
                    style={styles.itemImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk" // ✅ Brže ponovno učitavanje
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
    ), [styles, handleItemPress, handleRemove, getFirstImage, t, colors]);

    // ✅ Memoiziran keyExtractor
    const keyExtractor = useCallback((item: Listing) => item.listingId.toString(), []);

    // ═══════════════════════════════════════════════════════════════
    // ✨ SHIMMER LOADING STATE - premium UX
    // ═══════════════════════════════════════════════════════════════
    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 14 }}>
                    {/* Header shimmer */}
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{ width: '40%', height: 16, borderRadius: 4, marginBottom: 8 }}
                        shimmerColors={shimmerColors}
                    />
                    {/* Card shimmers */}
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={{ flexDirection: 'row', borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: 115, height: 115 }}
                                shimmerColors={shimmerColors}
                            />
                            <View style={{ flex: 1, padding: 14, gap: 10 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <ShimmerPlaceholder
                                        LinearGradient={LinearGradient}
                                        style={{ width: '60%', height: 18, borderRadius: 4 }}
                                        shimmerColors={shimmerColors}
                                    />
                                    <ShimmerPlaceholder
                                        LinearGradient={LinearGradient}
                                        style={{ width: 22, height: 22, borderRadius: 11 }}
                                        shimmerColors={shimmerColors}
                                    />
                                </View>
                                <ShimmerPlaceholder
                                    LinearGradient={LinearGradient}
                                    style={{ width: '50%', height: 14, borderRadius: 4 }}
                                    shimmerColors={shimmerColors}
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' }}>
                                    <ShimmerPlaceholder
                                        LinearGradient={LinearGradient}
                                        style={{ width: '35%', height: 20, borderRadius: 4 }}
                                        shimmerColors={shimmerColors}
                                    />
                                    <ShimmerPlaceholder
                                        LinearGradient={LinearGradient}
                                        style={{ width: 60, height: 24, borderRadius: 8 }}
                                        shimmerColors={shimmerColors}
                                    />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
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
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true} // ✅ Bolja memorija
                maxToRenderPerBatch={5}       // ✅ Bolja responsivnost
                windowSize={5}               // ✅ Manje memorije
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListHeaderComponent={
                    <Text style={styles.headerSubtitle}>
                        {savedItems.length} {t('saved', 'header')}
                    </Text>
                }
            />
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.textMuted + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: 'center', color: colors.textMuted, lineHeight: 20 },
    headerSubtitle: { fontSize: 14, fontWeight: '600', color: colors.textMuted, paddingHorizontal: 16, paddingBottom: 10, paddingTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
    listContent: { paddingHorizontal: 16, paddingBottom: 24 },
    card: { flexDirection: 'row', borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
    imageContainer: { width: 115, height: 115, backgroundColor: colors.background },
    itemImage: { width: '100%', height: '100%' },
    unavailableBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
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