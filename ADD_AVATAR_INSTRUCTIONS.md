# ⚠️ IMPORTANTE: Agregar Columna Avatar

La foto de perfil no se muestra porque **falta la columna `avatar` en tu base de datos**.

## Opción 1: MySQL Workbench (Recomendado)

1. Abre **MySQL Workbench**
2. Conéctate a tu base de datos local (`localhost:3306`)
3. Selecciona la base de datos `sistema_riego`
4. Ejecuta este SQL:

```sql
ALTER TABLE usuarios ADD COLUMN avatar VARCHAR(255) NULL AFTER email;
```

## Opción 2: Línea de Comandos

Si tienes MySQL en el PATH:

```bash
mysql -u root -p sistema_riego
```

Luego ejecuta:
```sql
ALTER TABLE usuarios ADD COLUMN avatar VARCHAR(255) NULL AFTER email;
EXIT;
```

## Opción 3: phpMyAdmin

1. Accede a phpMyAdmin
2. Selecciona base de datos `sistema_riego`
3. Tabla `usuarios` → Estructura
4. Clic en "Añadir columna" después de `email`
5. Nombre: `avatar`
6. Tipo: `VARCHAR(255)`
7. Null: ✅ Permitir
8. Guardar

## Verificar que funcionó:

Después de ejecutar el SQL, reinicia el servidor:

```bash
npm run dev
```

Luego ve a tu perfil y sube una foto. ¡Debería aparecer en el navbar!

---

**Nota:** El archivo con el SQL está en: `database/add_avatar_column.sql`
