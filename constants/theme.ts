/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#f59e0b',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#f59e0b',
    amber: '#f59e0b',
    rose: '#f43f5e',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0c0c14',
    tint: '#f59e0b',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#f59e0b',
    amber: '#f59e0b',
    rose: '#f43f5e',
    indigo: '#6366f1',
    emerald: '#10b981',
    surface: '#151718',
    border: 'rgba(255,255,255,0.08)',
  },
  gradients: {
    primary: ['#f59e0b', '#d97706'],
    rose: ['#f43f5e', '#e11d48'],
    indigo: ['#6366f1', '#4f46e5'],
    emerald: ['#10b981', '#059669'],
    surface: ['#1c1c24', '#0c0c14'],
  }
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
