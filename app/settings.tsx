import React, { useState, useMemo } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/src/context/languageContext';
import { LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/src/i18n/translations';
import { useRouter } from "expo-router";

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
    isLast?: boolean;
};

// ───────── COMPONENT: SETTING ITEM ─────────
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
                         isLast = false,
                     }: SettingItemProps) => {
    const styles = makeStyles(colors);

    const handlePress = () => {
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
                isLast && { borderBottomWidth: 0 }
            ]}
            onPress={handlePress}
            activeOpacity={0.7} // Svi elementi sada blicaju jednako na dodir za konzistentan osjećaj
        >
            <View style={styles.settingLeft}>
                <View style={[
                    styles.iconBox,
                    isDestructive && styles.destructiveIconBox,
                ]}>
                    <Ionicons
                        name={iconName as any}
                        size={20}
                        color={isDestructive ? colors.danger : colors.primary}
                    />
                </View>

                <View style={styles.textContainer}>
                    <Text style={[
                        styles.settingTitle,
                        { color: colors.text },
                        isDestructive && { color: colors.danger }
                    ]} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={styles.settingDescription} numberOfLines={2}>
                        {description}
                    </Text>
                </View>
            </View>

            {type === 'toggle' ? (
                <Switch
                    value={typeof value === 'boolean' ? value : false}
                    onValueChange={onToggle} // Omogućuje i direktan klik na sam Switch s animacijom
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={value ? colors.iconColorInverse : colors.textMuted}
                    style={styles.switch}
                />
            ) : (
                <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textSecondary}
                />
            )}
        </TouchableOpacity>
    );
};

