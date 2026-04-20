import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type MovementType = "entrada" | "salida";

interface Movement {
  id: string;
  product: string;
  date: string;
  type: MovementType;
  quantity: number;
  user: string;
  notes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (date: Date): string => {
  const day = date.getDate();
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} de ${month}, ${year} ${hours}:${minutes}`;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// ─── Movement Card ────────────────────────────────────────────────────────────

const MovementCard = ({ item }: { item: Movement }) => {
  const isEntrada = item.type === "entrada";
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardProduct}>{item.product}</Text>
        <View style={[styles.badge, isEntrada ? styles.badgeEntrada : styles.badgeSalida]}>
          <Text style={[styles.badgeText, isEntrada ? styles.badgeTextEntrada : styles.badgeTextSalida]}>
            {isEntrada ? "↗ Entrada" : "↙ Salida"}
          </Text>
        </View>
      </View>

      <Text style={styles.cardDate}>{item.date}</Text>

      <View style={styles.cardMeta}>
        <Text style={styles.metaLabel}>
          Cantidad:{" "}
          <Text style={[styles.metaQty, isEntrada ? styles.colorGreen : styles.colorRed]}>
            {isEntrada ? `+${item.quantity}` : `${item.quantity}`}
          </Text>
        </Text>
        <Text style={styles.metaLabel}>
          Usuario: <Text style={styles.metaUser}>{item.user}</Text>
        </Text>
      </View>

      <Text style={styles.cardNotes}>Notas: {item.notes}</Text>
    </View>
  );
};

// ─── Add Movement Modal ───────────────────────────────────────────────────────

interface AddMovementModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (movement: Movement) => void;
}

const EMPTY_FORM = {
  product: "",
  type: "entrada" as MovementType,
  quantity: "",
  user: "",
  notes: "",
};

const AddMovementModal = ({ visible, onClose, onAdd }: AddMovementModalProps) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.product.trim()) newErrors.product = "El producto es requerido";
    if (!form.quantity.trim()) newErrors.quantity = "La cantidad es requerida";
    else if (isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
      newErrors.quantity = "Ingresa un número válido mayor a 0";
    if (!form.user.trim()) newErrors.user = "El usuario es requerido";
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const qty = Number(form.quantity);
    const newMovement: Movement = {
      id: generateId(),
      product: form.product.trim(),
      date: formatDate(new Date()),
      type: form.type,
      quantity: form.type === "salida" ? -qty : qty,
      user: form.user.trim(),
      notes: form.notes.trim() || "Sin notas",
    };

    onAdd(newMovement);
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />

        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Registrar Movimiento</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.modalCloseBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Producto */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Producto *</Text>
              <TextInput
                style={[styles.input, errors.product ? styles.inputError : null]}
                placeholder="Ej. Monitor LG 27 pulgadas"
                placeholderTextColor="#bbbbbb"
                value={form.product}
                onChangeText={(v) => {
                  setForm((p) => ({ ...p, product: v }));
                  if (errors.product) setErrors((e) => ({ ...e, product: "" }));
                }}
              />
              {errors.product ? <Text style={styles.errorText}>{errors.product}</Text> : null}
            </View>

            {/* Tipo */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Tipo de movimiento *</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, form.type === "entrada" && styles.toggleBtnActiveEntrada]}
                  onPress={() => setForm((p) => ({ ...p, type: "entrada" }))}
                >
                  <Text style={[styles.toggleBtnText, form.type === "entrada" && styles.toggleBtnTextActiveEntrada]}>
                    ↗ Entrada
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, form.type === "salida" && styles.toggleBtnActiveSalida]}
                  onPress={() => setForm((p) => ({ ...p, type: "salida" }))}
                >
                  <Text style={[styles.toggleBtnText, form.type === "salida" && styles.toggleBtnTextActiveSalida]}>
                    ↙ Salida
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cantidad */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Cantidad *</Text>
              <TextInput
                style={[styles.input, errors.quantity ? styles.inputError : null]}
                placeholder="Ej. 10"
                placeholderTextColor="#bbbbbb"
                keyboardType="numeric"
                value={form.quantity}
                onChangeText={(v) => {
                  const onlyNumbers = v.replace(/[^0-9]/g, "");
                  setForm((p) => ({ ...p, quantity: onlyNumbers}));
                  if (errors.quantity) setErrors((e) => ({ ...e, quantity: "" }));
                }}
              />
              {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
            </View>

            {/* Usuario */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Usuario *</Text>
              <TextInput
                style={[styles.input, errors.user ? styles.inputError : null]}
                placeholder="Ej. Admin"
                placeholderTextColor="#bbbbbb"
                value={form.user}
                onChangeText={(v) => {
                  setForm((p) => ({ ...p, user: v }));
                  if (errors.user) setErrors((e) => ({ ...e, user: "" }));
                }}
              />
              {errors.user ? <Text style={styles.errorText}>{errors.user}</Text> : null}
            </View>

            {/* Notas */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notas</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Ej. Venta al cliente corporativo ABC"
                placeholderTextColor="#bbbbbb"
                multiline
                numberOfLines={3}
                value={form.notes}
                onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
              <Text style={styles.submitBtnText}>Guardar Movimiento</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MovimientosScreen() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddMovement = (movement: Movement) => {
    // New movements appear at the top of the list
    setMovements((prev) => [movement, ...prev]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Movimientos</Text>
          <Text style={styles.pageSubtitle}>
            Registro de entradas y salidas del inventario
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.ctaBtnText}>＋  Registrar Movimiento</Text>
        </TouchableOpacity>

        {/* History section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⇄</Text>
            <Text style={styles.sectionTitle}>Historial de Movimientos</Text>
          </View>

          {movements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Sin movimientos registrados</Text>
            </View>
          ) : (
            movements.map((item) => <MovementCard key={item.id} item={item} />)
          )}
        </View>
      </ScrollView>

      {/* Modal */}
      <AddMovementModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddMovement}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // ── Page Header
  pageHeader: {
    marginTop: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#888888",
    marginTop: 3,
  },

  // ── CTA Button
  ctaBtn: {
    backgroundColor: "#111111",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  ctaBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // ── Section
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionIcon: {
    fontSize: 18,
    color: "#555555",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
    letterSpacing: -0.2,
  },

  // ── Empty State
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#aaaaaa",
  },

  // ── Movement Card
  card: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingVertical: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cardProduct: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeEntrada: { backgroundColor: "#dcfce7" },
  badgeSalida: { backgroundColor: "#fee2e2" },
  badgeText: { fontSize: 11.5, fontWeight: "600" },
  badgeTextEntrada: { color: "#16a34a" },
  badgeTextSalida: { color: "#dc2626" },
  cardDate: {
    fontSize: 12,
    color: "#aaaaaa",
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 6,
  },
  metaLabel: { fontSize: 13, color: "#555555" },
  metaQty: { fontWeight: "600" },
  metaUser: { fontWeight: "500", color: "#333333" },
  colorGreen: { color: "#16a34a" },
  colorRed: { color: "#dc2626" },
  cardNotes: { fontSize: 12, color: "#888888" },

  // ── Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: "90%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    fontSize: 16,
    color: "#888888",
    fontWeight: "500",
  },

  // ── Form Fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111111",
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: "#dc2626",
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 4,
  },

  // ── Toggle tipo
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  toggleBtnActiveEntrada: {
    backgroundColor: "#dcfce7",
    borderColor: "#16a34a",
  },
  toggleBtnActiveSalida: {
    backgroundColor: "#fee2e2",
    borderColor: "#dc2626",
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888888",
  },
  toggleBtnTextActiveEntrada: {
    color: "#16a34a",
  },
  toggleBtnTextActiveSalida: {
    color: "#dc2626",
  },

  // ── Submit
  submitBtn: {
    backgroundColor: "#111111",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});