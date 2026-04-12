import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fontisto, Ionicons } from '@expo/vector-icons';

const ALL_ITEMS = [
    { id: 1,  name: 'Hammer',          category: 'tools' },
    { id: 2,  name: 'Screwdriver set', category: 'tools' },
    { id: 3,  name: 'Power drill',     category: 'tools' },
    { id: 4,  name: 'Tent',            category: 'camping' },
    { id: 5,  name: 'Sleeping bag',    category: 'camping' },
    { id: 6,  name: 'Laptop',          category: 'electronics' },
    { id: 7,  name: 'Camera',          category: 'electronics' },
    { id: 8,  name: 'Chess set',       category: 'games' },
    { id: 9,  name: 'Football',        category: 'sports' },
    { id: 10, name: 'T-shirt',         category: 'clothes' },
];

const CATEGORIES = [
    { id: 'tools',       label: 'TOOLS',       iconName: 'construct' },
    { id: 'camping',     label: 'CAMPING',     iconName: 'bonfire' },
    { id: 'electronics', label: 'ELECTRONICS', iconName: 'laptop' },
    { id: 'games',       label: 'GAMES',       iconName: 'game-controller' },
    { id: 'sports',      label: 'SPORTS',      iconName: 'football' },
    { id: 'clothes',     label: 'CLOTHES',     iconName: 'shirt' },
];

const NEARBY_ITEMS = [
    { id: 1, name: 'Bosch Power Drill',    distance: '0.8 km away', price: 12 },
    { id: 2, name: 'Epson Projector',      distance: '1.2 km away', price: 30 },
    { id: 3, name: 'Karcher K5 Washer',    distance: '2.5 km away', price: 18 },
];

export default function HomeScreen() {
    const [searchText, setSearchText]       = useState('');
    const [activeCategory, setActiveCategory] = useState('tools');
    const [favorites, setFavorites]         = useState([]);

    const toggleFavorite = (id: number) => {
        // @ts-ignore
        // @ts-ignore
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };



    const filteredData = ALL_ITEMS.filter(item =>
        item.category === activeCategory &&
        item.name.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >

                {/* ── Search bar ── */}
                <View style={styles.searchBar}>
                    <Fontisto name="search" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for tools, cameras, or bikes..."
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Text style={styles.clearBtn}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Kategorije ── */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                >
                    {CATEGORIES.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={styles.tab}
                                onPress={() => {
                                    setActiveCategory(cat.id);
                                    setSearchText('');
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                                    <Ionicons
                                        name={isActive ? cat.iconName : `${cat.iconName}-outline`}
                                        size={24}
                                        color={isActive ? '#fff' : '#555'}
                                    />
                                </View>
                                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* ── Filtrirani itemi ── */}
                <View style={styles.listContainer}>
                    {filteredData.length === 0 ? (
                        <Text style={styles.emptyText}>{`Nema rezultata za "${searchText}"`}</Text>
                    ) : (
                        filteredData.map((item) => (
                            <View key={item.id} style={styles.itemCard}>
                                <Text style={styles.itemName}>{item.name}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* ── Nearby ── */}
                <Text style={styles.sectionTitle}>Nearby You</Text>

                {NEARBY_ITEMS.map((item) => (
                    <View key={item.id} style={styles.TabCard}>

                        {/* Slika */}
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                            style={styles.thumbnail}
                        />

                        {/* Info */}
                        <View style={styles.TabsCard}>
                            <Text style={styles.itemTitle}>{item.name}</Text>
                            <Text style={styles.distanceText}>{item.distance}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                <Text style={styles.price}>${item.price}</Text>
                                <Text style={styles.perDay}>/day</Text>
                            </View>
                        </View>

                        {/* Akcije */}
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                                <Ionicons
                                    name={!favorites.includes(item.id) ? 'heart-outline' : 'heart'}
                                    size={22}
                                    color={!favorites.includes(item.id) ? '#ccc' : '#e74c3c'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.RentButton}>
                                <Text style={styles.rentText}>RENT NOW</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                ))}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },

    // ── Search ──
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#EFEFEF',
        borderRadius: 12,
    },
    searchIcon: {
        fontSize: 15,
        color: '#888',
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#222',
    },
    clearBtn: {
        fontSize: 14,
        color: '#999',
        paddingHorizontal: 4,
    },

    // ── Kategorije ──
    tabsContainer: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    tab: {
        alignItems: 'center',
        marginHorizontal: 6,
        width: 64,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#EBEBEB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    iconCircleActive: {
        backgroundColor: '#5c2d91',
    },
    tabLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#999',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    tabLabelActive: {
        color: '#5c2d91',
    },


    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    itemCard: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    itemName: {
        fontSize: 14,
        color: '#222',
        fontWeight: '500',
    },
    emptyText: {
        textAlign: 'center',
        color: '#bbb',
        paddingVertical: 20,
        fontSize: 13,
    },


    sectionTitle: {
        marginTop: 28,
        marginBottom: 4,
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        paddingHorizontal: 16,
    },

    // ── Nearby kartice ──
    TabCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginHorizontal: 16,
        marginTop: 10,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 10,
        backgroundColor: '#eee',
    },
    TabsCard: {
        flex: 1,
        paddingHorizontal: 12,
        gap: 4,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
    },
    distanceText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '300',
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: '#00646F',
    },
    perDay: {
        fontSize: 12,
        color: '#999',
        marginLeft: 2,
    },


    actions: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 10,
    },
    RentButton: {
        backgroundColor: '#00646F',
        borderRadius: 9999,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    rentText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});