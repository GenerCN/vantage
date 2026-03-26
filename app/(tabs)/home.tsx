import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type RootStackParamList = {
  Home: undefined;
  Activity: undefined;
};

type HomeScreenProps = {
  navigation?: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

type Stat = {
  label: string;
  value: string;
  color: string;
  icon: string;
  alert?: boolean;
};

type QuickAction = {
  label: string;
  icon: string;
  bg: string;
  accent: string;
};

type ActivityEntry = {
  id: string;
  title: string;
  time: string;
  badge: string;
  color: string;
  badgeBg: string;
};

// ─── Datos de ejemplo ─────────────────────────────────────────────────────────
const STATS: Stat[] = [
  { label: 'Productos', value: '1,284', color: '#38BDF8', icon: '📦' },
  { label: 'Bajo stock', value: '18',   color: '#F59E0B', icon: '⚠️', alert: true },
  { label: 'Órdenes',   value: '7',     color: '#34D399', icon: '✅' },
];

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Nuevo\nproducto',    icon: '➕', bg: '#d3d7de', accent: '#f83838' },
  { label: 'Buscar\nproducto',   icon: '🔍', bg: '#d3d7de', accent: '#94A3B8' },
];

const RECENT_ACTIVITY: ActivityEntry[] = [
  {
    id: '1',
    title: 'Entrada: Cables HDMI x50',
    time: 'hace 12 min',
    badge: '+50',
    color: '#34D399',
    badgeBg: '#0D2E1E',
  },
  {
    id: '2',
    title: 'Salida: Monitor 27" x3',
    time: 'hace 1 hora',
    badge: '-3',
    color: '#F59E0B',
    badgeBg: '#2D1E06',
  },
  {
    id: '3',
    title: 'Alerta: Teclados inalámbricos',
    time: 'hace 3 horas',
    badge: 'stock bajo',
    color: '#E24B4A',
    badgeBg: '#2D0A0A',
  },
  {
    id: '1',
    title: 'Entrada: Cables HDMI x50',
    time: 'hace 12 min',
    badge: '+50',
    color: '#34D399',
    badgeBg: '#0D2E1E',
  },
  {
    id: '2',
    title: 'Salida: Monitor 27" x3',
    time: 'hace 1 hora',
    badge: '-3',
    color: '#F59E0B',
    badgeBg: '#2D1E06',
  },
  {
    id: '3',
    title: 'Alerta: Teclados inalámbricos',
    time: 'hace 3 horas',
    badge: 'stock bajo',
    color: '#E24B4A',
    badgeBg: '#2D0A0A',
  },
  {
    id: '1',
    title: 'Entrada: Cables HDMI x50',
    time: 'hace 12 min',
    badge: '+50',
    color: '#34D399',
    badgeBg: '#0D2E1E',
  },
  {
    id: '2',
    title: 'Salida: Monitor 27" x3',
    time: 'hace 1 hora',
    badge: '-3',
    color: '#F59E0B',
    badgeBg: '#2D1E06',
  },
  {
    id: '3',
    title: 'Alerta: Dildos Xmax 3000',
    time: 'hace 3 horas',
    badge: 'stock bajo',
    color: '#E24B4A',
    badgeBg: '#2D0A0A',
  },
];

// ─── Componentes internos ─────────────────────────────────────────────────────
type SectionTitleProps = {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
};

const SectionTitle: React.FC<SectionTitleProps> = ({ text, actionLabel, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{text}</Text>
    {actionLabel && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const StatCard: React.FC<Stat> = ({ label, value, color, icon, alert }) => (
  <View style={[styles.statCard, alert && { borderColor: color + '50' }]}>
    {alert && <View style={[styles.alertBar, { backgroundColor: color }]} />}
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color: alert ? color : '#F1F5F9' }]}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

type QuickActionCardProps = QuickAction & { onPress: () => void };

const QuickActionCard: React.FC<QuickActionCardProps> = ({ label, icon, bg, accent, onPress }) => (
  <TouchableOpacity
    style={[styles.actionCard, { backgroundColor: bg }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.actionIconBox, { backgroundColor: accent + '20' }]}>
      <Text style={styles.actionIcon}>{icon}</Text>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

type ActivityItemProps = {
  item: ActivityEntry;
  isFirst: boolean;
  isLast: boolean;
};

const ActivityItem: React.FC<ActivityItemProps> = ({ item, isFirst, isLast }) => (
  <View
    style={[
      styles.activityItem,
      isFirst && styles.activityFirst,
      isLast && styles.activityLast,
    ]}
  >
    <View style={[styles.activityDot, { backgroundColor: item.color }]} />
    <View style={styles.activityInfo}>
      <Text style={styles.activityTitle}>{item.title}</Text>
      <Text style={styles.activityTime}>{item.time}</Text>
    </View>
    <View style={[styles.activityBadge, { backgroundColor: item.badgeBg }]}>
      <Text style={[styles.activityBadgeText, { color: item.color }]}>
        {item.badge}
      </Text>
    </View>
  </View>
);

// ─── Pantalla principal ───────────────────────────────────────────────────────
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
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

        {/* ── Stats ── */}
        <SectionTitle text="Resumen del día" />
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </View>

        {/* ── Acciones rápidas ── */}
        <SectionTitle text="Acciones rápidas" />
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <QuickActionCard
              key={a.label}
              {...a}
              onPress={() => console.log('Acción:', a.label)}
            />
          ))}
        </View>

        {/* ── Actividad reciente ── */}
        <SectionTitle
          text="Movimientos recientes"
          actionLabel="Ver todo"
          onAction={() => navigation?.navigate('Activity')}
        />
        <View style={styles.activityList}>
          {RECENT_ACTIVITY.map((item, i) => (
            <ActivityItem
              key={item.id}
              item={item}
              isFirst={i === 0}
              isLast={i === RECENT_ACTIVITY.length - 1}
            />
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fcfcfc',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.3,
  },
  warehouseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  dateBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#d3d7de',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#d3d7de',
    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: {
    height: 1.0,
    backgroundColor: '#64748B',
    marginBottom: 20,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionAction: {
    fontSize: 11,
    color: '#38BDF8',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#d3d7de',
    borderRadius: 14,
    padding: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  alertBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 3,
    bottom: 0,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  statIcon: {
    fontSize: 14,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 10,
    color: '#000000',
    marginTop: 4,
  },

  // Quick actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  actionLabel: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
    lineHeight: 18,
    flex: 1,
  },

  // Activity
  activityList: {
    gap: 2,
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#d3d7de',
    borderRadius: 4,
  },
  activityFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  activityLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  activityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activityBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
