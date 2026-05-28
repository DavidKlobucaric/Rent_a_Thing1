import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';

import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/src/context/authContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';
import { getMyProfile, UserProfile } from '@/src/api/itemsApi';
import { useCallback } from 'react';

type MenuItemProps = {
    iconName: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    subtitle: string;
    onPress: () => void;
    colors: typeof Colors.light;
    showSeparator?: boolean;
};

const MenuItem = ({ iconName, title, subtitle, onPress, colors, showSeparator = true }: MenuItemProps) => {
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
    const { user, logout } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();

    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const isDark = scheme === 'dark';
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            (async () => {
                setLoading(true);
                const result = await getMyProfile();
                if (active && result.success) {
                    setProfile(result.data);
                }
                if (active) setLoading(false);
            })();
            return () => { active = false; };
        }, [])
    );

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    const displayName = profile?.username ?? user?.username ?? '—';
    const rating = profile?.rating ?? 0;
    const ratingCount = profile?.ratingCount ?? 0;
    const favouriteCount = profile?.favouriteCount ?? 0;
    const listingCount = profile?.listingCount ?? 0;

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
                {/* 1. HERO HEADER */}
                <View style={styles.heroHeader}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={56} color={colors.textMuted} />
                    </View>

                    <View style={styles.heroDetails}>
                        {loading ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <>
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
                            </>
                        )}
                    </View>
                </View>

                {/* 2. STATS ROW */}
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
                        <Text style={styles.statValue}>{listingCount}</Text>
                        <Text style={styles.statLabel}>{t('profile', 'rentals')}</Text>
                    </View>
                </View>

                {/* 3. ACCOUNT SETTINGS */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>{t('profile', 'accountSettings')}</Text>
                    <View style={styles.menuGroup}>
                        <MenuItem
                            colors={colors}
                            iconName="heart-outline"
                            title={t('profile', 'savedItems')}
                            subtitle={t('profile', 'savedItemsSub')}
                            onPress={() => router.push('/saved-items')}
                        />

                        <MenuItem
                            colors={colors}
                            iconName="settings-outline"
                            title={t('profile', 'settings')}
                            subtitle={t('profile', 'settingsSub')}
                            onPress={() => router.push('/settings')}
                        />

                        <MenuItem
                            colors={colors}
                            iconName="help-circle-outline"
                            title={t('profile', 'support')}
                            subtitle={t('profile', 'supportSub')}
                            onPress={() => router.push('/support')}
                            showSeparator={false}
                        />
                    </View>
                </View>

                {/* 4. SIGN OUT */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                    <Text style={styles.logoutText}>{t('profile', 'signOut')}</Text>
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
    avatarPlaceholder: {
        width: 106,
        height: 106,
        borderRadius: 53,
        borderWidth: 0.5,
        borderColor: colors.border,
        backgroundColor: colors.surface || colors.background,
        justifyContent: 'center',
        alignItems: 'center',
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
