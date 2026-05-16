import { checkNetworkConnection } from '@/hooks/useNetworkState';
import {
    Producto,
    cleanupSyncQueue,
    deleteProducto,
    getAllProductos,
    getPendingSyncChanges,
    getProductoById,
    getProductoStats,
    insertProducto,
    markAsSynced,
    searchProductos,
    updateProducto,
} from '@/lib/sqlite/productosDb';
import { supabase } from '@/lib/supabase';

/**
 * CRUD completo de productos con sincronización Supabase + SQLite offline-first
 * 
 * Flujo:
 * 1. Todas las operaciones se guardan primero en SQLite (garantiza persistencia)
 * 2. Si hay conexión, se intenta sincronizar con Supabase
 * 3. Si no hay conexión, se marca para sincronizar después
 * 4. Cuando se restaura conexión, se sincronizan todos los cambios pendientes
 */

export interface CreateProductoInput {
  nombre: string;
  peso_individual_gramos: number;
  stock_minimo: number;
}

export interface ProductoStats {
  total: number;
}

/**
 * Genera un UUID v4 válido sin dependencias externas
 * Compatible con Expo/React Native
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Crea un nuevo producto en SQLite y sincroniza con Supabase si hay conexión
 */
export async function createProducto(input: CreateProductoInput): Promise<Producto | null> {
  try {
    const producto: Producto = {
      id: generateId(),
      nombre: input.nombre,
      peso_individual_gramos: input.peso_individual_gramos,
      stock_minimo: input.stock_minimo,
      creado_en: new Date().toISOString(),
    };

    // 1. Guardar en SQLite primero (garantizado)
    const savedLocally = await insertProducto(producto);
    if (!savedLocally) {
      console.error('❌ Error guardando producto en SQLite');
      return null;
    }

    console.log(`✅ Producto creado localmente: ${producto.nombre}`);

    // 2. Intentar sincronizar con Supabase si hay conexión
    const isConnected = await checkNetworkConnection();
    if (isConnected) {
      const synced = await syncProductoToSupabase(producto, 'INSERT');
      if (synced) {
        console.log(`☁️  Producto sincronizado a Supabase: ${producto.nombre}`);
      }
    } else {
      console.log(`⟳ Conexión no disponible, sincronizaremos cuando sea posible`);
    }

    return producto;
  } catch (error) {
    console.error('Error creando producto:', error);
    return null;
  }
}

/**
 * Obtiene todos los productos desde SQLite
 */
export async function getProductos(): Promise<Producto[]> {
  try {
    const productos = await getAllProductos();
    console.log(`📦 Cargados ${productos.length} productos desde SQLite`);
    return productos;
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return [];
  }
}

/**
 * Obtiene un producto específico por ID
 */
export async function getProducto(id: string): Promise<Producto | null> {
  try {
    return await getProductoById(id);
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    return null;
  }
}

/**
 * Busca productos por nombre o SKU
 */
export async function searchProductosByQuery(query: string): Promise<Producto[]> {
  try {
    if (!query.trim()) return [];
    return await searchProductos(query);
  } catch (error) {
    console.error('Error buscando productos:', error);
    return [];
  }
}

/**
 * Actualiza un producto en SQLite y sincroniza con Supabase
 */
export async function updateProductoService(
  id: string,
  updates: Partial<Producto>
): Promise<Producto | null> {
  try {
    // 1. Actualizar en SQLite primero
    const updated = await updateProducto(id, updates);
    if (!updated) {
      console.error('❌ Error actualizando producto en SQLite');
      return null;
    }

    console.log(`✅ Producto actualizado localmente: ${id}`);

    // 2. Intentar sincronizar con Supabase si hay conexión
    const isConnected = await checkNetworkConnection();
    if (isConnected) {
      const synced = await syncProductoToSupabase(updates as Producto, 'UPDATE', id);
      if (synced) {
        console.log(`☁️  Cambios sincronizados a Supabase: ${id}`);
      }
    }

    // Retornar el producto actualizado
    return await getProductoById(id);
  } catch (error) {
    console.error('Error actualizando producto:', error);
    return null;
  }
}

/**
 * Elimina un producto de SQLite y Supabase
 */
