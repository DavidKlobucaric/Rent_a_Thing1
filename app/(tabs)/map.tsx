import React, { useState, useRef, useMemo, useEffect, useCallback, memo } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    Keyboard, ScrollView, Alert, Animated
} from 'react-native';
import { Image } from 'expo-image';
import Mapbox, { MapView, Camera, PointAnnotation, MarkerView } from '@rnmapbox/maps';
import { Fontisto, Ionicons } from '@expo/vector-icons';
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { useAuth } from '@/src/context/authContext';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    getMapMarkers,
    MapMarker
} from '@/src/api/itemsApi';

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
    { id: 'all',     label: 'All',     icon: 'apps-outline',            iconActive: 'apps' },
    { id: 'tools',   label: 'Tools',   icon: 'hammer-outline',          iconActive: 'hammer' },
    { id: 'camping', label: 'Camping', icon: 'bonfire-outline',          iconActive: 'bonfire' },
    { id: 'tech',    label: 'Tech',    icon: 'laptop-outline',           iconActive: 'laptop' },
    { id: 'sports',  label: 'Sports',  icon: 'football-outline',         iconActive: 'football' },
    { id: 'games',   label: 'Games',   icon: 'game-controller-outline',  iconActive: 'game-controller' },
];

const CATEGORY_ICON_MAP: Record<string, { icon: IoniconName; iconActive: IoniconName }> = {
    'all': { icon: 'apps-outline', iconActive: 'apps' },
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
// MEMOIZIRANA PIN KOMPONENTA
// ═══════════════════════════════════════════════════════════════
interface MapPinProps {
    marker: MapMarker;
    isSelected: boolean;
    primaryColor: string;
    onPress: (marker: MapMarker) => void;
    styles: ReturnType<typeof makeStyles>;
}

const MapPin = memo(({ marker, isSelected, primaryColor, onPress, styles }: MapPinProps) => {
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
                <TouchableOpacity
                    onPress={handlePress}
                    activeOpacity={0.85}
                    style={{ alignItems: 'center' }}
                >
                    <View style={styles.pinShadow}>
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
// 🎯 BOTTOM SHEET KARTICA S DETALJIMA
// ═══════════════════════════════════════════════════════════════
interface SelectedMarkerCardProps {
    marker: MapMarker;
    colors: typeof Colors.light;
    styles: ReturnType<typeof makeStyles>;
    isAnimatingOut: boolean;
    onCloseRequest: () => void;
    onAnimationComplete: () => void;
    onViewDetails: () => void;
}

const SelectedMarkerCard = memo(({ marker, colors, styles, isAnimatingOut, onCloseRequest, onAnimationComplete, onViewDetails }: SelectedMarkerCardProps) => {
    const slideAnim = useRef(new Animated.Value(300)).current;
    const categoryIcon = getCategoryIcon(marker.category);
    const prevMarkerRef = useRef<MapMarker | null>(null);


    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
        prevMarkerRef.current = marker;
    }, []);


    useEffect(() => {
        if (isAnimatingOut) {
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                onAnimationComplete();
            });
        }
    }, [isAnimatingOut, slideAnim, onAnimationComplete]);


    useEffect(() => {
        if (prevMarkerRef.current && prevMarkerRef.current.listingId !== marker.listingId) {
            prevMarkerRef.current = marker;
        }
    }, [marker]);

    return (
        <Animated.View
            style={[
                styles.bottomCard,
                { transform: [{ translateY: slideAnim }] }
            ]}
        >
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Close button  */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={onCloseRequest}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.bottomCardContent}>
                {/* Image */}
                {marker.thumbnailUrl ? (
                    <Image
                        source={{ uri: marker.thumbnailUrl }}
                        style={styles.bottomCardImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                        key={`img-${marker.listingId}`}
                    />
                ) : (
                    <View style={[styles.bottomCardImage, styles.bottomCardImagePlaceholder]}>
                        <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                    </View>
                )}

                {/* Info */}
                <View style={styles.bottomCardInfo}>
                    {/* Category badge */}
                    <View style={[styles.bottomCategoryBadge, { backgroundColor: colors.primary + '18' }]}>
                        <Ionicons name={categoryIcon} size={12} color={colors.primary} />
                        <Text style={[styles.bottomCategoryText, { color: colors.primary }]}>
                            {marker.category.charAt(0).toUpperCase() + marker.category.slice(1)}
                        </Text>
                    </View>

                    <Text style={styles.bottomCardName} numberOfLines={2} key={`name-${marker.listingId}`}>
                        {marker.name}
                    </Text>

                    <View style={styles.bottomCardLocationRow}>
                        <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                        <Text style={styles.bottomCardLocation} numberOfLines={1}>
                            {marker.location || 'Location unavailable'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Price and action */}
            <View style={styles.bottomCardFooter}>
                <View>
                    <Text style={styles.bottomCardPriceLabel}>Price per day</Text>
                    <Text style={[styles.bottomCardPrice, { color: colors.primary }]} key={`price-${marker.listingId}`}>
                        €{Number(marker.price).toFixed(0)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.viewDetailsButton, { backgroundColor: colors.primary }]}
                    onPress={onViewDetails}
                    activeOpacity={0.85}
                >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </Animated.View>
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
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [scheme]);

    const shimmerColors = useMemo(() =>
            scheme === 'dark'
                ? ['#2A2A2A', '#3A3A3A', '#2A2A2A']
                : ['#E0E0E0', '#F5F5F5', '#E0E0E0'],
        [scheme]);

    useEffect(() => {
        console.log('MARKERS STATE UPDATED:', markers);
    }, [markers]);

    const loadMarkers = useCallback(async (category: string) => {
        setMarkersLoading(true);

        try {
            const categoryParam =
                category === 'all'
                    ? undefined
                    : category;

            const result = await getMapMarkers(categoryParam);
            console.log(JSON.stringify(result, null, 2));

            console.log('MAP API RESULT:', result);

            if (!result.success) {
                console.log('API FAILED');
                setMarkers([]);
                return;
            }

            console.log('RAW MARKERS:', result.data);

            const validMarkers = result.data.filter(
                marker =>
                    marker.latitude !== null &&
                    marker.latitude !== undefined &&
                    marker.longitude !== null &&
                    marker.longitude !== undefined
            );

            console.log('VALID MARKERS:', validMarkers);
            console.log('VALID MARKERS COUNT:', validMarkers.length);

            setMarkers(validMarkers);
        } catch (e) {
            console.log('[MAP_ERROR]', e);
            setMarkers([]);
        } finally {
            setMarkersLoading(false);
        }
    }, []);



    useFocusEffect(
        useCallback(() => {
            if (isLoading || !token) return;
            setSelectedMarker(null);
            setIsAnimatingOut(false);
            loadMarkers(activeCategory);
        }, [activeCategory, loadMarkers, token, isLoading])
    );


    const handleMarkerPress = useCallback((marker: MapMarker) => {
        setSelectedMarker((prev) => {

            if (prev?.listingId === marker.listingId) {
                setIsAnimatingOut(true);
                return prev;
            }


            if (prev) {
                cameraRef.current?.setCamera({
                    centerCoordinate: [marker.longitude!, marker.latitude!],
                    animationDuration: 400,
                });

                return marker;
            }


            cameraRef.current?.setCamera({
                centerCoordinate: [marker.longitude!, marker.latitude!],
                animationDuration: 400,
            });
            return marker;
        });
    }, []);


    const handleCloseAnimation = useCallback(() => {
        setIsAnimatingOut(true);
    }, []);


    const handleAnimationComplete = useCallback(() => {
        setSelectedMarker(null);
        setIsAnimatingOut(false);
    }, []);

    const handleViewDetails = useCallback(() => {
        if (!selectedMarker) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/item',
            params: { listingId: String(selectedMarker.listingId) },
        });
    }, [selectedMarker, router]);

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
        setActiveCategory(categoryId);
    }, []);


    const handleMapPress = useCallback(() => {
        if (selectedMarker && !isAnimatingOut) {
            setIsAnimatingOut(true);
        }
    }, [selectedMarker, isAnimatingOut]);

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
                        onPress={handleMarkerPress}
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

            {/* ⏳ INDIKATOR UČITAVANJA */}
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

            {/* 🎯 BOTTOM SHEET - PRIKAZUJE SE KAD JE MARKER SELEKTIRAN */}
            {selectedMarker && (
                <SelectedMarkerCard
                    marker={selectedMarker}
                    colors={colors}
                    styles={styles}
                    isAnimatingOut={isAnimatingOut}
                    onCloseRequest={handleCloseAnimation}
                    onAnimationComplete={handleAnimationComplete}
                    onViewDetails={handleViewDetails}
                />
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

        markerWrapper: {
            alignItems: 'center',
            justifyContent: 'flex-end',
        },

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

        pinShadow: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },

        pin: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
        },

        pinContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },

        pinSelected: {
            transform: [{ scale: 1.15 }],
        },

        pinPrice: {
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: '700',
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
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
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
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
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },

        CategoryButtonActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },

        categoryText: {
            fontSize: 13,
            fontWeight: '500',
            color: colors.textSecondary,
            letterSpacing: 0.3,
        },

        categoryTextActive: {
            color: colors.iconColorInverse,
            fontWeight: '600',
        },

        markersLoadingBadge: {
            position: 'absolute',
            bottom: 30,
            right: 16,
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 12,
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
        },

        shimmerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },

        shimmerCircle: {
            width: 24,
            height: 24,
            borderRadius: 12,
        },

        shimmerLine: {
            width: 80,
            height: 14,
            borderRadius: 7,
        },

        bottomCard: {
            position: 'absolute',
            bottom: 20,
            left: 16,
            right: 16,
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 10,
            zIndex: 100,
        },

        dragHandle: {
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.border,
            alignSelf: 'center',
            marginBottom: 12,
        },

        closeButton: {
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
        },

        bottomCardContent: {
            flexDirection: 'row',
            marginBottom: 14,
        },

        bottomCardImage: {
            width: 80,
            height: 80,
            borderRadius: 12,
            marginRight: 14,
        },

        bottomCardImagePlaceholder: {
            backgroundColor: colors.iconCircleBg,
            alignItems: 'center',
            justifyContent: 'center',
        },

        bottomCardInfo: {
            flex: 1,
            justifyContent: 'center',
        },

        bottomCategoryBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
            marginBottom: 6,
        },

        bottomCategoryText: {
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
        },

        bottomCardName: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
            lineHeight: 20,
        },

        bottomCardLocationRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },

        bottomCardLocation: {
            fontSize: 12,
            color: colors.textMuted,
            flex: 1,
        },

        bottomCardFooter: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 14,
        },

        bottomCardPriceLabel: {
            fontSize: 11,
            color: colors.textMuted,
            marginBottom: 2,
        },

        bottomCardPrice: {
            fontSize: 20,
            fontWeight: '700',
            letterSpacing: -0.3,
        },

        viewDetailsButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 18,
            paddingVertical: 12,
            borderRadius: 12,
        },

        viewDetailsText: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600',
        },
    });