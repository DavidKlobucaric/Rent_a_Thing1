import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/src/context/languageContext';
import { LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/src/i18n/translations';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Uvezi svoj auth context ili funkciju za logout i brisanje računa
// import { useAuth } from '@/src/context/authContext';
// import { changePasswordApi, deleteAccountApi } from '@/src/api/userApi';

const NOTIF_KEY = '@settings_notifications';

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

const SettingItem = ({ iconName, title, description, onPress, onToggle, value, type, isDestructive = false, colors }: SettingItemProps) => {
    const styles = makeStyles(colors);
    return (
        <TouchableOpacity
            style={[styles.settingItem, isDestructive && styles.destructiveItem]}
            onPress={type === 'toggle' ? undefined : onPress}
            activeOpacity={type === 'toggle' ? 1 : 0.7}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconBox, isDestructive && styles.destructiveIconBox]}>
                    <Ionicons name={iconName as any} size={20} color={isDestructive ? colors.danger : colors.iconColor} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.settingTitle, { color: colors.text }, isDestructive && { color: colors.danger }]}>{title}</Text>
                    <Text style={styles.settingDescription}>{description}</Text>
                </View>
            </View>
            {type === 'toggle' ? (
                <Switch
                    value={typeof value === 'boolean' ? value : false}
                    onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle?.(v); }}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={value ? colors.iconColorInverse : colors.textMuted}
                />
            ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            )}
        </TouchableOpacity>
    );
};

