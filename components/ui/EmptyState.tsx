import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { T } from '@/constants/theme';

interface Props {
  icon?: string;
  message: string;
  hint?: string;
}

export function EmptyState({ icon = '📭', message, hint }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: T.xxl + T.sm,
    alignItems: 'center',
  },
  icon: {
    fontSize: 36,
    marginBottom: T.sm,
  },
  message: {
    fontSize: T.fontMd,
    color: T.textMuted,
    fontWeight: T.weightMedium,
  },
  hint: {
    fontSize: T.fontSm,
    color: T.textMuted,
    marginTop: T.xs,
    textAlign: 'center',
  },
});
