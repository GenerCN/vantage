import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * INSTRUCCIONES PARA CONFIGURAR SUPABASE (Nuevo formato):
 * 
 * 1. Ve a https://supabase.com/dashboard/project
 * 2. En Settings > API, encontrarás:
 *    - Project URL (EXPO_PUBLIC_SUPABASE_URL)
 *    - Publishable Key (EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
 * 3. Copia estos valores al archivo .env.local (usa .env.example como referencia)
 * 4. IMPORTANTE: Nunca commits .env.local a git
 */

// Usar variables de entorno del archivo .env.local
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!SUPABASE_URL) {
  console.warn('EXPO_PUBLIC_SUPABASE_URL no está configurada en .env.local');
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.warn('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY no está configurada en .env.local');
}

// Crear cliente con URL y publishable key, configurando almacenamiento persistente
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;

