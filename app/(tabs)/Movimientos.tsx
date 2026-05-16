import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';

import { EmptyState }    from '@/components/ui/EmptyState';
import { FormField }     from '@/components/ui/FormField';
import { PageHeader }    from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionCard }   from '@/components/ui/SectionCard';
import { GlobalStyles, T } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
type MovementType = 'entrada' | 'salida';
interface Movement { id: string; product: string; date: string; type: MovementType; quantity: number; user: string; notes: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d: Date) => {
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d.getDate()} de ${months[d.getMonth()]}, ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};
const genId = () => Math.random().toString(36).substring(2, 9);

// ─── MovementCard ─────────────────────────────────────────────────────────────
const MovementCard = ({ item }: { item: Movement }) => {
  const isEntrada = item.type === 'entrada';
  const color = isEntrada ? T.success : T.danger;
  const bg    = isEntrada ? T.successBg : T.dangerBg;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardProduct}>{item.product}</Text>
        <View style={[styles.badge, { backgroundColor: bg }]}>
          <Text style={[styles.badgeText, { color }]}>{isEntrada ? '↗ Entrada' : '↙ Salida'}</Text>
        </View>
      </View>
      <Text style={styles.cardDate}>{item.date}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.metaLabel}>Cantidad: <Text style={[styles.metaQty, { color }]}>{isEntrada ? `+${item.quantity}` : `${item.quantity}`}</Text></Text>
        <Text style={styles.metaLabel}>Usuario: <Text style={styles.metaUser}>{item.user}</Text></Text>
      </View>
      <Text style={styles.cardNotes}>Notas: {item.notes}</Text>
    </View>
  );
};

// ─── Modal Agregar Movimiento ─────────────────────────────────────────────────
const EMPTY = { product: '', type: 'entrada' as MovementType, quantity: '', user: '', notes: '' };

const AddMovementModal = ({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (m: Movement) => void }) => {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string,string>>({});

  const set = (key: keyof typeof EMPTY) => (val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const handleSubmit = () => {
    const e: Record<string,string> = {};
    if (!form.product.trim()) e.product = 'El producto es requerido';
    if (!form.quantity.trim() || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) e.quantity = 'Ingresa un número válido mayor a 0';
    if (!form.user.trim()) e.user = 'El usuario es requerido';
    if (Object.keys(e).length) { setErrors(e); return; }

    const qty = Number(form.quantity);
    onAdd({ id: genId(), product: form.product.trim(), date: formatDate(new Date()), type: form.type, quantity: form.type === 'salida' ? -qty : qty, user: form.user.trim(), notes: form.notes.trim() || 'Sin notas' });
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
            <Text style={styles.sheetTitle}>Registrar Movimiento</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <FormField label="Producto" value={form.product} onChangeText={set('product')} placeholder="Ej. Monitor LG 27 pulgadas" error={errors.product} required />

            {/* Toggle tipo */}
            <FormField label="Tipo de movimiento" value="" onChangeText={() => {}} required>
              <View style={styles.toggleRow}>
                {(['entrada', 'salida'] as MovementType[]).map(tipo => (
                  <TouchableOpacity key={tipo} style={[styles.toggleBtn, form.type === tipo && (tipo === 'entrada' ? styles.toggleEntrada : styles.toggleSalida)]} onPress={() => setForm(p => ({ ...p, type: tipo }))}>
                    <Text style={[styles.toggleText, form.type === tipo && { color: tipo === 'entrada' ? T.success : T.danger }]}>
                      {tipo === 'entrada' ? '↗ Entrada' : '↙ Salida'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FormField>

            <FormField label="Cantidad" value={form.quantity} onChangeText={v => set('quantity')(v.replace(/[^0-9]/g, ''))} placeholder="Ej. 10" keyboardType="numeric" error={errors.quantity} required />
            <FormField label="Usuario"  value={form.user}     onChangeText={set('user')}     placeholder="Ej. Admin"  error={errors.user} required />
            <FormField label="Notas"    value={form.notes}    onChangeText={set('notes')}    placeholder="Sin notas"  multiline numberOfLines={3} />

            <PrimaryButton label="Guardar Movimiento" onPress={handleSubmit} style={styles.submitBtn} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Pantalla ──────────────────────────────────────────────────────────────────
export default function MovimientosScreen() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={GlobalStyles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={GlobalStyles.scrollContent} showsVerticalScrollIndicator={false}>

        <PageHeader title="Movimientos" subtitle="Registro de entradas y salidas" actionLabel="＋ Registrar" onAction={() => setModalVisible(true)} />

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⇄</Text>
            <Text style={styles.sectionTitle}>Historial de Movimientos</Text>
          </View>
          {movements.length === 0
            ? <EmptyState icon="📋" message="Sin movimientos registrados" hint="Presiona ＋ Registrar para agregar uno" />
            : movements.map(item => <MovementCard key={item.id} item={item} />)}
        </SectionCard>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AddMovementModal visible={modalVisible} onClose={() => setModalVisible(false)} onAdd={m => setMovements(prev => [m, ...prev])} />
    </SafeAreaView>
  );
}

// ─── Estilos locales ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Cards
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: T.sm, marginBottom: T.xs },
  sectionIcon:   { fontSize: 18, color: T.textSecondary },
  sectionTitle:  { fontSize: T.fontLg, fontWeight: T.weightSemi, color: T.text },
  card:          { borderTopWidth: 1, borderTopColor: T.separator, paddingVertical: T.md },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: T.xs },
  cardProduct:   { fontSize: T.fontMd, fontWeight: T.weightSemi, color: T.text, flex: 1, marginRight: T.sm },
  badge:         { paddingHorizontal: T.sm + 2, paddingVertical: 3, borderRadius: T.radiusFull },
  badgeText:     { fontSize: T.fontXs + 0.5, fontWeight: T.weightSemi },
  cardDate:      { fontSize: T.fontSm, color: T.textMuted, marginBottom: T.sm },
  cardMeta:      { flexDirection: 'row', gap: T.xxl, marginBottom: T.xs },
  metaLabel:     { fontSize: T.fontSm + 1, color: T.textSecondary },
  metaQty:       { fontWeight: T.weightSemi },
  metaUser:      { fontWeight: T.weightMedium, color: T.text },
  cardNotes:     { fontSize: T.fontSm, color: T.textMuted },
  // Modal
  overlay:     { flex: 1, justifyContent: 'flex-end' },
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:       { backgroundColor: T.surface, borderTopLeftRadius: T.radiusXl, borderTopRightRadius: T.radiusXl, padding: T.xl, paddingBottom: Platform.OS === 'ios' ? 36 : T.xxl, maxHeight: '90%' },
  handle:      { width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginBottom: T.lg },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.xl },
  sheetTitle:  { fontSize: T.fontLg + 2, fontWeight: T.weightBold, color: T.text, letterSpacing: -0.3 },
  closeBtn:    { fontSize: T.fontLg, color: T.textMuted, fontWeight: T.weightMedium },
  submitBtn:   { marginTop: T.sm, marginBottom: T.sm },
  // Toggle
  toggleRow:     { flexDirection: 'row', gap: T.sm },
  toggleBtn:     { flex: 1, paddingVertical: 10, borderRadius: T.radiusSm, borderWidth: 1, borderColor: T.border, alignItems: 'center', backgroundColor: T.surfaceAlt },
  toggleEntrada: { backgroundColor: T.successBg, borderColor: T.success },
  toggleSalida:  { backgroundColor: T.dangerBg,  borderColor: T.danger },
  toggleText:    { fontSize: T.fontSm + 1, fontWeight: T.weightSemi, color: T.textMuted },
});