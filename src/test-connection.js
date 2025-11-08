import { supabase } from './config/supabaseClient';

// Script de prueba para verificar conexión a Supabase
// Ejecutar desde la consola del navegador

console.log('🔍 Probando conexión a Supabase...');

// Test 1: Verificar configuración
console.log('📋 URL de Supabase:', import.meta.env.VITE_SUPABASE_URL);

// Test 2: Intentar leer greenhouses
async function testConnection() {
  try {
    console.log('📡 Intentando conectar...');
    
    const { data, error, count } = await supabase
      .from('greenhouses')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ Error:', error);
      console.log('💡 Mensaje:', error.message);
      console.log('💡 Código:', error.code);
      
      if (error.code === 'PGRST301' || error.message.includes('policy')) {
        console.log('');
        console.log('🔒 PROBLEMA DETECTADO: Row Level Security (RLS)');
        console.log('');
        console.log('✅ SOLUCIÓN:');
        console.log('1. Ve a Supabase SQL Editor');
        console.log('2. Ejecuta el archivo fix_rls_policies.sql');
        console.log('3. Recarga esta página');
      }
      
      return;
    }

    console.log('✅ Conexión exitosa!');
    console.log('📊 Datos encontrados:', count);
    console.log('🏠 Invernaderos:', data);
    
    if (data && data.length > 0) {
      console.log('');
      console.log('🎉 TODO ESTÁ FUNCIONANDO CORRECTAMENTE');
      console.log('Si no ves los datos en la página, presiona Ctrl+R para recargar');
    } else {
      console.log('');
      console.log('📦 No hay datos en la tabla greenhouses');
      console.log('Inserta algunos datos de prueba en Supabase');
    }
    
  } catch (err) {
    console.error('💥 Error inesperado:', err);
  }
}

// Ejecutar test
testConnection();

export { testConnection };
