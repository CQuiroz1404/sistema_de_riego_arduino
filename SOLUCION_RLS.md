# 🔧 Solución al Problema: "No hay invernaderos registrados"

## 🎯 El Problema

Tienes datos en Supabase pero la aplicación no los muestra. Esto es porque **Row Level Security (RLS)** está bloqueando el acceso.

## ✅ Solución Rápida (3 pasos)

### Paso 1: Ir a Supabase SQL Editor

1. Abre tu proyecto en Supabase
2. Ve a la sección **SQL Editor** (icono `</>` en el menú lateral)

### Paso 2: Ejecutar el Script de Corrección

1. Abre el archivo `fix_rls_policies.sql` en VS Code
2. **Copia todo el contenido**
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **"Run"** o presiona `Ctrl + Enter`

### Paso 3: Verificar y Recargar

1. Si todo sale bien, verás al final del resultado tus datos de `greenhouses`
2. Vuelve a tu aplicación (http://localhost:5173)
3. Haz clic en el botón **"🔄 Actualizar"**
4. ¡Deberías ver tu invernadero "casa"! 🎉

---

## 🔍 Verificación Manual (Si prefieres hacerlo paso a paso)

### Opción A: Desde la Interfaz de Supabase

1. Ve a **Database** → **Tables**
2. Haz clic en la tabla **greenhouses**
3. Ve a la pestaña **"Policies"**
4. Haz clic en **"New Policy"**
5. Selecciona **"Enable read access for all users"**
6. Guarda la política

### Opción B: SQL Individual

Ejecuta esto en SQL Editor:

```sql
-- Solo esta línea es suficiente para empezar
CREATE POLICY "Enable read access for all users" 
ON greenhouses FOR SELECT 
USING (true);
```

---

## 🐛 Si Aún No Funciona

### 1. Verificar la Consola del Navegador

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Console**
3. Busca mensajes de error en rojo
4. Si ves algo como "row-level security policy", las políticas RLS están bloqueando

### 2. Verificar que los Datos Existen

Ejecuta en SQL Editor:

```sql
SELECT * FROM greenhouses;
```

Deberías ver tu invernadero "casa" con id=1

### 3. Verificar las Credenciales

Asegúrate de que tu archivo `.env` tenga las credenciales correctas (ya lo verificamos ✅)

### 4. Reiniciar el Servidor de Desarrollo

En la terminal de VS Code:

```bash
# Detener el servidor (Ctrl + C)
# Luego reiniciar
npm run dev
```

---

## 📊 ¿Qué Hacen las Políticas RLS?

**Row Level Security (RLS)** es una característica de seguridad de PostgreSQL/Supabase que controla qué filas puede ver cada usuario.

Por defecto, cuando RLS está habilitado sin políticas:
- ❌ **Nadie puede leer datos** (por eso no ves los invernaderos)
- ❌ **Nadie puede escribir datos**

Con las políticas que agregamos:
- ✅ **Todos pueden leer** (SELECT)
- ✅ **Todos pueden insertar lecturas** (para Arduino)
- ✅ **Todos pueden actualizar actuadores** (para control de riego)

⚠️ **Nota de Seguridad**: Estas políticas son para desarrollo. En producción, debes implementar autenticación de usuarios y políticas más restrictivas.

---

## 🎯 Checklist de Verificación

- [ ] Ejecuté el script `fix_rls_policies.sql` en Supabase
- [ ] Vi mis datos al final del resultado del script
- [ ] Refresqué la página de la aplicación
- [ ] Veo mi invernadero "casa" en la pantalla

Si todos los pasos están marcados y aún no funciona, revisa la consola del navegador (F12) y comparte el error que aparece.

---

## 🚀 Resultado Esperado

Después de seguir estos pasos, deberías ver:

```
Sistema de Riego Arduino
┌─────────────────────────┐
│ 🏠 casa                 │
│ 📍 alto hospicio        │
│ ▶                       │
└─────────────────────────┘
```

¡Listo! 🌱