// ───────── MAIN SCREEN COMPONENT ─────────
export default function SettingsScreen() {
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const router = useRouter();

    const { language, setLanguage, t } = useLanguage();
    const [langModalVisible, setLangModalVisible] = useState(false);

    // ───────── STATE ─────────
    const [notifications, setNotifications] = useState({
        pushEnabled: true,
        newMessages: true,
        reminders: true,
        promotions: false,
    });

    const [privacy, setPrivacy] = useState({
        profileVisibility: 'Public',
        showPhoneNumber: false,
        locationSharing: true,
    });

    const accountInfo = {
        email: 'alex.neighbor@email.com',
        phone: '+1 (555) 123-4567',
    };

    // ───────── HANDLERS ─────────
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
        Alert.alert(
            'Delete Account',
            'This action cannot be undone. All your data will be permanently removed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => Alert.alert('Account Deleted', 'Your account has been permanently deleted'),
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Notifications */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>
                    {t('settings', 'notifications')}
                </Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="notifications-outline" title={t('settings', 'push')} description={t('settings', 'pushDesc')} type="toggle" value={notifications.pushEnabled} onToggle={() => toggleNotification('pushEnabled')} />
                    <SettingItem colors={colors} iconName="chatbubbles-outline" title={t('settings', 'newMessages')} description={t('settings', 'newMessagesDesc')} type="toggle" value={notifications.newMessages} onToggle={() => toggleNotification('newMessages')} />
                    <SettingItem colors={colors} iconName="time-outline" title={t('settings', 'reminders')} description={t('settings', 'remindersDesc')} type="toggle" value={notifications.reminders} onToggle={() => toggleNotification('reminders')} />
                    <SettingItem colors={colors} iconName="pricetag-outline" title={t('settings', 'promotions')} description={t('settings', 'promotionsDesc')} type="toggle" value={notifications.promotions} onToggle={() => toggleNotification('promotions')} isLast />
                </View>

                {/* Privacy */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    {t('settings', 'privacy')}
                </Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="eye-outline" title={t('settings', 'profileVisibility')} description={`${t('settings', 'currently')}: ${privacy.profileVisibility}`} type="link" onPress={() => handleLinkPress('Profile Visibility')} />
                    <SettingItem colors={colors} iconName="call-outline" title={t('settings', 'showPhone')} description={t('settings', 'showPhoneDesc')} type="toggle" value={privacy.showPhoneNumber} onToggle={() => togglePrivacy('showPhoneNumber')} />
                    <SettingItem colors={colors} iconName="location-outline" title={t('settings', 'locationSharing')} description={t('settings', 'locationSharingDesc')} type="toggle" value={privacy.locationSharing} onToggle={() => togglePrivacy('locationSharing')} isLast />
                </View>

                {/* Account */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    {t('settings', 'account')}
                </Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="mail-outline" title={t('settings', 'emailAddress')} description={accountInfo.email} type="link" onPress={() => handleLinkPress('Email')} />
                    <SettingItem colors={colors} iconName="call-outline" title={t('settings', 'phoneNumber')} description={accountInfo.phone} type="link" onPress={() => handleLinkPress('Phone')} />
                    <SettingItem colors={colors} iconName="lock-closed-outline" title={t('settings', 'changePassword')} description={t('settings', 'changePasswordDesc')} type="link" onPress={() => handleLinkPress('Password')} />
                    <SettingItem colors={colors} iconName="card-outline" title={t('settings', 'paymentMethods')} description={t('settings', 'paymentMethodsDesc')} type="link" onPress={() => handleLinkPress('Payment')} isLast />
                </View>

                {/* Legal */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    {t('settings', 'legal')}
                </Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="document-text-outline" title={t('settings', 'terms')} description={t('settings', 'termsDesc')} type="link" onPress={() => router.push('/terms')} />
                    <SettingItem colors={colors} iconName="shield-checkmark-outline" title={t('settings', 'privacyPolicy')} description={t('settings', 'privacyPolicyDesc')} type="link" onPress={() => router.push('/privacy')} isLast />
                </View>

                {/* Danger Zone */}
                <Text style={[styles.sectionTitle, { color: colors.danger }]}>
                    {t('settings', 'dangerZone')}
                </Text>
                <View style={[styles.settingContainer, { borderColor: colors.borderLight }]}>
                    <SettingItem colors={colors} iconName="trash-outline" title={t('settings', 'deleteAccount')} description={t('settings', 'deleteAccountDesc')} type="button" isDestructive onPress={handleDeleteAccount} isLast />
                </View>

                <Text style={[styles.versionText, { color: colors.textMuted }]}>
                    {t('settings', 'version')} 1.0.0
                </Text>

                {/* Language Modal */}
                <Modal visible={langModalVisible} transparent animationType="fade">
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangModalVisible(false)}>
                        <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    {t('settings', 'selectLanguage')}
                                </Text>
                            </View>

                            <ScrollView style={{ maxHeight: 400 }}>
                                {SUPPORTED_LANGUAGES.map((lang, idx) => {
                                    const isActive = language === lang;
                                    return (
                                        <TouchableOpacity
                                            key={lang}
                                            style={[
                                                styles.langRow,
                                                {
                                                    borderBottomColor: colors.border,
                                                    borderBottomWidth: idx < SUPPORTED_LANGUAGES.length - 1 ? 1 : 0,
                                                    backgroundColor: isActive ? colors.primary + '15' : 'transparent',
                                                }
                                            ]}
                                            onPress={() => {
                                                setLanguage(lang);
                                                setLangModalVisible(false);
                                            }}
                                        >
                                            <Text style={styles.langFlag}>{LANGUAGE_FLAGS[lang]}</Text>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.langName, { color: colors.text, fontWeight: isActive ? '700' : '500' }]}>
                                                    {LANGUAGE_NAMES[lang]}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                                                    {lang.toUpperCase()}
                                                </Text>
                                            </View>
                                            {isActive && (
                                                <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                                                    <Ionicons name="checkmark" size={22} color="white" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            <TouchableOpacity style={[styles.modalCloseBtn, { borderTopColor: colors.border }]} onPress={() => setLangModalVisible(false)}>
                                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textMuted }}>
                                    {t('common', 'cancel')}
                                </Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

            </ScrollView>
        </SafeAreaView>
    );
}

// ───────── STYLES ─────────
const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    settingContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 20,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.card,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    destructiveItem: {
        backgroundColor: colors.logoutBg,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: colors.primary + '12',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    destructiveIconBox: {
        backgroundColor: colors.logoutBg,
    },
    textContainer: {
        flex: 1,
        paddingRight: 8,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        color: colors.textMuted,
        lineHeight: 17,
    },
    switch: {
        transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
    },
    versionText: {
        textAlign: 'center',
        fontSize: 13,
        marginTop: 10,
        marginBottom: 30,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        padding: 20,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    langRow: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    langFlag: {
        fontSize: 26,
        marginRight: 14,
    },
    langName: {
        fontSize: 16,
    },
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseBtn: {
        paddingVertical: 16,
        borderTopWidth: 1,
        alignItems: 'center',
    }
});