import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useLanguage } from '@/src/context/languageContext';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const { t } = useLanguage();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                headerShown: false,
                tabBarButton: HapticTab,
                // Ovdje definiramo stil za cijeli tab bar ako zatreba
                tabBarStyle: {
                    backgroundColor: colors.background, // ili colors.surface ovisno o tvom dizajnu
                }
            }}>

            <Tabs.Screen
                name="home"
                options={{
                    title: t('tabs', 'home'),
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                }}
            />

            <Tabs.Screen
                name="map"
                options={{
                    title: t('tabs', 'map'),
                    tabBarIcon: ({ color }) => <MaterialIcons size={28} name="map" color={color} />,
                }}
            />

            <Tabs.Screen
                name="add"
                options={{
                    title: t('tabs', 'add'),
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{
                            width: 56,
                            height: 56,
                            borderRadius: 9999,
                            backgroundColor: focused ? colors.primary : (colors.surface || colors.background),
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: -30,

                            borderWidth: 1,
                            borderColor: focused ? colors.primary : (colors.border || '#E0E0E0'),

                        }}>
                            <MaterialIcons
                                name="add"
                                size={32}
                                color={focused ? '#FFFFFF' : color}
                            />
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="inbox"
                options={{
                    title: t('tabs', 'inbox'),
                    tabBarIcon: ({ color }) => <MaterialIcons name="mail" size={28} color={color} />,
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tabs', 'profile'),
                    tabBarIcon: ({ color }) => <MaterialIcons name="account-circle" size={28} color={color} />,
                }}
            />
        </Tabs>
    );
}