/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {

  light: {

    background: '#F8F9FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    header: '#F8F9FA',
    text: '#191C1D',
    textSecondary: '#3E4949',
    textMuted: '#6E7979',
    textInverse: '#FFFFFF',
    primary: '#00646F',
    primarySecondary: '#191C1D',
    success: '#10B981',
    rating: '#EAB308',
    danger: '#EF4444',
    border: '#E6E6E6',
    borderLight: '#E6E6E6',
    placeholder: '#6E7979',
    iconCircleBg: '#E7E8E9',
    iconCircleBorder: '#E6E6E6',
    iconColor: '#3E4949',
    iconColorInverse: '#FFFFFF',
    menuIconBg: '#E7E8E9',
    tabInactiveBg: '#F3F4F5',
    activeTabBg: '#FFFFFF',
    activeTabText: '#FFFFFF',
    tabText: '#3E4949',
    logoutBg: '#FFFBFB',
    logoutBorder: '#FEE2E2',
    statBoxBg: '#F3F4F5',
    googleButtonBorder: '#E6E6E6',
    googleButtonText: '#191C1D',

  },


  dark: {

    background: '#121212',
    surface: '#1E1E1E',
    card: '#232323',
    header: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textMuted: '#A1A1A1',
    textInverse: '#121212',
    primary: '#4DB8C3',
    primarySecondary: '#FFFFFF',
    success: '#10B981',
    rating: '#EAB308',
    danger: '#EF4444',
    border: '#FFFFFF0D',
    borderLight: '#FFFFFF0A',
    placeholder: '#777777',
    iconCircleBg: '#2A2A2A',
    iconCircleBorder: '#FFFFFF0A',
    iconColor: '#FFFFFF',
    iconColorInverse: '#FFFFFF',
    menuIconBg: '#2A2A2A',
    tabInactiveBg: '#1E1E1E',
    activeTabBg: '#4DB8C3',
    activeTabText: '#FFFFFF',
    tabText: '#FFFFFF',
    logoutBg: '#EF44440F',
    logoutBorder: '#EF44441A',
    statBoxBg: '#232323',
    googleButtonBorder: '#FFFFFF0D',
    googleButtonText: '#FFFFFF',

  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
