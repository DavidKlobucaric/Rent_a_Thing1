import React, { useMemo, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/authContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { getMyProfile, getMyListings, UserProfile } from '@/src/api/itemsApi';
import * as Haptics from 'expo-haptics';

type MenuItemProps = {
    iconName: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    subtitle: string;
    onPress: () => void;
    colors: typeof Colors.light;
    showSeparator?: boolean;
};

const MenuItem = React.memo(({ iconName, title, subtitle, onPress, colors, showSeparator = true }: MenuItemProps) => {
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    }, [onPress]);

    return (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePress}
            activeOpacity={0.7}
        >
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
});

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const isDark = scheme === 'dark';

    const styles = useMemo(() => makeStyles(colors), [scheme]);
    const shimmerColors = useMemo(() =>
            scheme === 'dark'
                ? ['#2A2A2A', '#3A3A3A', '#2A2A2A']
                : ['#E0E0E0', '#F5F5F5', '#E0E0E0'],
        [scheme]);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [myListingCount, setMyListingCount] = useState(0);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            (async () => {
                setLoading(true);
                const [profileResult, listingsResult] = await Promise.all([
                    getMyProfile(),
                    getMyListings(),
                ]);
                if (active) {
                    if (profileResult.success) {
                        setProfile(profileResult.data);
                    }
                    if (listingsResult.success) {
                        setMyListingCount(listingsResult.data.length);
                    }
                }
                if (active) setLoading(false);
            })();
            return () => { active = false; };
        }, [])
    );

    const handleLogout = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await logout();
    }, [logout]);

    const handleMyListingsPress = useCallback(() => router.push('/my-listings'), [router]);
    const handleSavedItemsPress = useCallback(() => router.push('/saved-items'), [router]);
    const handleSettingsPress = useCallback(() => router.push('/settings'), [router]);
    const handleSupportPress = useCallback(() => router.push('/support'), [router]);

    const displayName = profile?.username ?? user?.username ?? '—';
    const rating = profile?.rating ?? 0;
    const ratingCount = profile?.ratingCount ?? 0;
    const favouriteCount = profile?.favouriteCount ?? 0;

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar
                    barStyle={isDark ? 'light-content' : 'dark-content'}
                    backgroundColor={colors.background}
                />
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.heroHeader}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={styles.avatarPlaceholder}
                            shimmerColors={shimmerColors}
                        />
                        <View style={styles.heroDetails}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: '70%', height: 28, borderRadius: 8, marginBottom: 8 }}
                                shimmerColors={shimmerColors}
                            />
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: '50%', height: 16, borderRadius: 6, marginBottom: 6 }}
                                shimmerColors={shimmerColors}
                            />
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: '40%', height: 20, borderRadius: 10 }}
                                shimmerColors={shimmerColors}
                            />
                        </View>
                    </View>
                    <View style={styles.statsRowContainer}>
                        <View style={styles.statBox}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: 40, height: 22, borderRadius: 6, marginBottom: 4 }}
                                shimmerColors={shimmerColors}
                            />
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: 60, height: 12, borderRadius: 4 }}
                                shimmerColors={shimmerColors}
                            />
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: 40, height: 22, borderRadius: 6, marginBottom: 4 }}
                                shimmerColors={shimmerColors}
                            />
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: 60, height: 12, borderRadius: 4 }}
                                shimmerColors={shimmerColors}
                            />
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: 40, height: 22, borderRadius: 6, marginBottom: 4 }}
                                shimmerColors={shimmerColors}
                            />
                            <ShimmerPlaceholder
                                LinearGradient={LinearGradient}
                                style={{ width: 60, height: 12, borderRadius: 4 }}
                                shimmerColors={shimmerColors}
                            />
                        </View>
                    </View>
                    <View style={styles.menuSection}>
                        <ShimmerPlaceholder
                            LinearGradient={LinearGradient}
                            style={{ width: '30%', height: 14, borderRadius: 4, marginBottom: 12 }}
                            shimmerColors={shimmerColors}
                        />
                        <View style={styles.menuGroup}>
                            {[1, 2, 3, 4].map((i) => (
                                <View key={i} style={styles.menuItem}>
                                    <View style={styles.menuLeft}>
                                        <ShimmerPlaceholder
                                            LinearGradient={LinearGradient}
                                            style={styles.iconBox}
                                            shimmerColors={shimmerColors}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <ShimmerPlaceholder
                                                LinearGradient={LinearGradient}
                                                style={{ width: '60%', height: 16, borderRadius: 4, marginBottom: 4 }}
                                                shimmerColors={shimmerColors}
                                            />
                                            <ShimmerPlaceholder
                                                LinearGradient={LinearGradient}
                                                style={{ width: '40%', height: 12, borderRadius: 4 }}
                                                shimmerColors={shimmerColors}
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

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
                {/* HERO HEADER */}
                <View style={styles.heroHeader}>
                    <View style={styles.avatarPlaceholder}>
                        {profile?.avatarUrl ? (
                            <Image
                                source={{ uri: profile.avatarUrl }}
                                style={styles.avatarImage}
                                cachePolicy="memory-disk"
                                transition={200}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={styles.avatarInitials}>
                                <Text style={styles.avatarInitialsText}>
                                    {(displayName?.charAt(0)?.toUpperCase() ?? 'U')}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.heroDetails}>
                        <Text style={styles.userName} numberOfLines={2}>{displayName}</Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={16} color={colors.rating || colors.primary} />
                            <Text style={styles.ratingText}>
                                {ratingCount === 0 ? '—' : rating.toFixed(1)}
                            </Text>
                            <Text style={styles.ratingCount}>
                                ({ratingCount} {t('profile', 'reviews').toLowerCase()})
                            </Text>
                        </View>
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                            <Text style={styles.verifiedText}>{t('profile', 'verifiedMember')}</Text>
                        </View>
                    </View>
                </View>

                {/* STATS ROW */}
                <View style={styles.statsRowContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{favouriteCount}</Text>
                        <Text style={styles.statLabel}>{t('profile', 'savedItems')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>
                            {ratingCount === 0 ? '—' : `${rating.toFixed(1)}★`}
                        </Text>
                        <Text style={styles.statLabel}>{t('profile', 'reviews')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{myListingCount}</Text>
                        <Text style={styles.statLabel}>{t('profile', 'myListings')}</Text>
                    </View>
                </View>

                {/* ACCOUNT SETTINGS */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>{t('profile', 'accountSettings')}</Text>
                    <View style={styles.menuGroup}>
                        <MenuItem
                            colors={colors}
                            iconName="cube-outline"
                            title={t('profile', 'myListings')}
                            subtitle={`${myListingCount} ${myListingCount === 1 ? (t('profile', 'listing') || 'listing') : (t('profile', 'listings') || 'listings')}`}
                            onPress={handleMyListingsPress}
                        />
                        <MenuItem
                            colors={colors}
                            iconName="heart-outline"
                            title={t('profile', 'savedItems')}
                            subtitle={t('profile', 'savedItemsSub')}
                            onPress={handleSavedItemsPress}
                        />
                        <MenuItem
                            colors={colors}
                            iconName="settings-outline"
                            title={t('profile', 'settings')}
                            subtitle={t('profile', 'settingsSub')}
                            onPress={handleSettingsPress}
                        />
                        <MenuItem
                            colors={colors}
                            iconName="help-circle-outline"
                            title={t('profile', 'support')}
                            subtitle={t('profile', 'supportSub')}
                            onPress={handleSupportPress}
                            showSeparator={false}
                        />
                    </View>
                </View>

                {/* SIGN OUT */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                    <Text style={styles.logoutText}>{t('profile', 'signOut')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) =>
    StyleSheet.create({
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

        avatarPlaceholder: {
            width: 106,
            height: 106,
            borderRadius: 53,
            borderWidth: 0.5,
            borderColor: colors.border,
            backgroundColor: colors.surface || colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
        },

        avatarImage: {
            width: '100%',
            height: '100%',
            borderRadius: 53,
        },

        avatarInitials: {
            width: '100%',
            height: '100%',
            borderRadius: 53,
            backgroundColor: colors.primary + '20',
            justifyContent: 'center',
            alignItems: 'center',
        },

        avatarInitialsText: {
            fontSize: 36,
            fontWeight: '700',
            color: colors.primary,
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