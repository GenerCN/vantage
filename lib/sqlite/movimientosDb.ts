import { getDatabase } from "../database";

/**
 * Interfaz de Movimiento que coincide con historial_movimientos de Supabase
 */
export interface Movimiento {
  id: string;
  usuario_id: string;
  estante_id: string;
  producto_id: string;
  tipo_accion: "ENTRADA" | "SALIDA";
  diferencia_peso_gramos: number;
  cantidad: number;
  fecha_hora: string;
  sinc: number; // 0 = pendiente, 1 = sincronizado
  usuario_nombre?: string;
  usuario_rol?: string;
  usuario_username?: string;
}


/**
 * Obtiene todos los movimientos ordenados por fecha descendente
 */
export async function getAllMovimientos(): Promise<Movimiento[]> {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<Movimiento>(
      `SELECT 
        id, usuario_id, estante_id, producto_id, tipo_accion, diferencia_peso_gramos, cantidad, fecha_hora, sinc,
        usuario_nombre, usuario_rol, usuario_username
       FROM movimientos 
       ORDER BY fecha_hora DESC`
    );
    return result || [];
  } catch (error) {
    console.error("Error obteniendo movimientos:", error);
    return [];
  }
}

/**
 * Obtiene un movimiento específico por ID
 */
export async function getMovimientoById(id: string): Promise<Movimiento | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<Movimiento>(
      `SELECT id, usuario_id, estante_id, producto_id, tipo_accion, diferencia_peso_gramos, cantidad, fecha_hora, sinc,
              usuario_nombre, usuario_rol, usuario_username
       FROM movimientos 
       WHERE id = ?`,
      [id]
    );
    return result || null;
  } catch (error) {
    console.error("Error obteniendo movimiento:", error);
    return null;
  }
}

/**
 * Inserta un nuevo movimiento en SQLite
 */
export async function insertMovimiento(movimiento: Movimiento): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO movimientos 
       (id, usuario_id, estante_id, producto_id, tipo_accion, diferencia_peso_gramos, cantidad, fecha_hora, sinc,
        usuario_nombre, usuario_rol, usuario_username)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movimiento.id,
        movimiento.usuario_id,
        movimiento.estante_id,
        movimiento.producto_id,
        movimiento.tipo_accion,
        movimiento.diferencia_peso_gramos,
        movimiento.cantidad,
        movimiento.fecha_hora,
        movimiento.sinc || 0,
        movimiento.usuario_nombre || null,
        movimiento.usuario_rol || null,
        movimiento.usuario_username || null,
      ]
    );
    console.log(`✅ Movimiento insertado en SQLite: ${movimiento.id}`);
    return true;
  } catch (error) {
    console.error("Error insertando movimiento:", error);
    return false;
  }
}

/**
 * Inserta un movimiento descargado de Supabase usando INSERT OR REPLACE
 */
export async function insertMovimientoFromSupabase(
  movimiento: Movimiento
): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO movimientos 
       (id, usuario_id, estante_id, producto_id, tipo_accion, diferencia_peso_gramos, cantidad, fecha_hora, sinc,
        usuario_nombre, usuario_rol, usuario_username)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        movimiento.id,
        movimiento.usuario_id,
        movimiento.estante_id,
        movimiento.producto_id,
        movimiento.tipo_accion,
        movimiento.diferencia_peso_gramos,
        movimiento.cantidad,
        movimiento.fecha_hora,
        movimiento.usuario_nombre || null,
        movimiento.usuario_rol || null,
        movimiento.usuario_username || null,
      ]
    );
    return true;
  } catch (error) {
    console.error("Error insertando movimiento de Supabase:", error);
    return false;
  }
}

/**
 * Elimina un movimiento de SQLite
 */
export async function deleteMovimiento(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM movimientos WHERE id = ?", [id]);
    console.log(`✅ Movimiento eliminado: ${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting movement:", error);
    return false;
  }
}

/**
 * Elimina un movimiento de SQLite sin agregar a cola de sincronización
 * (usado cuando falla INSERT por error 23505)
 */
export async function deleteMovimientoLocally(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM movimientos WHERE id = ?", [id]);
    console.log(`✅ Movimiento eliminado localmente: ${id}`);
    return true;
  } catch (error) {
    console.error("Error eliminando movimiento localmente:", error);
    return false;
  }
}

/**
 * Obtiene los cambios pendientes de sincronizar
 */
export async function getPendingSyncChanges(): Promise<Movimiento[]> {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<Movimiento>(
      `SELECT id, usuario_id, estante_id, producto_id, tipo_accion, diferencia_peso_gramos, cantidad, fecha_hora, sinc,
              usuario_nombre, usuario_rol, usuario_username
       FROM movimientos 
       WHERE sinc = 0 
       ORDER BY fecha_hora ASC`
    );
    return result || [];
  } catch (error) {
    console.error("Error obteniendo cambios pendientes:", error);
    return [];
  }
}

/**
 * Marca un movimiento como sincronizado
 */
export async function markAsSynced(movimientoId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.runAsync("UPDATE movimientos SET sinc = 1 WHERE id = ?", [
      movimientoId,
    ]);
    return true;
  } catch (error) {
    console.error("Error marcando como sincronizado:", error);
    return false;
  }
}

/**
 * Limpia movimientos sincronizados (opcional, para liberar espacio)
 */
export async function cleanupSyncQueue(movimientoId?: string): Promise<void> {
  try {
    const db = await getDatabase();
    if (movimientoId) {
      await db.runAsync("DELETE FROM movimientos WHERE id = ? AND sinc = 1", [
        movimientoId,
      ]);
    } else {
      // Opcionalmente limpiar todos los sincronizados antiguos
      console.log("✅ Sincronización limpiada");
    }
  } catch (error) {
    console.error("Error limpiando sincronización:", error);
  }
}
