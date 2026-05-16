import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { T } from '@/constants/theme';

interface Props {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionTitle({ text, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{text}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.sm + 2,
  },
  title: {
    fontSize: T.fontXs,
    fontWeight: T.weightSemi,
    color: T.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  action: {
    fontSize: T.fontXs,
    color: T.primary,
    fontWeight: T.weightMedium,
  },
});