export async function deleteProductoService(id: string): Promise<boolean> {
  try {
    // 1. Eliminar de SQLite primero
    const deleted = await deleteProducto(id);
    if (!deleted) {
      console.error('❌ Error eliminando producto de SQLite');
      return false;
    }

    console.log(`✅ Producto eliminado localmente: ${id}`);

    // 2. Intentar sincronizar con Supabase si hay conexión
    const isConnected = await checkNetworkConnection();
    if (isConnected) {
      const synced = await deleteProductoFromSupabase(id);
      if (synced) {
        console.log(`☁️  Producto eliminado de Supabase: ${id}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error eliminando producto:', error);
    return false;
  }
}

/**
 * Obtiene estadísticas de productos
 */
export async function getProductoStatistics(): Promise<ProductoStats> {
  try {
    const stats = await getProductoStats();
    return {
      total: (stats as any)?.total || 0,
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { total: 0 };
  }
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * FUNCIONES DE SINCRONIZACIÓN CON SUPABASE
 * ────────────────────────────────────────────────────────────────────────────
 */

/**
 * Sincroniza un producto individual a Supabase
 */
async function syncProductoToSupabase(
  producto: Partial<Producto>,
  operacion: 'INSERT' | 'UPDATE' | 'DELETE',
  id?: string
): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('⚠️  Supabase no configurado');
      return false;
    }

    const productoId = id || producto.id;
    if (!productoId) return false;

    if (operacion === 'INSERT') {
      const { error } = await supabase.from('productos').insert([producto]);
      if (error) {
        console.error('Error INSERT en Supabase:', error);
        return false;
      }
    } else if (operacion === 'UPDATE') {
      const { error } = await supabase.from('productos').update(producto).eq('id', productoId);
      if (error) {
        console.error('Error UPDATE en Supabase:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error sincronizando a Supabase:', error);
    return false;
  }
}

/**
 * Elimina un producto de Supabase
 */
async function deleteProductoFromSupabase(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('⚠️  Supabase no configurado');
      return false;
    }

    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) {
      console.error('Error DELETE en Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error eliminando de Supabase:', error);
    return false;
  }
}

/**
 * Sincroniza todos los cambios pendientes (INSERT, UPDATE, DELETE) con Supabase
 * Se llama automáticamente cuando se restaura la conexión a internet
 */
export async function syncAllPendingChanges(): Promise<{
  total: number;
  synced: number;
  failed: number;
}> {
  try {
    const changes = await getPendingSyncChanges();
    console.log(`🔄 Sincronizando ${changes.length} cambios pendientes...`);

    let synced = 0;
    let failed = 0;

    for (const changeUnknown of changes) {
      try {
        const change = changeUnknown as any;
        let success = false;

        if (change.operacion === 'DELETE') {
          success = await deleteProductoFromSupabase(change.producto_id);
        } else {
          const datos = JSON.parse(change.datos);
          success = await syncProductoToSupabase(datos, change.operacion, change.producto_id);
        }

        if (success) {
          await markAsSynced(change.id);
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error sincronizando cambio:`, error);
        failed++;
      }
    }

    // Limpiar cola de cambios sincronizados
    await cleanupSyncQueue();

    const result = { total: changes.length, synced, failed };
    console.log(`✅ Sincronización completada: ${synced}/${changes.length} cambios sincronizados, ${failed} fallidos`);

    return result;
  } catch (error) {
    console.error('Error sincronizando cambios pendientes:', error);
    return { total: 0, synced: 0, failed: 0 };
  }
}

/**
 * Descarga todos los productos de Supabase y los guarda en SQLite
 * (Útil para sincronización inicial)
 */
export async function downloadProductosFromSupabase(): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('⚠️  Supabase no configurado');
      return false;
    }

    const { data, error } = await supabase.from('productos').select('*');

    if (error) {
      console.error('Error descargando productos de Supabase:', error);
      return false;
    }

    if (!data || data.length === 0) {
      console.log('ℹ️  No hay productos en Supabase');
      return true;
    }

    // Guardar cada producto en SQLite
    for (const producto of data) {
      await insertProducto(producto as Producto);
    }

    console.log(`✅ ${data.length} productos descargados de Supabase`);
    return true;
  } catch (error) {
    console.error('Error descargando productos de Supabase:', error);
    return false;
  }
}
