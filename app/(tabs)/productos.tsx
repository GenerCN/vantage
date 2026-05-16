import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';

import { EmptyState }    from '@/components/ui/EmptyState';
import { FilterTabs }    from '@/components/ui/FilterTabs';
import { FormField }     from '@/components/ui/FormField';
import { PageHeader }    from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SearchBar }     from '@/components/ui/SearchBar';
import { SectionCard }   from '@/components/ui/SectionCard';
import { StatChip }      from '@/components/ui/StatChip';
import { GlobalStyles, T } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = 'Electrónica' | 'Accesorios' | 'Periféricos' | 'Cables' | 'Otro';
interface Product { id: string; name: string; sku: string; category: Category; stock: number; minStock: number; price: number }

const CATEGORIES: Category[] = ['Electrónica', 'Accesorios', 'Periféricos', 'Cables', 'Otro'];
const FILTERS = [{ key: 'todos', label: 'Todos' }, { key: 'bajo', label: 'Stock bajo' }, { key: 'agotado', label: 'Agotados' }];

// ─── Data ─────────────────────────────────────────────────────────────────────
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Monitor LG 27"',         sku: 'MON-LG-27',  category: 'Electrónica', stock: 14, minStock: 5,  price: 4200 },
  { id: '2', name: 'Teclado Mecánico',        sku: 'TEC-RED-01', category: 'Periféricos', stock: 3,  minStock: 10, price: 850  },
  { id: '3', name: 'Cable HDMI 2m',           sku: 'CAB-HDM-2M', category: 'Cables',      stock: 52, minStock: 20, price: 120  },
  { id: '4', name: 'Mouse Logitech G305',     sku: 'MOU-LOG-G3', category: 'Periféricos', stock: 8,  minStock: 5,  price: 650  },
  { id: '5', name: 'Audífonos Sony WH-1000',  sku: 'AUD-SON-WH', category: 'Electrónica', stock: 2,  minStock: 4,  price: 5500 },
  { id: '6', name: 'Hub USB-C 7 en 1',        sku: 'HUB-USC-7P', category: 'Accesorios',  stock: 19, minStock: 8,  price: 380  },
  { id: '7', name: 'Webcam Logitech C920',    sku: 'CAM-LOG-C9', category: 'Accesorios',  stock: 0,  minStock: 5,  price: 1900 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).substring(2, 9);

const stockStatus = (p: Product) => {
  if (p.stock === 0)               return { label: 'Sin stock',  color: T.danger,  bg: T.dangerBg };
  if (p.stock <= p.minStock)       return { label: 'Stock bajo', color: T.warning, bg: T.warningBg };
  return                                  { label: 'En stock',   color: T.success, bg: T.successBg };
};

// ─── ProductCard ──────────────────────────────────────────────────────────────
const ProductCard = ({ item }: { item: Product }) => {
  const s = stockStatus(item);
  return (
    <View style={styles.card}>
      <View style={styles.cardIconBox}><Text style={styles.cardIcon}>📦</Text></View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardSku}>{item.sku}</Text>
        <View style={styles.cardTags}>
          <Text style={styles.categoryTag}>{item.category}</Text>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.cardStock, { color: s.color }]}>{item.stock}</Text>
        <Text style={styles.cardStockLabel}>uds.</Text>
        <Text style={styles.cardPrice}>${item.price.toLocaleString()}</Text>
      </View>
    </View>
  );
};

// ─── Modal Agregar Producto ───────────────────────────────────────────────────
const EMPTY = { name: '', sku: '', category: 'Electrónica' as Category, stock: '', minStock: '', price: '' };

const AddProductModal = ({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (p: Product) => void }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof EMPTY) => (val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name = 'El nombre es requerido';
    if (!form.sku.trim())   e.sku  = 'El SKU es requerido';
    if (!form.stock.trim()    || isNaN(Number(form.stock)))    e.stock    = 'Stock inválido';
    if (!form.minStock.trim() || isNaN(Number(form.minStock))) e.minStock = 'Stock mínimo inválido';
    if (!form.price.trim()    || isNaN(Number(form.price)))    e.price    = 'Precio inválido';
    if (Object.keys(e).length) { setErrors(e); return; }
    onAdd({ id: genId(), name: form.name.trim(), sku: form.sku.trim().toUpperCase(), category: form.category, stock: Number(form.stock), minStock: Number(form.minStock), price: Number(form.price) });
    setForm(EMPTY); setErrors({}); onClose();
  };

  const handleClose = () => { setForm(EMPTY); setErrors({}); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Nuevo Producto</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <FormField label="Nombre" value={form.name} onChangeText={set('name')} placeholder="Ej. Monitor LG 27 pulgadas" error={errors.name} required />
            <FormField label="SKU"    value={form.sku}  onChangeText={set('sku')}  placeholder="Ej. MON-LG-27" autoCapitalize="characters" error={errors.sku} required />

            {/* Categoría con chips */}
            <FormField label="Categoría" value="" onChangeText={() => {}} required>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat} style={[styles.chip, form.category === cat && styles.chipActive]} onPress={() => setForm(p => ({ ...p, category: cat }))}>
                      <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </FormField>

            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <FormField label="Stock" value={form.stock} onChangeText={v => set('stock')(v.replace(/[^0-9]/g, ''))} placeholder="0" keyboardType="numeric" error={errors.stock} required />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Stock Mínimo" value={form.minStock} onChangeText={v => set('minStock')(v.replace(/[^0-9]/g, ''))} placeholder="0" keyboardType="numeric" error={errors.minStock} required />
              </View>
            </View>

            <FormField label="Precio (MXN)" value={form.price} onChangeText={v => set('price')(v.replace(/[^0-9.]/g, ''))} placeholder="0.00" keyboardType="numeric" error={errors.price} required />
            <PrimaryButton label="Guardar Producto" onPress={handleSubmit} style={styles.submitBtn} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Pantalla ──────────────────────────────────────────────────────────────────
