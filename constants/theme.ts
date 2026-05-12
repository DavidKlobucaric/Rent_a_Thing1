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
    primarySecondary: '#FFFFFF',
    success: '#10B981',
    warning: '#EAB308',
    danger: '#EF4444',
    border: '#E6E6E6',
    borderLight: '#BDC9C880',
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
    background: '#1C1C1C',
    surface: '#424242',
    card: '#424242',
    header: '#424242',
    text: '#FFFFFF',
    textSecondary: '#C9C9C9',
    textMuted: '#E6E6E6',
    textInverse: '#1C1C1C',
    primary: '#4DB8C3',
    primarySecondary: '#FFFFFF',
    success: '#10B981',
    warning: '#EAB308',
    danger: '#EF4444',
    border: '#424242',
    borderLight: '#FFFFFF1A',
    placeholder: '#9A9A9A',
    iconCircleBg: '#E7E8E9',
    iconCircleBorder: '#E7E8E9',
    iconColor: '#FFFFFF',
    iconColorInverse: '#FFFFFF',
    menuIconBg: '#E7E8E9',
    tabInactiveBg: '#4E4E4E',
    activeTabBg: '#4DB8C3',
    activeTabText: '#FFFFFF',
    tabText: '#FFFFFF',
    logoutBg: '#EF444433',
    logoutBorder: '#EF444466',
    statBoxBg: '#4E4E4E',
    googleButtonBorder: '#4E4E4E',
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
