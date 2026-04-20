import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProductos } from '../context/ProductContext';






export default function HomeScreen() {
  const router = useRouter();
  
  // Guardamos los productos en el "estado" 
  const { productos, eliminarProducto } = useProductos();

  // Función para ELIMINAR
  const confirmarEliminacion = (id: string, nombre: string) => {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`);
      if (confirmar) {
        eliminarProducto(id);
      }
    } else {
      Alert.alert(
        "Eliminar Producto",
        `¿Estás seguro de que deseas eliminar "${nombre}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Eliminar", 
            style: "destructive", 
            onPress: () => eliminarProducto(id) 
          }
        ]
      );
    }
  };
  // Función para EDITAR 
  const handleEditar = (producto: any) => {
    
    router.push({
      pathname: '/modal',
      params: { 
        id: producto.id,
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* --- BOTÓN PARA REGRESAR A BIENVENIDA --- */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
          <TouchableOpacity 
        style={styles.btnVolver} 
        onPress={() => router.replace('/')}
      >
        <Ionicons name="arrow-back-circle-outline" size={20} color="#64748b" />
        <Text style={styles.btnVolverText}> Volver al Inicio</Text>
      </TouchableOpacity>
    </View>
      {/* Encabezado Principal */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Productos</Text>
          <Text style={styles.subtitle}>Gestiona el catálogo de productos del inventario</Text>
        </View>
        <TouchableOpacity 
          style={styles.btnAgregar}
          onPress={() => router.push('/modal')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.btnAgregarText}>Agregar Producto</Text>
        </TouchableOpacity>
      </View>

      {/* Cuadrícula de Tarjetas */}
      <View style={styles.gridContainer}>
        {productos.length === 0 && (
          <Text style={styles.emptyText}>No hay productos en el inventario.</Text>
        )}

        {productos.map((item: any) => {
          const isStockLow = item.stockActual <= item.stockMinimo;

          return (
            <View key={item.id} style={styles.card}>
              
              
              {/* Top de la tarjeta */}
              <View style={styles.cardHeader}>
                <Text style={styles.productName} numberOfLines={1}>{item.nombre}</Text>
                <View style={styles.badgeCategoria}>
                  <Text style={styles.badgeCategoriaText}>{item.categoria}</Text>
                </View>
              </View>
              <Text style={styles.productSku}>SKU: {item.sku}</Text>

              {/* Lista de detalles */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Stock actual:</Text>
                  <View style={[styles.badgeStock, isStockLow ? styles.badgeStockAgotado : styles.badgeStockOk]}>
                    <Text style={[styles.detailValue, isStockLow ? styles.textRed : styles.textGreen]}>
                      {item.stockActual} {item.unidad}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Stock mínimo:</Text>
                  <Text style={styles.detailValue}>{item.stockMinimo} {item.unidad}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Precio:</Text>
                  <Text style={styles.detailValueBold}>${item.precio.toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                </View>

                <View style={{height: 10}} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabelBold}>Valor total:</Text>
                  <Text style={styles.detailValueBlue}>${item.valorTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                </View>
              </View>

              {/* Botones de Editar / Eliminar */}
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.btnEditar} onPress={() => handleEditar(item)}>
                  <Ionicons name="pencil-outline" size={16} color="#374151" />
                  <Text style={styles.btnEditarText}>Editar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.btnEliminar} onPress={() => confirmarEliminacion(item.id, item.nombre)}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>

            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  btnVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9', 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnVolverText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, flexWrap: 'wrap', gap: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4 },
  btnAgregar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000010', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, gap: 8 },
  btnAgregarText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  emptyText: { fontSize: 16, color: '#64748b', fontStyle: 'italic', marginTop: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', flex: 1, minWidth: Platform.OS === 'web' ? 320 : '100%', maxWidth: Platform.OS === 'web' ? 400 : '100%' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 10 },
  badgeCategoria: { borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeCategoriaText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  productSku: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  detailsContainer: { marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  detailLabel: { fontSize: 14, color: '#64748b' },
  detailValue: { fontSize: 14, color: '#334155' },
  detailValueBold: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  detailLabelBold: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  detailValueBlue: { fontSize: 14, fontWeight: 'bold', color: '#2563eb' },
  badgeStock: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeStockOk: { backgroundColor: '#dcfce7' },
  badgeStockAgotado: { backgroundColor: '#fee2e2' },
  textGreen: { color: '#16a34a', fontWeight: '600' },
  textRed: { color: '#dc2626', fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  btnEditar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, gap: 6 },
  btnEditarText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  btnEliminar: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, backgroundColor: '#fffaf8' }
});