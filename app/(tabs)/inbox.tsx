import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Image
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Fontisto } from "@expo/vector-icons";
import React, { useState } from "react";

type Conversation = {
    id: number;
    name: string;
    itemName: string;
    lastMessage: string;
    timeAgo: string;
    avatar: string;
    isOnline?: boolean;
    isUnread?: boolean;
};

const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 1,
        name: 'Sarah Miller',
        itemName: 'Sony Alpha Camera',
        lastMessage: 'Is the camera still available for this ...',
        timeAgo: '2m ago',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        isOnline: true,
        isUnread: true,
    },
    {
        id: 2,
        name: 'James Davies',
        itemName: 'Mountain Bike Pro',
        lastMessage: 'Thanks again for the bike! It handle...',
        timeAgo: '1h ago',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        isOnline: false,
        isUnread: true,
    },
    {
        id: 3,
        name: 'Elena Lopez',
        itemName: 'KitchenAid Mixer',
        lastMessage: 'I noticed a small scratch on the sid...',
        timeAgo: '3h ago',
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        isOnline: false,
        isUnread: false,
    },
    {
        id: 4,
        name: 'Marcus Thompson',
        itemName: 'Camping Tent 4-Person',
        lastMessage: 'The tent is all cleaned and packed b...',
        timeAgo: 'Yesterday',
        avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
        isOnline: false,
        isUnread: false,
    },
    {
        id: 5,
        name: 'Alice Wong',
        itemName: 'Electric Pressure Washer',
        lastMessage: 'Perfect! See you at 5 PM for the han...',
        timeAgo: '2 days ago',
        avatar: 'https://randomuser.me/api/portraits/women/90.jpg',
        isOnline: false,
        isUnread: false,
    },
];

export default function Inbox() {
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [searchText, setSearchText] = useState('');

    const handleCategorySelect = (categoryName: string) => {
        setActiveCategory(categoryName);
    };

    const filteredConversations = MOCK_CONVERSATIONS.filter((conv) => {
        const matchesSearch =
            conv.name.toLowerCase().includes(searchText.toLowerCase()) ||
            conv.itemName.toLowerCase().includes(searchText.toLowerCase());

        if (activeCategory === 'Unread') return conv.isUnread && matchesSearch;
        if (activeCategory === 'Archived') return false;
        return matchesSearch;
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* SEARCH BAR */}
                <View style={styles.searchBar}>
                    <Fontisto name="search" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search conversations..."
                        placeholderTextColor="#9CA3AF"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Text style={styles.clearBtn}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* FILTER TABS */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContent}
                >
                    {(['All', 'Unread', 'Archived'] as string[]).map((name) => {
                        const isActive = activeCategory === name;
                        return (
                            <TouchableOpacity
                                key={name}
                                style={[styles.CategoryButton, isActive && styles.CategoryButtonActive]}
                                onPress={() => handleCategorySelect(name)}
                            >
                                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                                    {name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* CONVERSATION LIST */}
                <View style={styles.conversationList}>
                    {filteredConversations.length === 0 ? (
                        <Text style={styles.emptyText}>No conversations found.</Text>
                    ) : (
                        filteredConversations.map((conv) => (
                            <TouchableOpacity
                                key={conv.id}
                                style={[
                                    styles.conversationItem,
                                    !conv.isUnread && styles.conversationItemRead,
                                ]}
                                activeOpacity={0.7}
                            >
                                {/* AVATAR */}
                                <View style={styles.avatarWrapper}>
                                    <Image
                                        source={{ uri: conv.avatar }}
                                        style={styles.avatar}
                                    />
                                    {conv.isOnline && <View style={styles.onlineDot} />}
                                </View>

                                {/* CONTENT */}
                                <View style={styles.convContent}>
                                    <View style={styles.convHeader}>
                                        <Text
                                            style={[
                                                styles.convName,
                                                conv.isUnread && styles.convNameUnread,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {conv.name}
                                        </Text>
                                        <Text style={styles.timeAgo}>{conv.timeAgo}</Text>
                                    </View>
                                    <Text style={styles.itemName} numberOfLines={1}>
                                        {conv.itemName.toUpperCase()}
                                    </Text>
                                    <Text style={styles.lastMessage} numberOfLines={1}>
                                        {conv.lastMessage}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
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

    searchInput: {
        flex: 1,
        height: 45,
        fontSize: 16,
        color: '#333',
    },

    clearBtn: {
        color: '#999',
        fontSize: 16,
        paddingHorizontal: 4,
    },

    categoryContent: {
        gap: 8,
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 16,
    },

    CategoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 9999,
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },

    CategoryButtonActive: {
        backgroundColor: '#097F8C',
        borderColor: '#097F8C',
    },

    categoryText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },

    categoryTextActive: {
        color: '#fff',
        fontWeight: '600',
    },

    conversationList: {
        gap: 10,
    },

    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },

    conversationItemRead: {
        backgroundColor: '#F3F4F6',
    },

    avatarWrapper: {
        position: 'relative',
        marginRight: 12,
    },

    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E5E7EB',
    },

    onlineDot: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#fff',
    },

    convContent: {
        flex: 1,
        gap: 2,
    },

    convHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    convName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },

    convNameUnread: {
        fontWeight: '700',
    },

    timeAgo: {
        fontSize: 12,
        color: '#9CA3AF',
    },

    itemName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#097F8C',
        letterSpacing: 0.4,
    },

    lastMessage: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 1,
    },

    emptyText: {
        textAlign: 'center',
        color: '#bbb',
        paddingVertical: 32,
        fontSize: 14,
    },
});