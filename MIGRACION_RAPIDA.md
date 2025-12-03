# ⚡ Guía de Migración Rápida

## 🎯 Pasos para Activar Todas las Mejoras

### Paso 1: Actualizar Base de Datos (30 segundos)
```bash
# En PowerShell
cd C:\Users\masta\Documents\GitHub\sistema_de_riego_arduino
mysql -u root -p < database/migrations/add_duracion_calendario.sql
```

**Verificar**:
```sql
USE sistema_riego;
DESCRIBE calendario;
-- Debe aparecer columna: duracion_minutos INT DEFAULT 10
```

---

### Paso 2: Reiniciar Servidor Node.js (10 segundos)
```bash
# Detener servidor actual (Ctrl+C)
# Reiniciar
npm run dev
```

**Verificar en logs**:
```
✅ Scheduler de riego iniciado
✓ MQTT Broker: ✓ Conectado
📡 Socket.IO configurado en SchedulerService
```

---

### Paso 3: Actualizar Arduino (3 minutos)

1. Abrir Arduino IDE
2. Cargar: `arduino/sistema_riego_mqtt_mejorado.ino`
3. Configurar líneas 18-19 (WiFi) y línea 28 (API_KEY)
4. Tools → Board → Arduino UNO R4 WiFi
5. Tools → Port → Seleccionar COM
6. Upload (Ctrl+U)

**Verificar en Serial Monitor (115200 baud)**:
```
✅ WiFi Conectado
✅ MQTT Conectado
✅ Sensores inicializados correctamente
Sistema listo - Loop iniciado
```

---

### Paso 4: Verificar Frontend (10 segundos)

1. Abrir navegador: `http://localhost:3000`
2. Login
3. Abrir Consola del Navegador (F12)

**Verificar**:
```javascript
// Debe aparecer:
🔌 Conectado a WebSockets
```

---

## ✅ Pruebas Rápidas

### Prueba 1: Riego Manual + Calendario Desactivado
```javascript
// En página de dispositivo, ejecutar en consola:
controlActuator(1, 'encender');  // ID del actuador

// Verificar:
// ✅ Bomba se enciende en Arduino
// ✅ Notificación: "Calendario desactivado por riego manual"
// ✅ En BD: UPDATE calendario SET estado=false WHERE...
```

### Prueba 2: Configuración Remota de Umbrales
```javascript
// En consola del navegador:
updateThresholds(1);  // ID del dispositivo

// Ingresar cuando pregunte:
// Min: 50
// Max: 75

// Verificar en Arduino Serial Monitor:
// ⚙️ Umbrales actualizados remotamente: 50% - 75%
// LCD muestra nuevos valores en pantalla 3
```

### Prueba 3: Parada de Emergencia
```javascript
// En consola:
emergencyStop(1);

// Verificar:
// ✅ Todos los actuadores se apagan inmediatamente
// ✅ Arduino muestra "EMERGENCIA" en LCD
// ✅ Notificación: "Parada de emergencia ejecutada"
```

### Prueba 4: Calendario Automático
```sql
-- Crear evento de prueba para dentro de 2 minutos
INSERT INTO calendario (
  invernadero_id, 
  dia_semana, 
  hora_inicial, 
  hora_final,
  duracion_minutos,
  usuario_id,
  estado
) VALUES (
  1,
  'Martes',  -- Cambiar al día actual
  '14:30',   -- Cambiar a 2 min después de hora actual
  '14:40',
  5,         -- Duración 5 minutos
  1,
  true
);
```

**Esperar a la hora configurada y verificar**:
1. ✅ Servidor log: `🚿 NOTIFICACIÓN DE RIEGO: Es hora de regar...`
2. ✅ Servidor log: `🚿 Riego automático activado: Bomba...`
3. ✅ Arduino: Bomba se enciende
4. ✅ Frontend: Notificación con sonido
5. ✅ Después de 5 min: Bomba se apaga automáticamente

---

## 🔧 Solución de Problemas

### Problema: "Columna duracion_minutos no existe"
```bash
# Ejecutar migración de nuevo
mysql -u root -p sistema_riego < database/migrations/add_duracion_calendario.sql
```

### Problema: "Socket.IO no conecta"
```javascript
// Verificar en server.js que Socket.IO esté iniciado
// Debe estar en línea 8-9:
const io = new Server(server);
```

### Problema: "Arduino no recibe comandos"
```cpp
// Verificar en Serial Monitor:
// - WiFi conectado ✅
// - MQTT conectado ✅
// - Suscrito a comandos ✅

// Si falla, revisar:
// 1. API_KEY coincide con BD
// 2. Broker MQTT correcto
// 3. Credenciales MQTT correctas
```

### Problema: "Calendario no activa bomba"
```javascript
// Verificar en server.js línea 37-38:
const schedulerService = require('./src/services/schedulerService');
schedulerService.start();

// Debe aparecer en log:
// ✅ Scheduler de riego iniciado
```

---

## 📊 Estado Esperado Después de Migración

| Componente | Estado | Verificación |
|------------|--------|--------------|
| MySQL | ✅ Actualizado | `DESCRIBE calendario` muestra duracion_minutos |
| Node.js | ✅ Funcionando | Log muestra "Scheduler iniciado" |
| Arduino | ✅ Actualizado | Serial Monitor muestra "Sistema listo" |
| Frontend | ✅ Conectado | Console muestra "Conectado a WebSockets" |
| MQTT | ✅ Activo | Servidor y Arduino reportan "Conectado" |

---

## 🎉 Funcionalidades Activadas

Después de completar la migración, tendrás:

- ✅ Riego manual desde web → Arduino (< 100ms)
- ✅ Calendario activa/apaga bomba automáticamente
- ✅ Duración configurable de riego
- ✅ Calendario se desactiva con riego manual
- ✅ Parada de emergencia
- ✅ Configuración remota de umbrales
- ✅ Actualizaciones UI en tiempo real
- ✅ Confirmaciones Arduino → Web
- ✅ Notificaciones con sonido

---

## 📞 Contacto

Si necesitas ayuda:
1. Verificar logs en servidor Node.js
2. Verificar Serial Monitor de Arduino
3. Verificar consola del navegador (F12)
4. Revisar `IMPLEMENTACION_COMPLETA.md` para detalles técnicos

---

**Tiempo total de migración: ~5 minutos**  
**Sin breaking changes - 100% compatible con código anterior**
