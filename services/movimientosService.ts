import { checkNetworkConnection } from "@/hooks/useNetworkState";
import { getProductoById, updateProducto } from "@/lib/sqlite/productosDb";
import {
    cleanupSyncQueue,
    deleteMovimiento,
    getAllMovimientos,
    getPendingSyncChanges,
    insertMovimiento,
    insertMovimientoFromSupabase,
    markAsSynced
} from "@/lib/sqlite/movimientosDb";
import { supabase } from "@/lib/supabase";

/**
 * Interfaz para un movimiento en historial
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
}

/**
 * Interfaz para crear un nuevo movimiento
 */
export interface CreateMovimientoInput {
  estante_id: string;
  producto_id: string;
  tipo_accion: "ENTRADA" | "SALIDA";
  cantidad: number; // Número de unidades
  peso_individual_gramos: number; // Peso de cada unidad
}

/**
 * Interfaz para estadísticas
 */
export interface MovimientosStats {
  total: number;
  entradas: number;
  salidas: number;
}

/**
 * Obtiene el usuario ID del usuario autenticado
 */
async function getAuthUserId(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error("Error obteniendo usuario autenticado:", error);
    return null;
  }
}

/**
 * Genera un UUID v4 válido sin dependencias externas
 */
function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Obtiene el stock actual de un producto (del campo stock_minimo de la tabla productos)
 */
export async function getStockActual(
  estante_id: string,
  producto_id: string
): Promise<number> {
  try {
    // El stock del producto está representado por la columna stock_minimo
    const producto = await getProductoById(producto_id);
    return producto?.stock_minimo || 0;
  } catch (error) {
    console.error("Error obteniendo stock actual:", error);
    return 0;
  }
}

/**
 * Actualiza el inventario_actual después de un movimiento
 */
async function actualizarInventario(
  producto_id: string,
  cantidad: number,
  tipo_accion: "ENTRADA" | "SALIDA"
): Promise<boolean> {
  try {
    const delta = tipo_accion === "ENTRADA" ? cantidad : -cantidad;
    const producto = await getProductoById(producto_id);
    if (!producto) {
      console.warn("⚠️ Producto no encontrado para actualizar inventario");
      return false;
    }

    const nuevoStock = Math.max(0, (producto.stock_minimo || 0) + delta);

    // 1. Actualizar localmente en SQLite
    await updateProducto(producto_id, { stock_minimo: nuevoStock });

    // 2. Intentar actualizar en Supabase si hay conexión
    const isConnected = await checkNetworkConnection();
    if (isConnected) {
      const { error } = await supabase
        .from("productos")
        .update({ stock_minimo: nuevoStock })
        .eq("id", producto_id);

      if (error) {
        console.error("Error actualizando stock_minimo en Supabase:", error);
        return false;
      }
    }

    console.log(`📦 Stock de producto "${producto.nombre}" actualizado a: ${nuevoStock}`);
    return true;
  } catch (error) {
    console.error("Error actualizando inventario:", error);
    return false;
  }
}

/**
 * Crea un nuevo movimiento en SQLite y sincroniza con Supabase si hay conexión
 * Flujo offline-first: guardar localmente primero, luego sincronizar
 */
