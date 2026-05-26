import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Shadows, T } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Buscar...' }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const containerBg = isDark ? '#1E2022' : T.surface;
  const borderColor = isDark ? '#2E3033' : T.border;
  const textColor = isDark ? '#ECEDEE' : T.text;
  const placeholderColor = isDark ? '#7E848C' : T.textMuted;

  return (
    <View style={[styles.container, { backgroundColor: containerBg, borderColor }]}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.clear, { color: placeholderColor }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: T.radiusMd,
    paddingHorizontal: T.md,
    marginBottom: T.md,
    borderWidth: 1,
    borderColor: T.border,
    ...Shadows.sm,
  },
  icon: { fontSize: 16, marginRight: T.sm },
  input: {
    flex: 1,
    paddingVertical: T.md,
    fontSize: T.fontMd,
    color: T.text,
  },
  clear: {
    color: T.textMuted,
    fontSize: T.fontLg,
  },
});
