# 📚 Documentación - Sistema de Riego Arduino IoT

Bienvenido a la documentación del Sistema de Riego Arduino IoT. Aquí encontrarás toda la información necesaria para entender, configurar y mantener el proyecto.

> 📁 **[Ver Estructura Completa del Proyecto →](PROJECT_STRUCTURE.md)**  
> Diagrama detallado de carpetas, archivos y organización del código.

---

## 📖 Índice de Documentación

### 🚀 Inicio Rápido
- **[QUICKSTART.md](QUICKSTART.md)** - Guía rápida de instalación y configuración
- **[QUICKSTART_MQTT.md](QUICKSTART_MQTT.md)** - Inicio rápido específico para MQTT

### 🏗️ Arquitectura
- **[ARCHITECTURE_MQTT.md](ARCHITECTURE_MQTT.md)** - Diagrama y explicación de la arquitectura MQTT
- **[MQTT_MIGRATION.md](MQTT_MIGRATION.md)** - Guía de migración a MQTT

### 📝 Guías de Implementación
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Resumen de mejoras implementadas (v2.0)
- **[MEJORAS_V2.1.0.md](MEJORAS_V2.1.0.md)** - Nuevas mejoras implementadas (v2.1.0)
- **[RESUMEN.md](RESUMEN.md)** - Resumen general del proyecto

### 🎨 Componentes y UI
- **[COMPONENTS_GUIDE.md](COMPONENTS_GUIDE.md)** - Guía de componentes reutilizables
- **[ADD_AVATAR_INSTRUCTIONS.md](ADD_AVATAR_INSTRUCTIONS.md)** - Cómo agregar avatares de usuario

### ⚙️ Configuración
- **[CONFIGURACION_VARIABLES.md](CONFIGURACION_VARIABLES.md)** - Variables de entorno y configuración

### 🔧 Hardware y Sensores
- **[SENSOR_LM35CZ.md](SENSOR_LM35CZ.md)** - Documentación del sensor de temperatura LM35

### 📋 Historial de Cambios
- **[CHANGELOG_MQTT.md](CHANGELOG_MQTT.md)** - Registro de cambios relacionados con MQTT

### 🚢 Despliegue
- **[DEPLOY.md](DEPLOY.md)** - Guía de despliegue en producción

### 🐛 Solución de Problemas
- **[troubleshooting/DIAGNOSTICO_SENSORES.md](troubleshooting/DIAGNOSTICO_SENSORES.md)** - Diagnóstico de problemas con sensores
- **[troubleshooting/SOLUCION_SENSORES.md](troubleshooting/SOLUCION_SENSORES.md)** - Soluciones para problemas de sensores
- **[troubleshooting/SOLUCION_SENSORES_COMPLETA.md](troubleshooting/SOLUCION_SENSORES_COMPLETA.md)** - Solución completa para sensores
- **[troubleshooting/SOLUCION_DASHBOARD.md](troubleshooting/SOLUCION_DASHBOARD.md)** - Soluciones para problemas del dashboard

---

## 📁 Estructura de Documentación

```
docs/
├── README.md                          # Este archivo (índice)
├── QUICKSTART.md                      # Inicio rápido
├── QUICKSTART_MQTT.md                 # Inicio rápido MQTT
├── ARCHITECTURE_MQTT.md               # Arquitectura del sistema
├── MQTT_MIGRATION.md                  # Guía de migración MQTT
├── IMPLEMENTATION_SUMMARY.md          # Resumen de implementación v2.0
├── MEJORAS_V2.1.0.md                 # Mejoras v2.1.0
├── RESUMEN.md                         # Resumen general
├── COMPONENTS_GUIDE.md                # Guía de componentes
├── ADD_AVATAR_INSTRUCTIONS.md         # Instrucciones de avatares
├── CONFIGURACION_VARIABLES.md         # Variables de entorno
├── SENSOR_LM35CZ.md                   # Documentación sensor LM35
├── CHANGELOG_MQTT.md                  # Changelog MQTT
├── DEPLOY.md                          # Guía de despliegue
└── troubleshooting/                   # Solución de problemas
    ├── DIAGNOSTICO_SENSORES.md
    ├── SOLUCION_SENSORES.md
    ├── SOLUCION_SENSORES_COMPLETA.md
    └── SOLUCION_DASHBOARD.md
```

