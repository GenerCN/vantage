import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatChip } from "@/components/ui/StatChip";
import { GlobalStyles, T } from "@/constants/theme";
import {
  checkNetworkConnection,
  useNetworkState,
} from "@/hooks/useNetworkState";
import { supabase } from "@/lib/supabase";
import {
  createMovimiento,
  deleteMovimientoFromLocalOnly,
  deleteMovimientoService,
  downloadMovimientosFromSupabase,
  getMovimientos,
  getMovimientosStatistics,
  getStockActual,
  syncAllPendingChanges,
  type CreateMovimientoInput,
  type Movimiento,
  type MovimientosStats,
} from "@/services/movimientosService";
import { getProductos } from "@/services/productosService";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Estante {
  id: string;
  mac_address: string;
  ubicacion_fisica: string;
}

interface Producto {
  id: string;
  nombre: string;
  peso_individual_gramos: number;
  stock_minimo: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d.getDate()} de ${months[d.getMonth()]}, ${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// ─── MovementCard ─────────────────────────────────────────────────────────────
const MovementCard = ({
  item,
  onDelete,
  estanteMap,
  productoMap,
}: {
  item: Movimiento;
  onDelete: (id: string) => void;
  estanteMap: Map<string, string>;
  productoMap: Map<string, string>;
}) => {
  const isEntrada = item.tipo_accion === "ENTRADA";
  const color = isEntrada ? T.success : T.danger;
  const bg = isEntrada ? T.successBg : T.dangerBg;
  const weightText = isEntrada
    ? `+${formatWeight(item.diferencia_peso_gramos)}`
    : `${formatWeight(item.diferencia_peso_gramos)}`;

  const estanteName = item.estante_id
    ? (estanteMap.get(item.estante_id) || `Estante ${item.estante_id.slice(0, 8)}`)
    : "Sin estante";
  const productoName = productoMap.get(item.producto_id) || "Producto desconocido";

  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#ECEDEE' : T.text;
  const textSecondaryColor = isDark ? '#9BA1A6' : T.textSecondary;
  const textMutedColor = isDark ? '#7E848C' : T.textMuted;
  const borderBottomColor = isDark ? '#2E3033' : T.separator;

  return (
    <View style={[styles.card, { borderTopColor: borderBottomColor }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardProduct, { color: textColor }]}>{productoName}</Text>
          <Text style={[styles.cardEstante, { color: textSecondaryColor }]}>{estanteName}</Text>
          <Text style={[styles.cardDate, { color: textMutedColor }]}>{formatDate(item.fecha_hora)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: bg }]}>
          <Text style={[styles.badgeText, { color }]}>
            {isEntrada ? "↗" : "↙"}
          </Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <Text style={[styles.metaLabel, { color: textSecondaryColor }]}>
          Cantidad: <Text style={[styles.metaQty, { color }]}>{isEntrada ? "+" : "-"}{item.cantidad || "?"}</Text>
        </Text>
        <Text style={[styles.metaLabel, { color: textSecondaryColor }]}>
          Peso: <Text style={[styles.metaQty, { color }]}>{weightText}</Text>
        </Text>
        <Text style={[styles.metaLabel, { color: textSecondaryColor }]}>
          Tipo: <Text style={[styles.metaUser, { color: textColor }]}>{isEntrada ? "Entrada" : "Salida"}</Text>
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteBtn}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const formatWeight = (gramos: number) => {
  if (gramos >= 1000) {
    return `${(gramos / 1000).toFixed(2)} kg`;
  }
  return `${gramos.toFixed(0)} g`;
};

// ─── Modal Agregar Movimiento ──────────────────────────────────────────────────
const EMPTY_FORM: {
  estante_id: string;
  producto_id: string;
  tipo_accion: "ENTRADA" | "SALIDA";
  cantidad: string;
} = {
  estante_id: "",
  producto_id: "",
  tipo_accion: "ENTRADA",
  cantidad: "",
};

interface AddMovementModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (m: CreateMovimientoInput) => Promise<void>;
  estantes: Estante[];
  productos: Producto[];
  isLoading?: boolean;
}

