import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { T } from '@/constants/theme';

export interface FilterOption {
  key: string;
  label: string;
}

interface Props {
  options: FilterOption[];
  active: string;
  onSelect: (key: string) => void;
}

export function FilterTabs({ options, active, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.tab, active === opt.key && styles.tabActive]}
            onPress={() => onSelect(opt.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, active === opt.key && styles.tabTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginBottom: T.lg },
  row: { flexDirection: 'row', gap: T.sm },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: T.md + 2,
    borderRadius: T.radiusFull,
    backgroundColor: T.surfaceAlt,
  },
  tabActive: { backgroundColor: T.primary },
  tabText: {
    fontSize: T.fontSm + 1,
    fontWeight: T.weightMedium,
    color: T.textSecondary,
  },
  tabTextActive: { color: '#fff' },
});
