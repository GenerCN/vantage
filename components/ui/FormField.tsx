import React from 'react';
import { KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from 'react-native';
import { T } from '@/constants/theme';

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
  return (
    <View style={styles.group}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      {children ? (
        children
      ) : (
        <TextInput
          style={[
            styles.input,
            multiline && styles.multiline,
            error ? styles.inputError : null,
          ]}
          placeholder={placeholder}
          placeholderTextColor={T.textMuted}
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
