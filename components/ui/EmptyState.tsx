import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { T } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Props {
  icon?: any;
  message: string;
  hint?: string;
}

export function EmptyState({ icon = 'inbox', message, hint }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <IconSymbol name={icon} size={36} color={isDark ? '#5A6069' : T.textMuted} style={styles.icon} />
      <Text style={[styles.message, { color: isDark ? '#A1A6AF' : T.textMuted }]}>{message}</Text>
      {hint ? <Text style={[styles.hint, { color: isDark ? '#7E848C' : T.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: T.xxl + T.sm,
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    marginBottom: T.sm,
  },
  message: {
    fontSize: T.fontMd,
    fontWeight: T.weightMedium,
    textAlign: 'center',
  },
  hint: {
    fontSize: T.fontSm,
    marginTop: T.xs,
    textAlign: 'center',
    paddingHorizontal: T.lg,
  },
});
