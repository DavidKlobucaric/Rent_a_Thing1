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
    colors: typeof Colors.light;
    showSeparator?: boolean;
};

const MenuItem = ({ iconName, title, subtitle, onPress, colors, showSeparator = true }: MenuItemProps) => {
    // Dodan useMemo za performanse kako se stilovi ne bi ponovno kreirali unutar liste
    const styles = useMemo(() => makeStyles(colors), [colors]);

    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
                <View style={styles.iconBox}>
                    <Ionicons name={iconName} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.menuTitle}>{title}</Text>
                    <Text style={styles.menuSubtitle} numberOfLines={1}>{subtitle}</Text>
                </View>
            </View>
            <View style={styles.menuRightSide}>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>

            {showSeparator && <View style={styles.menuSeparator} />}
        </TouchableOpacity>
    );
};

export default function ProfileScreen() {
    const { logout } = useAuth();
    const router = useRouter();

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const isDark = scheme === 'dark';

    const styles = useMemo(() => makeStyles(colors), [colors]);

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* 1. HERO HEADER  */}
                <View style={styles.heroHeader}>
                    <Image source={{ uri: userData.profileImage }} style={styles.bigProfileImage} />

                    <View style={styles.heroDetails}>
                        <Text style={styles.userName} numberOfLines={2}>{userData.name}</Text>

                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={16} color={colors.rating || colors.primary} />
                            <Text style={styles.ratingText}>{userData.rating}</Text>
                            <Text style={styles.ratingCount}>({userData.reviews} reviews)</Text>
                        </View>

                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                            <Text style={styles.verifiedText}>Verified Member</Text>
                        </View>
                    </View>
                </View>

                {/* 2. STATS ROW */}
                <View style={styles.statsRowContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userData.rentals}</Text>
                        <Text style={styles.statLabel}>Rentals</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userData.responseRate}%</Text>
                        <Text style={styles.statLabel}>Response</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userData.reviews}</Text>
                        <Text style={styles.statLabel}>Reviews</Text>
                    </View>
                </View>

                {/* 3. POSTAVKE  */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Account Settings</Text>
                    <View style={styles.menuGroup}>
                        <MenuItem
                            colors={colors}
                            iconName="heart-outline"
                            title="Saved Items"
                            subtitle="Things you want to rent later"
                            onPress={() => router.push('/saved-items')}
                        />

                        <MenuItem
                            colors={colors}
                            iconName="settings-outline"
                            title="Settings"
                            subtitle="Privacy, Notifications & Account"
                            onPress={() => router.push('/settings')}
                        />

                        <MenuItem
                            colors={colors}
                            iconName="help-circle-outline"
                            title="Support"
                            subtitle="FAQs and direct help center"
                            onPress={() => router.push('/support')}
                            showSeparator={false}
                        />
                    </View>
                </View>

                {/* 4. SIGN OUT  */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
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
        flexGrow: 1,
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    heroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 32,
        gap: 20,
    },
    bigProfileImage: {
        width: 146,
        height: 146,
        borderRadius: 73,
        borderWidth: 0.5,
        borderColor: colors.border,
        backgroundColor: colors.surface || colors.background,
    },
    heroDetails: {
        flex: 1,
        gap: 6,
    },
    userName: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.text,
        letterSpacing: -0.8,
        lineHeight: 34,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
    },
    ratingCount: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '500',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: (colors.success || '#000') + '15',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        alignSelf: 'flex-start',
        gap: 5,
        marginTop: 2,
    },
    verifiedText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.success,
    },
    statsRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface || colors.background,
        paddingVertical: 18,
        borderRadius: 20,
        borderWidth: 0.5,
        borderColor: colors.border,
        marginBottom: 40,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.3,
    },
    statLabel: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '600',
        marginTop: 2,
    },
    statDivider: {
        width: 0.5,
        height: 24,
        backgroundColor: colors.border,
    },
    menuSection: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        paddingLeft: 4,
    },
    menuGroup: {
        backgroundColor: colors.card || colors.background,
        borderRadius: 20,
        borderWidth: 0.5,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    menuItem: {
        paddingHorizontal: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary + '10',
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
    menuSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
    },
    menuRightSide: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuSeparator: {
        position: 'absolute',
        bottom: 0,
        left: 70,
        right: 16,
        height: 0.5,
        backgroundColor: colors.border,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.logoutBg || colors.background,
        borderWidth: 0.5,
        borderColor: colors.logoutBorder || colors.border,
        paddingVertical: 16,
        borderRadius: 28,
        gap: 8,
        marginTop: 'auto',
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.danger,
    },
});