import React, { useState, useRef } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, Keyboard,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import {Fontisto} from "@expo/vector-icons";


export default function MapScreen() {
    const mapRef = useRef<MapView>(null);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    const performSearch = async () => {
        if (!searchText.trim()) return;

        Keyboard.dismiss(); // Sakrij tastaturu nakon pretrage
        setLoading(true);

        try {
            // Nominatim zahtijeva validan User-Agent header
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

                const newRegion = {
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                    latitudeDelta: 0.09,
                    longitudeDelta: 0.0421,
                };

               mapRef.current?.animateToRegion(newRegion, 1000);


                setSearchText(display_name.split(',')[0]); // Prikaži samo ime grada
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

    };

    return (
        <View style={styles.container}>

            {/* SEARCH BAR */}
            <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={performSearch}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Fontisto name="search" style={styles.searchIcon}/>
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

                    {/* Gumb za brisanje (prikazuje se samo ako ima teksta) */}
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

                <Marker
                    coordinate={{ latitude: 45.8150, longitude: 15.9819 }}
                    title="Zagreb"
                />
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    map: { width: '100%', height: '100%' },


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
        flex:1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: '#ffff',
        borderWidth: 0.5,
        borderColor: "#BDC9C8",
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
    btnText: {
        color: '#FFF',
        fontSize: 18,
    },
});