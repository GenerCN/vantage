import { supabase } from '../lib/supabase';

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
}

export const rolesService = {
  /**
   * Obtiene todos los roles disponibles desde Supabase
   */
  async obtenerRoles(): Promise<Rol[]> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, nombre, descripcion')
        .order('id', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo roles:", error);
      return [];
    }
  }
};
