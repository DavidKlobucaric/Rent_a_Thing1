import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, Keyboard, ScrollView, Alert,
} from 'react-native';

import Mapbox, { MapView, Camera, PointAnnotation } from '@rnmapbox/maps';
import { Fontisto, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');
const LIGHT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const DARK_MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Coordinate {
    latitude: number;
    longitude: number;
}

export default function MapScreen() {
    const { t } = useLanguage();
    const cameraRef = useRef<Camera>(null);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [markerCoordinate, setMarkerCoordinate] = useState<Coordinate | null>(null);
    const [markerTitle, setMarkerTitle] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);

    useEffect(() => {
        fetch('https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=' + process.env.EXPO_PUBLIC_MAPBOX_TOKEN)
            .then(r => console.log('MAPBOX STATUS:', r.status))
            .catch(e => console.log('MAPBOX ERROR:', e));
    }, []);

    const performSearch = async () => {
        if (!searchText.trim()) return;
        Keyboard.dismiss();
        setLoading(true);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1`,
                { headers: { 'User-Agent': 'MyReactNativeApp/1.0 (your@email.com)' } }
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

                setMarkerCoordinate({ latitude, longitude });
                setMarkerTitle(shortName);
                setSearchText(shortName);
            } else {
                Alert.alert(t('common', 'error'), t('map', 'locationNotFound'));
            }
        } catch (error) {
            console.error("Greška:", error);
            Alert.alert(t('common', 'error'), t('map', 'searchError'));
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchText('');
        setMarkerCoordinate(null);
        setMarkerTitle('');
    };

    const handleCategorySelect = (categoryName: string) => {
        setActiveCategory(prev => prev === categoryName ? null : categoryName);
    };

    return (
        <View style={styles.container}>

            {/* MAPA */}
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
            >
                <Camera
                    ref={cameraRef}
                    centerCoordinate={[15.9819, 45.8150]}
                    zoomLevel={12}
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
                        {loading ? (
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

            {/* KATEGORIJE */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryContainer}
                contentContainerStyle={styles.categoryContent}
            >
                {(
                    [
                        { name: 'Tools', icon: 'hammer-outline', iconActive: 'hammer' },
                        { name: 'Camping', icon: 'bonfire-outline', iconActive: 'bonfire' },
                        { name: 'Tech', icon: 'laptop-outline', iconActive: 'laptop' },
                        { name: 'Sports', icon: 'football-outline', iconActive: 'football' },
                        { name: 'Games', icon: 'game-controller-outline', iconActive: 'game-controller' },
                    ] as { name: string; icon: IoniconName; iconActive: IoniconName }[]
                ).map((category) => {
                    const isActive = activeCategory === category.name;
                    return (
                        <TouchableOpacity
                            key={category.name}
                            style={[styles.CategoryButton, isActive && styles.CategoryButtonActive]}
                            onPress={() => handleCategorySelect(category.name)}
                        >
                            <Ionicons
                                name={isActive ? category.iconActive : category.icon}
                                size={20}
                                color={isActive ? colors.activeTabText : colors.primarySecondary}
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
        borderWidth: 1,
        borderColor: colors.background,
    },

    markerDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.primary,
        borderWidth: 1,
        borderColor: colors.background,
    },

    searchContainer: {
        position: 'absolute',
        top: 55,
        paddingHorizontal: 13,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
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

    CategoryButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },

    categoryTextActive: {
        color: colors.activeTabText,
        fontWeight: '600',
    },
});