import React, { useState, useMemo, useRef } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/src/context/languageContext';
import { LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/src/i18n/translations';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

type SettingItemProps = {
    iconName: string;
    title: string;
    description: string;
    onPress?: () => void;
    onToggle?: (value: boolean) => void;
    value?: boolean | string;
    type: 'toggle' | 'link' | 'button';
    isDestructive?: boolean;
    colors: typeof Colors.light;
};

const router = useRouter();

const SettingItem = ({
                         iconName,
                         title,
                         description,
                         onPress,
                         onToggle,
                         value,
                         type,
                         isDestructive = false,
                         colors,
                     }: SettingItemProps) => {
    const styles = makeStyles(colors);
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (type === 'toggle' && typeof value === 'boolean') {
            onToggle?.(!value);
        } else if (type === 'link' || type === 'button') {
            onPress?.();
        }
    };
    return (
        <TouchableOpacity
            style={[
                styles.settingItem,
                isDestructive && styles.destructiveItem,
            ]}
            onPress={handlePress}
            activeOpacity={type === 'toggle' ? 1 : 0.7}
            disabled={type === 'toggle'}
        >
            <View style={styles.settingLeft}>
                <View style={[
                    styles.iconBox,
                    isDestructive && styles.destructiveIconBox,
                ]}>
                    <Ionicons
                        name={iconName as any}
                        size={20}
                        color={isDestructive ? colors.danger : colors.iconColor}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[
                        styles.settingTitle,
                        { color: colors.text },
                        isDestructive && { color: colors.danger }
                    ]}>
                        {title}
                    </Text>
                    <Text style={styles.settingDescription}>
                        {description}
                    </Text>
                </View>
            </View>
            {type === 'toggle' ? (
                <Switch
                    value={typeof value === 'boolean' ? value : false}
                    onValueChange={(v) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onToggle?.(v);
                    }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={value ? colors.iconColorInverse : colors.textMuted}
                    style={styles.switch}
                />
            ) : (
                <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                />
            )}
        </TouchableOpacity>
    );
};