const AddMovementModal = ({
  visible,
  onClose,
  onAdd,
  estantes,
  productos,
  isLoading = false,
}: AddMovementModalProps) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [stockDisponible, setStockDisponible] = useState<number | null>(null);
  const [loadingStock, setLoadingStock] = useState(false);

  const set = (key: keyof typeof EMPTY_FORM) => (val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  // Obtener el producto seleccionado para autocompletar peso
  const selectedProduct = useMemo(
    () => productos.find((p) => p.id === form.producto_id),
    [form.producto_id, productos]
  );

  // Verificar stock (global o por estante si estuviera seleccionado)
  useEffect(() => {
    async function checkStock() {
      if (form.producto_id && form.tipo_accion === "SALIDA") {
        setLoadingStock(true);
        try {
          const stock = await getStockActual(form.estante_id, form.producto_id);
          setStockDisponible(stock);
        } catch {
          setStockDisponible(null);
        } finally {
          setLoadingStock(false);
        }
      } else {
        setStockDisponible(null);
      }
    }
    checkStock();
  }, [form.estante_id, form.producto_id, form.tipo_accion]);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    // if (!form.estante_id.trim()) e.estante_id = "Debes seleccionar un estante";
    if (!form.producto_id.trim()) e.producto_id = "Debes seleccionar un producto";
    if (!form.cantidad.trim() || isNaN(Number(form.cantidad)) || Number(form.cantidad) <= 0)
      e.cantidad = "Ingresa un número válido mayor a 0";

    // Validar stock para salidas (sea global o por estante)
    if (form.tipo_accion === "SALIDA" && stockDisponible !== null) {
      const cantidadSolicitada = Number(form.cantidad);
      if (cantidadSolicitada > stockDisponible) {
        e.cantidad = `Stock insuficiente. Disponible: ${stockDisponible} unidades`;
      }
    }

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    if (!selectedProduct) {
      setErrors({ producto_id: "Producto no encontrado" });
      return;
    }

    setSaving(true);
    try {
      await onAdd({
        estante_id: form.estante_id.trim(),
        producto_id: form.producto_id.trim(),
        tipo_accion: form.tipo_accion,
        cantidad: Number(form.cantidad),
        peso_individual_gramos: selectedProduct.peso_individual_gramos,
      });
      setForm(EMPTY_FORM);
      setErrors({});
      onClose();
    } catch (error: any) {
      console.error("Error guardando movimiento:", error);
      const errorMsg = error?.message?.includes("Stock insuficiente")
        ? error.message
        : "Error al guardar movimiento. Intenta de nuevo.";
      setErrors({ general: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Nuevo Movimiento</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={saving}
            >
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {errors.general && (
            <Text style={styles.errorAlert}>{errors.general}</Text>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Toggle tipo */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tipo de Movimiento *</Text>
              <View style={styles.toggleRow}>
                {(["ENTRADA", "SALIDA"] as const).map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.toggleBtn,
                      form.tipo_accion === tipo &&
                        (tipo === "ENTRADA"
                          ? styles.toggleEntrada
                          : styles.toggleSalida),
                    ]}
                    onPress={() => setForm((p) => ({ ...p, tipo_accion: tipo }))}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        form.tipo_accion === tipo && {
                          color:
                            tipo === "ENTRADA"
                              ? T.success
                              : T.danger,
                        },
                      ]}
                    >
                      {tipo === "ENTRADA" ? "↗ Entrada" : "↙ Salida"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Selector de estante deshabilitado por test */}
            {/* 
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Estante {form.estante_id ? "" : "*"}</Text>
              {estantes.length === 0 ? (
                <Text style={styles.emptyListText}>No hay estantes disponibles</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipList}
                >
                  {estantes.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.chip,
                        form.estante_id === s.id && styles.chipActive,
                      ]}
                      onPress={() => {
                        set("estante_id")(s.id);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          form.estante_id === s.id &&
                            styles.chipTextActive,
                        ]}
                      >
                        {s.ubicacion_fisica || `Estante ${s.mac_address.slice(0, 5)}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {errors.estante_id && (
                <Text style={styles.errorText}>{errors.estante_id}</Text>
              )}
            </View>
            */}

            {/* Selector de producto */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Producto {form.producto_id ? "" : "*"}</Text>
              {productos.length === 0 ? (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ No hay productos registrados. Agrega productos primero en la sección de Productos.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.productoList}
                  nestedScrollEnabled
                >
                  {productos.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.productoItem,
                        form.producto_id === p.id && styles.productoItemActive,
                      ]}
                      onPress={() => {
                        set("producto_id")(p.id);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.productoItemName,
                            form.producto_id === p.id && styles.productoItemNameActive,
                          ]}
                        >
                          {p.nombre}
                        </Text>
                        <Text
                          style={[
                            styles.productoItemDetail,
                            form.producto_id === p.id && styles.productoItemDetailActive,
                          ]}
                        >
                          {formatWeight(p.peso_individual_gramos)} por unidad
                        </Text>
                      </View>
                      {form.producto_id === p.id && (
                        <Text style={styles.productoCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {errors.producto_id && (
                <Text style={styles.errorText}>{errors.producto_id}</Text>
              )}
            </View>

            {/* Alerta de stock disponible */}
            {form.tipo_accion === "SALIDA" && form.producto_id && (
              <View style={[styles.infoBox, stockDisponible !== null && stockDisponible <= 0 ? styles.warningInfoBox : null]}>
                <Text style={[styles.infoText, stockDisponible !== null && stockDisponible <= 0 ? styles.warningInfoText : null]}>
                  {loadingStock
                    ? "Consultando stock..."
                    : stockDisponible !== null
                      ? stockDisponible <= 0
                        ? "⚠️ No hay stock disponible para este producto"
                        : `📦 Stock disponible: ${stockDisponible} unidades`
                      : "No se pudo consultar el stock"}
                </Text>
              </View>
            )}

            <FormField
              label="Cantidad (# de unidades)"
              value={form.cantidad}
              onChangeText={(v) =>
                set("cantidad")(v.replace(/[^0-9]/g, ""))
              }
              placeholder="Ej. 5"
              keyboardType="numeric"
              error={errors.cantidad}
              required
            />

            {/* Resumen de peso total */}
            {selectedProduct && form.cantidad ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Peso total: {formatWeight(Number(form.cantidad) * selectedProduct.peso_individual_gramos)}
                  {" "}({form.cantidad} × {formatWeight(selectedProduct.peso_individual_gramos)})
                </Text>
              </View>
            ) : null}

            <PrimaryButton
              label={saving ? "Guardando..." : "Guardar Movimiento"}
              onPress={handleSubmit}
              style={styles.submitBtn}
              disabled={saving || (form.tipo_accion === "SALIDA" && stockDisponible !== null && stockDisponible <= 0)}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Pantalla Principal ───────────────────────────────────────────────────────
export default function MovimientosScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [movements, setMovements] = useState<Movimiento[]>([]);
  const [estantes, setEstantes] = useState<Estante[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [stats, setStats] = useState<MovimientosStats>({
    total: 0,
    entradas: 0,
    salidas: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Mapear estante_id a ubicación
  const estanteMap = useMemo(() => {
    const map = new Map<string, string>();
    estantes.forEach((e) => {
      map.set(e.id, e.ubicacion_fisica || `Estante ${e.mac_address.slice(0, 5)}`);
    });
    return map;
  }, [estantes]);

  // Mapear producto_id a nombre
  const productoMap = useMemo(() => {
    const map = new Map<string, string>();
    productos.forEach((p) => {
      map.set(p.id, p.nombre);
    });
    return map;
  }, [productos]);

  // Monitorear cambios de conexión
  const networkState = useNetworkState(handleNetworkRestore);

  // Cargar movimientos al iniciar y suscribirse a cambios en tiempo real
  useEffect(() => {
    loadMovimientos();
    loadEstantes();
    loadProductos();

    // Suscribirse a cambios en tiempo real de la tabla movimientos
    const channel = supabase
      .channel("historial-movimientos-channel")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "historial_movimientos",
        },
        (payload) => {
          console.log("🔄 Cambio detectado en movimientos:", payload);
          handleRealtimeChange(payload);
        }
      )
      .subscribe((status) => {
        console.log("📡 Estado de suscripción Realtime (movimientos):", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cargar movimientos desde la base de datos local
  async function loadMovimientos() {
    try {
      setLoading(true);

      // Intentar sincronizar y reconciliar con Supabase si hay conexión
      const isConnected = await checkNetworkConnection();
      if (isConnected) {
        console.log("📥 Reconciliando base de datos de movimientos con Supabase...");
        await downloadMovimientosFromSupabase();
      }

      const data = await getMovimientos();
      setMovements(data);

      const stats = await getMovimientosStatistics();
      setStats(stats);
    } catch (error) {
      console.error("Error cargando movimientos:", error);
    } finally {
      setLoading(false);
    }
  }

  // Cargar estantes
  async function loadEstantes() {
    try {
      const { data, error } = await supabase
        .from("estantes")
        .select("id, mac_address, ubicacion_fisica");

      if (error) {
        console.error("Error cargando estantes:", error);
        return;
      }

      setEstantes(data as Estante[]);
    } catch (error) {
      console.error("Error cargando estantes:", error);
    }
  }

  // Cargar productos
  async function loadProductos() {
    try {
      const data = await getProductos();
      setProductos(data as Producto[]);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  }

  // Manejar eventos Realtime
  async function handleRealtimeChange(payload: any) {
    const eventType = payload.eventType as string;
    const deletedId = payload.old?.id;

    if (eventType === "DELETE" && deletedId) {
      console.log(
        `🗑️ Eliminando movimiento ${deletedId} por evento Realtime`
      );
      await deleteMovimientoFromLocalOnly(deletedId);
      setMovements((prev) => prev.filter((m) => m.id !== deletedId));
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } else {
      await loadMovimientosFromSupabase();
    }
  }

  // Recargar desde Supabase
  async function loadMovimientosFromSupabase() {
    try {
      console.log("📥 Descargando cambios de movimientos desde Supabase...");
      const downloaded = await downloadMovimientosFromSupabase();
      if (downloaded) {
        const data = await getMovimientos();
        setMovements(data);
        const stats = await getMovimientosStatistics();
        setStats(stats);
      }
    } catch (error) {
      console.error("Error sincronizando movimientos desde Supabase:", error);
    }
  }

  // Manejar restauración de conexión
  async function handleNetworkRestore() {
    console.log("Sincronizando movimientos con Supabase...");
    setSyncing(true);
    try {
      await syncAllPendingChanges();
      await loadMovimientos();
    } catch (error) {
      console.error("Error sincronizando:", error);
    } finally {
      setSyncing(false);
    }
  }

  // Agregar movimiento
  async function handleAddMovimiento(input: CreateMovimientoInput) {
    try {
      const newMovimiento = await createMovimiento(input);
      if (newMovimiento) {
        setMovements((prev) => [newMovimiento, ...prev]);
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          [input.tipo_accion === "ENTRADA" ? "entradas" : "salidas"]:
            prev[input.tipo_accion === "ENTRADA" ? "entradas" : "salidas"] + 1,
        }));
        console.log("✅ Movimiento agregado");
        // Recargar productos para reflejar cambios en stock
        await loadProductos();
      }
    } catch (error: any) {
      console.error("Error agregando movimiento:", error);
      throw error; // Re-lanzar para que el modal muestre el error
    }
  }

  // Eliminar movimiento
  async function handleDeleteMovimiento(id: string) {
    try {
      const success = await deleteMovimientoService(id);
      if (success) {
        const movimiento = movements.find((m) => m.id === id);
        setMovements((prev) => prev.filter((m) => m.id !== id));
        setStats((prev) => {
          const tipo = movimiento?.tipo_accion === "ENTRADA" ? "entradas" : "salidas";
          return {
            ...prev,
            total: Math.max(0, prev.total - 1),
            [tipo]: Math.max(0, prev[tipo] - 1),
          };
        });
      }
    } catch (error) {
      console.error("Error eliminando movimiento:", error);
    }
  }

  // Confirmación para eliminar
  function handleDeleteConfirmation(id: string) {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este movimiento?",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Eliminar",
          onPress: () => handleDeleteMovimiento(id),
          style: "destructive",
        },
      ]
    );
  }

  // Pull-to-refresh
  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadMovimientos();
      await loadProductos();
    } catch (error) {
      console.error("Error refrescando movimientos:", error);
    } finally {
      setRefreshing(false);
    }
  }

  // Filtrar movimientos
  const filtered = useMemo(() => {
    let list = movements;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          (m.estante_id && estanteMap.get(m.estante_id)?.toLowerCase().includes(q)) ||
          productoMap.get(m.producto_id)?.toLowerCase().includes(q) ||
          m.tipo_accion.toLowerCase().includes(q)
      );
    }
    return list;
  }, [movements, search, estanteMap, productoMap]);

  return (
    <SafeAreaView style={[GlobalStyles.screen, { backgroundColor: isDark ? "#151718" : T.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#151718" : T.bg} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={GlobalStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.primary}
          />
        }
      >
        <PageHeader
          title="Movimientos"
          subtitle={`Historial de entradas y salidas ${
            !networkState.isConnected ? "(sin conexión)" : ""
          }`}
          actionLabel="＋ Nuevo"
          onAction={() => setModal(true)}
        />

        {/* Estado de sincronización */}
        {(!networkState.isConnected || syncing) && (
          <View style={styles.syncStatus}>
            <Text style={styles.syncStatusText}>
              {!networkState.isConnected
                ? "📴 Sin conexión - cambios se guardarán localmente"
                : syncing
                  ? "🔄 Sincronizando cambios..."
                  : ""}
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatChip
            value={stats.total}
            label="Total"
            color={T.info}
            bg={T.infoBg}
          />
          <StatChip
            value={stats.entradas}
            label="Entradas"
            color={T.success}
            bg={T.successBg}
          />
          <StatChip
            value={stats.salidas}
            label="Salidas"
            color={T.danger}
            bg={T.dangerBg}
          />
        </View>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por producto o estante..."
        />

        <SectionCard>
          <View style={styles.listHeader}>
            <Text style={[styles.listCount, { color: isDark ? '#7E848C' : T.textMuted }]}>
              {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
            </Text>
            {syncing && <ActivityIndicator size="small" color={T.primary} />}
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={T.primary} />
              <Text style={styles.loadingText}>Cargando movimientos...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <EmptyState message="Sin movimientos encontrados" />
          ) : (
            filtered.map((item) => (
              <MovementCard
                key={item.id}
                item={item}
                onDelete={handleDeleteConfirmation}
                estanteMap={estanteMap}
                productoMap={productoMap}
              />
            ))
          )}
        </SectionCard>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AddMovementModal
        visible={modal}
        onClose={() => setModal(false)}
        onAdd={handleAddMovimiento}
        estantes={estantes}
        productos={productos}
        isLoading={loading}
      />
    </SafeAreaView>
  );
}

// ─── Estilos locales ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Sincronización
  syncStatus: {
    backgroundColor: T.warningBg,
    borderRadius: T.radiusMd,
    padding: T.md,
    marginBottom: T.md,
  },
  syncStatusText: {
    color: T.warning,
    fontSize: T.fontSm,
    fontWeight: T.weightMedium,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: T.sm,
    marginBottom: T.lg,
  },

  // List
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: T.sm,
  },
  listCount: {
    fontSize: T.fontSm,
    color: T.textMuted,
    fontWeight: T.weightMedium,
  },

  // Loading
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: T.xl * 2,
  },
  loadingText: {
    fontSize: T.fontSm,
    color: T.textMuted,
    marginTop: T.md,
  },

  // Cards
  card: {
    borderTopWidth: 1,
    borderTopColor: T.separator,
    paddingVertical: T.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: T.sm,
  },
  cardProduct: {
    fontSize: T.fontMd,
    fontWeight: T.weightSemi,
    color: T.text,
  },
  cardEstante: {
    fontSize: T.fontSm,
    color: T.textSecondary,
    marginTop: 2,
  },
  cardDate: {
    fontSize: T.fontSm,
    color: T.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.radiusFull,
  },
  badgeText: {
    fontSize: T.fontMd,
    fontWeight: T.weightSemi,
  },
  cardMeta: {
    flexDirection: "row",
    gap: T.lg,
    marginBottom: T.sm,
  },
  metaLabel: {
    fontSize: T.fontSm,
    color: T.textSecondary,
  },
  metaQty: {
    fontWeight: T.weightSemi,
  },
  metaUser: {
    fontWeight: T.weightMedium,
    color: T.text,
  },
  cardNotes: {
    fontSize: T.fontSm,
    color: T.textMuted,
    marginTop: T.xs,
    marginBottom: T.sm,
  },
  cardActions: {
    flexDirection: "row",
    gap: T.sm,
    marginTop: T.sm,
  },
  editBtn: {
    fontSize: 18,
    padding: T.sm,
  },
  deleteBtn: {
    fontSize: 18,
    padding: T.sm,
  },

  // Modal
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: T.surface,
    borderTopLeftRadius: T.radiusXl,
    borderTopRightRadius: T.radiusXl,
    padding: T.xl,
    paddingBottom: Platform.OS === "ios" ? 36 : T.xxl,
    maxHeight: "92%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: T.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: T.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: T.xl,
  },
  sheetTitle: {
    fontSize: T.fontLg + 2,
    fontWeight: T.weightBold,
    color: T.text,
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
    marginBottom: T.md,
  },

  // Form
  formGroup: {
    marginBottom: T.lg,
  },
  formLabel: {
    fontSize: T.fontSm,
    fontWeight: T.weightMedium,
    color: T.text,
    marginBottom: T.sm,
  },
  chipList: {
    marginBottom: T.sm,
  },
  chip: {
    paddingHorizontal: T.md,
    paddingVertical: T.sm,
    borderRadius: T.radiusFull,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surfaceAlt,
    marginRight: T.sm,
  },
  chipActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  chipText: {
    fontSize: T.fontSm,
    fontWeight: T.weightMedium,
    color: T.textSecondary,
  },
  chipTextActive: {
    color: "#fff",
  },
  emptyListText: {
    fontSize: T.fontSm,
    color: T.textMuted,
    fontStyle: "italic",
    paddingVertical: T.sm,
  },

  // Producto selector
  productoList: {
    maxHeight: 180,
    marginBottom: T.sm,
  },
  productoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: T.md,
    paddingVertical: T.sm + 2,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surfaceAlt,
    marginBottom: T.xs,
  },
  productoItemActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  productoItemName: {
    fontSize: T.fontSm,
    fontWeight: T.weightSemi,
    color: T.text,
  },
  productoItemNameActive: {
    color: "#fff",
  },
  productoItemDetail: {
    fontSize: T.fontXs,
    color: T.textMuted,
    marginTop: 1,
  },
  productoItemDetailActive: {
    color: "rgba(255,255,255,0.8)",
  },
  productoCheckmark: {
    fontSize: T.fontLg,
    color: "#fff",
    fontWeight: T.weightBold,
    marginLeft: T.sm,
  },

  // Warning box
  warningBox: {
    backgroundColor: T.warningBg,
    borderRadius: T.radiusMd,
    padding: T.md,
    marginBottom: T.sm,
  },
  warningText: {
    color: T.warning,
    fontSize: T.fontSm,
    fontWeight: T.weightMedium,
  },

  errorText: {
    fontSize: T.fontXs,
    color: T.danger,
    marginTop: T.xs,
  },
  toggleRow: {
    flexDirection: "row",
    gap: T.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: T.radiusSm,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    backgroundColor: T.surfaceAlt,
  },
  toggleEntrada: {
    backgroundColor: T.successBg,
    borderColor: T.success,
  },
  toggleSalida: {
    backgroundColor: T.dangerBg,
    borderColor: T.danger,
  },
  toggleText: {
    fontSize: T.fontSm + 1,
    fontWeight: T.weightSemi,
    color: T.textMuted,
  },
  infoBox: {
    backgroundColor: T.infoBg,
    borderRadius: T.radiusMd,
    padding: T.md,
    marginBottom: T.lg,
  },
  infoText: {
    color: T.info,
    fontSize: T.fontSm,
    fontWeight: T.weightMedium,
    textAlign: "center",
  },
  warningInfoBox: {
    backgroundColor: T.warningBg,
  },
  warningInfoText: {
    color: T.warning,
  },
  submitBtn: {
    marginTop: T.sm,
    marginBottom: T.sm,
  },
});