export default function ProductosScreen() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('todos');
  const [modal, setModal]       = useState(false);

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)); }
    if (filter === 'bajo')    list = list.filter(p => p.stock > 0 && p.stock <= p.minStock);
    if (filter === 'agotado') list = list.filter(p => p.stock === 0);
    return list;
  }, [products, search, filter]);

  const low  = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const out  = products.filter(p => p.stock === 0).length;

  return (
    <SafeAreaView style={GlobalStyles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={GlobalStyles.scrollContent} showsVerticalScrollIndicator={false}>

        <PageHeader title="Productos" subtitle="Gestión de inventario" actionLabel="＋ Nuevo" onAction={() => setModal(true)} />

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatChip value={products.length} label="Total"      color={T.info}    bg={T.infoBg}    />
          <StatChip value={low}             label="Stock bajo" color={T.warning} bg={T.warningBg} />
          <StatChip value={out}             label="Agotados"   color={T.danger}  bg={T.dangerBg}  />
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por nombre o SKU..." />
        <FilterTabs options={FILTERS} active={filter} onSelect={setFilter} />

        <SectionCard>
          <Text style={styles.listCount}>{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</Text>
          {filtered.length === 0
            ? <EmptyState message="Sin productos encontrados" />
            : filtered.map(item => <ProductCard key={item.id} item={item} />)}
        </SectionCard>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AddProductModal visible={modal} onClose={() => setModal(false)} onAdd={p => setProducts(prev => [p, ...prev])} />
    </SafeAreaView>
  );
}

// ─── Estilos locales ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  statsRow:  { flexDirection: 'row', gap: T.sm, marginBottom: T.lg },
  listCount: { fontSize: T.fontSm, color: T.textMuted, fontWeight: T.weightMedium, marginBottom: T.sm },
  // Product card
  card:          { flexDirection: 'row', alignItems: 'center', paddingVertical: T.md, borderTopWidth: 1, borderTopColor: T.separator },
  cardIconBox:   { width: 44, height: 44, borderRadius: T.radiusMd, backgroundColor: T.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: T.md },
  cardIcon:      { fontSize: 20 },
  cardBody:      { flex: 1 },
  cardName:      { fontSize: T.fontMd, fontWeight: T.weightSemi, color: T.text },
  cardSku:       { fontSize: T.fontXs, color: T.textMuted, marginTop: 1 },
  cardTags:      { flexDirection: 'row', alignItems: 'center', gap: T.xs + 2, marginTop: T.xs + 2 },
  categoryTag:   { fontSize: T.fontXs, color: T.textSecondary, backgroundColor: T.surfaceAlt, paddingHorizontal: 7, paddingVertical: 2, borderRadius: T.radiusSm - 2 },
  statusBadge:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: T.radiusSm - 2 },
  statusText:    { fontSize: T.fontXs, fontWeight: T.weightSemi },
  cardRight:     { alignItems: 'flex-end' },
  cardStock:     { fontSize: T.fontXl, fontWeight: T.weightBold },
  cardStockLabel:{ fontSize: T.fontXs, color: T.textMuted },
  cardPrice:     { fontSize: T.fontSm, color: T.textSecondary, marginTop: T.xs },
  // Modal
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:       { backgroundColor: T.surface, borderTopLeftRadius: T.radiusXl, borderTopRightRadius: T.radiusXl, padding: T.xl, paddingBottom: Platform.OS === 'ios' ? 36 : T.xxl, maxHeight: '92%' },
  handle:      { width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginBottom: T.lg },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.xl },
  sheetTitle:  { fontSize: T.fontLg + 2, fontWeight: T.weightBold, color: T.text, letterSpacing: -0.3 },
  closeBtn:    { fontSize: T.fontLg, color: T.textMuted, fontWeight: T.weightMedium },
  submitBtn:   { marginTop: T.sm, marginBottom: T.sm },
  rowFields:   { flexDirection: 'row', gap: T.md },
  chipRow:     { flexDirection: 'row', gap: T.sm },
  chip:        { paddingHorizontal: T.md, paddingVertical: T.sm - 1, borderRadius: T.radiusFull, borderWidth: 1, borderColor: T.border, backgroundColor: T.surfaceAlt },
  chipActive:  { backgroundColor: T.primary, borderColor: T.primary },
  chipText:    { fontSize: T.fontSm + 1, fontWeight: T.weightMedium, color: T.textSecondary },
  chipTextActive: { color: '#fff' },
});
