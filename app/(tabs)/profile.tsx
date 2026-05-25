import React, { useMemo } from 'react';
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

import { useAuth } from '@/src/context/authContext';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

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
    colors: typeof Colors.light;
};

const MenuItem = ({
                      iconName,
                      title,
                      subtitle,
                      onPress,
                      isLogout = false,
                      colors,
                  }: MenuItemProps) => {

    const styles = makeStyles(colors);

    return (
        <TouchableOpacity
            style={[styles.menuItem, isLogout && styles.logoutItem]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.menuLeft}>
                <View style={[styles.iconBox]}>
                    <Ionicons
                        name={iconName}
                        size={24}

                        color={isLogout ? colors.danger : colors.primary}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={[styles.menuTitle, isLogout && styles.logoutTitle]}>
                        {title}
                    </Text>
                    <Text style={styles.menuSubtitle}>
                        {subtitle}
                    </Text>
                </View>
            </View>

            {!isLogout && (
                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                />
            )}
        </TouchableOpacity>
    );
};

export default function ProfileScreen() {

    const { logout } = useAuth();
    const router = useRouter();

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];

    const isDark = scheme === 'dark';

    const styles = useMemo(
        () => makeStyles(colors),
        [colors]
    );

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    return (
        <SafeAreaView
            style={styles.container}
            edges={['top', 'left', 'right']}
        >

            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >

                {/* PROFILE */}
                <View style={styles.profileSection}>

                    <View style={styles.profileImageContainer}>
                        <Image
                            source={{ uri: userData.profileImage }}
                            style={styles.profileImage}
                        />
                    </View>

                    <Text style={styles.userName}>
                        {userData.name}
                    </Text>

                    <View style={styles.userStatus}>
                        <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.success}
                        />
                        <Text style={styles.verifiedText}>
                            Verified Member
                        </Text>
                        <Text style={styles.separator}>•</Text>
                        <Ionicons
                            name="star"
                            size={16}
                            color={colors.rating}
                        />
                        <Text style={styles.ratingText}>
                            {userData.rating} Rating
                        </Text>
                    </View>
                </View>

                {/* STATS */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>
                            RENTALS
                        </Text>
                        <Text style={styles.statValue}>
                            {userData.rentals}
                        </Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>
                            REVIEWS
                        </Text>
                        <Text style={styles.statValue}>
                            {userData.reviews}
                        </Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>
                            RESPONSE
                        </Text>
                        <Text style={styles.statValue}>
                            {userData.responseRate}%
                        </Text>
                    </View>
                </View>

                {/* MENU */}
                <View style={styles.menuContainer}>
                    <MenuItem
                        colors={colors}
                        iconName="heart-outline"
                        title="Saved Items"
                        subtitle="Things you want to rent later"
                        onPress={() => { router.push('/saved-items')}}
                    />

                    <MenuItem
                        colors={colors}
                        iconName="settings-outline"
                        title="Settings"
                        subtitle="Privacy, Notifications & Account"
                        onPress={() => { router.push('/settings')}}
                    />

                    <MenuItem
                        colors={colors}
                        iconName="help-circle-outline"
                        title="Support"
                        subtitle="FAQs and direct help center"
                        onPress={() => {router.push('/support')}}
                    />

                    <MenuItem
                        colors={colors}
                        iconName="log-out-outline"
                        title="Logout"
                        subtitle="Sign out of your account"
                        onPress={handleLogout}
                        isLogout
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    scrollContent: {
        paddingBottom: 40,
    },

    profileSection: {
        alignItems: 'center',
        paddingTop: 36,
        paddingBottom: 28,
    },

    profileImageContainer: {
        marginBottom: 18,
    },

    profileImage: {
        width: 200,
        height: 200,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: colors.border,

    },

    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
        letterSpacing: -0.3,
    },

    userStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    verifiedText: {
        fontSize: 13,
        color: colors.textSecondary,
    },

    separator: {
        fontSize: 14,
        color: colors.textMuted,
        paddingHorizontal: 2,
    },

    ratingText: {
        fontSize: 13,
        color: colors.textSecondary,
    },

    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        marginBottom: 28,
    },

    statBox: {
        flex: 1,
        backgroundColor: colors.surface,
        paddingVertical: 16,
        marginHorizontal: 5,
        borderRadius: 14,
        alignItems: 'center',
    },

    statValue: {
        fontSize: 24,
        fontWeight: '600',
        color: colors.text,

    },

    statLabel: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '600',
        letterSpacing: 0.5,
    },

    menuContainer: {
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 10,
    },

    menuItem: {
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    logoutItem: {
        borderColor: colors.logoutBorder,
        backgroundColor: colors.logoutBg,
    },

    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },

    iconBox: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },

    menuTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },

    logoutTitle: {
        color: colors.danger,
    },

    menuSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
    },
});