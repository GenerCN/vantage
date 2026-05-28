import { checkNetworkConnection } from "@/hooks/useNetworkState";
import {
  clearEstantesLocales,
  deleteEstanteLocal,
  getEstantesConInventario,
  insertOrReplaceEstante,
  insertOrReplaceInventario,
  syncEstantesAtomic,
  updateEstanteLocal,
  type Estante,
  type EstanteConDetalle,
  type InventarioActual
} from "@/lib/sqlite/estantesDb";
import { supabase } from "@/lib/supabase";

/**
 * Genera un UUID v4 seguro para IDs
 */
function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let isSyncing = false;

export const estantesService = {
  /**
   * Obtiene todos los estantes con su inventario del almacenamiento local SQLite
   */
  async getEstantes(): Promise<EstanteConDetalle[]> {
    return await getEstantesConInventario();
  },

  /**
   * Registra un nuevo estante físico en la base de datos (con su MAC y ubicación)
   */
  async registerEstante(macAddress: string, ubicacion: string): Promise<Estante | null> {
    try {
      const isConnected = await checkNetworkConnection();
      const id = generateId();

      const newEstante: Estante = {
        id,
        mac_address: macAddress.toUpperCase().trim(),
        ubicacion_fisica: ubicacion.trim(),
        esta_abierto: 0,
        alerta_activa: 0,
        ultima_conexion: new Date().toISOString(),
      };

      // 1. Guardar en SQLite local
      await insertOrReplaceEstante(newEstante);

      // 2. Si hay red, sincronizar en la nube
      if (isConnected && supabase) {
        const { error } = await supabase
          .from("estantes")
          .insert([
            {
              id: newEstante.id,
              mac_address: newEstante.mac_address,
              ubicacion_fisica: newEstante.ubicacion_fisica,
              esta_abierto: false,
              alerta_activa: false,
            },
          ]);

        if (error) {
          console.log("⚠️ [Supabase error ignored for LogBox] Error registrando estante en Supabase:", error);
          // Si hay error en Supabase por UNIQUE constraint (MAC duplicada), lanzar error
          if ((error as any).code === "23505") {
            throw new Error(`La dirección MAC "${newEstante.mac_address}" ya está registrada.`);
          }
        }
      }

      console.log(`✅ Estante registrado exitosamente: ${newEstante.mac_address}`);
      return newEstante;
    } catch (error) {
      console.log("⚠️ [LogBox-safe] Error en registerEstante:", error);
      throw error;
    }
  },

  /**
   * Asigna un producto a un estante (crea o actualiza el registro en inventario_actual).
   * Esto sirve para indicarle a la báscula física qué producto está conteniendo
   * y cuál es su peso unitario, recalibrando la báscula de forma remota.
   */
  async linkProductToShelf(estanteId: string, productoId: string): Promise<boolean> {
    try {
      const isConnected = await checkNetworkConnection();
      const id = generateId();

      const newInventario: InventarioActual = {
        id,
        estante_id: estanteId,
        producto_id: productoId,
        peso_total_gramos: 0.0,
        cantidad_calculada: 0,
        ultima_actualizacion: new Date().toISOString(),
      };

      // 1. Guardar localmente
      await insertOrReplaceInventario(newInventario);

      // 2. Sincronizar en la nube
      if (isConnected && supabase) {
        // Enforce 1-to-1 relationship: Delete any existing product links for this specific shelf first
        await supabase
          .from("inventario_actual")
          .delete()
          .eq("estante_id", estanteId);

        // Insert the fresh unique association
        const { error } = await supabase
          .from("inventario_actual")
          .insert({
            estante_id: estanteId,
            producto_id: productoId,
            peso_total_gramos: 0.0,
            cantidad_calculada: 0,
            ultima_actualizacion: new Date().toISOString(),
          });

        if (error) {
          console.log("⚠️ [LogBox-safe] Error vinculando producto a estante en Supabase:", error);
          return false;
        }
      }

      // 3. Forzar redescarga para alinear el estado SQLite local inmediatamente
      await this.downloadEstantesFromSupabase();

      console.log(`✅ Producto ${productoId} vinculado a Estante ${estanteId} (se eliminó cualquier vínculo previo)`);
      return true;
    } catch (error) {
      console.log("⚠️ [LogBox-safe] Error en linkProductToShelf:", error);
      return false;
    }
  },

  /**
   * Desvincula cualquier producto de un estante (elimina la relación en inventario_actual)
   */
  async unlinkProductFromShelf(estanteId: string, productoId: string): Promise<boolean> {
    try {
      const isConnected = await checkNetworkConnection();

      // 1. Eliminar localmente en SQLite es manejado al descargar, pero podemos hacer delete directo
      // Para simplificar localmente, eliminaremos el estante de SQLite y forzaremos redescarga
      
      // 2. Si hay red, eliminar de Supabase
      if (isConnected && supabase) {
        const { error } = await supabase
          .from("inventario_actual")
          .delete()
          .eq("estante_id", estanteId)
          .eq("producto_id", productoId);

        if (error) {
          console.log("⚠️ [LogBox-safe] Error desvinculando de Supabase:", error);
          return false;
        }
      }

      await this.downloadEstantesFromSupabase();
      return true;
    } catch (error) {
      console.log("⚠️ [LogBox-safe] Error en unlinkProductFromShelf:", error);
      return false;
    }
  },

  /**
   * Actualiza la ubicación de un estante
   */
  async updateUbicacion(id: string, ubicacion: string): Promise<boolean> {
    try {
      const isConnected = await checkNetworkConnection();

      // 1. SQLite
      await updateEstanteLocal(id, ubicacion);

      // 2. Supabase
      if (isConnected && supabase) {
        const { error } = await supabase
          .from("estantes")
          .update({ ubicacion_fisica: ubicacion })
          .eq("id", id);

        if (error) {
          console.log("⚠️ [LogBox-safe] Error actualizando ubicación en Supabase:", error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.log("⚠️ [LogBox-safe] Error en updateUbicacion:", error);
      return false;
    }
  },

  /**
   * Elimina un estante físicamente
   */
  async deleteEstante(id: string): Promise<boolean> {
    try {
      const isConnected = await checkNetworkConnection();

      // 1. SQLite
      await deleteEstanteLocal(id);

      // 2. Supabase
      if (isConnected && supabase) {
        const { error } = await supabase
          .from("estantes")
          .delete()
          .eq("id", id);

        if (error) {
          console.log("⚠️ [LogBox-safe] Error eliminando estante en Supabase:", error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.log("⚠️ [LogBox-safe] Error en deleteEstante:", error);
      return false;
    }
  },

  /**
   * Descarga todos los estantes y su inventario activo desde Supabase y los guarda en SQLite
   */
  async downloadEstantesFromSupabase(): Promise<boolean> {
    if (isSyncing) {
      console.log("🔄 [LogBox-safe] Sincronización en curso, omitiendo llamada duplicada paralela.");
      return false;
    }
    isSyncing = true;
    try {
      if (!supabase) return false;

      const isConnected = await checkNetworkConnection();
      if (!isConnected) return false;

      // Descargar estantes
      const { data: estantesData, error: estantesError } = await supabase
        .from("estantes")
        .select("*");

      if (estantesError) {
        console.log("⚠️ [LogBox-safe] Error descargando estantes:", estantesError);
        return false;
      }

      // Descargar inventarios
      const { data: invData, error: invError } = await supabase
        .from("inventario_actual")
        .select("*");

      if (invError) {
        console.log("⚠️ [LogBox-safe] Error descargando inventario_actual:", invError);
        return false;
      }

      // Estructurar los estantes para la transacción atómica
      const estantesList: Estante[] = (estantesData || []).map((e) => ({
        id: e.id,
        mac_address: e.mac_address,
        ubicacion_fisica: e.ubicacion_fisica,
        esta_abierto: e.esta_abierto ? 1 : 0,
        alerta_activa: e.alerta_activa ? 1 : 0,
        ultima_conexion: e.ultima_conexion,
      }));

      // Estructurar los inventarios para la transacción atómica (ignorando nulos)
      const invList: InventarioActual[] = [];
      for (const i of (invData || [])) {
        if (!i.producto_id) {
          console.warn(`⚠️ Saltando inventario_actual id ${i.id} porque producto_id es nulo o vacío.`);
          continue;
        }
        invList.push({
          id: i.id,
          estante_id: i.estante_id,
          producto_id: i.producto_id,
          peso_total_gramos: i.peso_total_gramos || 0.0,
          cantidad_calculada: i.cantidad_calculada || 0,
          ultima_actualizacion: i.ultima_actualizacion,
        });
      }

      // Ejecutar sincronización atómica local en SQLite
      const success = await syncEstantesAtomic(estantesList, invList);
      if (success) {
        console.log(`☁️  Sincronizados atómicamente ${estantesList.length} estantes y ${invList.length} inventarios desde Supabase.`);
      }
      return success;
    } catch (error) {
      console.log("⚠️ [LogBox-safe] Error en downloadEstantesFromSupabase:", error);
      return false;
    } finally {
      isSyncing = false;
    }
  }
};
