import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKeys } from '../i18n/translations';

const LANGUAGE_KEY = '@app_language';
const SUPPORTED_LANGUAGES: Language[] = ['en', 'hr', 'de', 'zh', 'es', 'fr', 'it'];

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: <S extends keyof TranslationKeys, K extends keyof TranslationKeys[S]>(
        section: S,
        key: K
    ) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('en');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
                if (saved && SUPPORTED_LANGUAGES.includes(saved as Language)) {
                    setLanguageState(saved as Language);
                }
            } catch (e) {
                console.log('Language load error:', e);
            } finally {
                setIsReady(true);
            }
        })();
    }, []);

    const setLanguage = async (lang: Language) => {
        if (!SUPPORTED_LANGUAGES.includes(lang)) return;
        setLanguageState(lang);
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, lang);
        } catch (e) {
            console.log('Language save error:', e);
        }
    };

    const t = <S extends keyof TranslationKeys, K extends keyof TranslationKeys[S]>(
        section: S,
        key: K
    ): string => {
        const sectionDict = (translations[language] as any)?.[section] || (translations.en as any)[section];
        const value = sectionDict?.[key];
        if (typeof value === 'string' && value.length > 0) return value;
        const fallback = (translations.en as any)[section]?.[key];
        return typeof fallback === 'string' ? fallback : String(key);
    };

    if (!isReady) return null;

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
};

export { SUPPORTED_LANGUAGES };