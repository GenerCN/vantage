import { checkNetworkConnection } from "@/hooks/useNetworkState";
import {
  clearEstantesLocales,
  deleteEstanteLocal,
  getEstantesConInventario,
  insertOrReplaceEstante,
  insertOrReplaceInventario,
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
          console.error("Error registrando estante en Supabase:", error);
          // Si hay error en Supabase por UNIQUE constraint (MAC duplicada), lanzar error
          if ((error as any).code === "23505") {
            throw new Error(`La dirección MAC "${newEstante.mac_address}" ya está registrada.`);
          }
        }
      }

      console.log(`✅ Estante registrado exitosamente: ${newEstante.mac_address}`);
      return newEstante;
    } catch (error) {
      console.error("Error en registerEstante:", error);
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
        // Usar upsert para evitar conflictos si ya existía una relación
        const { error } = await supabase
          .from("inventario_actual")
          .upsert(
            {
              estante_id: estanteId,
              producto_id: productoId,
              peso_total_gramos: 0.0,
              cantidad_calculada: 0,
              ultima_actualizacion: new Date().toISOString(),
            },
            { onConflict: "estante_id, producto_id" }
          );

        if (error) {
          console.error("Error vinculando producto a estante en Supabase:", error);
          return false;
        }
      }

      console.log(`✅ Producto ${productoId} vinculado a Estante ${estanteId}`);
      return true;
    } catch (error) {
      console.error("Error en linkProductToShelf:", error);
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
          console.error("Error desvinculando de Supabase:", error);
          return false;
        }
      }

      await this.downloadEstantesFromSupabase();
      return true;
    } catch (error) {
      console.error("Error en unlinkProductFromShelf:", error);
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
          console.error("Error actualizando ubicación en Supabase:", error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error en updateUbicacion:", error);
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
          console.error("Error eliminando estante en Supabase:", error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error en deleteEstante:", error);
      return false;
    }
  },

  /**
   * Descarga todos los estantes y su inventario activo desde Supabase y los guarda en SQLite
   */
  async downloadEstantesFromSupabase(): Promise<boolean> {
    try {
      if (!supabase) return false;

      const isConnected = await checkNetworkConnection();
      if (!isConnected) return false;

      // Descargar estantes
      const { data: estantesData, error: estantesError } = await supabase
        .from("estantes")
        .select("*");

      if (estantesError) {
        console.error("Error descargando estantes:", estantesError);
        return false;
      }

      // Descargar inventarios
      const { data: invData, error: invError } = await supabase
        .from("inventario_actual")
        .select("*");

      if (invError) {
        console.error("Error descargando inventario_actual:", invError);
        return false;
      }

      // Limpiar locales primero
      await clearEstantesLocales();

      // Insertar estantes en SQLite
      for (const e of (estantesData || [])) {
        const estante: Estante = {
          id: e.id,
          mac_address: e.mac_address,
          ubicacion_fisica: e.ubicacion_fisica,
          esta_abierto: e.esta_abierto ? 1 : 0,
          alerta_activa: e.alerta_activa ? 1 : 0,
          ultima_conexion: e.ultima_conexion,
        };
        await insertOrReplaceEstante(estante);
      }

      // Insertar inventarios en SQLite
      for (const i of (invData || [])) {
        const inv: InventarioActual = {
          id: i.id,
          estante_id: i.estante_id,
          producto_id: i.producto_id,
          peso_total_gramos: i.peso_total_gramos || 0.0,
          cantidad_calculada: i.cantidad_calculada || 0,
          ultima_actualizacion: i.ultima_actualizacion,
        };
        await insertOrReplaceInventario(inv);
      }

      console.log(`☁️  Sincronizados ${estantesData?.length} estantes y ${invData?.length} inventarios desde Supabase.`);
      return true;
    } catch (error) {
      console.error("Error en downloadEstantesFromSupabase:", error);
      return false;
    }
  }
};
