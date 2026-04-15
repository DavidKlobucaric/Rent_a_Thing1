import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fontisto, Ionicons } from '@expo/vector-icons';



const ALL_ITEMS = [
    { id: 1, name: 'Hammer', category: 'tools', image:'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', price: 12 },
    { id: 2, name: 'Screwdriver set', category: 'tools', image:'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', price: 13 },
    { id: 3, name: 'Power drill', category: 'tools', image:'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', price: 11 },
    { id: 4, name: 'Tent', category: 'camping', image:'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', price: 12 },
    { id: 5, name: 'Sleeping bag', category: 'camping', image:'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', price: 14 },
    { id: 6, name: 'Laptop', category: 'electronics', image:'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', price: 17},
    { id: 7, name: 'Camera', category: 'electronics', image:'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', price: 16 },
    { id: 8, name: 'Chess set', category: 'games', image:'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', price: 13 },
    { id: 9, name: 'Football', category: 'sports', image: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', price: 12},
    { id: 10, name: 'T-shirt', category: 'clothes', image:'https://cdn-icons-png.flaticon.com/512/2991/2991148.png', price: 18},
];

type Category = {
    id: string;
    label: string;
    activeIcon: React.ComponentProps<typeof Ionicons>['name'];
    inactiveIcon: React.ComponentProps<typeof Ionicons>['name'];
};

const CATEGORIES: Category[] = [
    {
        id: 'tools',
        label: 'TOOLS',
        activeIcon: 'construct',
        inactiveIcon: 'construct-outline',
    },
    {
        id: 'camping',
        label: 'CAMPING',
        activeIcon: 'flame',
        inactiveIcon: 'flame-outline',
    },
    {
        id: 'electronics',
        label: 'ELECTRONICS',
        activeIcon: 'laptop',
        inactiveIcon: 'laptop-outline',
    },
    {
        id: 'games',
        label: 'GAMES',
        activeIcon: 'game-controller',
        inactiveIcon: 'game-controller-outline',
    },
    {
        id: 'sports',
        label: 'SPORTS',
        activeIcon: 'football',
        inactiveIcon: 'football-outline',
    },
    {
        id: 'clothes',
        label: 'CLOTHES',
        activeIcon: 'shirt',
        inactiveIcon: 'shirt-outline',
    },
];

const NEARBY_ITEMS = [
    { id: 1, name: 'Bosch Power Drill', distance: '0.8 km away', price: 12 },
    { id: 2, name: 'Epson Projector', distance: '1.2 km away', price: 30 },
    { id: 3, name: 'Karcher K5 Washer', distance: '2.5 km away', price: 18 },
];



export default function HomeScreen() {
    const [searchText, setSearchText] = useState('');
    const [activeCategory, setActiveCategory] = useState('tools');
    const [favorites, setFavorites] = useState<number[]>([]);

    const toggleFavorite = (id: number) => {
        setFavorites(prev =>
            prev.includes(id)
                ? prev.filter(f => f !== id)
                : [...prev, id]
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

                {/*-------------------------------- SEARCH BAR --------------------------------*/}

                <View style={styles.searchBar}>
                    <Fontisto name="search" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
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

                {/*-------------------------------- CATEGORY TABS --------------------------------*/}

                <ScrollView horizontal showsHorizontalScrollIndicator={false}
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
                            >
                                <View style={[
                                    styles.iconCircle,
                                    isActive && styles.iconCircleActive
                                ]}>
                                    <Ionicons
                                        name={isActive ? cat.activeIcon : cat.inactiveIcon}
                                        size={24}
                                        color={isActive ? '#fff' : '#555'}
                                    />
                                </View>

                                <Text style={[
                                    styles.tabLabel,
                                    isActive && styles.tabLabelActive
                                ]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/*-------------------------------- SEARCH RESULTS --------------------------------*/}

                <View  style={styles.listContainer}>
                    {filteredData.length === 0 ? (
                        <Text style={styles.emptyText}>
                            {`Nema rezultata za "${searchText}"`}
                        </Text>
                    ) : (

                            <FlatList
                                data={filteredData}
                                keyExtractor={(item) => item.id.toString()}
                                scrollEnabled={true}
                                horizontal={true}
                                renderItem={({ item }) => (
                                    <View style={styles.itemCard}>
                                        <Image source={{uri: item.image}} style={styles.itemImage}></Image>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <View style={{flexDirection:"row"}}>
                                            <Text style={styles.price}>${item.price}</Text>
                                            <Text style={styles.perDay}>/day</Text>
                                        </View>

                                    </View>
                                )}
                            />

                    )}

                </View>

                {/* -------------------------------- NEARBY SECTION -------------------------------- */}

                <Text style={styles.sectionTitle}>Nearby You</Text>

                {NEARBY_ITEMS.map((item) => (
                    <View key={item.id} style={styles.card}>

                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                            style={styles.thumbnail}
                        />

                        <View style={styles.cardContent}>
                            <Text style={styles.itemTitle}>{item.name}</Text>
                            <Text style={styles.distanceText}>{item.distance}</Text>

                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.price}>${item.price}</Text>
                                <Text style={styles.perDay}>/day</Text>
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                                <Ionicons
                                    name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
                                    size={22}
                                    color={favorites.includes(item.id) ? '#e74c3c' : '#ccc'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.rentButton}>
                                <Text style={styles.rentText}>RENT</Text>
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

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        padding: 10,
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
    },
    clearBtn: {
        color: '#999',
    },

    tabsContainer: {
        paddingHorizontal: 12,
    },
    tab: {
        alignItems: 'center',
        marginHorizontal: 6,
        width: 64,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 9999,
        backgroundColor: '#EBEBEB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircleActive: {
        backgroundColor: '#5c2d91',
    },
    tabLabel: {
        fontSize: 10,
        color: '#999',
    },
    tabLabelActive: {
        color: '#5c2d91',
    },

    listContainer: {
        paddingHorizontal: 16,
        marginTop: 10,
    },
    itemCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginTop:15,
        marginBottom: 10,
        marginHorizontal: 10

    },

    itemName: {
        fontSize: 16,
        paddingTop:10,
    },
    emptyText: {
        textAlign: 'center',
        color: '#bbb',
    },

    sectionTitle: {
        marginTop: 20,
        fontSize: 16,
        fontWeight: '700',
        paddingHorizontal: 15,
    },

    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 15,
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 10,
    },
    cardContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    itemTitle: {
        fontWeight: '700',
    },
    distanceText: {
        fontSize: 12,
        color: '#888',
    },
    price: {
        fontWeight: '700',
        color: '#00646F',
    },
    perDay: {
        color: '#999',
        marginLeft: 5,
    },

    actions: {
        alignItems: 'flex-end',
        gap: 20,
    },
    rentButton: {
        backgroundColor: '#00646F',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    rentText: {
        color: '#fff',
        fontSize: 11,
    },

    itemImage: {
        width: 160,
        height: 160,
        borderRadius: 10,
        backgroundColor: 'white',

    },
});