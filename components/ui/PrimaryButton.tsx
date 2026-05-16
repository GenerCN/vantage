import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { T } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'outline';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, variant = 'primary', style, disabled }: Props) {
  const btnStyle = [
    styles.btn,
    variant === 'danger'  && styles.danger,
    variant === 'outline' && styles.outline,
    disabled              && styles.disabled,
    style,
  ];
  const txtStyle = [
    styles.text,
    variant === 'outline' && styles.outlineText,
    variant === 'danger'  && styles.dangerText,
  ];

  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} activeOpacity={0.85} disabled={disabled}>
      <Text style={txtStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: T.primary,
    borderRadius: T.radiusMd,
    paddingVertical: 14,
    alignItems: 'center',
  },
  danger: {
    backgroundColor: T.danger,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: T.border,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: T.fontBase,
    fontWeight: T.weightSemi,
    letterSpacing: 0.2,
  },
  outlineText: { color: T.text },
  dangerText:  { color: '#fff' },
});
