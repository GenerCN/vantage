/**
 * AppTheme — Sistema de diseño centralizado para Vantage
 * Paleta: Claro moderno con acento azul pavo (teal #0D9488)
 */

import { Platform, StyleSheet } from 'react-native';

// ─── Paleta de color ──────────────────────────────────────────────────────────

export const Palette = {
  // Acento principal (azul pavo / teal)
  teal50:  '#F0FDFA',
  teal100: '#CCFBF1',
  teal200: '#99F6E4',
  teal500: '#14B8A6',
  teal600: '#0D9488',   // ← color de acento principal
  teal700: '#0F766E',
  teal900: '#134E4A',

  // Grises (Slate)
  slate50:  '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',

  // Blanco / Negro
  white: '#FFFFFF',
  black: '#000000',

  // Estados
  green600: '#16A34A',
  green100: '#DCFCE7',
  amber600: '#D97706',
  amber100: '#FEF3C7',
  red600:   '#DC2626',
  red100:   '#FEE2E2',
  blue600:  '#2563EB',
  blue100:  '#EFF6FF',
};

// ─── Tokens de diseño ─────────────────────────────────────────────────────────

export const T = {
  // Fondos
  bg:         Palette.slate50,
  surface:    Palette.white,
  surfaceAlt: Palette.slate100,

  // Texto
  text:          Palette.slate900,
  textSecondary: Palette.slate500,
  textMuted:     Palette.slate400,

  // Acento
  primary:      Palette.teal600,
  primaryLight: Palette.teal100,
  primaryDark:  Palette.teal700,

  // Estados
  success:    Palette.green600,
  successBg:  Palette.green100,
  warning:    Palette.amber600,
  warningBg:  Palette.amber100,
  danger:     Palette.red600,
  dangerBg:   Palette.red100,
  info:       Palette.blue600,
  infoBg:     Palette.blue100,

  // Bordes
  border:    Palette.slate200,
  separator: Palette.slate100,

  // Radios de esquina
  radiusSm:   8,
  radiusMd:   12,
  radiusLg:   16,
  radiusXl:   20,
  radiusFull: 999,

  // Espaciado
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,

  // Tipografía — tamaños
  fontXs:    11,
  fontSm:    12,
  fontMd:    14,
  fontBase:  15,
  fontLg:    16,
  fontXl:    20,
  fontXxl:   26,
  fontTitle: 32,

  // Tipografía — pesos (cast explícito para StyleSheet)
  weightNormal:  '400' as const,
  weightMedium:  '500' as const,
  weightSemi:    '600' as const,
  weightBold:    '700' as const,
} as const;

// ─── Sombras reutilizables ────────────────────────────────────────────────────

export const Shadows = {
  sm: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
    android: { elevation: 2 },
    default: {},
  })!,
  md: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    android: { elevation: 4 },
    default: {},
  })!,
  lg: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 14 },
    android: { elevation: 8 },
    default: {},
  })!,
};

// ─── Estilos globales compartidos ─────────────────────────────────────────────

export const GlobalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scrollContent: {
    paddingHorizontal: T.lg,
    paddingBottom: 32,
  },
});

// ─── Colors (compatibilidad con expo-router) ──────────────────────────────────

export const Colors = {
  light: {
    text:            Palette.slate900,
    background:      Palette.white,
    tint:            Palette.teal600,
    icon:            Palette.slate500,
    tabIconDefault:  Palette.slate400,
    tabIconSelected: Palette.teal600,
  },
  dark: {
    text:            '#ECEDEE',
    background:      '#151718',
    tint:            Palette.teal500,
    icon:            '#9BA1A6',
    tabIconDefault:  '#9BA1A6',
    tabIconSelected: Palette.teal500,
  },
};

// ─── Fonts (compatibilidad existente) ────────────────────────────────────────

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
