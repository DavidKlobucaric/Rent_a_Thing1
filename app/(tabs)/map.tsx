import React, { useState, useRef } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, Keyboard, ScrollView, SafeAreaView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Fontisto, Ionicons } from "@expo/vector-icons";


type IoniconName = React.ComponentProps<typeof Ionicons>['name'];


interface Coordinate {
    latitude: number;
    longitude: number;
}

export default function MapScreen() {

    const mapRef = useRef<MapView>(null);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    const [markerCoordinate, setMarkerCoordinate] = useState<Coordinate | null>(null);
    const [markerTitle, setMarkerTitle] = useState('');

    const performSearch = async () => {
        if (!searchText.trim()) return;

        Keyboard.dismiss();
        setLoading(true);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1`,
                {
                    headers: {
                        'User-Agent': 'MyReactNativeApp/1.0 (your@email.com)'
                    }
                }
            );
            const data = await response.json();

            if (data?.length > 0) {
                const { lat, lon, display_name } = data[0];
                const shortName = display_name.split(',')[0];

                const newRegion = {
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                    latitudeDelta: 0.09,
                    longitudeDelta: 0.0421,
                };

                mapRef.current?.animateToRegion(newRegion, 1000);
                setMarkerCoordinate({
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                });
                setMarkerTitle(shortName);
                setSearchText(shortName);
            } else {
                alert('Lokacija nije pronađena. Pokušaj s drugim pojmom.');
            }
        } catch (error) {
            console.error("Greška:", error);
            alert('Došlo je do greške pri pretrazi.');
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchText('');
        setMarkerCoordinate(null);
        setMarkerTitle('');
    };

    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // Fix 3: explicit string type on parameter
    const handleCategorySelect = (categoryName: string) => {
        setActiveCategory(prev => prev === categoryName ? null : categoryName);
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* MAPA */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: 45.8150,
                    longitude: 15.9819,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                scrollEnabled
                zoomEnabled
                rotateEnabled
                pitchEnabled
                showsUserLocation
            >
                {markerCoordinate && (
                    <Marker
                        coordinate={markerCoordinate}
                        title={markerTitle}
                    />
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
                            <ActivityIndicator color="#888" size="small" />
                        ) : (
                            <Fontisto name="search" style={styles.searchIcon} />
                        )}
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Pretraži (npr. Zagreb, Rijeka...)"
                        placeholderTextColor="#9CA3AF"
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
                            <Text style={styles.clearButtonText}>✕</Text>
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
                            style={[
                                styles.CategoryButton,
                                isActive && styles.CategoryButtonActive
                            ]}
                            onPress={() => handleCategorySelect(category.name)}
                        >
                            <Ionicons
                                name={isActive ? category.iconActive : category.icon}
                                size={20}
                                color={isActive ? '#fff' : '#6B7280'}
                            />
                            <Text style={[
                                styles.categoryText,
                                isActive && styles.categoryTextActive
                            ]}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    map: {
        flex: 1,
    },

    searchContainer: {
        position: 'absolute',
        top: 50,
        width: '95%',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: '#fff',
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
        borderRadius: 12,
    },
    searchIcon: {
        fontSize: 16,
        color: '#888',
        marginRight: 8,
        alignSelf: 'center',
    },
    input: {
        flex: 1,
        height: 45,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 8,
    },
    clearButtonText: {
        color: '#999',
        fontSize: 18,
        fontWeight: '600',
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },

    categoryContainer: {
        position: 'absolute',
        top: 115,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    categoryContent: {
        paddingHorizontal: 10,
        gap: 8,
        alignItems: 'center',
    },
    CategoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 7,
        paddingHorizontal: 16,
        borderRadius: 9999,
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    categoryText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
        marginLeft: 5,
    },
    CategoryButtonActive: {
        backgroundColor: '#097F8C',
        borderColor: '#097F8C',
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
});