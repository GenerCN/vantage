import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Shadows, T } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Sin padding interno (útil para listas con bordes propios) */
  noPadding?: boolean;
}

export function SectionCard({ children, style, noPadding }: Props) {
  return (
    <View style={[styles.card, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.surface,
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
