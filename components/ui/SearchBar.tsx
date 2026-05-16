import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Shadows, T } from '@/constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Buscar...' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={T.textMuted}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.clear}>✕</Text>
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