export default function SettingsScreen() {
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const { language, setLanguage, t } = useLanguage();
    const router = useRouter();

    const langSheetRef = useRef<BottomSheet>(null);
    const passSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['50%'], []);

    // Stanja za notifikacije (Spremaju se lokalno!)
    const [notifications, setNotifications] = useState({ pushEnabled: true, newMessages: true });

    // Stanja za lozinku
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [saving, setSaving] = useState(false);

    // Učitaj notifikacije iz memorije telefona
    useEffect(() => {
        AsyncStorage.getItem(NOTIF_KEY).then(data => {
            if (data) setNotifications(JSON.parse(data));
        });
    }, []);

    const toggleNotif = async (key: keyof typeof notifications) => {
        const updated = { ...notifications, [key]: !notifications[key] };
        setNotifications(updated);
        await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    };

    const handleChangePassword = async () => {
        if (!currentPass || !newPass) return Alert.alert('Error', 'Fill all fields');
        if (newPass.length < 6) return Alert.alert('Error', 'Min 6 characters');

        setSaving(true);
        // TODO: Pozovi svoj backend API ovdje!
        // const res = await changePasswordApi(currentPass, newPass);
        await new Promise(r => setTimeout(r, 1000)); // Simulacija
        setSaving(false);

        Alert.alert('Success', 'Password changed');
        passSheetRef.current?.close();
        setCurrentPass(''); setNewPass('');
    };

    const handleDeleteAccount = () => {
        Alert.alert('Delete Account', 'Are you sure? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                    // TODO: Pozovi backend API za brisanje!
                    // await deleteAccountApi();
                    // await logout(); // Obrisi token
                    // router.replace('/(auth)/login');
                    Alert.alert('Deleted', 'Account removed.');
                }},
        ]);
    };


    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* NOTIFIKACIJE */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 20 }]}>{t('settings', 'notifications')}</Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="notifications" title={t('settings', 'push')} description={t('settings', 'pushDesc')} type="toggle" value={notifications.pushEnabled} onToggle={() => toggleNotif('pushEnabled')} />
                    <SettingItem colors={colors} iconName="chatbubbles" title={t('settings', 'newMessages')} description={t('settings', 'newMessagesDesc')} type="toggle" value={notifications.newMessages} onToggle={() => toggleNotif('newMessages')} />
                </View>

                {/* RAČUN */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settings', 'account')}</Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="mail" title={t('settings', 'emailAddress')} description="user@example.com" type="link" onPress={() => Alert.alert('Info', 'Contact support to change email.')} />
                    <SettingItem colors={colors} iconName="lock-closed" title={t('settings', 'changePassword')} description={t('settings', 'changePasswordDesc')} type="link" onPress={() => passSheetRef.current?.expand()} />
                    <SettingItem colors={colors} iconName="language" title={t('settings', 'language')} description={`${LANGUAGE_FLAGS[language]} ${LANGUAGE_NAMES[language]}`} type="link" onPress={() => langSheetRef.current?.expand()} />
                </View>

                {/* PRAVNO */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('settings', 'legal')}</Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="document-text" title={t('settings', 'terms')} description={t('settings', 'termsDesc')} type="link" onPress={() => router.push('/terms')} />
                    <SettingItem colors={colors} iconName="shield-checkmark" title={t('settings', 'privacyPolicy')} description={t('settings', 'privacyPolicyDesc')} type="link" onPress={() => router.push('/privacy')} />
                </View>

                {/* OPASNA ZONA & ODJAVA */}
                <Text style={[styles.sectionTitle, { color: colors.danger }]}>{t('settings', 'dangerZone')}</Text>
                <View style={[styles.settingContainer, { borderColor: colors.borderLight }]}>
                    <SettingItem colors={colors} iconName="trash" title={t('settings', 'deleteAccount')} description={t('settings', 'deleteAccountDesc')} type="button" isDestructive onPress={handleDeleteAccount} />
                </View>

                <Text style={[styles.versionText, { color: colors.textMuted }]}>Version 1.0.0</Text>
            </ScrollView>

            {/* LANGUAGE SHEET */}
            <BottomSheet ref={langSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} handleIndicatorStyle={{ backgroundColor: colors.textMuted, width: 40 }}>
                <BottomSheetView style={styles.sheetContent}>
                    <Text style={styles.sheetTitle}>🌍 {t('settings', 'selectLanguage')}</Text>
                    <View style={styles.sheetList}>
                        {SUPPORTED_LANGUAGES.map((lang) => {
                            const isActive = language === lang;
                            return (
                                <TouchableOpacity key={lang} style={[styles.sheetItem, isActive && styles.sheetItemActive]} onPress={() => { setLanguage(lang); langSheetRef.current?.close(); }}>
                                    <Text style={styles.sheetFlag}>{LANGUAGE_FLAGS[lang]}</Text>
                                    <Text style={[styles.sheetItemText, isActive && styles.sheetItemTextActive]}>{LANGUAGE_NAMES[lang]}</Text>
                                    {isActive && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </BottomSheetView>
            </BottomSheet>

            {/* PASSWORD SHEET */}
            <BottomSheet ref={passSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} handleIndicatorStyle={{ backgroundColor: colors.textMuted, width: 40 }}>
                <BottomSheetView style={styles.sheetContent}>
                    <Text style={styles.sheetTitle}>🔒 {t('settings', 'changePassword')}</Text>
                    <TextInput style={styles.input} placeholder="Current Password" placeholderTextColor={colors.textMuted} secureTextEntry value={currentPass} onChangeText={setCurrentPass} />
                    <TextInput style={styles.input} placeholder="New Password" placeholderTextColor={colors.textMuted} secureTextEntry value={newPass} onChangeText={setNewPass} />
                    <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={saving}>
                        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Password</Text>}
                    </TouchableOpacity>
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
    versionText: { textAlign: 'center', fontSize: 12, marginTop: 10, marginBottom: 30 },
    sheetContent: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, gap: 12 },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 10 },
    sheetList: { gap: 6 },
    sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    sheetItemActive: { backgroundColor: colors.primary + '15', borderColor: colors.primary },
    sheetFlag: { fontSize: 26, marginRight: 14 },
    sheetItemText: { fontSize: 16, fontWeight: '500', color: colors.text, flex: 1 },
    sheetItemTextActive: { color: colors.primary, fontWeight: '700' },
    input: { width: '100%', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, fontSize: 15, color: colors.text },
    saveBtn: { width: '100%', paddingVertical: 15, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});