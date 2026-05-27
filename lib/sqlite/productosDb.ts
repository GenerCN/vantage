import { getDatabase } from "../database";

export interface Producto {
  id: string;
  nombre: string;
  peso_individual_gramos: number;
  stock_minimo: number;
  creado_en?: string;
}

/**
 * Obtiene todos los productos de la base de datos local
 */
export async function getAllProductos(): Promise<Producto[]> {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<Producto>(
      "SELECT id, nombre, peso_individual_gramos, stock_minimo, creado_en FROM productos ORDER BY creado_en DESC",
    );
    return result;
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    return [];
  }
}

/**
 * Obtiene un producto por ID
 */
export async function getProductoById(id: string): Promise<Producto | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<Producto>(
      "SELECT id, nombre, peso_individual_gramos, stock_minimo, creado_en FROM productos WHERE id = ?",
      [id],
    );
    return result || null;
  } catch (error) {
    console.error("Error obteniendo producto por ID:", error);
    return null;
  }
}

/**
 * Busca productos por nombre
 */
export async function searchProductos(query: string): Promise<Producto[]> {
  try {
    const db = await getDatabase();
    const searchTerm = `%${query}%`;
    const result = await db.getAllAsync<Producto>(
      "SELECT id, nombre, peso_individual_gramos, stock_minimo, creado_en FROM productos WHERE nombre LIKE ? ORDER BY creado_en DESC",
      [searchTerm],
    );
    return result;
  } catch (error) {
    console.error("Error buscando productos:", error);
    return [];
  }
}

/**
 * Inserta un nuevo producto en la base de datos local
 */
export async function insertProducto(producto: Producto): Promise<boolean> {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO productos (id, nombre, peso_individual_gramos, stock_minimo, creado_en, sincronizado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        producto.id,
        producto.nombre,
        producto.peso_individual_gramos,
        producto.stock_minimo,
        now,
        0, // Sin sincronizar aún
      ],
    );

    // Registrar en cola de sincronización
    await addToSyncQueue(
      "productos",
      "INSERT",
      producto.id,
      JSON.stringify(producto),
    );

    console.log(`✅ Producto insertado localmente: ${producto.id}`);
    return true;
  } catch (error) {
    console.error("Error insertando producto:", error);
    return false;
  }
}

/**
 * Inserta un producto descargado de Supabase (sin agregarlo a la cola de sincronización)
 */
export async function insertProductoFromSupabase(
  producto: Producto,
): Promise<boolean> {
  try {
    const db = await getDatabase();

    await db.runAsync(
      `INSERT OR REPLACE INTO productos (id, nombre, peso_individual_gramos, stock_minimo, creado_en, sincronizado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        producto.id,
        producto.nombre,
        producto.peso_individual_gramos,
        producto.stock_minimo,
        producto.creado_en || new Date().toISOString(),
        1, // Ya sincronizado en Supabase
      ],
    );

    console.log(`✅ Producto descargado de Supabase: ${producto.id}`);
    return true;
  } catch (error) {
    console.error("Error insertando producto de Supabase:", error);
    return false;
  }
}

/**
 * Actualiza un producto en la base de datos local
 */
export async function updateProducto(
  id: string,
  updates: Partial<Producto>,
): Promise<boolean> {
  try {
    const db = await getDatabase();

    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "id" && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);

    await db.runAsync(
      `UPDATE productos SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    // Registrar en cola de sincronización
    await addToSyncQueue("productos", "UPDATE", id, JSON.stringify(updates));

    console.log(`✅ Producto actualizado localmente: ${id}`);
    return true;
  } catch (error) {
    console.error("Error actualizando producto:", error);
    return false;
  }
}

/**
 * Elimina un producto de la base de datos local
 */
export async function deleteProducto(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();

    // Obtener datos del producto antes de eliminarlo (para sincronización)
    const producto = await getProductoById(id);

    // Borrar de inventario_actual primero para cascada lógica en SQLite
    await db.runAsync("DELETE FROM inventario_actual WHERE producto_id = ?", [id]);

    await db.runAsync("DELETE FROM productos WHERE id = ?", [id]);

    // Registrar en cola de sincronización
    if (producto) {
      await addToSyncQueue("productos", "DELETE", id, JSON.stringify(producto));
    }

    console.log(`✅ Producto y sus vinculaciones de estante eliminados localmente: ${id}`);
    return true;
  } catch (error) {
    console.error("Error eliminando producto y sus vinculaciones:", error);
    return false;
  }
}

/**
 * Elimina un producto de SQLite sin agregar a la cola de sincronización
 * (usado cuando falla INSERT por UNIQUE constraint - el producto no fue realmente sincronizado)
 */
export async function deleteProductoLocally(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    // Borrar de inventario_actual primero para cascada lógica en SQLite
    await db.runAsync("DELETE FROM inventario_actual WHERE producto_id = ?", [id]);
    
    await db.runAsync("DELETE FROM productos WHERE id = ?", [id]);
    console.log(`✅ Producto y sus vinculaciones eliminados del almacenamiento local: ${id}`);
    return true;
  } catch (error) {
    console.error("Error eliminando producto del almacenamiento local:", error);
    return false;
  }
}

/**
 * Obtiene los cambios pendientes de sincronizar con el servidor
 */
export async function getPendingSyncChanges() {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync(
      "SELECT * FROM sync_queue WHERE sincronizado = 0 ORDER BY creado_en ASC",
    );
    return result;
  } catch (error) {
    console.error("Error obteniendo cambios pendientes:", error);
    return [];
  }
}

/**
 * Marca un cambio como sincronizado
 */
export async function markAsSynced(syncId: number): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync("UPDATE sync_queue SET sincronizado = 1 WHERE id = ?", [
      syncId,
    ]);
    return true;
  } catch (error) {
    console.error("Error marcando como sincronizado:", error);
    return false;
  }
}

/**
 * Limpia la cola de sincronización de elementos ya sincronizados
 */
export async function cleanupSyncQueue(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM sync_queue WHERE sincronizado = 1");
    console.log("✅ Cola de sincronización limpiada");
  } catch (error) {
    console.error("Error limpiando cola de sincronización:", error);
  }
}

/**
 * Agrega un cambio a la cola de sincronización
 */
async function addToSyncQueue(
  tabla: string,
  operacion: "INSERT" | "UPDATE" | "DELETE",
  productoId: string,
  datos: string,
): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT INTO sync_queue (tabla, operacion, producto_id, datos) VALUES (?, ?, ?, ?)",
      [tabla, operacion, productoId, datos],
    );
  } catch (error) {
    console.error("Error agregando a cola de sincronización:", error);
  }
}

/**
 * Obtiene estadísticas de productos
 */
export async function getProductoStats() {
  try {
    const db = await getDatabase();
    const stats = await db.getFirstAsync(
      `SELECT 
        COUNT(*) as total
      FROM productos`,
    );
    return stats || { total: 0 };
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return { total: 0 };
  }
}
