import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Linking,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const faqs = [
    {
        id: '1',
        question: 'How do I rent an item?',
        answer:
            'Browse items, tap one you like, choose your rental dates and confirm. The owner will approve your request and you can arrange pickup.',
    },
    {
        id: '2',
        question: 'What if an item is damaged?',
        answer:
            'All rentals include basic damage protection. Report any damage within 24 hours of return through the app and our team will assist you.',
    },
    {
        id: '3',
        question: 'How do I list my own item?',
        answer:
            'Tap the "+" button on the home screen, fill in the details, set your price and availability, then publish. It usually goes live within minutes.',
    },
    {
        id: '4',
        question: 'When will I receive my payment?',
        answer:
            'Payouts are processed 24 hours after the rental period ends and transferred to your linked bank account within 3–5 business days.',
    },
    {
        id: '5',
        question: 'Can I cancel a rental?',
        answer:
            'Yes. Cancellations made 48+ hours before the rental start are fully refunded. Later cancellations may incur a small fee per our cancellation policy.',
    },
];

type FAQItemProps = {
    question: string;
    answer: string;
    colors: typeof Colors.light;
    isLast?: boolean;
};

const FAQItem = ({ question, answer, colors, isLast = false }: FAQItemProps) => {
    const [open, setOpen] = useState(false);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    return (
        <TouchableOpacity
            style={[
                styles.faqItem,
                !isLast && styles.faqItemBorder,
                open && styles.faqItemOpen,
            ]}
            activeOpacity={0.7}
            onPress={() => setOpen((v) => !v)}
        >
            <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, open && styles.faqQuestionOpen]}>
                    {question}
                </Text>
                <View style={[styles.faqIconBox, open && styles.faqIconBoxOpen]}>
                    <Ionicons
                        name={open ? 'remove' : 'add'}
                        size={18}
                        color={open ? colors.iconColorInverse : colors.primary}
                    />
                </View>
            </View>
            {open && (
                <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{answer}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export default function SupportScreen() {
    const router = useRouter();
    const scheme = useColorScheme() ?? 'light';
    const colors = Colors[scheme];
    const isDark = scheme === 'dark';
    const styles = useMemo(() => makeStyles(colors), [colors]);

    const contactOptions = [
        {
            icon: 'chatbubble-ellipses-outline' as const,
            label: 'Live Chat',
            detail: 'Replies in minutes',
            onPress: () => router.push('/inbox'),
        },
        {
            icon: 'mail-outline' as const,
            label: 'Email Us',
            detail: 'support@rentathing.com',
            onPress: () => Linking.openURL('mailto:support@rentathing.com'),
        },
        {
            icon: 'call-outline' as const,
            label: 'Call Us',
            detail: 'Mon–Fri, 9am–6pm',
            onPress: () => Linking.openURL('tel:+1800000000'),
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={[ 'left', 'right']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />


            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ─── HERO ─── */}
                <View style={styles.heroBanner}>
                    <View style={styles.heroIconBox}>
                        <Ionicons name="help-circle" size={32} color={colors.iconColorInverse} />
                    </View>
                    <Text style={styles.heroTitle}>How can we help?</Text>
                    <Text style={styles.heroSubtitle}>
                        Browse FAQs below or reach out to our support team directly.
                    </Text>
                </View>

                {/* ─── CONTACT OPTIONS ─── */}
                <Text style={styles.sectionTitle}>Contact Us</Text>
                <View style={styles.contactCard}>
                    {contactOptions.map((option, index) => (
                        <TouchableOpacity
                            key={option.label}
                            style={[
                                styles.contactRow,
                                index < contactOptions.length - 1 && styles.contactRowBorder,
                            ]}
                            activeOpacity={0.7}
                            onPress={option.onPress}
                        >
                            <View style={styles.contactIconBox}>
                                <Ionicons
                                    name={option.icon}
                                    size={22}
                                    color={colors.primary}
                                />
                            </View>
                            <View style={styles.contactTextContainer}>
                                <Text style={styles.contactLabel}>{option.label}</Text>
                                <Text style={styles.contactDetail} numberOfLines={1}>
                                    {option.detail}
                                </Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color={colors.textMuted}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ─── FAQ ─── */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                <View style={styles.faqContainer}>
                    {faqs.map((faq, index) => (
                        <FAQItem
                            key={faq.id}
                            question={faq.question}
                            answer={faq.answer}
                            colors={colors}
                            isLast={index === faqs.length - 1}
                        />
                    ))}
                </View>

                {/* ─── FOOTER ─── */}
                <View style={styles.footerNote}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                    <Text style={styles.footerNoteText}>
                        Your data is always kept private and secure.
                    </Text>
                </View>
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
            paddingBottom: 40,
        },


        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
        },

        backButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },

        headerTitle: {
            fontSize: 17,
            fontWeight: '700',
            color: colors.text,
        },


        heroBanner: {
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 28,
            paddingBottom: 24,
        },

        heroIconBox: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },

        heroTitle: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
            letterSpacing: -0.3,
            marginBottom: 8,
            textAlign: 'center',
        },

        heroSubtitle: {
            fontSize: 15,
            color: colors.textSecondary,
            lineHeight: 21,
            textAlign: 'center',
            maxWidth: 320,
        },

        sectionTitle: {
            fontSize: 12,
            fontWeight: '700',
            color: colors.textMuted,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            marginHorizontal: 20,
            marginBottom: 10,
            marginTop: 8,
        },


        contactCard: {
            marginHorizontal: 20,
            marginBottom: 24,
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
        },

        contactRow: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
        },

        contactRowBorder: {
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },

        contactIconBox: {
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: colors.primary + '15',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,


        },

        contactTextContainer: {
            flex: 1,
            gap: 2,
        },

        contactLabel: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
        },

        contactDetail: {
            fontSize: 13,
            color: colors.textMuted,
        },


        faqContainer: {
            marginHorizontal: 20,
            marginBottom: 24,
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
        },

        faqItem: {
            paddingHorizontal: 16,
            paddingVertical: 16,
        },

        faqItemBorder: {
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },

        faqItemOpen: {
            backgroundColor: colors.primary + '08',
        },

        faqHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
        },

        faqQuestion: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
            flex: 1,
        },

        faqQuestionOpen: {
            color: colors.primary,
        },

        faqIconBox: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.primary + '15',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.primary + '30',
        },

        faqIconBoxOpen: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },

        faqAnswerContainer: {
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },

        faqAnswer: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 21,
        },


        footerNote: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingHorizontal: 20,
            paddingVertical: 16,
            marginTop: 8,
        },

        footerNoteText: {
            fontSize: 13,
            color: colors.textMuted,
        },
    });