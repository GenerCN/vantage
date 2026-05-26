import { supabase } from '../lib/supabase';

export interface Rol {
  nombre: string;
}

export interface Perfil {
  id: string; // El UUID que viene de auth.users
  nombre_completo: string;
  role_id: number;
  roles?: Rol | null; // Relación con la tabla de roles
  actualizado_en?: string;
}

export const perfilService = {
  /**
   * Guarda o actualiza la información extendida del usuario.
   */
  async upsertPerfil(perfil: Perfil) {
    const { data, error } = await supabase
      .from('perfiles')
      .upsert({
        id: perfil.id,
        nombre_completo: perfil.nombre_completo,
        role_id: perfil.role_id,
        actualizado_en: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Obtiene el perfil completo incluyendo el nombre del rol.
   */
  async getPerfilActual(userId: string) {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*, roles(nombre)')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
};
