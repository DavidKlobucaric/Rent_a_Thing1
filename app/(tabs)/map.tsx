import React, { useState, useRef, useMemo, useEffect, useCallback, memo } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    Keyboard, ScrollView, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import Mapbox, { MapView, Camera, PointAnnotation, MarkerView } from '@rnmapbox/maps';
import { Fontisto, Ionicons } from '@expo/vector-icons';
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { getMapMarkers, resolveMarkerCoordinates, MapMarker } from '@/src/api/itemsApi';
import { useAuth } from '@/src/context/authContext';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const LIGHT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const DARK_MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Coordinate {
    latitude: number;
    longitude: number;
}

const CATEGORIES: {
    id: string;
    label: string;
    icon: IoniconName;
    iconActive: IoniconName;
}[] = [
    { id: 'tools',   label: 'Tools',   icon: 'hammer-outline',          iconActive: 'hammer' },
    { id: 'camping', label: 'Camping', icon: 'bonfire-outline',          iconActive: 'bonfire' },
    { id: 'tech',    label: 'Tech',    icon: 'laptop-outline',           iconActive: 'laptop' },
    { id: 'sports',  label: 'Sports',  icon: 'football-outline',         iconActive: 'football' },
    { id: 'games',   label: 'Games',   icon: 'game-controller-outline',  iconActive: 'game-controller' },
];

const CATEGORY_ICON_MAP: Record<string, { icon: IoniconName; iconActive: IoniconName }> = {
    'tools': { icon: 'hammer-outline', iconActive: 'hammer' },
    'camping': { icon: 'bonfire-outline', iconActive: 'bonfire' },
    'tech': { icon: 'laptop-outline', iconActive: 'laptop' },
    'sports': { icon: 'football-outline', iconActive: 'football' },
    'games': { icon: 'game-controller-outline', iconActive: 'game-controller' },
};

const getCategoryIcon = (category: string): IoniconName => {
    const cat = category.toLowerCase();
    return CATEGORY_ICON_MAP[cat]?.iconActive ?? 'pricetag';
};

// ═══════════════════════════════════════════════════════════════
// ✅ MEMOIZIRANA PIN KOMPONENTA
// ═══════════════════════════════════════════════════════════════
interface MapPinProps {
    marker: MapMarker;
    isSelected: boolean;
    primaryColor: string;
    colors: typeof Colors.light;
    onPress: (marker: MapMarker) => void;
    onCalloutPress: () => void;
    styles: ReturnType<typeof makeStyles>;
}

const MapPin = memo(({ marker, isSelected, primaryColor, colors, onPress, onCalloutPress, styles }: MapPinProps) => {
    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(marker);
    }, [marker, onPress]);

    const categoryIcon = getCategoryIcon(marker.category);

    return (
        <MarkerView
            key={`marker-${marker.listingId}`}
            coordinate={[marker.longitude!, marker.latitude!]}
            anchor={{ x: 0.5, y: 1 }}
        >
            <View style={styles.markerWrapper}>

                {/* 💬 POPUP PROZORČIĆ IZNAD IGLE */}
                {isSelected && (
                    <TouchableOpacity
                        style={styles.floatingCallout}
                        activeOpacity={0.92}
                        onPress={onCalloutPress}
                    >
                        {marker.thumbnailUrl ? (
                            <Image
                                source={{ uri: marker.thumbnailUrl }}
                                style={styles.calloutImage}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                                transition={200}
                            />
                        ) : (
                            <View style={[styles.calloutImage, styles.calloutImagePlaceholder]}>
                                <Ionicons name="image-outline" size={20} color={colors.textMuted} />
                            </View>
                        )}
                        <View style={styles.calloutText}>
                            <Text style={styles.calloutName} numberOfLines={1}>
                                {marker.name}
                            </Text>
                            <Text style={styles.calloutPrice}>
                                €{Number(marker.price).toFixed(0)} / day
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.textMuted}
                            style={{ marginLeft: 4 }}
                        />
                    </TouchableOpacity>
                )}

                {/* 📍 PRIBADAČA SA CIJENOM */}
                <TouchableOpacity
                    onPress={handlePress}
                    activeOpacity={0.85}
                    style={{ alignItems: 'center' }}
                >
                    <View
                        style={[
                            styles.pin,
                            { backgroundColor: primaryColor },
                            isSelected && styles.pinSelected,
                        ]}
                    >
                        <View style={styles.pinContent}>
                            <Ionicons name={categoryIcon} size={12} color="#FFFFFF" />
                            <Text style={styles.pinPrice}>
                                €{Number(marker.price).toFixed(0)}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.pinTail, { borderTopColor: primaryColor }]} />
                </TouchableOpacity>
            </View>
        </MarkerView>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.marker.listingId === nextProps.marker.listingId &&
        prevProps.marker.price === nextProps.marker.price &&
        prevProps.marker.category === nextProps.marker.category &&
        prevProps.marker.latitude === nextProps.marker.latitude &&
        prevProps.marker.longitude === nextProps.marker.longitude
    );
});

