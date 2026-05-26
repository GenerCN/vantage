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
  View
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { EmptyState } from "@/components/ui/EmptyState";
import { FilterTabs } from "@/components/ui/FilterTabs";
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
  createProducto,
  deleteProductoFromLocalOnly,
  deleteProductoService,
  downloadProductosFromSupabase,
  getProductos,
  getProductoStatistics,
  syncAllPendingChanges,
  updateProductoService,
  type CreateProductoInput,
  type ProductoStats,
} from "@/services/productosService";

// ─── Types ────────────────────────────────────────────────────────────────────
// Interfaz que coincide con Supabase
interface Product {
  id: string;
  nombre: string;
  peso_individual_gramos: number;
  stock_minimo: number;
  creado_en?: string;
}

const CATEGORIES = ["Básico"];
const FILTERS = [{ key: "todos", label: "Todos" }];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const stockStatus = (p: Product) => {
  // Por ahora, simple estado
  return { label: "Registrado", color: T.success, bg: T.successBg };
};

// ─── ProductCard ──────────────────────────────────────────────────────────────
const ProductCard = ({
  item,
  onDelete,
  onEdit,
}: {
  item: Product;
  onDelete: (id: string) => void;
  onEdit?: (product: Product) => void;
}) => {
  const s = stockStatus(item);
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#ECEDEE' : T.text;
  const textSecondaryColor = isDark ? '#9BA1A6' : T.textSecondary;
  const textMutedColor = isDark ? '#7E848C' : T.textMuted;
  const cardIconBoxBg = isDark ? '#2E3033' : T.surfaceAlt;
  const categoryTagBg = isDark ? '#2E3033' : T.surfaceAlt;
  const borderBottomColor = isDark ? '#2E3033' : T.separator;

  return (
    <View style={[styles.card, { borderTopColor: borderBottomColor }]}>
      <View style={[styles.cardIconBox, { backgroundColor: cardIconBoxBg }]}>
        <Text style={styles.cardIcon}>📦</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: textColor }]} numberOfLines={1}>
          {item.nombre}
        </Text>
        <Text style={[styles.cardSku, { color: textMutedColor }]}>{item.peso_individual_gramos}g</Text>
        <View style={styles.cardTags}>
          <Text style={[styles.categoryTag, { color: textSecondaryColor, backgroundColor: categoryTagBg }]}>
            Stock mín: {item.stock_minimo}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>
              {s.label}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.cardPrice, { color: textSecondaryColor }]}>
          {new Date(item.creado_en || "").toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.cardActions}>
        {onEdit && (
          <TouchableOpacity
            onPress={() => onEdit(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.editBtn}>✏️</Text>
          </TouchableOpacity>
        )}
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

// ─── Modales de Producto ──────────────────────────────────────────────────────────
const EMPTY_FORM = { nombre: "", peso_individual_gramos: "", stock_minimo: "" };

interface EditProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (p: Partial<Product>) => Promise<void>;
  product: Product | null;
  isLoading?: boolean;
}

const EditProductModal = ({
  visible,
  onClose,
  onSave,
  product,
  isLoading = false,
}: EditProductModalProps) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        nombre: product.nombre,
        peso_individual_gramos: product.peso_individual_gramos.toString(),
        stock_minimo: product.stock_minimo.toString(),
      });
    }
  }, [product, visible]);

  const set = (key: keyof typeof EMPTY_FORM) => (val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es requerido";
    if (
      !form.peso_individual_gramos.trim() ||
      isNaN(Number(form.peso_individual_gramos))
    )
      e.peso_individual_gramos = "Peso inválido";
    if (!form.stock_minimo.trim() || isNaN(Number(form.stock_minimo)))
      e.stock_minimo = "Stock mínimo inválido";

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        nombre: form.nombre.trim(),
        peso_individual_gramos: Number(form.peso_individual_gramos),
        stock_minimo: Number(form.stock_minimo),
      });
      onClose();
    } catch (error) {
      console.error("Error guardando producto:", error);
      setErrors({ general: "Error al guardar el producto. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const overlayBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)';
  const sheetBg = isDark ? '#1E2022' : T.surface;
  const handleBg = isDark ? '#3E4145' : T.border;
  const textColor = isDark ? '#ECEDEE' : T.text;

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
        <Pressable style={[styles.backdrop, { backgroundColor: overlayBg }]} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
          <View style={[styles.handle, { backgroundColor: handleBg }]} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: textColor }]}>Editar Producto</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={saving}
            >
              <Text style={[styles.closeBtn, isDark && { color: '#9BA1A6' }]}>✕</Text>
            </TouchableOpacity>
          </View>
          {errors.general && (
            <Text style={styles.errorAlert}>{errors.general}</Text>
          )}
          <ScrollView showsVerticalScrollIndicator={false}>
            <FormField
              label="Nombre"
              value={form.nombre}
              onChangeText={set("nombre")}
              placeholder="Ej. Laptop Dell"
              error={errors.nombre}
              required
            />
            <FormField
              label="Peso (gramos)"
              value={form.peso_individual_gramos}
              onChangeText={(v) =>
                set("peso_individual_gramos")(v.replace(/[^0-9.]/g, ""))
              }
              placeholder="Ej. 1500"
              keyboardType="numeric"
              error={errors.peso_individual_gramos}
              required
            />
            <FormField
              label="Stock Mínimo"
              value={form.stock_minimo}
              onChangeText={(v) =>
                set("stock_minimo")(v.replace(/[^0-9]/g, ""))
              }
              placeholder="Ej. 5"
              keyboardType="numeric"
              error={errors.stock_minimo}
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