export async function createMovimiento(
  input: CreateMovimientoInput
): Promise<Movimiento | null> {
  try {
    // 1. Obtener usuario autenticado
    const usuario_id = await getAuthUserId();
    if (!usuario_id) {
      throw new Error("No hay una sesión activa de usuario. Por favor, inicia sesión.");
    }

    // 2. Validar stock para SALIDA
    if (input.tipo_accion === "SALIDA") {
      const stockActual = await getStockActual(input.estante_id, input.producto_id);
      if (input.cantidad > stockActual) {
        throw new Error(
          `Stock insuficiente. Disponible: ${stockActual}, Solicitado: ${input.cantidad}`
        );
      }
    }

    // 3. Calcular diferencia de peso
    const diferencia_peso_gramos =
      input.tipo_accion === "SALIDA"
        ? -(input.cantidad * input.peso_individual_gramos)
        : input.cantidad * input.peso_individual_gramos;

    const movimiento: Movimiento = {
      id: generateId(),
      usuario_id,
      estante_id: input.estante_id,
      producto_id: input.producto_id,
      tipo_accion: input.tipo_accion,
      diferencia_peso_gramos,
      cantidad: input.cantidad,
      fecha_hora: new Date().toISOString(),
      sinc: 0, // Pendiente de sincronizar
    };

    // 4. Guardar en SQLite primero (garantizado)
    const savedLocally = await insertMovimiento(movimiento);
    if (!savedLocally) {
      console.error("❌ Error guardando movimiento en SQLite");
      return null;
    }

    console.log(`✅ Movimiento creado localmente: ${movimiento.id}`);

    // 5. Intentar sincronizar con Supabase si hay conexión
    const isConnected = await checkNetworkConnection();
    if (isConnected) {
      const synced = await syncMovimientoToSupabase(movimiento, "INSERT");
      if (synced) {
        console.log(`☁️  Movimiento sincronizado a Supabase: ${movimiento.id}`);
      }

      // 6. Actualizar inventario (stock_minimo del producto) en SQLite y Supabase
      await actualizarInventario(
        input.producto_id,
        input.cantidad,
        input.tipo_accion
      );
    } else {
      console.log(
        `⟳ Sin conexión, movimiento se sincronizará cuando sea posible`
      );
    }

    return movimiento;
  } catch (error) {
    console.error("Error creando movimiento:", error);
    throw error; // Re-lanzar para que la UI muestre el mensaje
  }
}

/**
 * Obtiene todos los movimientos desde SQLite
 */
export async function getMovimientos(): Promise<Movimiento[]> {
  try {
    const movimientos = await getAllMovimientos();
    console.log(`📦 Cargados ${movimientos.length} movimientos desde SQLite`);
    return movimientos;
  } catch (error) {
    console.error("Error obteniendo movimientos:", error);
    return [];
  }
}

/**
 * Obtiene estadísticas de movimientos
 */
