import { Stack } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';


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

                <View>
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
                    onValueChange={onToggle}
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

// ───────── MAIN COMPONENT ─────────
export default function SettingsScreen() {
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = useMemo(() => makeStyles(colors), [colors]);

    // ───────── STATE ─────────
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
                <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop:25 }]}>Notifications</Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="notifications" title="Push Notifications" description="Receive push notifications on your device" type="toggle" value={notifications.pushEnabled} onToggle={() => toggleNotification('pushEnabled')} />
                    <SettingItem colors={colors} iconName="mail" title="Email Notifications" description="Receive updates via email" type="toggle" value={notifications.emailEnabled} onToggle={() => toggleNotification('emailEnabled')} />
                    <SettingItem colors={colors} iconName="chatbubbles" title="New Messages" description="Get notified when you receive a message" type="toggle" value={notifications.newMessages} onToggle={() => toggleNotification('newMessages')} />
                    <SettingItem colors={colors} iconName="calendar" title="Booking Requests" description="Notifications for new rental requests" type="toggle" value={notifications.bookingRequests} onToggle={() => toggleNotification('bookingRequests')} />
                    <SettingItem colors={colors} iconName="time" title="Reminders" description="Rental return and pickup reminders" type="toggle" value={notifications.reminders} onToggle={() => toggleNotification('reminders')} />
                    <SettingItem colors={colors} iconName="pricetag" title="Promotions" description="Special offers and discounts" type="toggle" value={notifications.promotions} onToggle={() => toggleNotification('promotions')} />
                </View>

                {/* Privacy */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Privacy</Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="eye" title="Profile Visibility" description={`Currently: ${privacy.profileVisibility}`} type="link" onPress={() => handleLinkPress('Profile Visibility')} />
                    <SettingItem colors={colors} iconName="call" title="Show Phone Number" description="Allow others to see your phone number" type="toggle" value={privacy.showPhoneNumber} onToggle={() => togglePrivacy('showPhoneNumber')} />
                    <SettingItem colors={colors} iconName="mail" title="Show Email Address" description="Allow others to see your email" type="toggle" value={privacy.showEmail} onToggle={() => togglePrivacy('showEmail')} />
                    <SettingItem colors={colors} iconName="location" title="Location Sharing" description="Share your location for nearby rentals" type="toggle" value={privacy.locationSharing} onToggle={() => togglePrivacy('locationSharing')} />
                </View>

                {/* Account */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Account</Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="mail" title="Email Address" description={accountInfo.email} type="link" onPress={() => handleLinkPress('Email')} />
                    <SettingItem colors={colors} iconName="call" title="Phone Number" description={accountInfo.phone} type="link" onPress={() => handleLinkPress('Phone')} />
                    <SettingItem colors={colors} iconName="lock-closed" title="Change Password" description="Update your password" type="link" onPress={() => handleLinkPress('Password')} />
                    <SettingItem colors={colors} iconName="card" title="Payment Methods" description="Manage your payment options" type="link" onPress={() => handleLinkPress('Payment')} />
                    <SettingItem colors={colors} iconName="language" title="Language" description="English (US)" type="link" onPress={() => handleLinkPress('Language')} />
                </View>

                {/* Legal */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Legal</Text>
                <View style={styles.settingContainer}>
                    <SettingItem colors={colors} iconName="document-text" title="Terms of Service" description="Read our terms and conditions" type="link" onPress={() => handleLinkPress('Terms')} />
                    <SettingItem colors={colors} iconName="shield-checkmark" title="Privacy Policy" description="How we protect your data" type="link" onPress={() => handleLinkPress('Privacy')} />
                </View>

                {/* Danger Zone */}
                <Text style={[styles.sectionTitle, { color: colors.danger }]}>Danger Zone</Text>
                <View style={styles.settingContainer}>
                    <SettingItem
                        colors={colors}
                        iconName="trash"
                        title="Delete Account"
                        description="Permanently delete all your data"
                        type="button"
                        isDestructive
                        onPress={handleDeleteAccount}
                    />
                </View>

                <Text style={[styles.versionText, { color: colors.textMuted }]}>Version 1.0.0</Text>
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
       paddingVertical:5

    },

    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        marginBottom: 10,
    },

    settingContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 24,
    },

    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    destructiveItem: {
        backgroundColor: colors.logoutBg,
        borderBottomWidth: 0,
    },

    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },



    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 9999,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },

    destructiveIconBox: {
        backgroundColor: colors.logoutBg,
        borderColor: colors.logoutBorder,
    },

    settingTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,

    },

    settingDescription: {
        fontSize: 12,
        color: colors.textMuted,
    },

    switch: {
        transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }],
    },

    versionText: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 10,
        marginBottom: 20,
    },

});