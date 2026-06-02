import { Image } from 'expo-image';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity, Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { getMyListings, deleteListing } from '@/src/api/itemsApi';
import type { Listing } from '@/src/api/itemsApi';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const PLACEHOLDER_IMAGE = 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png';

export default function MyListingsScreen() {
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [scheme]);
    const { t } = useLanguage();
    const router = useRouter();

    const shimmerColors = useMemo(() =>
            scheme === 'dark'
                ? ['#2A2A2A', '#3A3A3A', '#2A2A2A']
                : ['#E0E0E0', '#F5F5F5', '#E0E0E0'],
        [scheme]);

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadListings = useCallback(async () => {
        const result = await getMyListings();
        if (result.success) {
            setListings(result.data);
            setError('');
        } else {
            setError(result.message);
        }
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await loadListings();
            setLoading(false);
        })();
    }, [loadListings]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadListings();
        setRefreshing(false);
    }, [loadListings]);

    const handleEdit = useCallback((listingId: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/edit-listing', params: { listingId: listingId.toString() } });
    }, [router]);

    const handleDelete = useCallback((listing: Listing) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            t('edit', 'deleteListing') || 'Delete Listing',
            t('edit', 'deleteConfirm') || 'This will permanently remove your listing.',
            [
                { text: t('common', 'cancel'), style: 'cancel' },
                {
                    text: t('common', 'delete'),
                    style: 'destructive',
                    onPress: async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        const result = await deleteListing(listing.listingId);
                        if (result.success) {
                            setListings(prev => prev.filter(l => l.listingId !== listing.listingId));
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } else {
                            Alert.alert(t('common', 'error'), result.message);
                        }
                    },
                },
            ]
        );
    }, [t]);

    const handleView = useCallback((listingId: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/item', params: { listingId: listingId.toString() } });
    }, [router]);

    const getFirstImage = useCallback((imageUrls: string[] | string | undefined) => {
        if (!imageUrls) return PLACEHOLDER_IMAGE;
        if (Array.isArray(imageUrls)) return imageUrls[0] || PLACEHOLDER_IMAGE;
        return imageUrls.split(',')[0]?.trim() || PLACEHOLDER_IMAGE;
    }, []);

    const renderItem = useCallback(({ item }: { item: Listing }) => (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.cardTouchable}
                onPress={() => handleView(item.listingId)}
                activeOpacity={0.85}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: getFirstImage(item.imageUrls) }}
                        style={styles.itemImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                    />
                    {!item.isAvailable && (
                        <View style={styles.unavailableBadge}>
                            <Text style={styles.unavailableText}>{t('saved', 'unavailable')}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
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
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleEdit(item.listingId)}
                >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <Text style={styles.editBtnText}>{t('edit', 'edit') || 'Edit'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item)}
                >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={styles.deleteBtnText}>{t('common', 'delete')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    ), [styles, handleEdit, handleDelete, handleView, getFirstImage, t, colors]);

    const keyExtractor = useCallback((item: Listing) => item.listingId.toString(), []);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 14 }}>
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{ width: '40%', height: 16, borderRadius: 4, marginBottom: 8 }}
                        shimmerColors={shimmerColors}
                    />
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={{ borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                            <View style={{ flexDirection: 'row' }}>
                                <ShimmerPlaceholder
                                    LinearGradient={LinearGradient}
                                    style={{ width: 115, height: 115 }}
                                    shimmerColors={shimmerColors}
                                />
                                <View style={{ flex: 1, padding: 14, gap: 10 }}>
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '60%', height: 18, borderRadius: 4 }} shimmerColors={shimmerColors} />
                                    <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '50%', height: 14, borderRadius: 4 }} shimmerColors={shimmerColors} />
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' }}>
                                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: '35%', height: 20, borderRadius: 4 }} shimmerColors={shimmerColors} />
                                        <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ width: 60, height: 24, borderRadius: 8 }} shimmerColors={shimmerColors} />
                                    </View>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ flex: 1, height: 36, borderRadius: 8 }} shimmerColors={shimmerColors} />
                                <ShimmerPlaceholder LinearGradient={LinearGradient} style={{ flex: 1, height: 36, borderRadius: 8 }} shimmerColors={shimmerColors} />
                            </View>
                        </View>
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="cloud-offline-outline" size={56} color={colors.danger} />
                    <Text style={styles.emptyTitle}>{error}</Text>
                    <TouchableOpacity onPress={loadListings} style={styles.retryBtn}>
                        <Ionicons name="refresh-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (listings.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="cube-outline" size={44} color={colors.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>{t('profile', 'noListings') || 'No Listings Yet'}</Text>
                    <Text style={styles.emptyText}>{t('profile', 'noListingsSub') || 'Tap the + button to create your first listing and start earning.'}</Text>
                    <TouchableOpacity
                        style={styles.createBtn}
                        onPress={() => router.push('/(tabs)/add')}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.createBtnText}>{t('profile', 'createListing') || 'Create Listing'}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <FlatList
                data={listings}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={5}
                windowSize={5}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListHeaderComponent={
                    <Text style={styles.headerSubtitle}>
                        {listings.length} {listings.length === 1 ? (t('profile', 'listing') || 'listing') : (t('profile', 'listings') || 'listings')}
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
    emptyText: { fontSize: 14, textAlign: 'center', color: colors.textMuted, lineHeight: 20, marginBottom: 20 },
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
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 28,
        backgroundColor: colors.primary,
        borderRadius: 14,
    },
    createBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 16,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    listContent: { paddingHorizontal: 16, paddingBottom: 24 },
    card: {
        borderRadius: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    cardTouchable: { flexDirection: 'row' },
    imageContainer: { width: 115, height: 115, backgroundColor: colors.background },
    itemImage: { width: '100%', height: '100%' },
    unavailableBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    unavailableText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
    cardContent: { flex: 1, padding: 14, justifyContent: 'space-between' },
    itemName: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    locationText: { fontSize: 13, color: colors.textMuted, flex: 1 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
    price: { fontSize: 18, fontWeight: '700', color: colors.text },
    perDay: { fontSize: 13, color: colors.textMuted, marginLeft: 2 },
    categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.primary + '15' },
    categoryText: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.3 },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: colors.primary + '12',
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    editBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    deleteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: colors.danger + '10',
        borderWidth: 1,
        borderColor: colors.danger + '25',
    },
    deleteBtnText: { fontSize: 13, fontWeight: '600', color: colors.danger },
});