import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, Keyboard, ScrollView, Alert, Image,
} from 'react-native';

import Mapbox, { MapView, Camera, PointAnnotation, MarkerView } from '@rnmapbox/maps';
import { Fontisto, Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { getMapMarkers, resolveMarkerCoordinates, MapMarker } from '@/src/api/itemsApi';
import { useAuth } from '@/src/context/authContext';
import { useRouter } from 'expo-router';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');
const LIGHT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const DARK_MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Coordinate {
    latitude: number;
    longitude: number;
}

// Category config — icon names and colours used for each pin
const CATEGORIES: {
    name: string;
    icon: IoniconName;
    iconActive: IoniconName;
    pinColor: string;
}[] = [
    { name: 'Tools',   icon: 'hammer-outline',          iconActive: 'hammer',          pinColor: '#F59E0B' },
    { name: 'Camping', icon: 'bonfire-outline',          iconActive: 'bonfire',         pinColor: '#10B981' },
    { name: 'Tech',    icon: 'laptop-outline',           iconActive: 'laptop',          pinColor: '#3B82F6' },
    { name: 'Sports',  icon: 'football-outline',         iconActive: 'football',        pinColor: '#EF4444' },
    { name: 'Games',   icon: 'game-controller-outline',  iconActive: 'game-controller', pinColor: '#8B5CF6' },
];

const getCategoryColor = (category: string, fallback: string): string => {
    const found = CATEGORIES.find(
        (c) => c.name.toLowerCase() === category.toLowerCase()
    );
    return found ? found.pinColor : fallback;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function MapScreen() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const router = useRouter();
    const cameraRef = useRef<Camera>(null);

    // Search state
    const [searchText, setSearchText] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchMarker, setSearchMarker] = useState<Coordinate & { title: string } | null>(null);

    // Listing markers state
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [markersLoading, setMarkersLoading] = useState(false);

    // Selected marker callout
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

    // Category filter
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);

    //Load markers whenever the active category changes

    const loadMarkers = useCallback(async (category: string | null) => {
        setMarkersLoading(true);
        setSelectedMarker(null);

        const result = await getMapMarkers(category ?? undefined);

        if (!result.success) {
            setMarkersLoading(false);
            return;
        }

        const resolved = await resolveMarkerCoordinates(result.data);
        setMarkers(resolved);
        setMarkersLoading(false);
    }, []);

    useEffect(() => {
        loadMarkers(activeCategory);
    }, [activeCategory, loadMarkers]);


    const performSearch = async () => {
        if (!searchText.trim()) return;
        Keyboard.dismiss();
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
                Alert.alert(t('common', 'error'), t('map', 'locationNotFound'));
            }
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert(t('common', 'error'), t('map', 'searchError'));
        } finally {
            setSearchLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchText('');
        setSearchMarker(null);
    };


    const handleCategorySelect = (categoryName: string) => {
        setActiveCategory((prev) => (prev === categoryName ? null : categoryName));
    };

    return (
        <View style={styles.container}>

            {/* MAP */}
            <MapView
                key={scheme}
                style={styles.map}
                styleURL={scheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
                scrollEnabled={true}
                zoomEnabled={true}
                rotateEnabled={true}
                pitchEnabled={true}
                logoEnabled={false}
                attributionEnabled={false}
                scaleBarEnabled={false}
                onPress={() => setSelectedMarker(null)}
            >
                <Camera
                    ref={cameraRef}
                    centerCoordinate={[15.9819, 45.8150]}
                    zoomLevel={12}
                />

                {/* Search result pin */}
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

                {/* Listing markers */}
                {markers.map((marker) => {
                    const pinColor = getCategoryColor(marker.category, colors.primary);
                    const isSelected = selectedMarker?.listingId === marker.listingId;

                    return (
                        <MarkerView
                            key={`marker-${marker.listingId}`}
                            coordinate={[marker.longitude!, marker.latitude!]}
                        >
                            <TouchableOpacity
                                onPress={() =>
                                    setSelectedMarker((prev) =>
                                        prev?.listingId === marker.listingId ? null : marker
                                    )
                                }
                                activeOpacity={0.85}
                            >
                                <View
                                    style={[
                                        styles.pin,
                                        { backgroundColor: pinColor },
                                        isSelected && styles.pinSelected,
                                    ]}
                                >
                                    <Text style={styles.pinPrice}>
                                        €{Number(marker.price).toFixed(0)}
                                    </Text>
                                </View>
                                {/* Downward triangle tail */}
                                <View style={[styles.pinTail, { borderTopColor: pinColor }]} />
                            </TouchableOpacity>
                        </MarkerView>
                    );
                })}
            </MapView>

            {/* CALLOUT CARD — shown above the map when a marker is tapped */}
            {selectedMarker && (
                <View style={styles.callout} pointerEvents="box-none">
                    <TouchableOpacity
                        style={styles.calloutInner}
                        activeOpacity={0.92}
                        onPress={() =>
                            router.push({
                                pathname: '/(tabs)/item',
                                params: { listingId: String(selectedMarker.listingId) },
                            })
                        }
                    >
                        {selectedMarker.thumbnailUrl ? (
                            <Image
                                source={{ uri: selectedMarker.thumbnailUrl }}
                                style={styles.calloutImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.calloutImage, styles.calloutImagePlaceholder]}>
                                <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                            </View>
                        )}

                        <View style={styles.calloutText}>
                            <Text style={styles.calloutName} numberOfLines={1}>
                                {selectedMarker.name}
                            </Text>
                            <Text style={styles.calloutLocation} numberOfLines={1}>
                                {selectedMarker.location}
                            </Text>
                            <Text style={styles.calloutPrice}>
                                €{Number(selectedMarker.price).toFixed(2)} / day
                            </Text>
                            <View style={styles.calloutPoster}>
                                <Ionicons name="person-circle-outline" size={13} color={colors.textMuted} />
                                <Text style={styles.calloutPosterName} numberOfLines={1}>
                                    {selectedMarker.userName ?? '—'}
                                </Text>
                                {(selectedMarker.userRating ?? 0) > 0 && (
                                    <>
                                        <Ionicons name="star" size={11} color={colors.rating || '#F59E0B'} />
                                        <Text style={styles.calloutPosterRating}>
                                            {selectedMarker.userRating!.toFixed(1)}
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>

                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.textMuted}
                            style={styles.calloutChevron}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.calloutClose}
                        onPress={() => setSelectedMarker(null)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: '600' }}>
                            ✕
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* SEARCH BAR */}
            <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                    <TouchableOpacity
                        style={[styles.button, searchLoading && styles.buttonDisabled]}
                        onPress={performSearch}
                        disabled={searchLoading}
                    >
                        {searchLoading ? (
                            <ActivityIndicator color={colors.textMuted} size="small" />
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

            {/* CATEGORY CHIPS */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryContainer}
                contentContainerStyle={styles.categoryContent}
            >
                {CATEGORIES.map((category) => {
                    const isActive = activeCategory === category.name;
                    return (
                        <TouchableOpacity
                            key={category.name}
                            style={[
                                styles.CategoryButton,
                                isActive && { backgroundColor: category.pinColor, borderColor: category.pinColor },
                            ]}
                            onPress={() => handleCategorySelect(category.name)}
                        >
                            <Ionicons
                                name={isActive ? category.iconActive : category.icon}
                                size={20}
                                color={isActive ? '#FFFFFF' : colors.primarySecondary}
                            />
                            <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Markers loading spinner (small, bottom-right) */}
            {markersLoading && (
                <View style={styles.markersLoadingBadge}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            )}
        </View>
    );
}

const makeStyles = (colors: typeof Colors.light) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },

        map: {
            flex: 1,
        },

        // ── Search pin  ───────────────────────────────────────────────────────────
        searchPin: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.primary + '30',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.background,
        },
        searchPinDot: {
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 1,
            borderColor: colors.background,
        },

        // ── Price pin ─────────────────────────────────────────────────────────
        pin: {
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.22,
            shadowRadius: 3,
            elevation: 4,
        },
        pinSelected: {
            transform: [{ scale: 1.12 }],
            shadowOpacity: 0.35,
        },
        pinPrice: {
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: '700',
        },
        pinTail: {
            alignSelf: 'center',
            width: 0,
            height: 0,
            borderLeftWidth: 6,
            borderRightWidth: 6,
            borderTopWidth: 7,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            marginTop: -1,
        },

        // ── Callout card ──────────────────────────────────────────────────────
        callout: {
            position: 'absolute',
            bottom: 185,
            left: 16,
            right: 16,
            zIndex: 20,
            flexDirection: 'row',
            alignItems: 'center',
        },
        calloutInner: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.14,
            shadowRadius: 6,
            elevation: 5,
        },
        calloutImage: {
            width: 56,
            height: 56,
            borderRadius: 10,
            marginRight: 12,
        },
        calloutImagePlaceholder: {
            backgroundColor: colors.iconCircleBg,
            alignItems: 'center',
            justifyContent: 'center',
        },
        calloutText: {
            flex: 1,
        },
        calloutName: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 2,
        },
        calloutLocation: {
            fontSize: 12,
            color: colors.textMuted,
            marginBottom: 3,
        },
        calloutPrice: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.primary,
        },
        calloutPoster: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
            gap: 3,
        },
        calloutPosterName: {
            fontSize: 11,
            color: colors.textMuted,
            fontWeight: '500',
            flex: 1,
        },
        calloutPosterRating: {
            fontSize: 11,
            color: colors.textMuted,
            fontWeight: '600',
        },
        calloutChevron: {
            marginLeft: 8,
        },
        calloutClose: {
            marginLeft: 10,
            padding: 6,
        },

        // ── Search bar
        searchContainer: {
            position: 'absolute',
            top: 55,
            paddingHorizontal: 13,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 10,
            width: '100%',
        },
        inputWrapper: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 6,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
        },
        searchIcon: {
            fontSize: 18,
            marginRight: 8,
            alignSelf: 'center',
        },
        input: {
            flex: 1,
            height: 42,
            fontSize: 15,
            color: colors.text,
            fontWeight: '400',
        },
        clearButton: {
            padding: 6,
            marginLeft: 4,
        },
        clearButtonText: {
            fontSize: 18,
            fontWeight: '600',
        },
        button: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingRight: 4,
        },
        buttonDisabled: {
            opacity: 0.6,
        },

        // ── Category chips ──────────────────────────────────────────────────────────────────────────────────────────────────────
        categoryContainer: {
            position: 'absolute',
            top: 120,
            left: 0,
            right: 0,
            zIndex: 10,
        },
        categoryContent: {
            paddingHorizontal: 12,
            gap: 10,
            alignItems: 'center',
        },
        CategoryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 9,
            paddingHorizontal: 18,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 6,
        },
        categoryText: {
            fontSize: 13,
            fontWeight: '500',
            color: colors.textSecondary,
            letterSpacing: 0.3,
        },
        categoryTextActive: {
            color: '#FFFFFF',
            fontWeight: '600',
        },

        // ── Markers loading indicator ─────────────────────────────────────────
        markersLoadingBadge: {
            position: 'absolute',
            bottom: 170,
            right: 16,
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
        },
    });