const AddProductModal = ({
  visible,
  onClose,
  onAdd,
  isLoading = false,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (p: CreateProductoInput) => Promise<void>;
  isLoading?: boolean;
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof EMPTY_FORM) => (val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es requerido";
    if (
      !form.peso_individual_gramos.trim() ||
      isNaN(Number(form.peso_individual_gramos))
    )
      e.peso_individual_gramos = "Peso inválido";
    if (!form.stock_minimo.trim() || isNaN(Number(form.stock_minimo)))
      e.stock_minimo = "Stock mínimo inválido";

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setSaving(true);
    try {
      await onAdd({
        nombre: form.nombre.trim(),
        peso_individual_gramos: Number(form.peso_individual_gramos),
        stock_minimo: Number(form.stock_minimo),
      });
      setForm(EMPTY_FORM);
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error guardando producto:", error);
      setErrors({ general: "Error al guardar el producto. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const overlayBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)';
  const sheetBg = isDark ? '#1E2022' : T.surface;
  const handleBg = isDark ? '#3E4145' : T.border;
  const textColor = isDark ? '#ECEDEE' : T.text;

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
        <Pressable style={[styles.backdrop, { backgroundColor: overlayBg }]} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
          <View style={[styles.handle, { backgroundColor: handleBg }]} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: textColor }]}>Nuevo Producto</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={saving}
            >
              <Text style={[styles.closeBtn, isDark && { color: '#9BA1A6' }]}>✕</Text>
            </TouchableOpacity>
          </View>
          {errors.general && (
            <Text style={styles.errorAlert}>{errors.general}</Text>
          )}
          <ScrollView showsVerticalScrollIndicator={false}>
            <FormField
              label="Nombre"
              value={form.nombre}
              onChangeText={set("nombre")}
              placeholder="Ej. Laptop Dell"
              error={errors.nombre}
              required
            />
            <FormField
              label="Peso (gramos)"
              value={form.peso_individual_gramos}
              onChangeText={(v) =>
                set("peso_individual_gramos")(v.replace(/[^0-9.]/g, ""))
              }
              placeholder="Ej. 1500"
              keyboardType="numeric"
              error={errors.peso_individual_gramos}
              required
            />
            <FormField
              label="Stock Mínimo"
              value={form.stock_minimo}
              onChangeText={(v) =>
                set("stock_minimo")(v.replace(/[^0-9]/g, ""))
              }
              placeholder="Ej. 5"
              keyboardType="numeric"
              error={errors.stock_minimo}
              required
            />
            <PrimaryButton
              label={saving ? "Guardando..." : "Guardar Producto"}
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

// ─── Pantalla Principal ───────────────────────────────────────────────────────
export default function ProductosScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.openModal === "true") {
      setModal(true);
    }
  }, [params.openModal]);

  const [stats, setStats] = useState<ProductoStats>({ total: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingUpdateData, setPendingUpdateData] = useState<{
    productId: string;
    updates: Partial<Product>;
  } | null>(null);

  // Monitorear cambios de conexión
  const networkState = useNetworkState(handleNetworkRestore);

  // Cargar productos al iniciar y suscribirse a cambios en tiempo real
  useEffect(() => {
    loadProductos();

    // Suscribirse a cambios en tiempo real de la tabla productos
    const channel = supabase
      .channel('productos-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'productos',
        },
        (payload) => {
          console.log('🔄 Cambio detectado en productos:', payload);
          console.log('📡 Evento:', payload.eventType);
          // Manejar cambios según el tipo de evento
          handleRealtimeChange(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción Realtime:', status);
      });

    // Limpiar suscripción al desmontar el componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cargar productos desde la base de datos local
  async function loadProductos() {
    try {
      setLoading(true);
      let data = await getProductos();

      // Si no hay productos en SQLite pero hay conexión, descargar de Supabase
      if (data.length === 0) {
        const isConnected = await checkNetworkConnection();
        if (isConnected) {
          console.log("📥 BD local vacía, descargando de Supabase...");
          const downloaded = await downloadProductosFromSupabase();
          if (downloaded) {
            // Recargar desde SQLite después de descargar
            data = await getProductos();
          }
        }
      }

      setProducts(data);

      const productStats = await getProductoStatistics();
      setStats(productStats);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setLoading(false);
    }
  }

  // Manejar eventos Realtime de forma inteligente
  async function handleRealtimeChange(payload: any) {
    const eventType = payload.eventType as string;
    const deletedId = payload.old?.id;

    // Para DELETE: eliminar de SQLite y del estado local
    if (eventType === 'DELETE' && deletedId) {
      console.log(`🗑️ Eliminando producto ${deletedId} por evento Realtime`);
      // Eliminar de SQLite local
      await deleteProductoFromLocalOnly(deletedId);
      // Eliminar del estado React
      setProducts((prev) => prev.filter((p) => p.id !== deletedId));
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      console.log(`✅ Producto ${deletedId} eliminado de SQLite y estado`);
    } else {
      // Para INSERT/UPDATE: descargar desde Supabase
      await loadProductosFromSupabase();
    }
  }

  // Recargar solo desde Supabase (para Realtime)
  async function loadProductosFromSupabase() {
    try {
      console.log("📥 Descargando cambios desde Supabase...");
      const downloaded = await downloadProductosFromSupabase();
      if (downloaded) {
        // Luego recargar desde SQLite para mostrar datos frescos
        const data = await getProductos();
        setProducts(data);
        const productStats = await getProductoStatistics();
        setStats(productStats);
        console.log("✅ Cambios sincronizados desde Supabase");
      }
    } catch (error) {
      console.error("Error sincronizando desde Supabase:", error);
    }
  }

  // Manejar restauración de conexión
  async function handleNetworkRestore() {
    console.log("Sincronizando cambios con Supabase...");
    setSyncing(true);
    try {
      await syncAllPendingChanges();
      // Recargar productos después de sincronizar
      await loadProductos();
    } catch (error) {
      console.error("Error sincronizando:", error);
    } finally {
      setSyncing(false);
    }
  }

  // Agregar producto
  async function handleAddProducto(input: CreateProductoInput) {
    try {
      const newProducto = await createProducto(input);
      if (newProducto) {
        // Agregar al estado local inmediatamente
        setProducts((prev) => [newProducto as Product, ...prev]);
        // Actualizar estadísticas
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
        }));
        console.log("✅ Producto agregado");
      }
    } catch (error) {
      console.error("Error agregando producto:", error);
      throw error;
    }
  }

  // Editar producto
  function handleEditProducto(product: Product) {
    setEditingProduct(product);
    setEditModal(true);
  }

  // Guardar cambios de producto

    // Guardar cambios con confirmación
  async function handleSaveProducto(updates: Partial<Product>) {
    if (!editingProduct) return;

    // Pedir confirmación
    Alert.alert(
      "Confirmar cambios",
      "¿Deseas guardar los cambios en este producto?",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Guardar",
          onPress: () => performSaveProducto(editingProduct.id, updates),
          style: "default",
        },
      ]
    );
  }

  // Realizar guardado después de confirmación
  async function performSaveProducto(
    productId: string,
    updates: Partial<Product>
  ) {
    try {
      const updated = await updateProductoService(productId, updates);
      if (updated) {
        // Actualizar en la lista local
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, ...updates } : p
          )
        );
        setEditModal(false);
        setEditingProduct(null);
        console.log("✅ Producto actualizado");
      }
    } catch (error) {
      console.error("Error actualizando producto:", error);
      throw error;
    }
  }

  // Manejar pull-to-refresh
  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadProductos();
    } catch (error) {
      console.error("Error refrescando productos:", error);
    } finally {
      setRefreshing(false);
    }
  }

  // Eliminar producto
  async function handleDeleteProducto(id: string) {
    try {
      const success = await deleteProductoService(id);
      if (success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
      }
    } catch (error) {
      console.error("Error eliminando producto:", error);
    }
  }

  // Pedir confirmación para eliminar
  function handleDeleteConfirmation(id: string) {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este producto?",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Eliminar",
          onPress: () => handleDeleteProducto(id),
          style: "destructive",
        },
      ]
    );
  }


  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.nombre.toLowerCase().includes(q));
    }
    return list;
  }, [products, search, filter]);

  const statusIcon = !networkState.isConnected ? "📴" : syncing ? "🔄" : "✓";

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
          title="Productos"
          subtitle={`Gestión de inventario ${!networkState.isConnected ? "(sin conexión)" : ""}`}
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
        </View>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre..."
        />
        <FilterTabs options={FILTERS} active={filter} onSelect={setFilter} />

        <SectionCard>
          <View style={styles.listHeader}>
            <Text style={[styles.listCount, { color: isDark ? '#7E848C' : T.textMuted }]}>
              {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
            </Text>
            {syncing && <ActivityIndicator size="small" color={T.primary} />}
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={T.primary} />
              <Text style={styles.loadingText}>Cargando productos...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <EmptyState message="Sin productos encontrados" />
          ) : (
            filtered.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onDelete={handleDeleteConfirmation}
                onEdit={handleEditProducto}
              />
            ))
          )}
        </SectionCard>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AddProductModal
        visible={modal}
        onClose={() => setModal(false)}
        onAdd={handleAddProducto}
        isLoading={loading}
      />
      <EditProductModal
        visible={editModal}
        onClose={() => setEditModal(false)}
        onSave={handleSaveProducto}
        product={editingProduct}
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

  // Stats y lista
  statsRow: { flexDirection: "row", gap: T.sm, marginBottom: T.lg },
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
  loadingText: { fontSize: T.fontSm, color: T.textMuted, marginTop: T.md },

  // Product card
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: T.md,
    borderTopWidth: 1,
    borderTopColor: T.separator,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: T.radiusMd,
    backgroundColor: T.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: T.md,
  },
  cardIcon: { fontSize: 20 },
  cardBody: { flex: 1 },
  cardName: { fontSize: T.fontMd, fontWeight: T.weightSemi, color: T.text },
  cardSku: { fontSize: T.fontXs, color: T.textMuted, marginTop: 1 },
  cardTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.xs + 2,
    marginTop: T.xs + 2,
  },
  categoryTag: {
    fontSize: T.fontXs,
    color: T.textSecondary,
    backgroundColor: T.surfaceAlt,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: T.radiusSm - 2,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: T.radiusSm - 2,
  },
  statusText: { fontSize: T.fontXs, fontWeight: T.weightSemi },
  cardRight: { alignItems: "flex-end", marginRight: T.md },
  cardPrice: { fontSize: T.fontSm, color: T.textSecondary, marginTop: T.xs },
  cardActions: { flexDirection: "row", gap: T.sm },
  editBtn: { fontSize: 18, padding: T.sm },
  deleteBtn: { fontSize: 18, padding: T.sm },

  // Modal
  overlay: { flex: 1, justifyContent: "flex-end" },
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
  submitBtn: { marginTop: T.sm, marginBottom: T.sm },
  rowFields: { flexDirection: "row", gap: T.md },
  chipRow: { flexDirection: "row", gap: T.sm },
  chip: {
    paddingHorizontal: T.md,
    paddingVertical: T.sm - 1,
    borderRadius: T.radiusFull,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surfaceAlt,
  },
  chipActive: { backgroundColor: T.primary, borderColor: T.primary },
  chipText: {
    fontSize: T.fontSm + 1,
    fontWeight: T.weightMedium,
    color: T.textSecondary,
  },
  chipTextActive: { color: "#fff" },
});
