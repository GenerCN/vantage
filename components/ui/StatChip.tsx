import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { T } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Props {
  value: string | number;
  label: string;
  color: string;
  bg: string;
  icon?: any;
}

export function StatChip({ value, label, color, bg, icon }: Props) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {icon ? (
        <IconSymbol name={icon} size={20} color={color} style={{ marginBottom: 4 }} />
      ) : null}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    borderRadius: T.radiusMd,
    padding: T.md,
    alignItems: 'center',
  },
  value: {
    fontSize: T.fontXl,
    fontWeight: T.weightBold,
  },
  label: {
    fontSize: T.fontXs,
    fontWeight: T.weightMedium,
    marginTop: 2,
    textAlign: 'center',
  },
});
