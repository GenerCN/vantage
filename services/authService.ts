import { supabase } from '../lib/supabase';

export const authService = {
  /**
   * Registra un usuario con username y contraseña.
   */
  async signUp(username: string, password: string, fullName: string) {
    // Generar email automático basado en username
    const email = `${username}@vantage.com`;
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        },
      },
    });
    return { data, error };
  },

  /**
   * Inicia sesión con username y contraseña.
   */
  async signIn(username: string, password: string) {
    // Usar username para generar el email que se usará en auth
    const email = `${username}@vantage.com`;
    
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
