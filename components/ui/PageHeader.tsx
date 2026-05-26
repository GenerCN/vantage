import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { T } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  title: string;
  subtitle?: string;
  /** Texto del botón derecho */
  actionLabel?: string;
  onAction?: () => void;
  /** Elemento custom en el lado derecho (sobreescribe actionLabel) */
  rightElement?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actionLabel, onAction, rightElement }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const titleColor = isDark ? '#ECEDEE' : T.text;
  const subtitleColor = isDark ? '#9BA1A6' : T.textSecondary;
  const btnBg = isDark ? '#ECEDEE' : T.text;
  const btnText = isDark ? '#151718' : '#fff';

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text> : null}
      </View>

      {rightElement ? (
        rightElement
      ) : actionLabel ? (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: btnBg }]} onPress={onAction} activeOpacity={0.8}>
          <Text style={[styles.actionText, { color: btnText }]}>{actionLabel}</Text>
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
    marginTop: T.xl,
    marginBottom: T.lg,
  },
  left: { flex: 1, marginRight: T.sm },
  title: {
    fontSize: T.fontXxl,
    fontWeight: T.weightBold,
    color: T.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: T.fontSm,
    color: T.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: T.text,
    borderRadius: T.radiusMd,
    paddingVertical: 9,
    paddingHorizontal: T.lg,
  },
  actionText: {
    color: '#fff',
    fontSize: T.fontMd,
    fontWeight: T.weightSemi,
  },
});
