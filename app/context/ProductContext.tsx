import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. Datos iniciales (sacados de tu index)
const productosIniciales: any = [];

// 2. Creamos la "memoria compartida"
const ProductContext = createContext<any>(null);

// 3. Este componente envuelve nuestra app y guarda el estado
export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [productos, setProductos] = useState<any[]>(productosIniciales);

  // 👉 EFECTO 1: Carga los datos al iniciar (Asegúrate de haber importado useEffect arriba)
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const guardados = await AsyncStorage.getItem('@mis_productos');
        if (guardados !== null) {
          setProductos(JSON.parse(guardados));
        }
      } catch (e) {
        console.error("Error al cargar", e);
      }
    };
    cargarProductos();
  }, []);

  // 👉 EFECTO 2: Guarda automáticamente cada que cambien los productos
  useEffect(() => {
    const guardarProductos = async () => {
      try {
        await AsyncStorage.setItem('@mis_productos', JSON.stringify(productos));
      } catch (e) {
        console.error("Error al guardar", e);
      }
    };
    guardarProductos();
  }, [productos]);

  // Funciones globales para modificar la lista
  const agregarProducto = (producto: any) => {
    setProductos([...productos, producto]);
  };

  const eliminarProducto = (id: string) => {
    setProductos((prev) => prev.filter((prod) => prod.id !== id));
  };

  const editarProducto = (id: string, productoActualizado: any) => {
    setProductos((prev) =>
      prev.map((prod) => (prod.id === id ? productoActualizado : prod))
    );
  };

  return (
    <ProductContext.Provider value={{ productos, agregarProducto, eliminarProducto, editarProducto }}>
      {children}
    </ProductContext.Provider>
  );
}

// 4. Hook para usar esta memoria fácilmente en cualquier pantalla
export const useProductos = () => useContext(ProductContext);