import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLanguage } from '@/src/context/languageContext';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const { t } = useLanguage();
    const colors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();


    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifBadge, setShowNotifBadge] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {

                const settingsStr = await AsyncStorage.getItem('@settings_notifications');
                if (settingsStr) {
                    const settings = JSON.parse(settingsStr);
                    setShowNotifBadge(settings.newMessages !== false);
                }


                const countStr = await AsyncStorage.getItem('@app_unread_count');
                if (countStr) setUnreadCount(parseInt(countStr, 10) || 0);
            } catch (e) {}
        };

        loadData();

        const interval = setInterval(loadData, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    paddingBottom: Math.max(insets.bottom, 8) + 4,
                    paddingTop: 8,
                    height: 60 + Math.max(insets.bottom, 8) + 4,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 0.3,
                },
            }}>

            <Tabs.Screen name="home" options={{ title: t('tabs', 'home'), tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} /> }} />
            <Tabs.Screen name="map" options={{ title: t('tabs', 'map'), tabBarIcon: ({ color }) => <MaterialIcons size={28} name="map" color={color} /> }} />

            <Tabs.Screen
                name="add"
                options={{
                    title: t('tabs', 'add'),
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{ width: 56, height: 56, borderRadius: 9999, backgroundColor: focused ? colors.primary : (colors.surface || colors.background), justifyContent: 'center', alignItems: 'center', marginTop: -40, borderWidth: 1, borderColor: focused ? colors.primary : (colors.border || '#E0E0E0') }}>
                            <MaterialIcons name="add" size={32} color={focused ? '#FFFFFF' : color} />
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="inbox"
                options={{
                    title: t('tabs', 'inbox'),
                    tabBarIcon: ({ color }) => <MaterialIcons name="mail" size={28} color={color} />,

                    tabBarBadge: (showNotifBadge && unreadCount > 0) ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: colors.danger,
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: '700',
                        minWidth: 18,
                        height: 18,
                        lineHeight: 18,
                        borderRadius: 9,
                    }
                }}
            />

            <Tabs.Screen name="profile" options={{ title: t('tabs', 'profile'), tabBarIcon: ({ color }) => <MaterialIcons name="account-circle" size={28} color={color} /> }} />
        </Tabs>
    );
}