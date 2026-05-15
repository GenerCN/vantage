import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCard } from '@/components/ui/SectionCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { StatChip } from '@/components/ui/StatChip';
import { GlobalStyles, T } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
type RootStackParamList = { Home: undefined; Activity: undefined };
type HomeScreenProps = { navigation?: NativeStackNavigationProp<RootStackParamList, 'Home'> };

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '1,284', label: 'Productos', color: T.primary,  bg: T.primaryLight, icon: '📦' },
  { value: '18',    label: 'Bajo stock', color: T.warning,  bg: T.warningBg,    icon: '⚠️' },
  { value: '7',     label: 'Órdenes',   color: T.success,  bg: T.successBg,    icon: '✅' },
];

const QUICK_ACTIONS = [
  { label: 'Nuevo\nproducto',  icon: '➕', bg: T.primaryLight, accent: T.primary },
  { label: 'Buscar\nproducto', icon: '🔍', bg: T.surfaceAlt,   accent: T.textSecondary },
];

const RECENT_ACTIVITY = [
  { id: '1', title: 'Entrada: Cables HDMI x50',        time: 'hace 12 min',  badge: '+50',       color: T.success, badgeBg: T.successBg },
  { id: '2', title: 'Salida: Monitor 27" x3',          time: 'hace 1 hora',  badge: '-3',        color: T.warning, badgeBg: T.warningBg },
  { id: '3', title: 'Alerta: Teclados inalámbricos',   time: 'hace 3 horas', badge: 'stock bajo', color: T.danger,  badgeBg: T.dangerBg },
  { id: '4', title: 'Entrada: Hub USB-C x20',          time: 'hace 5 horas', badge: '+20',       color: T.success, badgeBg: T.successBg },
];

// ─── Sub-componentes locales ──────────────────────────────────────────────────
const QuickActionCard = ({ label, icon, bg, accent, onPress }: typeof QUICK_ACTIONS[0] & { onPress: () => void }) => (
  <TouchableOpacity style={[styles.actionCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.actionIconBox, { backgroundColor: accent + '20' }]}>
      <Text style={styles.actionIcon}>{icon}</Text>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const ActivityItem = ({ item, isFirst, isLast }: { item: typeof RECENT_ACTIVITY[0]; isFirst: boolean; isLast: boolean }) => (
  <View style={[styles.activityItem, isFirst && styles.activityFirst, isLast && styles.activityLast]}>
    <View style={[styles.activityDot, { backgroundColor: item.color }]} />
    <View style={styles.activityInfo}>
      <Text style={styles.activityTitle}>{item.title}</Text>
      <Text style={styles.activityTime}>{item.time}</Text>
    </View>
    <View style={[styles.activityBadge, { backgroundColor: item.badgeBg }]}>
      <Text style={[styles.activityBadgeText, { color: item.color }]}>{item.badge}</Text>
    </View>
  </View>
);

// ─── Pantalla ──────────────────────────────────────────────────────────────────
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={GlobalStyles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={GlobalStyles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Buenos días,</Text>
            <Text style={styles.warehouseName}>Almacén Central</Text>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>📅  {today}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Stats */}
        <SectionTitle text="Resumen del día" />
        <View style={styles.statsRow}>
          {STATS.map((s) => <StatChip key={s.label} {...s} />)}
        </View>

        {/* Acciones rápidas */}
        <SectionTitle text="Acciones rápidas" />
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <QuickActionCard key={a.label} {...a} onPress={() => {}} />
          ))}
        </View>

        {/* Actividad reciente */}
        <SectionTitle text="Movimientos recientes" actionLabel="Ver todo" onAction={() => navigation?.navigate('Activity')} />
        <SectionCard noPadding>
          {RECENT_ACTIVITY.length === 0
            ? <EmptyState message="Sin movimientos recientes" />
            : RECENT_ACTIVITY.map((item, i) => (
                <ActivityItem key={item.id} item={item} isFirst={i === 0} isLast={i === RECENT_ACTIVITY.length - 1} />
              ))}
        </SectionCard>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

// ─── Estilos locales (solo lo que no puede venir del tema) ────────────────────
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: T.xl, paddingBottom: T.lg },
  greeting:      { fontSize: T.fontSm + 1, color: T.textSecondary, letterSpacing: 0.3 },
  warehouseName: { fontSize: T.fontXxl, fontWeight: T.weightBold, color: T.text, letterSpacing: -0.5, marginTop: 2 },
  dateBadge: { marginTop: T.sm + 2, alignSelf: 'flex-start', backgroundColor: T.surfaceAlt, borderRadius: T.radiusSm, paddingVertical: 5, paddingHorizontal: T.sm + 2 },
  dateText:  { fontSize: T.fontXs, color: T.textSecondary },
  bellBtn:   { width: 42, height: 42, borderRadius: T.radiusMd, backgroundColor: T.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  divider:   { height: 1, backgroundColor: T.border, marginBottom: T.xl },
  statsRow:  { flexDirection: 'row', gap: T.sm, marginBottom: T.xxl },
  actionsGrid: { flexDirection: 'row', gap: T.sm, marginBottom: T.xxl },
  actionCard:    { flex: 1, borderRadius: T.radiusLg, padding: T.md, flexDirection: 'row', alignItems: 'center', gap: T.sm },
  actionIconBox: { width: 36, height: 36, borderRadius: T.radiusMd, alignItems: 'center', justifyContent: 'center' },
  actionIcon:    { fontSize: 16 },
  actionLabel:   { fontSize: T.fontSm + 1, color: T.text, fontWeight: T.weightMedium, lineHeight: 18, flex: 1 },
  activityItem:  { flexDirection: 'row', alignItems: 'center', gap: T.sm, padding: T.md, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.separator },
  activityFirst: { borderTopWidth: 0 },
  activityLast:  {},
  activityDot:   { width: 8, height: 8, borderRadius: 4 },
  activityInfo:  { flex: 1 },
  activityTitle: { fontSize: T.fontSm, color: T.text, fontWeight: T.weightMedium },
  activityTime:  { fontSize: T.fontXs, color: T.textSecondary, marginTop: 2 },
  activityBadge: { paddingVertical: 3, paddingHorizontal: T.sm, borderRadius: T.radiusSm },
  activityBadgeText: { fontSize: T.fontXs, fontWeight: T.weightMedium },
});
