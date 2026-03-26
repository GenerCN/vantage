import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type RowProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  rightText?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  isLast?: boolean;
  iconBg: string;
  iconColor: string;
  textMuted: string;
  separatorColor: string;
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
  textMuted,
  separatorColor,
}: RowProps) {
  const rowStyle: StyleProp<ViewStyle> = [
    styles.row,
    !isLast && { borderBottomColor: separatorColor, borderBottomWidth: 1 },
  ];

  return (
    <Pressable
      style={rowStyle}
      onPress={onPress}
      disabled={!onPress}
      android_ripple={{ color: "#00000010" }}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={18} color={iconColor} />
      </View>

      <View style={styles.rowTextWrap}>
        <ThemedText type="defaultSemiBold" style={styles.rowTitle}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText style={[styles.rowSubtitle, { color: textMuted }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#B9C2CC", true: iconColor }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <View style={styles.rowRightWrap}>
          {rightText ? (
            <ThemedText style={{ color: textMuted }}>{rightText}</ThemedText>
          ) : null}
          <MaterialIcons name="chevron-right" size={20} color={textMuted} />
        </View>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const palette = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [syncOnMobileData, setSyncOnMobileData] = useState(true);
  const [faceIdLogin, setFaceIdLogin] = useState(true);
  const [showActivityStatus, setShowActivityStatus] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  const ui = {
    card: isDark ? "#1D232B" : "#F7F9FC",
    cardStrong: isDark ? "#24303D" : "#EAF3FF",
    stroke: isDark ? "#2F3A46" : "#DFE5EE",
    muted: isDark ? "#A5AFB8" : "#5A6673",
    primary: isDark ? "#61B4FF" : "#0A7EA4",
    success: isDark ? "#57D18C" : "#159A58",
    danger: isDark ? "#FF8080" : "#C73A3A",
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTopRow}>
          <ThemedText type="title" style={styles.pageTitle}>
            Ajustes
          </ThemedText>
          <ThemedText style={{ color: ui.muted }}>Perfil</ThemedText>
        </View>

        <View
          style={[
            styles.profileCard,
            { backgroundColor: ui.cardStrong, borderColor: ui.stroke },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: ui.primary }]}>
            <ThemedText style={styles.avatarText}>GA</ThemedText>
          </View>

          <View style={styles.profileInfo}>
            <ThemedText type="subtitle" style={styles.profileName}>
              Gener Admin
            </ThemedText>
            <ThemedText style={{ color: ui.muted }}>
              gener@example.com
            </ThemedText>
          </View>

          <Pressable style={[styles.editButton, { borderColor: ui.stroke }]}>
            <MaterialIcons name="edit" size={18} color={palette.text} />
          </Pressable>
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: ui.card, borderColor: ui.stroke },
          ]}
        >
          <ThemedText style={styles.sectionTitle}>General</ThemedText>
          <SettingRow
            icon="public"
            title="Región"
            subtitle="Latinoamérica"
            rightText="MX"
            iconBg={isDark ? "#09304A" : "#D9EDF9"}
            iconColor={ui.primary}
            textMuted={ui.muted}
            separatorColor={ui.stroke}
          />
          <SettingRow
            icon="sync"
            title="Sincronizar con datos móviles"
            subtitle="Mantén tus datos actualizados fuera de Wi-Fi"
            hasSwitch
            switchValue={syncOnMobileData}
            onSwitchChange={setSyncOnMobileData}
            isLast
            iconBg={isDark ? "#09304A" : "#D9EDF9"}
            iconColor={ui.primary}
            textMuted={ui.muted}
            separatorColor={ui.stroke}
          />
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: ui.card, borderColor: ui.stroke },
          ]}
        >
          <ThemedText style={styles.sectionTitle}>Notificaciones</ThemedText>
          <SettingRow
            icon="notifications-active"
            title="Push"
            subtitle="Alertas en tiempo real"
            hasSwitch
            switchValue={pushNotifications}
            onSwitchChange={setPushNotifications}
            iconBg={isDark ? "#193320" : "#DEF5E7"}
            iconColor={ui.success}
            textMuted={ui.muted}
            separatorColor={ui.stroke}
          />
          <SettingRow
            icon="mail"
            title="Correo importante"
            subtitle="Resumenes semanales y actividad"
            hasSwitch
            switchValue={emailNotifications}
            onSwitchChange={setEmailNotifications}
            iconBg={isDark ? "#193320" : "#DEF5E7"}
            iconColor={ui.success}
            textMuted={ui.muted}
            separatorColor={ui.stroke}
          />
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: ui.card, borderColor: ui.stroke },
          ]}
        >
          <ThemedText style={styles.sectionTitle}>
            Apariencia y soporte
          </ThemedText>
          <SettingRow
            icon="palette"
            title="Tema"
            subtitle="Sincronizado con el sistema"
            rightText="Automático"
            iconBg={isDark ? "#28224A" : "#E9E4FF"}
            iconColor={isDark ? "#C7B7FF" : "#5E49C8"}
            textMuted={ui.muted}
            separatorColor={ui.stroke}
          />
          <SettingRow
            icon="help"
            title="Centro de ayuda"
            subtitle="Preguntas frecuentes y soporte"
            rightText="Abrir"
            iconBg={isDark ? "#28224A" : "#E9E4FF"}
            iconColor={isDark ? "#C7B7FF" : "#5E49C8"}
            textMuted={ui.muted}
            separatorColor={ui.stroke}
            isLast
          />
        </View>

        <Pressable
          style={[
            styles.logoutButton,
            {
              borderColor: ui.danger,
              backgroundColor: isDark ? "#2A1B1B" : "#FFF2F2",
            },
          ]}
        >
          <MaterialIcons name="logout" size={18} color={ui.danger} />
          <ThemedText style={[styles.logoutText, { color: ui.danger }]}>
            Cerrar sesión
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 36,
    gap: 16,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: {
    fontFamily: Fonts.rounded,
    fontSize: 34,
  },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 20,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    lineHeight: 26,
  },
  planBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planBadgeText: {
    fontWeight: "700",
    fontSize: 12,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.rounded,
    fontSize: 20,
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    gap: 10,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rowTextWrap: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowRightWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  logoutText: {
    fontWeight: "700",
  },
});