---

## 🎯 ¿Por Dónde Empezar?

### Si eres nuevo en el proyecto:
1. Lee el **[README.md principal](../README.md)** en la raíz del proyecto
2. Sigue la **[QUICKSTART.md](QUICKSTART.md)** para configurar el entorno
3. Revisa la **[ARCHITECTURE_MQTT.md](ARCHITECTURE_MQTT.md)** para entender el sistema

### Si necesitas configurar Arduino:
1. Lee **[CONFIGURACION_VARIABLES.md](CONFIGURACION_VARIABLES.md)**
2. Consulta **[SENSOR_LM35CZ.md](SENSOR_LM35CZ.md)** para sensores específicos
3. Revisa **[troubleshooting/DIAGNOSTICO_SENSORES.md](troubleshooting/DIAGNOSTICO_SENSORES.md)** si hay problemas

### Si quieres contribuir:
1. Lee **[COMPONENTS_GUIDE.md](COMPONENTS_GUIDE.md)** para usar componentes existentes
2. Revisa **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** para entender la estructura
3. Consulta **[MEJORAS_V2.1.0.md](MEJORAS_V2.1.0.md)** para ver las últimas mejoras

### Si vas a desplegar:
1. Lee **[DEPLOY.md](DEPLOY.md)** completo
2. Configura variables según **[CONFIGURACION_VARIABLES.md](CONFIGURACION_VARIABLES.md)**
3. Sigue la checklist de despliegue

---

## 🔍 Búsqueda Rápida

### Problemas Comunes
- **Sensores no reportan datos**: Ver [DIAGNOSTICO_SENSORES.md](troubleshooting/DIAGNOSTICO_SENSORES.md)
- **Arduino no se conecta**: Ver [SOLUCION_SENSORES.md](troubleshooting/SOLUCION_SENSORES.md)
- **Dashboard no actualiza**: Ver [SOLUCION_DASHBOARD.md](troubleshooting/SOLUCION_DASHBOARD.md)

### Configuración
- **Variables de entorno**: [CONFIGURACION_VARIABLES.md](CONFIGURACION_VARIABLES.md)
- **MQTT Setup**: [QUICKSTART_MQTT.md](QUICKSTART_MQTT.md)
- **Sensores**: [SENSOR_LM35CZ.md](SENSOR_LM35CZ.md)

### Desarrollo
- **Componentes UI**: [COMPONENTS_GUIDE.md](COMPONENTS_GUIDE.md)
- **Arquitectura**: [ARCHITECTURE_MQTT.md](ARCHITECTURE_MQTT.md)
- **Changelog**: [CHANGELOG_MQTT.md](CHANGELOG_MQTT.md)

---

## 📞 Soporte

Si no encuentras la información que necesitas:
1. Revisa la documentación relevante en este índice
2. Busca en los issues de GitHub
3. Consulta el [README principal](../README.md)
4. Abre un nuevo issue con la etiqueta `documentation`

---

## 🔄 Actualizaciones

Esta documentación se actualiza regularmente. Última actualización: **2 de diciembre de 2025** (v2.1.0)

Para ver el historial de cambios, consulta:
- [CHANGELOG_MQTT.md](CHANGELOG_MQTT.md) - Cambios MQTT
- [MEJORAS_V2.1.0.md](MEJORAS_V2.1.0.md) - Últimas mejoras

---

**¿Falta algo?** Contribuye abriendo un Pull Request con mejoras a la documentación.
