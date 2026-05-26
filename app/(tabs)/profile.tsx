import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FormField } from '@/components/ui/FormField';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionCard } from '@/components/ui/SectionCard';
import { Colors, Fonts, T } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/authService';
import { perfilService, type Perfil } from '@/services/perfilService';

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

function SettingRow({
  icon,
  title,
  subtitle,
  rightText,
  hasSwitch,
  switchValue,
  onSwitchChange,
  onPress,
  isLast,
  iconBg,
  iconColor,
}: RowProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const separatorColor = isDark ? '#2E3033' : T.separator;
  const textSecondaryColor = isDark ? '#9BA1A6' : T.textSecondary;
  const textMutedColor = isDark ? '#7E848C' : T.textMuted;
  const borderColor = isDark ? '#2E3033' : T.border;

  const rowStyle: StyleProp<ViewStyle> = [
    styles.row,
    !isLast && { borderBottomColor: separatorColor, borderBottomWidth: 1 },
  ];

  return (
    <Pressable
      style={rowStyle}
      onPress={onPress}
      disabled={!onPress}
      android_ripple={{ color: isDark ? '#ffffff10' : '#00000010' }}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowTextWrap}>
        <ThemedText type="defaultSemiBold" style={styles.rowTitle}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText style={[styles.rowSubtitle, { color: textSecondaryColor }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: borderColor, true: iconColor }}
          thumbColor="#fff"
        />
      ) : (
        <View style={styles.rowRight}>
          {rightText ? (
            <ThemedText style={{ color: textMutedColor, marginRight: 4 }}>
              {rightText}
            </ThemedText>
          ) : null}
          <MaterialIcons name="chevron-right" size={20} color={textMutedColor} />
        </View>
      )}
    </Pressable>
  );
}

// ─── Modal Editar Perfil ──────────────────────────────────────────────────────
interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (fullName: string) => Promise<void>;
  currentFullName: string;
}

