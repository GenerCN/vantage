import { supabase } from '../lib/supabase';

export const authService = {
  /**
   * Registra un usuario con username y contraseña.
   */
  async signUp(username: string, password: string, fullName: string, roleId?: number) {
    // Sanitizar username para evitar errores de mayúsculas o espacios invisibles
    const sanitizedUsername = username.trim().toLowerCase();
    const email = `${sanitizedUsername}@vantage.com`;
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          username: sanitizedUsername,
          role_id: roleId,
        },
      },
    });
    return { data, error };
  },

  /**
   * Inicia sesión con username y contraseña.
   */
  async signIn(username: string, password: string) {
    // Sanitizar username para evitar errores de mayúsculas o espacios invisibles
    const sanitizedUsername = username.trim().toLowerCase();
    const email = `${sanitizedUsername}@vantage.com`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    return { data, error };
  },

  /**
   * Cierra la sesión del usuario.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }
};
