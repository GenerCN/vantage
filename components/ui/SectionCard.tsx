import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Shadows, T } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Sin padding interno (útil para listas con bordes propios) */
  noPadding?: boolean;
}

export function SectionCard({ children, style, noPadding }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const cardStyle = {
    backgroundColor: isDark ? '#1E2022' : T.surface,
    borderColor: isDark ? '#2E3033' : T.border,
    borderWidth: isDark ? 1 : 0,
  };

  return (
    <View style={[styles.card, cardStyle, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: T.radiusLg,
    padding: T.lg,
    marginBottom: T.lg,
    ...Shadows.md,
  },
  noPadding: {
    padding: 0,
    overflow: 'hidden',
  },
});
