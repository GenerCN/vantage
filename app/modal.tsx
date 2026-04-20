import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useProductos } from './context/ProductContext';

export default function AgregarProductoModal() {
  const router = useRouter();
  //  ID
  const { id } = useLocalSearchParams();

  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState('');
  const [categoria, setCategoria] = useState('');
  const [stockActual, setStockActual] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [unidad, setUnidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [pesoUnidad, setPesoUnidad] = useState(''); 
  
  const [mensajeError, setMensajeError] = useState('');
  
  //  lista de productos y la función de editar
  const { productos, agregarProducto, editarProducto } = useProductos();

  //  Llena los datos si hay un ID
  useEffect(() => {
    if (id) {
      const productoAEditar = productos.find((p: any) => p.id === id);
      if (productoAEditar) {
        setNombre(productoAEditar.nombre || '');
        setSku(productoAEditar.sku || '');
        setCategoria(productoAEditar.categoria || '');
        setStockActual(productoAEditar.stockActual?.toString() || '');
        setStockMinimo(productoAEditar.stockMinimo?.toString() || '');
        setUnidad(productoAEditar.unidad || '');
        setPrecio(productoAEditar.precio?.toString() || '');
        setPesoUnidad(productoAEditar.pesoUnidad?.toString() || '');
      }
    }
  }, [id, productos]);

  const mostrarError = (mensaje: string) => {
    setMensajeError(mensaje);
    setTimeout(() => {
      setMensajeError('');
    }, 3500); 
  };

  const handleSoloLetras = (texto: string, setter: (val: string) => void) => {
    if (/[0-9]/.test(texto)) {
      mostrarError('No se admiten números en este campo.');
      setter(texto.replace(/[0-9]/g, ''));
    } else {
      setter(texto);
    }
  };

  const handleSoloNumeros = (texto: string, setter: (val: string) => void) => {
    if (/[^0-9.]/.test(texto) || texto.includes('-')) {
      mostrarError('Entrada no admitida. Solo ingresa números positivos.');
      setter(texto.replace(/[^0-9.]/g, ''));
    } else {
      setter(texto);
    }
  };

  //  Crear o Editar
  const handleGuardar = () => {
    // 1. Forzamos la conversión a número justo aquí para evitar errores
    const sActual = Number(stockActual) || 0;
    const pPrecio = Number(precio) || 0;
    const pPeso = Number(pesoUnidad) || 0;
    const sMinimo = Number(stockMinimo) || 0;

    const datosProducto = {
      nombre: nombre,
      sku: sku,
      categoria: categoria,
      stockActual: sActual,
      stockMinimo: sMinimo,
      precio: pPrecio,
      unidad: unidad,
      pesoUnidad: pPeso,
      
      valorTotal: sActual * pPrecio, 
    };

    if (id) {
      // Si estamos editando, mandamos el ID que ya teníamos y los nuevos datos
      editarProducto(id as string, { ...datosProducto, id: id as string });
    } else {
      // Si es nuevo, generamos ID y guardamos
      agregarProducto({ ...datosProducto, id: Date.now().toString() });
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '', headerLeft: () => null }} />

      <View style={styles.headerForm}>
        <View>
          {/* Cambiamos el título  */}
          <Text style={styles.title}>{id ? 'Editar Producto' : 'Agregar Producto'}</Text>
          <Text style={styles.subtitle}>{id ? 'Modifica los datos del producto' : 'Ingresa los datos del nuevo producto'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* --- MENSAJE DE ERROR  --- */}
      {mensajeError !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{mensajeError}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.formBody}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del producto</Text>
          <TextInput 
            style={styles.input} 
            placeholder="INGRESAR NOMBRE" 
            value={nombre} 
            onChangeText={setNombre}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Codigo</Text>
            <TextInput style={styles.input} placeholder="" value={sku} onChangeText={setSku}/>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Categoría</Text>
            <TextInput 
              style={styles.input} 
              placeholder="" 
              value={categoria} 
              onChangeText={(t) => handleSoloLetras(t, setCategoria)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Stock actual</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0" 
              keyboardType="numeric" 
              value={stockActual} 
              onChangeText={(t) => handleSoloNumeros(t, setStockActual)}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Stock mínimo</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0" 
              keyboardType="numeric" 
              value={stockMinimo} 
              onChangeText={(t) => handleSoloNumeros(t, setStockMinimo)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Unidad de medida</Text>
            <TextInput 
              style={styles.input} 
              placeholder="unidad / kg" 
              value={unidad} 
              onChangeText={(t) => setUnidad(t.replace(/[^a-zA-ZÀ-ÿ0-9\s/.-]/g, ''))}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Peso por unidad (kg)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0.00" 
              keyboardType="decimal-pad" 
              value={pesoUnidad} 
              onChangeText={(t) => handleSoloNumeros(t, setPesoUnidad)}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, {marginTop: 10}]}>
          <Text style={styles.label}>Precio</Text>
          <TextInput 
            style={styles.input} 
            placeholder="0" 
            keyboardType="numeric" 
            value={precio} 
            onChangeText={(t) => handleSoloNumeros(t, setPrecio)}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnCancel} onPress={() => router.back()}>
          <Text style={styles.btnTextCancel}>Cancelar</Text>
        </TouchableOpacity>
        {/*  Actualizamos la función */}
        <TouchableOpacity style={styles.btnPrimary} onPress={handleGuardar}>
          <Text style={styles.btnTextPrimary}>{id ? 'Guardar Cambios' : 'Agregar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    ...Platform.select({
        web: {
            borderRadius: 12,
            overflow: 'hidden'
        }
    })
  },
  headerForm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 10,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '500',
  },
  formBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  col: {
    flex: 1,
    marginHorizontal: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  btnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 10,
  },
  btnTextCancel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  btnPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#000010',
  },
  btnTextPrimary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});