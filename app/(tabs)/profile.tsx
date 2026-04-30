import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/authContext'; // adjust path if needed
import { useRouter } from 'expo-router';

const userData = {
    name: 'Alex Neighbor',
    rating: 4.7,
    rentals: 12,
    reviews: 48,
    responseRate: 94,
    profileImage: 'https://i.pravatar.cc/300',
};

type MenuItemProps = {
    iconName: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    subtitle: string;
    onPress: () => void;
    isLogout?: boolean;
};

const MenuItem = ({ iconName, title, subtitle, onPress, isLogout = false }: MenuItemProps) => (
    <TouchableOpacity
        style={[styles.menuItem, isLogout && styles.logoutItem]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.menuLeft}>
            <View style={[styles.iconBox, isLogout && styles.logoutIconBox]}>
                <Ionicons
                    name={iconName}
                    size={20}
                    color={isLogout ? '#EF4444' : '#097F8C'}
                />
            </View>
            <View>
                <Text style={[styles.menuTitle, isLogout && styles.logoutTitle]}>
                    {title}
                </Text>
                <Text style={styles.menuSubtitle}>{subtitle}</Text>
            </View>
        </View>
        {!isLogout && (
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        )}
    </TouchableOpacity>
);

const ProfileScreen = () => {
    const [activeTab, setActiveTab] = useState<'myRentals' | 'savedItems'>('myRentals');
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/');

    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            <ScrollView showsVerticalScrollIndicator={false}>



                {/* -------- PROFILE SECTION -------- */}
                <View style={styles.profileSection}>
                    <Image
                        source={{ uri: userData.profileImage }}
                        style={styles.profileImage}
                    />
                    <Text style={styles.userName}>{userData.name}</Text>

                    <View style={styles.userStatus}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.verifiedText}>Verified Member</Text>
                        <Text style={styles.separator}>•</Text>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.ratingText}>{userData.rating} Rating</Text>
                    </View>
                </View>

                {/* -------- STATS -------- */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userData.rentals}</Text>
                        <Text style={styles.statLabel}>RENTALS</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userData.reviews}</Text>
                        <Text style={styles.statLabel}>REVIEWS</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userData.responseRate}%</Text>
                        <Text style={styles.statLabel}>RESPONSE</Text>
                    </View>
                </View>

                {/* -------- TABS -------- */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'myRentals' && styles.activeTab]}
                        onPress={() => setActiveTab('myRentals')}
                    >
                        <Text style={[styles.tabText, activeTab === 'myRentals' && styles.activeTabText]}>
                            My Rentals
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'savedItems' && styles.activeTab]}
                        onPress={() => setActiveTab('savedItems')}
                    >
                        <Text style={[styles.tabText, activeTab === 'savedItems' && styles.activeTabText]}>
                            Saved Items
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* -------- MENU -------- */}
                <View style={styles.menuContainer}>
                    <MenuItem
                        iconName="time-outline"
                        title="Rentals History"
                        subtitle="View all past transactions"
                        onPress={() => console.log('Rentals History')}
                    />
                    <MenuItem
                        iconName="heart-outline"
                        title="Saved Items"
                        subtitle="Things you want to rent later"
                        onPress={() => console.log('Saved Items')}
                    />
                    <MenuItem
                        iconName="settings-outline"
                        title="Settings"
                        subtitle="Privacy, Notifications & Account"
                        onPress={() => console.log('Settings')}
                    />
                    <MenuItem
                        iconName="help-circle-outline"
                        title="Support"
                        subtitle="FAQs and direct help center"
                        onPress={() => console.log('Support')}
                    />
                    <MenuItem
                        iconName="log-out-outline"
                        title="Logout"
                        subtitle="Sign out of your account"
                        onPress={handleLogout}
                        isLogout
                    />
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },

    appNameContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    appName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#097F8C',
    },

    profileSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 12,
        backgroundColor: '#E5E7EB',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    userStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    verifiedText: {
        fontSize: 14,
        color: '#64748B',
    },
    separator: {
        fontSize: 14,
        color: '#94A3B8',
        marginHorizontal: 4,
    },
    ratingText: {
        fontSize: 14,
        color: '#64748B',
    },

    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingVertical: 20,
        marginHorizontal: 6,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#097F8C',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },

    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
    },
    activeTab: {
        backgroundColor: '#097F8C',
        borderColor: '#097F8C',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: '#FFFFFF',
    },

    menuContainer: {
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 10,
    },
    menuItem: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
    },
    logoutItem: {
        borderColor: '#FEE2E2',
        backgroundColor: '#FFFBFB',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 9999,
        backgroundColor: '#F0FDFA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 0.5,
        borderColor: '#BDC9C8',
    },
    logoutIconBox: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FEE2E2',
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    logoutTitle: {
        color: '#EF4444',
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#94A3B8',
    },
});

export default ProfileScreen;