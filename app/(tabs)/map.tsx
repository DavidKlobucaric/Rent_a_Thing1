import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, Keyboard, ScrollView,
} from 'react-native';

import Mapbox, { MapView, Camera, PointAnnotation } from '@rnmapbox/maps';
import { Fontisto, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

Mapbox.setAccessToken("process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? ''");

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Coordinate {
    latitude: number;
    longitude: number;
}

const CATEGORIES = [
    { name: 'Tools', icon: 'hammer-outline' as IoniconName, iconActive: 'hammer' as IoniconName },
    { name: 'Camping', icon: 'bonfire-outline' as IoniconName, iconActive: 'bonfire' as IoniconName },
    { name: 'Tech', icon: 'laptop-outline' as IoniconName, iconActive: 'laptop' as IoniconName },
    { name: 'Sports', icon: 'football-outline' as IoniconName, iconActive: 'football' as IoniconName },
    { name: 'Games', icon: 'game-controller-outline' as IoniconName, iconActive: 'game-controller' as IoniconName },
];

const ZAGREB: [number, number] = [15.9819, 45.8150];

export default function MapScreen() {
    const cameraRef = useRef<Camera>(null);

    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [markerCoordinate, setMarkerCoordinate] = useState<Coordinate | null>(null);
    const [markerTitle, setMarkerTitle] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const flyTo = useCallback((longitude: number, latitude: number, zoom = 13) => {
        cameraRef.current?.setCamera({
            centerCoordinate: [longitude, latitude],
            zoomLevel: zoom,
            animationMode: 'flyTo',
            animationDuration: 1200,
        });
    }, []);

    const performSearch = useCallback(async () => {
        if (!searchText.trim()) return;
        Keyboard.dismiss();
        setLoading(true);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1`,
                { headers: { 'User-Agent': 'RentApp/1.0' } }
            );
            const data = await response.json();

            if (data?.length > 0) {
                const { lat, lon, display_name } = data[0];
                const shortName = display_name.split(',')[0];
                const latitude = parseFloat(lat);
                const longitude = parseFloat(lon);

                flyTo(longitude, latitude);
                setMarkerCoordinate({ latitude, longitude });
                setMarkerTitle(shortName);
                setSearchText(shortName);
            } else {
                alert('Lokacija nije pronađena. Pokušaj s drugim pojmom.');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Došlo je do greške pri pretrazi.');
        } finally {
            setLoading(false);
        }
    }, [searchText, flyTo]);

    const clearSearch = useCallback(() => {
        setSearchText('');
        setMarkerCoordinate(null);
        setMarkerTitle('');
        flyTo(ZAGREB[0], ZAGREB[1], 12);
    }, [flyTo]);

    const handleCategorySelect = useCallback((name: string) => {
        setActiveCategory(prev => prev === name ? null : name);
    }, []);

    return (
        <View style={styles.container}>

            <MapView
                style={styles.map}
                styleURL={Mapbox.StyleURL.Street}
                scrollEnabled
                zoomEnabled
                rotateEnabled
                pitchEnabled
                logoEnabled={false}
                attributionEnabled={false}
                scaleBarEnabled={false}
            >
                <Camera
                    ref={cameraRef}
                    centerCoordinate={ZAGREB}
                    zoomLevel={12}
                    animationMode="none"
                />

                {markerCoordinate && (
                    <PointAnnotation
                        id="searched-location"
                        coordinate={[markerCoordinate.longitude, markerCoordinate.latitude]}
                        title={markerTitle}
                    >
                        <View style={styles.marker}>
                            <View style={styles.markerDot} />
                        </View>
                    </PointAnnotation>
                )}
            </MapView>

            {/* SEARCH BAR */}
            <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={performSearch}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color={colors.textMuted} size="small" />
                            : <Fontisto name="search" style={[styles.searchIcon, { color: colors.textMuted }]} />
                        }
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Pretraži (npr. Zagreb, Rijeka...)"
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

            {/* KATEGORIJE */}
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
                            style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
                            onPress={() => handleCategorySelect(category.name)}
                        >
                            <Ionicons
                                name={isActive ? category.iconActive : category.icon}
                                size={20}
                                color={isActive ? colors.activeTabText : colors.textSecondary}
                            />
                            <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

        </View>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    map: {
        flex: 1,
    },
    marker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '30',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    markerDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: colors.background,
    },
    searchContainer: {
        position: 'absolute',
        top: 55,
        width: '95%',
        alignSelf: 'center',
        zIndex: 10,
        paddingHorizontal: 4,
    },
    inputWrapper: {
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
    categoryButton: {
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
    categoryButtonActive: {
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
        color: colors.activeTabText,
        fontWeight: '700',
    },
});