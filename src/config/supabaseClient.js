import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
// IMPORTANTE: Reemplaza estas variables con tus credenciales de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verificar si las credenciales están configuradas
export const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         supabaseUrl !== 'YOUR_SUPABASE_URL' &&
         supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
         supabaseUrl.includes('supabase.co');
};

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