// ═══════════════════════════════════════════════════════════════
export default function MapScreen() {
    const { t } = useLanguage();
    const { token, isLoading } = useAuth();
    const router = useRouter();
    const cameraRef = useRef<Camera>(null);

    const [searchText, setSearchText] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchMarker, setSearchMarker] = useState<Coordinate & { title: string } | null>(null);
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [markersLoading, setMarkersLoading] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [scheme]);

    const shimmerColors = useMemo(() =>
            scheme === 'dark'
                ? ['#2A2A2A', '#3A3A3A', '#2A2A2A']
                : ['#E0E0E0', '#F5F5F5', '#E0E0E0'],
        [scheme]);

    const loadMarkers = useCallback(async (category: string | null) => {
        setMarkersLoading(true);
        console.log(`[MAP_DEBUG] Pokrećem dohvaćanje. Kategorija:`, category);

        const result = await getMapMarkers(category || undefined);
        if (!result.success) {
            console.log('[MAP_DEBUG] Greška dohvaćanja:', result.message);
            setMarkers([]);
            setMarkersLoading(false);
            return;
        }

        console.log(`[MAP_DEBUG] Povučeno s backenda stavki:`, result.data.length);
        const resolved = await resolveMarkerCoordinates(result.data);
        console.log(`[MAP_DEBUG] Stavki na mapi (s koordinatama):`, resolved.length);

        setMarkers(resolved);
        setMarkersLoading(false);
    }, []);

    // 🔒 SPOJENE KOČNICE: useFocusEffect sada samostalno upravlja i fokusom i promjenom kategorija.
    // Stari useEffect je uklonjen kako bi se spriječilo duplo okidanje API-ja na inicijalnom loadu.
    useFocusEffect(
        useCallback(() => {
            if (isLoading || !token) {
                console.log("[MAP_DEBUG] Obustavljam dohvaćanje, čekam token...");
                return;
            }
            setSelectedMarker(null);
            loadMarkers(activeCategory);
        }, [activeCategory, loadMarkers, token, isLoading])
    );

    const handleMarkerPress = useCallback((marker: MapMarker) => {
        setSelectedMarker((prev) => {
            const isClosing = prev?.listingId === marker.listingId;
            if (!isClosing) {
                cameraRef.current?.setCamera({
                    centerCoordinate: [marker.longitude!, marker.latitude!],
                    animationDuration: 400,
                });
            }
            return isClosing ? null : marker;
        });
    }, []);

    const performSearch = useCallback(async () => {
        if (!searchText.trim()) return;
        Keyboard.dismiss();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSearchLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1`,
                { headers: { 'User-Agent': 'RentAThing/1.0' } }
            );
            const data = await response.json();
            if (data?.length > 0) {
                const { lat, lon, display_name } = data[0];
                const shortName = display_name.split(',')[0];
                const latitude = parseFloat(lat);
                const longitude = parseFloat(lon);
                cameraRef.current?.setCamera({
                    centerCoordinate: [longitude, latitude],
                    zoomLevel: 13,
                    animationDuration: 1000,
                });
                setSearchMarker({ latitude, longitude, title: shortName });
                setSearchText(shortName);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert(t('common', 'error'), t('map', 'locationNotFound'));
            }
        } catch (error) {
            console.error('Search error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('common', 'error'), t('map', 'searchError'));
        } finally {
            setSearchLoading(false);
        }
    }, [searchText, t]);

    const clearSearch = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSearchText('');
        setSearchMarker(null);
    }, []);

    const handleCategorySelect = useCallback((categoryId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveCategory((prev) => (prev === categoryId ? null : categoryId));
    }, []);

    const handleMapPress = useCallback(() => {
        setSelectedMarker(null);
    }, []);

    const handleCalloutPress = useCallback(() => {
        if (!selectedMarker) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/item',
            params: { listingId: String(selectedMarker.listingId) },
        });
    }, [selectedMarker, router]);

    const markersWithState = useMemo(() =>
            markers.map(marker => ({
                marker,
                isSelected: selectedMarker?.listingId === marker.listingId,
            })),
        [markers, selectedMarker?.listingId]
    );

    return (
        <View style={styles.container}>
            <MapView
                key={`map-view-${scheme}`}
                style={styles.map}
                styleURL={scheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
                scrollEnabled={true}
                zoomEnabled={true}
                rotateEnabled={false}
                pitchEnabled={true}
                logoEnabled={false}
                attributionEnabled={false}
                scaleBarEnabled={false}
                onPress={handleMapPress}
            >
                <Camera
                    ref={cameraRef}
                    centerCoordinate={[15.9819, 45.8150]}
                    zoomLevel={12}
                    minZoomLevel={6}
                    maxZoomLevel={18}
                    followUserLocation={false}
                />
                {searchMarker && (
                    <PointAnnotation
                        id="searched-location"
                        coordinate={[searchMarker.longitude, searchMarker.latitude]}
                        title={searchMarker.title}
                    >
                        <View style={styles.searchPin}>
                            <View style={[styles.searchPinDot, { backgroundColor: colors.primary }]} />
                        </View>
                    </PointAnnotation>
                )}

                {markersWithState.map(({ marker, isSelected }) => (
                    <MapPin
                        key={`pin-${marker.listingId}-${activeCategory}`}
                        marker={marker}
                        isSelected={isSelected}
                        primaryColor={colors.primary}
                        colors={colors}
                        onPress={handleMarkerPress}
                        onCalloutPress={handleCalloutPress}
                        styles={styles}
                    />
                ))}
            </MapView>

            {/* 🔍 SEARCH BAR */}
            <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                    <TouchableOpacity
                        style={[styles.button, searchLoading && styles.buttonDisabled]}
                        onPress={performSearch}
                        disabled={searchLoading}
                    >
                        {searchLoading ? (
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: 20, height: 20, borderRadius: 10 }}
                                shimmerColors={shimmerColors}
                            />
                        ) : (
                            <Fontisto name="search" style={[styles.searchIcon, { color: colors.primarySecondary }]} />
                        )}
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder={t('map', 'searchPlaceholder')}
                        placeholderTextColor={colors.placeholder}
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={performSearch}
                        returnKeyType="search"
                        autoCapitalize="words"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={clearSearch}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text style={[styles.clearButtonText, { color: colors.textMuted }]}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* 🏷️ CATEGORIES */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryContainer}
                contentContainerStyle={styles.categoryContent}
            >
                {CATEGORIES.map((category) => {
                    const isActive = activeCategory === category.id;
                    return (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.CategoryButton,
                                isActive && styles.CategoryButtonActive,
                            ]}
                            onPress={() => handleCategorySelect(category.id)}
                        >
                            <Ionicons
                                name={isActive ? category.iconActive : category.icon}
                                size={20}
                                color={isActive ? colors.iconColorInverse : colors.primarySecondary}
                            />
                            <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* ⏳ INDIKATOR UČITAVANJA REZULTATA */}
            {markersLoading && (
                <View style={styles.markersLoadingBadge}>
                    <View style={styles.shimmerRow}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerCircle}
                            shimmerColors={shimmerColors}
                            isReversed={true}
                        />
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.shimmerLine}
                            shimmerColors={shimmerColors}
                        />
                    </View>
                </View>
            )}
        </View>
    );
}

const makeStyles = (colors: typeof Colors.light) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        map: { flex: 1 },
        markerWrapper: { alignItems: 'center', justifyContent: 'flex-end' },
        floatingCallout: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 7,
            width: 170,
            marginBottom: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 5
        },
        calloutImage: { width: 38, height: 38, borderRadius: 6, marginRight: 8 },
        calloutImagePlaceholder: { backgroundColor: colors.iconCircleBg, alignItems: 'center', justifyContent: 'center' },
        calloutText: { flex: 1 },
        calloutName: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 1 },
        calloutPrice: { fontSize: 11, fontWeight: '600', color: colors.primary },
        searchPin: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + '30', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.background },
        searchPinDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.background },
        pin: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 3, elevation: 4 },
        pinContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        pinSelected: { transform: [{ scale: 1.08 }], shadowOpacity: 0.35 },
        pinPrice: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
        pinTail: { alignSelf: 'center', width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
        searchContainer: { position: 'absolute', top: 55, paddingHorizontal: 13, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', zIndex: 10, width: '100%' },
        inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
        searchIcon: { fontSize: 18, marginRight: 8, alignSelf: 'center' },
        input: { flex: 1, height: 42, fontSize: 15, color: colors.text, fontWeight: '400' },
        clearButton: { padding: 6, marginLeft: 4 },
        clearButtonText: { fontSize: 18, fontWeight: '600' },
        button: { justifyContent: 'center', alignItems: 'center', paddingRight: 4 },
        buttonDisabled: { opacity: 0.6 },
        categoryContainer: { position: 'absolute', top: 120, left: 0, right: 0, zIndex: 10 },
        categoryContent: { paddingHorizontal: 12, gap: 10, alignItems: 'center' },
        CategoryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 6 },
        CategoryButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        categoryText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, letterSpacing: 0.3 },
        categoryTextActive: { color: colors.iconColorInverse, fontWeight: '600' },
        markersLoadingBadge: { position: 'absolute', bottom: 30, right: 16, backgroundColor: colors.surface, borderRadius: 20, padding: 12, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
        shimmerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        shimmerCircle: { width: 24, height: 24, borderRadius: 12 },
        shimmerLine: { width: 80, height: 14, borderRadius: 7 },
    });