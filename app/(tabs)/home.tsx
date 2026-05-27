import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCard } from '@/components/ui/SectionCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { StatChip } from '@/components/ui/StatChip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlobalStyles, T } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { getMovimientos, downloadMovimientosFromSupabase, type Movimiento } from '@/services/movimientosService';
import { getProductos, downloadProductosFromSupabase } from '@/services/productosService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRelativeTime = (dateStr: string) => {
  try {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'hace un momento';
    if (diffMin < 60) return `hace ${diffMin} min`;
    if (diffHr < 24) return `hace ${diffHr} hora${diffHr > 1 ? 's' : ''}`;
    return `hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
  } catch {
    return 'recientemente';
  }
};

// ─── Sub-componentes locales ──────────────────────────────────────────────────
const QuickActionCard = ({
  label,
  icon,
  bg,
  accent,
  onPress,
}: {
  label: string;
  icon: any;
  bg: string;
  accent: string;
  onPress: () => void;
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#ECEDEE' : T.text;

  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.actionIconBox, { backgroundColor: accent + '20' }]}>
        <IconSymbol name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const ActivityItem = ({
  title,
  time,
  badge,
  color,
  badgeBg,
  isFirst,
  isLast,
}: {
  title: string;
  time: string;
  badge: string;
  color: string;
  badgeBg: string;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const itemBg = isDark ? '#1E2022' : T.surface;
  const separatorColor = isDark ? '#2E3033' : T.separator;
  const titleColor = isDark ? '#ECEDEE' : T.text;
  const timeColor = isDark ? '#9BA1A6' : T.textSecondary;

  return (
    <View
      style={[
        styles.activityItem,
        {
          backgroundColor: itemBg,
          borderTopColor: separatorColor,
          borderTopWidth: isFirst ? 0 : 1,
        },
        isLast && styles.activityLast,
      ]}
    >
      <View style={[styles.activityDot, { backgroundColor: color }]} />
      <View style={styles.activityInfo}>
        <Text style={[styles.activityTitle, { color: titleColor }]}>{title}</Text>
        <Text style={[styles.activityTime, { color: timeColor }]}>{time}</Text>
      </View>
      <View style={[styles.activityBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.activityBadgeText, { color }]}>{badge}</Text>
      </View>
    </View>
  );
};

// ─── Pantalla Principal ────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos locales desde SQLite
  async function loadData() {
    try {
      const prods = await getProductos();
      const movs = await getMovimientos();
      setProducts(prods);
      setMovements(movs);
    } catch (error) {
      console.error('Error cargando datos en Home:', error);
    } finally {
      setLoading(false);
    }
  }

  // Sincronizar datos de Supabase a SQLite y cargar locales
  async function syncAndLoadData() {
    try {
      await downloadProductosFromSupabase();
      await downloadMovimientosFromSupabase();
    } catch (error) {
      console.error('Error sincronizando en Home:', error);
    }
    await loadData();
  }

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    // Carga inicial rápida de SQLite + Sincronización en background
    loadData().then(() => {
      syncAndLoadData();
    });

    const channelProds = supabase
      .channel('home-productos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, async () => {
        console.log('🔄 Cambios de productos en tiempo real detectados en Home');
        await downloadProductosFromSupabase();
        await loadData();
      })
      .subscribe();

    const channelMovs = supabase
      .channel('home-movimientos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historial_movimientos' }, async () => {
        console.log('🔄 Cambios de movimientos en tiempo real detectados en Home');
        await downloadMovimientosFromSupabase();
        await loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelProds);
      supabase.removeChannel(channelMovs);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Mapear producto_id a nombre
  const productoMap = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      map.set(p.id, p.nombre);
    });
    return map;
  }, [products]);

  // Estadísticas del día calculadas dinámicamente
  const stats = useMemo(() => {
    const totalProducts = products.length;
    // stock_minimo actúa como stock actual en nuestro modelo
    const bajoStockCount = products.filter((p) => p.stock_minimo <= 5).length;
    const totalMovements = movements.length;

    return [
      {
        value: totalProducts.toString(),
        label: 'Productos',
        color: T.primary,
        bg: isDark ? '#112F30' : T.primaryLight,
        icon: 'cube.box.fill',
      },
      {
        value: bajoStockCount.toString(),
        label: 'Bajo stock',
        color: T.warning,
        bg: isDark ? '#3E2A00' : T.warningBg,
        icon: 'exclamationmark.triangle',
      },
      {
        value: totalMovements.toString(),
        label: 'Movimientos',
        color: T.success,
        bg: isDark ? '#14331C' : T.successBg,
        icon: 'arrow.right.circle.fill',
      },
    ];
  }, [products, movements, isDark]);

  // Mapear movimientos a elementos de actividad
  const recentActivities = useMemo(() => {
    const sorted = [...movements]
      .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
      .slice(0, 4);

    return sorted.map((m) => {
      const isEntrada = m.tipo_accion === 'ENTRADA';
      const prodName = productoMap.get(m.producto_id) || 'Producto';
      const timeAgo = formatRelativeTime(m.fecha_hora);

      return {
        id: m.id,
        title: `${isEntrada ? 'Entrada' : 'Salida'}: ${prodName} x${m.cantidad}`,
        time: timeAgo,
        badge: isEntrada ? `+${m.cantidad}` : `-${m.cantidad}`,
        color: isEntrada ? T.success : T.danger,
        badgeBg: isEntrada ? T.successBg : T.dangerBg,
      };
    });
  }, [movements, productoMap]);

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const headingColor = isDark ? '#FFF' : T.text;
  const greetingColor = isDark ? '#9BA1A6' : T.textSecondary;
  const dateBadgeBg = isDark ? '#2E3033' : T.surfaceAlt;
  const dateTextColor = isDark ? '#ECEDEE' : T.textSecondary;
  const bellBg = isDark ? '#2E3033' : T.surfaceAlt;
  const dividerColor = isDark ? '#2E3033' : T.border;

  return (
    <SafeAreaView style={[GlobalStyles.screen, { backgroundColor: isDark ? '#151718' : T.bg, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 0 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#151718' : T.bg} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[GlobalStyles.scrollContent, { paddingTop: Platform.OS === 'ios' ? 30 : T.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: greetingColor }]}>Buenos días,</Text>
            <Text style={[styles.warehouseName, { color: headingColor }]}>Almacén Central</Text>
            <View style={[styles.dateBadge, { backgroundColor: dateBadgeBg, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <IconSymbol name="calendar" size={14} color={dateTextColor} />
              <Text style={[styles.dateText, { color: dateTextColor, marginTop: 0 }]}>{today}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.bellBtn, { backgroundColor: bellBg }]}>
            <IconSymbol name="bell.fill" size={20} color={isDark ? '#ECEDEE' : T.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        {/* Stats */}
        <SectionTitle text="Resumen del día" />
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={T.primary} />
          </View>
        ) : (
          <View style={styles.statsRow}>
            {stats.map((s) => (
              <StatChip key={s.label} {...s} />
            ))}
          </View>
        )}

        {/* Acciones rápidas */}
        <SectionTitle text="Acciones rápidas" />
        <View style={styles.actionsGrid}>
          <QuickActionCard
            label="Nuevo producto"
            icon="plus"
            bg={isDark ? '#112F30' : T.primaryLight}
            accent={T.primary}
            onPress={() => router.push({ pathname: '/(tabs)/productos', params: { openModal: 'true' } })}
          />
          <QuickActionCard
            label="Ver todos los productos"
            icon="list.bullet"
            bg={isDark ? '#2E3033' : T.surfaceAlt}
            accent={T.textSecondary}
            onPress={() => router.push('/(tabs)/productos')}
          />
        </View>

        {/* Actividad reciente */}
        <SectionTitle
          text="Movimientos recientes"
          actionLabel="Ver todo"
          onAction={() => router.push('/(tabs)/Movimientos')}
        />
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={T.primary} />
          </View>
        ) : (
          <SectionCard noPadding style={{ borderWidth: isDark ? 1 : 0, borderColor: isDark ? '#2E3033' : 'transparent' }}>
            {recentActivities.length === 0 ? (
              <EmptyState message="Sin movimientos recientes" />
            ) : (
              recentActivities.map((item, i) => (
                <ActivityItem
                  key={item.id}
                  {...item}
                  isFirst={i === 0}
                  isLast={i === recentActivities.length - 1}
                />
              ))
            )}
          </SectionCard>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos locales ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: T.xl, paddingBottom: T.lg },
  greeting: { fontSize: T.fontSm + 1, letterSpacing: 0.3 },
  warehouseName: { fontSize: T.fontXxl, fontWeight: T.weightBold, letterSpacing: -0.5, marginTop: 2 },
  dateBadge: { marginTop: T.sm + 2, alignSelf: 'flex-start', borderRadius: T.radiusSm, paddingVertical: 5, paddingHorizontal: T.sm + 2 },
  dateText: { fontSize: T.fontXs },
  bellBtn: { width: 42, height: 42, borderRadius: T.radiusMd, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, marginBottom: T.xl },
  statsRow: { flexDirection: 'row', gap: T.sm, marginBottom: T.xxl },
  actionsGrid: { flexDirection: 'row', gap: T.sm, marginBottom: T.xxl },
  actionCard: { flex: 1, borderRadius: T.radiusLg, padding: T.md, flexDirection: 'row', alignItems: 'center', gap: T.sm },
  actionIconBox: { width: 36, height: 36, borderRadius: T.radiusMd, alignItems: 'center', justifyContent: 'center' },
  actionIcon: { fontSize: 16 },
  actionLabel: { fontSize: T.fontSm + 1, fontWeight: T.weightMedium, lineHeight: 18, flex: 1 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: T.sm, padding: T.md },
  activityLast: {},
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: T.fontSm, fontWeight: T.weightMedium },
  activityTime: { fontSize: T.fontXs, marginTop: 2 },
  activityBadge: { paddingVertical: 3, paddingHorizontal: T.sm, borderRadius: T.radiusSm },
  activityBadgeText: { fontSize: T.fontXs, fontWeight: T.weightMedium },
  loadingContainer: { paddingVertical: T.xl, alignItems: 'center', justifyContent: 'center' },
});