export default function SettingsScreen() {
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const { language, setLanguage, t } = useLanguage();

    // Bottom Sheet ref
    const langSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['55%'], []);

    const [notifications, setNotifications] = useState({
        pushEnabled: true,
        emailEnabled: true,
        newMessages: true,
        bookingRequests: true,
        reminders: true,
        promotions: false,
    });

    const [privacy, setPrivacy] = useState({
        profileVisibility: 'Public',
        showPhoneNumber: false,
        showEmail: false,
        locationSharing: true,
    });

    const accountInfo = {
        email: 'alex.neighbor@email.com',
        phone: '+1 (555) 123-4567',
    };

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const togglePrivacy = (key: keyof typeof privacy) => {
        setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLinkPress = (label: string) => {
        Alert.alert(label, `Open ${label} screen`);
    };

    const handleDeleteAccount = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            'Delete Account',
            'This action cannot be undone. All your data will be permanently removed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert('Account Deleted', 'Your account has been permanently deleted');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>
                    {t('settings', 'notifications')}
                </Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="notifications" title={t('settings', 'push')} description={t('settings', 'pushDesc')} type="toggle" value={notifications.pushEnabled} onToggle={() => toggleNotification('pushEnabled')} />
                    <SettingItem colors={colors} iconName="chatbubbles" title={t('settings', 'newMessages')} description={t('settings', 'newMessagesDesc')} type="toggle" value={notifications.newMessages} onToggle={() => toggleNotification('newMessages')} />
                    <SettingItem colors={colors} iconName="time" title={t('settings', 'reminders')} description={t('settings', 'remindersDesc')} type="toggle" value={notifications.reminders} onToggle={() => toggleNotification('reminders')} />
                    <SettingItem colors={colors} iconName="pricetag" title={t('settings', 'promotions')} description={t('settings', 'promotionsDesc')} type="toggle" value={notifications.promotions} onToggle={() => toggleNotification('promotions')} />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    {t('settings', 'privacy')}
                </Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="eye" title={t('settings', 'profileVisibility')} description={`${t('settings', 'currently')}: ${privacy.profileVisibility}`} type="link" onPress={() => handleLinkPress('Profile Visibility')} />
                    <SettingItem colors={colors} iconName="call" title={t('settings', 'showPhone')} description={t('settings', 'showPhoneDesc')} type="toggle" value={privacy.showPhoneNumber} onToggle={() => togglePrivacy('showPhoneNumber')} />
                    <SettingItem colors={colors} iconName="location" title={t('settings', 'locationSharing')} description={t('settings', 'locationSharingDesc')} type="toggle" value={privacy.locationSharing} onToggle={() => togglePrivacy('locationSharing')} />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    {t('settings', 'account')}
                </Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="mail" title={t('settings', 'emailAddress')} description={accountInfo.email} type="link" onPress={() => handleLinkPress('Email')} />
                    <SettingItem colors={colors} iconName="call" title={t('settings', 'phoneNumber')} description={accountInfo.phone} type="link" onPress={() => handleLinkPress('Phone')} />
                    <SettingItem colors={colors} iconName="lock-closed" title={t('settings', 'changePassword')} description={t('settings', 'changePasswordDesc')} type="link" onPress={() => handleLinkPress('Password')} />
                    <SettingItem colors={colors} iconName="card" title={t('settings', 'paymentMethods')} description={t('settings', 'paymentMethodsDesc')} type="link" onPress={() => handleLinkPress('Payment')} />
                    <SettingItem
                        colors={colors}
                        iconName="language"
                        title={t('settings', 'language')}
                        description={`${LANGUAGE_FLAGS[language]} ${LANGUAGE_NAMES[language]}`}
                        type="link"
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            langSheetRef.current?.expand();
                        }}
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    {t('settings', 'legal')}
                </Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="document-text" title={t('settings', 'terms')} description={t('settings', 'termsDesc')} type="link" onPress={() => router.push('/terms')} />
                    <SettingItem colors={colors} iconName="shield-checkmark" title={t('settings', 'privacyPolicy')} description={t('settings', 'privacyPolicyDesc')} type="link" onPress={() => router.push('/privacy')} />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.danger }]}>
                    {t('settings', 'dangerZone')}
                </Text>
                <View style={[styles.settingContainer, { borderColor: colors.borderLight }]}>
                    <SettingItem
                        colors={colors}
                        iconName="trash"
                        title={t('settings', 'deleteAccount')}
                        description={t('settings', 'deleteAccountDesc')}
                        type="button"
                        isDestructive
                        onPress={handleDeleteAccount}
                    />
                </View>

                <Text style={[styles.versionText, { color: colors.textMuted }]}>
                    {t('settings', 'version')} 1.0.0
                </Text>
            </ScrollView>

            {/* LANGUAGE BOTTOM SHEET */}
            <BottomSheet
                ref={langSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backgroundStyle={{
                    backgroundColor: colors.card,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                }}
                handleIndicatorStyle={{
                    backgroundColor: colors.textMuted,
                    width: 40,
                }}
            >
                <BottomSheetView style={styles.sheetContent}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>🌍 {t('settings', 'selectLanguage')}</Text>
                    </View>
                    <View style={styles.sheetList}>
                        {SUPPORTED_LANGUAGES.map((lang) => {
                            const isActive = language === lang;
                            return (
                                <TouchableOpacity
                                    key={lang}
                                    style={[
                                        styles.sheetItem,
                                        isActive && styles.sheetItemActive,
                                    ]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setLanguage(lang);
                                        langSheetRef.current?.close();
                                    }}
                                >
                                    <Text style={styles.sheetFlag}>{LANGUAGE_FLAGS[lang]}</Text>
                                    <View style={styles.sheetTextContainer}>
                                        <Text style={[
                                            styles.sheetItemText,
                                            isActive && styles.sheetItemTextActive,
                                        ]}>
                                            {LANGUAGE_NAMES[lang]}
                                        </Text>
                                        <Text style={styles.sheetLangCode}>{lang.toUpperCase()}</Text>
                                    </View>
                                    {isActive && (
                                        <View style={styles.sheetCheckmark}>
                                            <Ionicons name="checkmark" size={20} color="white" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </SafeAreaView>
    );
}

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingVertical: 10, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 4, marginBottom: 8 },
    settingContainer: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    destructiveItem: { backgroundColor: colors.logoutBg, borderBottomWidth: 0 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    destructiveIconBox: { backgroundColor: colors.logoutBg },
    textContainer: { flex: 1, paddingRight: 8 },
    settingTitle: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
    settingDescription: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
    switch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
    versionText: { textAlign: 'center', fontSize: 12, marginTop: 10, marginBottom: 30 },
    // Sheet styles
    sheetContent: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
    sheetHeader: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    sheetList: { gap: 6 },
    sheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sheetItemActive: {
        backgroundColor: colors.primary + '15',
        borderColor: colors.primary,
    },
    sheetFlag: { fontSize: 26, marginRight: 14 },
    sheetTextContainer: { flex: 1 },
    sheetItemText: { fontSize: 16, fontWeight: '500', color: colors.text },
    sheetItemTextActive: { color: colors.primary, fontWeight: '700' },
    sheetLangCode: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    sheetCheckmark: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});