const EditProfileModal = ({
  visible,
  onClose,
  onSave,
  currentFullName,
}: EditProfileModalProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [fullName, setFullName] = useState(currentFullName);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setFullName(currentFullName);
      setError("");
    }
  }, [currentFullName, visible]);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setError("El nombre completo es requerido");
      return;
    }
    setSaving(true);
    try {
      await onSave(fullName.trim());
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const overlayBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)';
  const sheetBg = isDark ? '#1E2022' : T.surface;
  const borderStyle = isDark ? { borderBottomColor: '#2E3033', borderBottomWidth: 1 } : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={[styles.backdrop, { backgroundColor: overlayBg }]} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
          <View style={styles.handle} />
          <View style={[styles.sheetHeader, borderStyle]}>
            <Text style={[styles.sheetTitle, { color: isDark ? '#FFF' : '#000' }]}>
              Editar Perfil
            </Text>
            <TouchableOpacity onPress={onClose} disabled={saving} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorAlert}>{error}</Text> : null}

          <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%', marginTop: T.md }}>
            <FormField
              label="Nombre Completo"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (error) setError("");
              }}
              placeholder="Ej. Juan Pérez"
              required
            />
            <PrimaryButton
              label={saving ? "Guardando..." : "Guardar Cambios"}
              onPress={handleSubmit}
              style={styles.submitBtn}
              disabled={saving}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Pantalla Principal ────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [userEmail, setUserEmail] = useState<string>("Cargando...");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);

  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [syncMobile, setSyncMobile] = useState(true);

  useEffect(() => {
    loadPerfilData();
  }, []);

  async function loadPerfilData() {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || "Usuario de Vantage");
        setUsername(user.user_metadata?.username || "");
        try {
          const profile = await perfilService.getPerfilActual(user.id);
          setPerfil(profile as Perfil);
        } catch (error) {
          console.warn("No se encontró perfil creado. Creando uno inicial...");
          const newProfile: Perfil = {
            id: user.id,
            nombre_completo: user.user_metadata?.full_name || "Mi Perfil",
            role_id: user.user_metadata?.role_id ? parseInt(user.user_metadata.role_id) : 4,
          };
          const created = await perfilService.upsertPerfil(newProfile);
          setPerfil(created as Perfil);
        }
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateProfile = async (fullName: string) => {
    if (!perfil) return;
    try {
      const updatedProfile = {
        ...perfil,
        nombre_completo: fullName,
      };
      const result = await perfilService.upsertPerfil(updatedProfile);
      if (result) {
        setPerfil(result as Perfil);
        Alert.alert("Éxito", "Perfil actualizado correctamente.");
      }
    } catch (error: any) {
      console.error("Error actualizando perfil:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que quieres salir?", [
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
        },
      },
    ]);
  };

  const ui = {
    primary: isDark ? '#14B8A6' : T.primary,
    success: isDark ? '#16A34A' : T.success,
    danger: isDark ? '#DC2626' : T.danger,
    accent: isDark ? '#C7B7FF' : '#5E49C8',
    accentBg: isDark ? '#28224A' : '#E9E4FF',
    primaryBg: isDark ? '#112F30' : T.primaryLight,
    successBg: isDark ? '#14331C' : T.successBg,
  };

  const textSecondaryTheme = isDark ? '#9BA1A6' : T.textSecondary;
  const borderTheme = isDark ? '#2E3033' : T.border;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.pageTitle}>
            Ajustes
          </ThemedText>
          <ThemedText style={{ color: textSecondaryTheme }}>Perfil</ThemedText>
        </View>

        {loading ? (
          <SectionCard style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={ui.primary} />
            <ThemedText style={{ marginTop: T.md, color: textSecondaryTheme }}>
              Cargando tu información...
            </ThemedText>
          </SectionCard>
        ) : (
          /* Tarjeta de perfil */
          <SectionCard style={{ flexDirection: 'row', alignItems: 'center', gap: T.md }}>
            <View style={[styles.avatar, { backgroundColor: ui.primary }]}>
              <ThemedText style={styles.avatarText}>👤</ThemedText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="subtitle" style={styles.profileName}>
                {perfil?.nombre_completo || "Mi Perfil"}
              </ThemedText>
              {username ? (
                <ThemedText style={{ color: textSecondaryTheme, fontSize: T.fontSm + 1 }}>
                  @{username}
                </ThemedText>
              ) : null}
              <ThemedText style={{ color: textSecondaryTheme, fontSize: T.fontSm + 1 }}>
                Rol: {(perfil as any)?.roles?.nombre || "Empleado"}
              </ThemedText>
              <ThemedText style={{ color: textSecondaryTheme, fontSize: T.fontSm + 1 }}>
                {userEmail}
              </ThemedText>
            </View>
            <Pressable
              style={[styles.editBtn, { borderColor: borderTheme }]}
              onPress={() => setEditModal(true)}
              android_ripple={{ color: isDark ? '#ffffff20' : '#00000010' }}
            >
              <MaterialIcons name="edit" size={18} color={palette.text} />
            </Pressable>
          </SectionCard>
        )}

        {/* General */}
        <SectionCard style={{ paddingVertical: T.sm }}>
          <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts?.rounded }]}>
            General
          </ThemedText>
          <SettingRow
            icon="public"
            title="Región"
            subtitle="Latinoamérica"
            rightText="MX"
            iconBg={ui.primaryBg}
            iconColor={ui.primary}
          />
          <SettingRow
            icon="sync"
            title="Sincronizar con datos móviles"
            subtitle="Mantén tus datos actualizados"
            hasSwitch
            switchValue={syncMobile}
            onSwitchChange={setSyncMobile}
            isLast
            iconBg={ui.primaryBg}
            iconColor={ui.primary}
          />
        </SectionCard>

        {/* Notificaciones */}
        <SectionCard style={{ paddingVertical: T.sm }}>
          <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts?.rounded }]}>
            Notificaciones
          </ThemedText>
          <SettingRow
            icon="notifications-active"
            title="Push"
            subtitle="Alertas en tiempo real"
            hasSwitch
            switchValue={pushNotif}
            onSwitchChange={setPushNotif}
            iconBg={ui.successBg}
            iconColor={ui.success}
          />
          <SettingRow
            icon="mail"
            title="Correo importante"
            subtitle="Resúmenes semanales y actividad"
            hasSwitch
            switchValue={emailNotif}
            onSwitchChange={setEmailNotif}
            isLast
            iconBg={ui.successBg}
            iconColor={ui.success}
          />
        </SectionCard>

        {/* Apariencia */}
        <SectionCard style={{ paddingVertical: T.sm }}>
          <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts?.rounded }]}>
            Apariencia y soporte
          </ThemedText>
          <SettingRow
            icon="palette"
            title="Tema"
            subtitle="Sincronizado con el sistema"
            rightText={isDark ? "Modo Oscuro" : "Modo Claro"}
            iconBg={ui.accentBg}
            iconColor={ui.accent}
          />
          <SettingRow
            icon="help"
            title="Centro de ayuda"
            subtitle="Preguntas frecuentes"
            rightText="Abrir"
            iconBg={ui.accentBg}
            iconColor={ui.accent}
            isLast
          />
        </SectionCard>

        <PrimaryButton
          label="Cerrar sesión"
          onPress={handleLogout}
          variant="outline"
          style={[styles.logoutBtn, { borderColor: ui.danger }]}
          textColor={ui.danger}
        />

        <EditProfileModal
          visible={editModal}
          onClose={() => setEditModal(false)}
          onSave={handleUpdateProfile}
          currentFullName={perfil?.nombre_completo || ""}
        />
      </ScrollView>
    </ThemedView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    paddingHorizontal: T.lg + 2,
    paddingTop: Platform.OS === 'ios' ? 70 : 55,
    paddingBottom: 36,
    gap: T.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: T.xs,
  },
  pageTitle: { fontSize: T.fontTitle, fontWeight: T.weightBold },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: T.weightBold, fontSize: T.fontXl },
  profileName: { lineHeight: 26 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: T.fontXl, marginVertical: T.sm, fontWeight: T.weightBold },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: T.sm,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: T.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTextWrap: { flex: 1, gap: 2 },
  rowTitle: { fontSize: T.fontBase, lineHeight: 20 },
  rowSubtitle: { fontSize: T.fontSm + 1, lineHeight: 18 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  logoutBtn: { marginTop: T.xs },

  // Estilos de modal
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: T.radiusXl,
    borderTopRightRadius: T.radiusXl,
    padding: T.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : T.xxl,
    maxHeight: '92%',
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: T.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: T.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingBottom: T.sm,
  },
  sheetTitle: {
    fontSize: T.fontLg + 2,
    fontWeight: T.weightBold,
    letterSpacing: -0.3,
  },
  closeBtn: {
    fontSize: T.fontLg,
    color: T.textMuted,
    fontWeight: T.weightMedium,
  },
  errorAlert: {
    backgroundColor: T.dangerBg,
    color: T.danger,
    padding: T.md,
    borderRadius: T.radiusMd,
    fontSize: T.fontSm,
    marginTop: T.sm,
    width: '100%',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: T.md,
    marginBottom: T.sm,
    width: '100%',
  },
});
