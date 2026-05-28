import { getDatabase } from "../database";

export interface Estante {
  id: string;
  mac_address: string;
  ubicacion_fisica: string | null;
  esta_abierto: number; // 0 = cerrado, 1 = abierto
  alerta_activa: number; // 0 = sin alerta, 1 = alerta activa
  ultima_conexion?: string;
}

export interface InventarioActual {
  id: string;
  estante_id: string;
  producto_id: string;
  peso_total_gramos: number;
  cantidad_calculada: number;
  ultima_actualizacion?: string;
}

// Estructura combinada para facilitar la renderización en UI
export interface EstanteConDetalle {
  estante_id: string;
  mac_address: string;
  ubicacion_fisica: string | null;
  esta_abierto: number;
  alerta_activa: number;
  ultima_conexion: string;
  inventario_id: string | null;
  producto_id: string | null;
  peso_total_gramos: number | null;
  cantidad_calculada: number | null;
  producto_nombre: string | null;
  producto_peso_individual: number | null;
  producto_stock_actual: number | null;
}

/**
 * Obtiene todos los estantes con su inventario y datos del producto asociado
 */
export async function getEstantesConInventario(): Promise<EstanteConDetalle[]> {
  try {
    const db = await getDatabase();
    const query = `
      SELECT 
      e.id as estante_id,
      e.mac_address,
      e.ubicacion_fisica,
      e.esta_abierto,
      e.alerta_activa,
      e.ultima_conexion,
      i.id as inventario_id,
        i.producto_id,
        i.peso_total_gramos,
        i.cantidad_calculada,
        p.nombre as producto_nombre,
        p.peso_individual_gramos as producto_peso_individual,
        p.stock_minimo as producto_stock_actual
      FROM estantes e
      LEFT JOIN inventario_actual i ON e.id = i.estante_id
      LEFT JOIN productos p ON i.producto_id = p.id
      ORDER BY e.ubicacion_fisica ASC
    `;
    const result = await db.getAllAsync<EstanteConDetalle>(query);
    return result || [];
  } catch (error) {
    console.log("⚠️ [LogBox-safe] Error en SQLite getEstantesConInventario:", error);
    return [];
  }
}

/**
 * Inserta o reemplaza un estante (usado para sincronizar desde Supabase)
 */
export async function insertOrReplaceEstante(estante: Estante): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO estantes 
       (id, mac_address, ubicacion_fisica, esta_abierto, alerta_activa, ultima_conexion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        estante.id,
        estante.mac_address,
        estante.ubicacion_fisica || null,
        estante.esta_abierto,
        estante.alerta_activa,
        estante.ultima_conexion || new Date().toISOString(),
      ]
    );
    return true;
  } catch (error) {
    console.log("⚠️ [LogBox-safe] Error en SQLite insertOrReplaceEstante:", error);
    return false;
  }
}

/**
 * Inserta o reemplaza un registro de inventario_actual
 */
export async function insertOrReplaceInventario(inv: InventarioActual): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO inventario_actual 
       (id, estante_id, producto_id, peso_total_gramos, cantidad_calculada, ultima_actualizacion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        inv.id,
        inv.estante_id,
        inv.producto_id,
        inv.peso_total_gramos,
        inv.cantidad_calculada,
        inv.ultima_actualizacion || new Date().toISOString(),
      ]
    );
    return true;
  } catch (error) {
    console.log("⚠️ [LogBox-safe] Error en SQLite insertOrReplaceInventario:", error);
    return false;
  }
}

/**
 * Actualiza la ubicación física de un estante local
 */
export async function updateEstanteLocal(id: string, ubicacion: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE estantes SET ubicacion_fisica = ? WHERE id = ?",
      [ubicacion, id]
    );
    return true;
  } catch (error) {
    console.log("⚠️ [LogBox-safe] Error en SQLite updateEstanteLocal:", error);
    return false;
  }
}

/**
 * Elimina un estante y su inventario asociado de SQLite
 */
export async function deleteEstanteLocal(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM estantes WHERE id = ?", [id]);
    await db.runAsync("DELETE FROM inventario_actual WHERE estante_id = ?", [id]);
    return true;
  } catch (error) {
    console.log("⚠️ [LogBox-safe] Error en SQLite deleteEstanteLocal:", error);
    return false;
  }
}

/**
 * Limpia la tabla local de estantes (para resincronización limpia)
 */
export async function clearEstantesLocales(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM estantes");
    await db.runAsync("DELETE FROM inventario_actual");
  } catch (error) {
    console.log("⚠️ [LogBox-safe] Error limpiando estantes locales:", error);
  }
}

/**
 * Sincroniza de manera atómica todos los estantes e inventarios en una única transacción SQLite.
 * Esto previene estados vacíos intermedios que causan que las cards parpadeen o desaparezcan de la UI.
 */
export async function syncEstantesAtomic(
  estantes: Estante[],
  inventarios: InventarioActual[]
): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      // 1. Limpiar tablas locales
      await db.runAsync("DELETE FROM estantes");
      await db.runAsync("DELETE FROM inventario_actual");

      // 2. Insertar estantes nuevos
      for (const e of estantes) {
        await db.runAsync(
          `INSERT OR REPLACE INTO estantes 
           (id, mac_address, ubicacion_fisica, esta_abierto, alerta_activa, ultima_conexion)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            e.id,
            e.mac_address,
            e.ubicacion_fisica || null,
            e.esta_abierto,
            e.alerta_activa,
            e.ultima_conexion || new Date().toISOString(),
          ]
        );
      }

      // 3. Insertar inventarios nuevos
      for (const i of inventarios) {
        await db.runAsync(
          `INSERT OR REPLACE INTO inventario_actual 
           (id, estante_id, producto_id, peso_total_gramos, cantidad_calculada, ultima_actualizacion)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            i.id,
            i.estante_id,
            i.producto_id,
            i.peso_total_gramos,
            i.cantidad_calculada,
            i.ultima_actualizacion || new Date().toISOString(),
          ]
        );
      }
    });
    return true;
  } catch (error) {
    console.log("⚠️ [LogBox-safe] Error en SQLite syncEstantesAtomic:", error);
    return false;
  }
}

