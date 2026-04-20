/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#F97316';
const tintColorDark = '#FFF8F0';

export const Colors = {
  light: {
    text: '#181A18',
    background: '#FFF8F0',
    tint: tintColorLight,
    icon: '#6B7280', // Gray 500
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    surface: '#FFF8F0',
    surfaceElevated: '#FFF8F0', // Creamy white for cards
    border: '#E5E5E5', // Neutral border
    mutedText: '#6B7280',
    success: '#10B981', // Emerald 500
    warning: '#F59E0B',
    accent: '#F97316', // Orange 500
    chip: '#F97316',
  },
  dark: {
    text: '#FAFAFA', // Neutral 50
    background: '#181A18', // Softer black
    tint: '#F97316',
    icon: '#A3A3A3', // Neutral 400
    tabIconDefault: '#737373', // Neutral 500
    tabIconSelected: '#F97316',
    surface: '#1F211F', // Slightly lighter than background
    surfaceElevated: '#262826', // Even lighter for elevated surfaces
    border: '#404040', // Neutral 700 - more visible
    mutedText: '#A3A3A3', // Neutral 400
    success: '#10B981',
    warning: '#FBBF24',
    accent: '#F97316',
    chip: '#F97316',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24, // Wider spacing
  xxl: 32,
  xxxl: 48,
};

export const Radii = {
  sm: 6,
  md: 12,
  lg: 20, // More rounded, friendly
  xl: 28,
  pill: 999,
};

export const Shadows = {
  light: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8, // Softer dispersion
      elevation: 2,
    },
    floating: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  dark: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8, // Tighter in dark mode
      elevation: 3,
    },
    floating: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 10,
    },
  },
  // Legacy: For backwards compatibility, also export the light shadows at root level
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
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
