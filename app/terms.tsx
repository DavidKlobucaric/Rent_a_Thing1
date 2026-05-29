import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/src/context/languageContext';

export default function TermsScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const styles = makeStyles(colors);

    return (
        <SafeAreaView style={styles.container}>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>
                    {t('legal', 'lastUpdated')}: 27.05.2026
                </Text>

                <Section title={t('legal', 'terms1Title')} colors={colors}>
                    <Text style={styles.paragraph}>
                        {t('legal', 'terms1Text')}
                    </Text>
                </Section>

                <Section title={t('legal', 'terms2Title')} colors={colors}>
                    <Text style={styles.paragraph}>
                        {t('legal', 'terms2Text')}
                    </Text>
                </Section>

                <Section title={t('legal', 'terms3Title')} colors={colors}>
                    <Text style={styles.paragraph}>
                        {t('legal', 'terms3Text')}
                    </Text>
                </Section>

                <Section title={t('legal', 'terms4Title')} colors={colors}>
                    <Text style={styles.paragraph}>
                        {t('legal', 'terms4Text')}
                    </Text>
                </Section>

                <Section title={t('legal', 'terms5Title')} colors={colors}>
                    <Text style={styles.paragraph}>
                        {t('legal', 'terms5Text')}
                    </Text>
                </Section>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {t('legal', 'contactUsAt')}: support@rentathing.com
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}


const Section = ({ title, children, colors }: any) => (
    <View style={makeStyles(colors).section}>
        <Text style={makeStyles(colors).sectionTitle}>{title}</Text>
        {children}
    </View>
);

const makeStyles = (colors: typeof Colors.light) => StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.background,
    },


    scroll: {
        flex: 1,
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,

    },

    lastUpdated: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 20,
        textAlign: 'center',
    },

    section: {
        marginBottom: 24,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },

    paragraph: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 23,
    },

    footer: {
        marginTop: 32,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    footerText: {
        fontSize: 13,
        color: colors.textMuted,
        textAlign: 'center',
    },
});