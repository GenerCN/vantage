import React from 'react';
import { KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from 'react-native';
import { T } from '@/constants/theme';

import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Elemento custom debajo del label (ej: chips de categoría) */
  children?: React.ReactNode;
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required,
  keyboardType = 'default',
  multiline,
  numberOfLines,
  autoCapitalize,
  children,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const labelColor = isDark ? '#ECEDEE' : T.text;
  const inputColor = isDark ? '#ECEDEE' : T.text;
  const inputBg = isDark ? '#2E3033' : T.surfaceAlt;
  const borderColor = isDark ? '#3E4145' : T.border;
  const placeholderColor = isDark ? '#7E848C' : T.textMuted;

  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: labelColor }]}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      {children ? (
        children
      ) : (
        <TextInput
          style={[
            styles.input,
            { color: inputColor, backgroundColor: inputBg, borderColor },
            multiline && styles.multiline,
            error ? styles.inputError : null,
          ]}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: T.lg },
  label: {
    fontSize: T.fontSm + 1,
    fontWeight: T.weightSemi,
    color: T.text,
    marginBottom: 6,
  },
  required: { color: T.danger },
  input: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radiusSm,
    paddingHorizontal: T.md,
    paddingVertical: 11,
    fontSize: T.fontMd,
    color: T.text,
    backgroundColor: T.surfaceAlt,
  },
  multiline: { height: 84 },
  inputError: { borderColor: T.danger },
  error: {
    fontSize: T.fontSm,
    color: T.danger,
    marginTop: T.xs,
  },
});
