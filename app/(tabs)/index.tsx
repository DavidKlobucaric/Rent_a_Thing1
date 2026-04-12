import { Image } from 'expo-image';
import React, { useState } from 'react';
import {Platform, StyleSheet, Text, View, TextInput,ScrollView, TouchableOpacity,FlatList} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {EvilIcons, Feather, Fontisto, Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';



import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {

    const [liked, setLiked] = useState(false);

    const ALL_ITEMS = [
        { id: 1, name: 'Hammer',           category: 'tools' },
        { id: 2, name: 'Screwdriver set',  category: 'tools' },
        { id: 3, name: 'Power drill',      category: 'tools' },
        { id: 4, name: 'Tent',             category: 'camping' },
        { id: 5, name: 'Sleeping bag',     category: 'camping' },
        { id: 6, name: 'Laptop',           category: 'electronics' },
        { id: 7, name: 'Camera',           category: 'electronics' },
        { id: 8, name: 'Chess set',        category: 'games' },
        { id: 9, name: 'Football',         category: 'sports' },
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

    const [searchText, setSearchText] = useState('');
    const [activeCategory, setActiveCategory] = useState('tools');


    const filteredData = ALL_ITEMS.filter(item =>
        item.category === activeCategory &&
        item.name.toLowerCase().includes(searchText.toLowerCase())
    );
    return (


         <SafeAreaView style={styles.container}>
             <ScrollView>


                                <View style={styles.searchBar}>
                                    <Fontisto name={"search"} style={styles.searchIcon}></Fontisto>
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

                                <View>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>{CATEGORIES.map((cat) => {
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
                                </View>
                <View>
                        <FlatList
                            data={filteredData}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContainer}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>{`Nema rezultata za "${searchText}"`}</Text>
                            }
                            renderItem={({ item }) => (
                                <View style={styles.itemCard}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                </View>
                            )}
                        />

                </View>


                <View>
                    <Text style={styles.NearbyText}>Nearby You</Text>
                </View>

                        <View style={styles.TabCard}>
                                <Image
                                    source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}}
                                    style={styles.googleIcon}>
                                </Image>
                                <View style={styles.TabsCard}>
                                    <View>
                                        <Text style={{fontWeight:"bold"}}>Bosch Power Drill</Text>
                                    </View>

                                    <View>
                                        <Text style={{fontWeight:300}}>0.8 km away</Text>
                                    </View>

                                    <View style={{flexDirection:"row", alignItems:"center"}}>
                                        <Text style={{color:"#00646F", fontWeight:"bold", fontSize:16}}> $12</Text>
                                        <Text> /day</Text>
                                    </View>
                                </View>

                            <View>
                                <TouchableOpacity onPress={() => setLiked(!liked)}>
                                    <Ionicons style={{textAlign:"right"}}
                                        name={liked ? 'heart' : 'heart-outline'}
                                        size={24}
                                        color={liked ? '#e74c3c' : '#ccc'}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.RentButton}>
                                    <Text style={{color:"white"}}>RENT NOW</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                     <View style={styles.TabCard}>
                                <Image
                                    source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}}
                                    style={styles.googleIcon}>
                                </Image>
                                        <View style={styles.TabsCard}>
                                            <View>
                                                <Text style={{fontWeight:"bold"}}>Bosch Power Drill</Text>
                                            </View>

                                            <View>
                                                <Text style={{fontWeight:300}}>0.8 km away</Text>
                                            </View>

                                            <View style={{flexDirection:"row", alignItems:"center"}}>
                                                <Text style={{color:"#00646F", fontWeight:"bold", fontSize:16}}> $12</Text>
                                                <Text> /day</Text>
                                            </View>
                                        </View>

                                        <View>
                                            <TouchableOpacity onPress={() => setLiked(!liked)}>
                                                <Ionicons style={{textAlign:"right"}}
                                                          name={liked ? 'heart' : 'heart-outline'}
                                                          size={24}
                                                          color={liked ? '#e74c3c' : '#ccc'}
                                                />
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.RentButton}>
                                                <Text style={{color:"white"}}>RENT NOW</Text>
                                            </TouchableOpacity>
                                        </View>
                    </View>

                                         <View style={styles.TabCard}>
                                            <Image
                                                source={{uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'}}
                                                style={styles.googleIcon}>
                                            </Image>
                                            <View style={styles.TabsCard}>
                                                <View>
                                                    <Text style={{fontWeight:"bold"}}>Bosch Power Drill</Text>
                                                </View>

                                                <View>
                                                    <Text style={{fontWeight:300}}>0.8 km away</Text>
                                                </View>

                                                <View style={{flexDirection:"row", alignItems:"center"}}>
                                                    <Text style={{color:"#00646F", fontWeight:"bold", fontSize:16}}> $12</Text>
                                                    <Text> /day</Text>
                                                </View>
                                            </View>

                                                <View>
                                                    <TouchableOpacity onPress={() => setLiked(!liked)}>
                                                        <Ionicons style={{textAlign:"right"}}
                                                                  name={liked ? 'heart' : 'heart-outline'}
                                                                  size={24}
                                                                  color={liked ? '#e74c3c' : '#ccc'}
                                                        />
                                                    </TouchableOpacity>

                                                    <TouchableOpacity style={styles.RentButton}>
                                                        <Text style={{color:"white"}}>RENT NOW</Text>
                                                    </TouchableOpacity>
                                                </View>

                                         </View>
             </ScrollView>
         </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F3F4F5',
        borderRadius: 10,
    },

    searchIcon: {
        fontSize: 16,
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



    tabsContainer: {
        paddingHorizontal: 10,
        paddingBottom: 10,

    },

    tab: {
        alignItems: 'center',
        marginHorizontal: 8,
        width: 64,
    },

    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },

    iconCircleActive: {
        backgroundColor: '#5c2d91',
    },

    icon: {
        fontSize: 22,
    },

    tabLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#888',
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
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },

    itemName: {
        fontSize: 15,
        color: '#222',
        fontWeight: '500',
    },

    emptyText: {
        textAlign: 'center',
        color: '#aaa',
        paddingTop: 40,
        fontSize: 14,
    },

    NearbyText:{
        marginTop: 40,
        fontSize: 15,
        textAlign: 'left',
        fontWeight: 'bold',
        paddingHorizontal: 16,

    },

    googleIcon: {
        width: 22,
        height: 22,
    },

    TabCard:{
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        padding: 16,
        marginTop: 16,
        backgroundColor: '#FFFFFF',
        width: '90%',
        borderRadius: 14,
        alignSelf: 'center',
    },

    TabsCard:{
        flexDirection: 'column',
        paddingHorizontal: 16,
        gap:4,
        flex:1,

    },

    RentButton:{
        backgroundColor: '#00646F',
        borderRadius: 9999,
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginTop: 32,

    }





});