export async function getMovimientosStatistics(): Promise<MovimientosStats> {
  try {
    const movimientos = await getMovimientos();
    return {
      total: movimientos.length,
      entradas: movimientos.filter(
        (m) => m.tipo_accion === "ENTRADA"
      ).length,
      salidas: movimientos.filter(
        (m) => m.tipo_accion === "SALIDA"
      ).length,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return { total: 0, entradas: 0, salidas: 0 };
  }
}

/**
 * Elimina un movimiento de SQLite y Supabase
 */
export async function deleteMovimientoService(id: string): Promise<boolean> {
  try {
    // 1. Eliminar de SQLite primero
    const deleted = await deleteMovimiento(id);
    if (!deleted) {
      console.error("❌ Error eliminando movimiento de SQLite");
      return false;
    }

    console.log(`✅ Movimiento eliminado localmente: ${id}`);

    // 2. Intentar sincronizar con Supabase si hay conexión
    const isConnected = await checkNetworkConnection();
    if (isConnected) {
      const synced = await deleteMovimientoFromSupabase(id);
      if (synced) {
        console.log(`☁️  Movimiento eliminado de Supabase: ${id}`);
      }
    }

    return true;
  } catch (error) {
    console.error("Error eliminando movimiento:", error);
    return false;
  }
}

/**
 * Elimina un movimiento solo de SQLite local (para Realtime sync)
 */
export async function deleteMovimientoFromLocalOnly(
  id: string
): Promise<boolean> {
  try {
    const deleted = await deleteMovimiento(id);
    if (!deleted) {
      console.error("❌ Error eliminando movimiento de SQLite local");
      return false;
    }
    console.log(`🗑️ Movimiento eliminado de SQLite local: ${id}`);
    return true;
  } catch (error) {
    console.error("Error eliminando movimiento de SQLite local:", error);
    return false;
  }
}

/**
 * Sincroniza un movimiento a Supabase
 */
async function syncMovimientoToSupabase(
  movimiento: Movimiento,
  operacion: "INSERT" | "DELETE"
): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn("⚠️  Supabase no configurado");
      return false;
    }

    if (operacion === "INSERT") {
      const { error } = await supabase
        .from("historial_movimientos")
        .insert([
          {
            id: movimiento.id,
            usuario_id: movimiento.usuario_id,
            estante_id: (movimiento.estante_id && movimiento.estante_id.trim() !== "") ? movimiento.estante_id : null,
            producto_id: movimiento.producto_id,
            tipo_accion: movimiento.tipo_accion,
            diferencia_peso_gramos: movimiento.diferencia_peso_gramos,
            cantidad: movimiento.cantidad,
            fecha_hora: movimiento.fecha_hora,
          },
        ]);

      if (error) {
        console.error("Error INSERT en Supabase:", error);
        return false;
      }

      // Marcar como sincronizado en SQLite
      await markAsSynced(movimiento.id);
      console.log(`✅ Movimiento sincronizado: ${movimiento.id}`);
      return true;
    } else if (operacion === "DELETE") {
      const { error } = await supabase
        .from("historial_movimientos")
        .delete()
        .eq("id", movimiento.id);

      if (error) {
        console.error("Error DELETE en Supabase:", error);
        return false;
      }

      await cleanupSyncQueue(movimiento.id);
      console.log(`✅ Movimiento eliminado de Supabase: ${movimiento.id}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error sincronizando movimiento:", error);
    return false;
  }
}

/**
 * Elimina un movimiento solo de Supabase
 */
async function deleteMovimientoFromSupabase(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn("⚠️  Supabase no configurado");
      return false;
    }

    const { error } = await supabase
      .from("historial_movimientos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error DELETE en Supabase:", error);
      return false;
    }

    console.log(`✅ Movimiento eliminado de Supabase: ${id}`);
    return true;
  } catch (error) {
    console.error("Error eliminando movimiento de Supabase:", error);
    return false;
  }
}

/**
 * Descarga todos los movimientos desde Supabase
 */
export async function downloadMovimientosFromSupabase(): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn("⚠️  Supabase no configurado");
      return false;
    }

    const { data, error } = await supabase
      .from("historial_movimientos")
      .select("*")
      .order("fecha_hora", { ascending: false });

    if (error) {
      console.error("Error descargando movimientos de Supabase:", error);
      return false;
    }

    const remoteMovements = data || [];
    const remoteIds = new Set(remoteMovements.map((m: any) => m.id));

    // 1. Obtener todos los movimientos locales de SQLite
    const localMovements = await getAllMovimientos();

    // 2. Eliminar localmente los movimientos que ya no existen en Supabase (solo si estaban sincronizados)
    for (const local of localMovements) {
      if (local.sinc === 1 && !remoteIds.has(local.id)) {
        await deleteMovimiento(local.id);
      }
    }

    // 3. Guardar en SQLite cada movimiento remoto (usando INSERT OR REPLACE para asegurar que se actualicen las cantidades de registros existentes)
    for (const remote of remoteMovements) {
      const mov: Movimiento = {
        id: remote.id,
        usuario_id: remote.usuario_id,
        estante_id: remote.estante_id || "",
        producto_id: remote.producto_id || "",
        tipo_accion: remote.tipo_accion,
        diferencia_peso_gramos: remote.diferencia_peso_gramos,
        cantidad: remote.cantidad || 0,
        fecha_hora: remote.fecha_hora,
        sinc: 1, // Ya sincronizado
      };
      await insertMovimientoFromSupabase(mov);
    }

    console.log(`✅ Sincronización con Supabase completada: ${remoteMovements.length} remotos.`);
    return true;
  } catch (error) {
    console.error("Error descargando movimientos de Supabase:", error);
    return false;
  }
}

/**
 * Sincroniza todos los cambios pendientes
 */
export async function syncAllPendingChanges(): Promise<void> {
  try {
    const pending = await getPendingSyncChanges();
    console.log(`🔄 Sincronizando ${pending.length} cambios pendientes...`);

    for (const movimiento of pending) {
      // Reintentar sincronizar
      await syncMovimientoToSupabase(movimiento, "INSERT");
    }

    console.log("✅ Todos los cambios han sido sincronizados");
  } catch (error) {
    console.error("Error sincronizando cambios:", error);
  }
}
