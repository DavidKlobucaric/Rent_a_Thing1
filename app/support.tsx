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
};

const FAQItem = ({ question, answer, colors }: FAQItemProps) => {
    const [open, setOpen] = useState(false);
    const styles = useMemo(() => makeStyles(colors), [colors]);

    return (
        <TouchableOpacity
            style={styles.faqItem}
            activeOpacity={0.7}
            onPress={() => setOpen((v) => !v)}
        >
            <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{question}</Text>
                <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textSecondary}
                />
            </View>
            {open && (
                <Text style={styles.faqAnswer}>{answer}</Text>
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

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />


            <ScrollView showsVerticalScrollIndicator={false}>

                {/* HERO */}
                <View style={styles.heroBanner}>
                    <Text style={styles.heroTitle}>How can we help?</Text>
                    <Text style={styles.heroSubtitle}>
                        Browse FAQs or reach out to our team directly.
                    </Text>
                </View>

                {/* CONTACT */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <View style={styles.contactGrid}>

                        <TouchableOpacity
                            style={styles.contactCard}
                            activeOpacity={0.7}
                            onPress={() => {}}
                        >
                            <View style={styles.contactIconBox}>
                                <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.primary} />
                            </View>
                            <Text style={styles.contactLabel}>Live Chat</Text>
                            <Text style={styles.contactDetail}>Replies in minutes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactCard}
                            activeOpacity={0.7}
                            onPress={() => Linking.openURL('mailto:support@rentathing.com')}
                        >
                            <View style={styles.contactIconBox}>
                                <Ionicons name="mail-outline" size={28} color={colors.primary} />
                            </View>
                            <Text style={styles.contactLabel}>Email Us</Text>
                            <Text style={styles.contactDetail}>support@rentathing.com</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactCard}
                            activeOpacity={0.7}
                            onPress={() => Linking.openURL('tel:+1800000000')}
                        >
                            <View style={styles.contactIconBox}>
                                <Ionicons name="call-outline" size={28} color={colors.primary} />
                            </View>
                            <Text style={styles.contactLabel}>Call Us</Text>
                            <Text style={styles.contactDetail}>Mon–Fri, 9am–6pm</Text>
                        </TouchableOpacity>

                    </View>
                </View>

                {/* FAQ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    <View style={styles.faqContainer}>
                        {faqs.map((faq) => (
                            <FAQItem
                                key={faq.id}
                                question={faq.question}
                                answer={faq.answer}
                                colors={colors}
                            />
                        ))}
                    </View>
                </View>

                {/* FOOTER */}
                <View style={styles.footerNote}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} />
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


        heroBanner: {
            paddingHorizontal: 24,
            paddingVertical: 14,
        },


        heroTitle: {
            fontSize: 22,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 6,
        },

        heroSubtitle: {
            fontSize: 16,
            color: colors.textSecondary,
            marginBottom: 8,
            lineHeight: 20,
        },

        section: {
            paddingHorizontal: 16,
            marginBottom: 24,
        },

        sectionTitle: {
            fontSize: 13,
            fontWeight: '700',
            color: colors.primary,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            marginBottom: 12,
        },

        contactGrid: {
            flexDirection: 'row',
            gap: 10,
        },

        contactCard: {
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            alignItems: 'center',
            gap: 6,
        },

        contactIconBox: {
            width: 44,
            height: 44,
            borderRadius: 9999,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4,
        },

        contactLabel: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.text,
            textAlign: 'center',
        },

        contactDetail: {
            fontSize: 11,
            color: colors.textMuted,
            textAlign: 'center',
        },

        faqContainer: {
            gap: 10,
        },

        faqItem: {
            backgroundColor: colors.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
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

        faqAnswer: {
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 10,
            lineHeight: 20,
        },

        footerNote: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingBottom: 32,
            paddingHorizontal: 24,
        },

        footerNoteText: {
            fontSize: 12,
            color: colors.textMuted,
        },
    });