import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionCard } from '@/components/ui/SectionCard';
import { Colors, Fonts, T } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authService } from '@/services/authService';

// ─── SettingRow ───────────────────────────────────────────────────────────────
type RowProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  rightText?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (v: boolean) => void;
  onPress?: () => void;
  isLast?: boolean;
  iconBg: string;
  iconColor: string;
};

function SettingRow({ icon, title, subtitle, rightText, hasSwitch, switchValue, onSwitchChange, onPress, isLast, iconBg, iconColor }: RowProps) {
  const rowStyle: StyleProp<ViewStyle> = [styles.row, !isLast && { borderBottomColor: T.separator, borderBottomWidth: 1 }];
  return (
    <Pressable style={rowStyle} onPress={onPress} disabled={!onPress} android_ripple={{ color: '#00000010' }}>
      <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowTextWrap}>
        <ThemedText type="defaultSemiBold" style={styles.rowTitle}>{title}</ThemedText>
        {subtitle ? <ThemedText style={[styles.rowSubtitle, { color: T.textSecondary }]}>{subtitle}</ThemedText> : null}
      </View>
      {hasSwitch ? (
        <Switch value={switchValue} onValueChange={onSwitchChange} trackColor={{ false: T.border, true: iconColor }} thumbColor="#fff" />
      ) : (
        <View style={styles.rowRight}>
          {rightText ? <ThemedText style={{ color: T.textMuted }}>{rightText}</ThemedText> : null}
          <MaterialIcons name="chevron-right" size={20} color={T.textMuted} />
        </View>
      )}
    </Pressable>
  );
}

// ─── Pantalla ──────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette     = Colors[colorScheme];
  const isDark      = colorScheme === 'dark';
  const router      = useRouter();

  const [pushNotif,    setPushNotif]    = useState(true);
  const [emailNotif,   setEmailNotif]   = useState(false);
  const [syncMobile,   setSyncMobile]   = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres salir?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: "destructive",
          onPress: async () => {
            const { error } = await authService.signOut();
            if (error) {
              Alert.alert("Error", "No se pudo cerrar la sesión.");
            } else {
              router.replace("/login");
            }
          }
        }
      ]
    );
  };

  const ui = {
    primary:  isDark ? '#61B4FF'  : T.primary,
    success:  isDark ? '#57D18C'  : T.success,
    danger:   isDark ? '#FF8080'  : T.danger,
    accent:   isDark ? '#C7B7FF'  : '#5E49C8',
    accentBg: isDark ? '#28224A'  : '#E9E4FF',
    primaryBg:isDark ? '#09304A'  : T.primaryLight,
    successBg:isDark ? '#193320'  : T.successBg,
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.pageTitle}>Ajustes</ThemedText>
          <ThemedText style={{ color: T.textSecondary }}>Perfil</ThemedText>
        </View>

        {/* Tarjeta de perfil */}
        <SectionCard style={{ flexDirection: 'row', alignItems: 'center', gap: T.md }}>
          <View style={[styles.avatar, { backgroundColor: ui.primary }]}>
            <ThemedText style={styles.avatarText}>👤</ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" style={styles.profileName}>Mi Perfil</ThemedText>
            <ThemedText style={{ color: T.textSecondary }}>Usuario de Vantage</ThemedText>
          </View>
          <Pressable style={[styles.editBtn, { borderColor: T.border }]}>
            <MaterialIcons name="edit" size={18} color={palette.text} />
          </Pressable>
        </SectionCard>

        {/* General */}
        <SectionCard style={{ paddingVertical: T.sm }}>
          <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts?.rounded }]}>General</ThemedText>
          <SettingRow icon="public" title="Región" subtitle="Latinoamérica" rightText="MX" iconBg={ui.primaryBg} iconColor={ui.primary} />
          <SettingRow icon="sync"   title="Sincronizar con datos móviles" subtitle="Mantén tus datos actualizados" hasSwitch switchValue={syncMobile} onSwitchChange={setSyncMobile} isLast iconBg={ui.primaryBg} iconColor={ui.primary} />
        </SectionCard>

        {/* Notificaciones */}
        <SectionCard style={{ paddingVertical: T.sm }}>
          <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts?.rounded }]}>Notificaciones</ThemedText>
          <SettingRow icon="notifications-active" title="Push" subtitle="Alertas en tiempo real" hasSwitch switchValue={pushNotif} onSwitchChange={setPushNotif} iconBg={ui.successBg} iconColor={ui.success} />
          <SettingRow icon="mail" title="Correo importante" subtitle="Resúmenes semanales y actividad" hasSwitch switchValue={emailNotif} onSwitchChange={setEmailNotif} isLast iconBg={ui.successBg} iconColor={ui.success} />
        </SectionCard>

        {/* Apariencia */}
        <SectionCard style={{ paddingVertical: T.sm }}>
          <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts?.rounded }]}>Apariencia y soporte</ThemedText>
          <SettingRow icon="palette"  title="Tema"            subtitle="Sincronizado con el sistema" rightText="Automático" iconBg={ui.accentBg} iconColor={ui.accent} />
          <SettingRow icon="help"     title="Centro de ayuda" subtitle="Preguntas frecuentes"         rightText="Abrir"      iconBg={ui.accentBg} iconColor={ui.accent} isLast />
        </SectionCard>

        <PrimaryButton
          label="Cerrar sesión"
          onPress={handleLogout}
          variant="outline"
          style={[styles.logoutBtn, { borderColor: ui.danger }]}
        />

      </ScrollView>
    </ThemedView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:       { flex: 1 },
  scrollContent:{ paddingHorizontal: T.lg + 2, paddingTop: T.xxl, paddingBottom: 36, gap: T.md },
  headerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle:    { fontSize: T.fontTitle, fontWeight: T.weightBold },
  avatar:       { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText:   { color: '#fff', fontWeight: T.weightBold, fontSize: T.fontXl },
  profileName:  { lineHeight: 26 },
  editBtn:      { width: 36, height: 36, borderRadius: T.radiusMd, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: T.fontXl, marginVertical: T.sm },
  row:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: T.sm },
  rowIconWrap:  { width: 32, height: 32, borderRadius: T.radiusMd, justifyContent: 'center', alignItems: 'center' },
  rowTextWrap:  { flex: 1, gap: 2 },
  rowTitle:     { fontSize: T.fontBase, lineHeight: 20 },
  rowSubtitle:  { fontSize: T.fontSm + 1, lineHeight: 18 },
  rowRight:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  logoutBtn:    { marginTop: T.xs },
});
