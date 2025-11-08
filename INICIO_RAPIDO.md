# Guía Rápida de Inicio

## ✅ Estructura Integrada

Se ha integrado exitosamente la siguiente estructura al proyecto:

```
src/
├── components/
│   ├── Dashboard.jsx          ✅ Componente principal
│   ├── InvernaderoCard.jsx    ✅ Tarjeta de invernadero
│   ├── ZonaDetalle.jsx        ✅ Modal de detalles de zona
│   ├── SensorDisplay.jsx      ✅ Visualización de sensores
│   ├── ActuadorBoton.jsx      ✅ Control de actuadores
│   ├── HistoricoChart.jsx     ✅ Gráficas históricas
│   ├── SetupGuide.jsx         ✅ Guía de configuración
│   └── *.css                  ✅ Estilos de componentes
├── config/
│   └── supabaseClient.js      ✅ Configuración de Supabase
├── App.jsx                    ✅ Actualizado
├── main.jsx                   ✅ Sin cambios
└── index.css                  ✅ Actualizado
```

## 🚀 Pasos para Iniciar

### 1. Instalar Dependencias (Ya Hecho ✅)

```bash
npm install
```

Dependencias instaladas:
- `@supabase/supabase-js` - Cliente de Supabase
- `recharts` - Librería de gráficos

### 2. Configurar Supabase

#### Crear Proyecto en Supabase
1. Ve a https://supabase.com
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se inicialice (2-3 minutos)

#### Ejecutar Script SQL
1. En tu proyecto de Supabase, ve a SQL Editor
2. Copia y pega el contenido de `database_setup.sql`
3. Ejecuta el script (botón "Run")
4. Verifica que se crearon todas las tablas

#### Configurar Variables de Entorno
1. En Supabase, ve a Settings → API
2. Copia tu "Project URL" y "anon public key"
3. Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 3. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará en: http://localhost:5173

## 🎯 Funcionalidades Implementadas

### Dashboard Principal
- ✅ Visualización de todos los invernaderos
- ✅ Botón de actualización manual
- ✅ Grid responsivo de tarjetas

### Invernadero Card
- ✅ Expandible/colapsable
- ✅ Lista de zonas por invernadero
- ✅ Navegación a detalles de zona

### Zona Detalle (Modal)
- ✅ Tabs para organizar información
- ✅ Vista de sensores con lecturas en tiempo real
- ✅ Control de actuadores
- ✅ Información de plantas
- ✅ Gráficos históricos

### Sensores
- ✅ Tarjetas individuales por sensor
- ✅ Última lectura registrada
- ✅ Iconos según tipo de sensor
- ✅ Información de instalación

### Actuadores
- ✅ Botones de activación
- ✅ Registro en historial de riego
- ✅ Estados de carga

### Histórico
- ✅ Gráficos de línea con Recharts
- ✅ Selector de sensor
- ✅ Filtros por período (24h, 7d, 30d)
- ✅ Datos formateados y legibles

## 🔄 Funcionalidades en Tiempo Real

El sistema utiliza Supabase Realtime para actualizar automáticamente:
- Lecturas de sensores
- Estados de actuadores

Para habilitar Realtime:
1. En Supabase, ve a Database → Replication
2. Habilita Realtime para: `sensors`, `Actuators`, `Readings`

## 📊 Flujo de Datos

```
Arduino → Supabase
    ↓
React (Frontend) ← Realtime Updates
    ↓
Usuario ve datos actualizados
    ↓
Usuario activa actuador
    ↓
Supabase registra comando
    ↓
Arduino consulta comandos
    ↓
Riego se activa
```

## 🛠️ Integración con Arduino

### Ejemplo de código Arduino (ESP8266/ESP32)

```cpp
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

// Configuración
const char* ssid = "tu-wifi";
const char* password = "tu-password";
const char* supabaseUrl = "https://tu-proyecto.supabase.co";
const char* supabaseKey = "tu-anon-key";

void sendReading(int sensorId, float value) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Para desarrollo
    HTTPClient http;
    
    String url = String(supabaseUrl) + "/rest/v1/Readings";
    http.begin(client, url);
    
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + String(supabaseKey));
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Prefer", "return=minimal");
    
    String payload = "{\"sensorId\":" + String(sensorId) + 
                     ",\"value\":" + String(value) + "}";
    
    int httpCode = http.POST(payload);
    
    if (httpCode > 0) {
      Serial.println("Lectura enviada: " + String(httpCode));
    }
    
    http.end();
  }
}

void loop() {
  float humidity = readSensor(); // Tu función
  sendReading(1, humidity); // sensorId = 1
  delay(30000); // Cada 30 segundos
}
```

## 🎨 Personalización

### Colores
Los colores principales están en los archivos CSS. Para cambiar el tema:
- Dashboard: `src/components/Dashboard.css`
- Tarjetas: Gradientes en archivos `.css` individuales

### Iconos
Los iconos de sensores se asignan en `SensorDisplay.jsx`:
```jsx
const getSensorIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'humedad': return '💧';
    case 'temperatura': return '🌡️';
    // Agregar más tipos aquí
  }
}
```

## 📝 Notas Importantes

1. **Seguridad**: Las políticas RLS en el script SQL son para desarrollo. En producción, implementa autenticación de usuarios.

2. **Actualización de Datos**: Los sensores se actualizan cada 30 segundos. Puedes cambiar este intervalo en `SensorDisplay.jsx`.

3. **Errores de ESLint**: Hay algunas advertencias de dependencias en useEffect. Son advertencias menores que no afectan la funcionalidad.

4. **Variables de Entorno**: NUNCA subas el archivo `.env` a GitHub. Ya está en `.gitignore`.

## 🐛 Solución de Problemas

### "No hay invernaderos registrados"
- Verifica que el script SQL se ejecutó correctamente
- Revisa que las políticas RLS permitan lectura

### Error de conexión a Supabase
- Verifica las credenciales en `.env`
- Reinicia el servidor de desarrollo
- Revisa la consola del navegador para errores

### Gráficos no muestran datos
- Verifica que hay lecturas en la tabla `Readings`
- Revisa que los `sensorId` coinciden

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Recharts](https://recharts.org/)
- [Guía de React Hooks](https://react.dev/reference/react)
- [ESP8266 Arduino](https://arduino-esp8266.readthedocs.io/)

## ✅ Checklist de Verificación

- [ ] Dependencias instaladas
- [ ] Proyecto de Supabase creado
- [ ] Script SQL ejecutado
- [ ] Variables de entorno configuradas
- [ ] Servidor de desarrollo corriendo
- [ ] Se ve la guía de configuración o el dashboard
- [ ] Datos de ejemplo visibles (si los insertaste)
- [ ] Realtime habilitado en Supabase

---

¡Tu sistema de riego está listo! 🌱💧
