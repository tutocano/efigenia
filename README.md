# Efigenia

App responsive (Next.js 14 + Supabase) para que una familia lleve el
seguimiento diario del bebé y de los padres, con panel de administración
integrado y soporte para varias familias (multi-tenant).

Es una sola aplicación: en el navegador del teléfono se ve y se comporta
como app móvil (instalable como PWA, con nav inferior), y en pantallas
grandes se convierte en el panel de escritorio (sidebar). El Panel admin
es una sección más dentro de la misma app, accesible desde ambos.

## Qué incluye

- **Multi-familia real**: cada familia vive aislada (Row Level Security en
  Postgres). Al registrar una familia se crea una cuenta "owner" — solo esa
  cuenta puede renombrar la familia o administrar los demás miembros
  (crear cuentas, cambiar roles, resetear contraseñas, eliminar).
- **Roles**: Padre/Madre 1, Padre/Madre 2, Cuidador (pueden registrar
  datos) y Familiar (solo lectura — pensado para abuelos, hermanos, etc.).
- **Panel admin accesible desde el móvil y el desktop**: gestión de la
  familia, miembros y accesos, hijos, y las preguntas dinámicas del
  registro diario.
- **Dashboard**: acciones rápidas de un toque (siesta con timer
  automático, comida, pañal, llanto, malestar), preguntas guiadas
  configurables desde el admin, línea de tiempo de actividad.
- **Padres**: cada quien registra su propio bienestar (horas de sueño,
  ánimo, hidratación, notas) y ve el estado del resto de la familia.
- **Semana**: gráficos (sueño del bebé, cólicos, sueño de los padres).
- **Chat IA**: simulado por ahora (ver sección "Conectar un modelo real").

## 1. Requisitos

- Node.js 18.18 o superior
- Una cuenta gratuita en [supabase.com](https://supabase.com)

## 2. Configurar Supabase

1. Crea un proyecto nuevo en Supabase.
2. Ve a **SQL Editor** y ejecuta el contenido de
   `supabase/migrations/0001_init.sql` (crea las tablas, funciones y
   políticas de seguridad RLS).
3. En **Authentication → Providers → Email**, para probar rápido puedes
   desactivar "Confirm email" (si lo dejas activo, el registro de una
   familia pedirá confirmar el correo antes de continuar).
4. En **Project Settings → API** copia:
   - `Project URL`
   - `anon public` key
   - `service_role` key (¡secreta! solo se usa en el servidor)

## 3. Configurar el proyecto

```bash
cp .env.example .env.local
```

Pega tus tres valores de Supabase en `.env.local`.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 4. Primer uso

1. Entra a `/signup` y crea tu familia: ese correo/contraseña queda como
   la cuenta "owner" — la única que puede renombrar la familia o
   administrar el resto de miembros.
2. Ve a **Panel admin → Hijos** y agrega a tu bebé.
3. Ve a **Panel admin → Familia y miembros** y crea cuentas para el resto
   (Padre/Madre 2, Cuidador, o Familiar para acceso de solo lectura).
   Cada quien inicia sesión con el correo/contraseña que le asignes ahí.
4. Ajusta las preguntas del registro diario en **Panel admin → Preguntas**.

## Notas de diseño

- **Modelo de datos real vs. conceptual**: `babysync-schema.ts` (en la
  carpeta anterior del proyecto) describe el modelo con una tabla por tipo
  de registro del bebé. En la base de datos real (`supabase/migrations/0001_init.sql`)
  esos registros se unificaron en una sola tabla `registros` con un campo
  `tipo` + `detalle jsonb`, que es más simple de mantener y consultar.
- **Seguridad de accesos**: crear la cuenta de otro miembro (usuario y
  contraseña) requiere la `service_role` key de Supabase, que solo se usa
  del lado del servidor (`src/lib/supabase/admin.ts`, marcado con
  `import "server-only"`) y siempre después de verificar que quien llama
  es el owner de la familia (`requireOwner()` en `src/lib/familia.ts`).
- **Tipos de Supabase**: `src/lib/supabase/types.ts` está escrito a mano a
  partir de la migración SQL. Una vez tengas el proyecto conectado puedes
  regenerarlos automáticamente con la CLI de Supabase:
  ```bash
  npx supabase gen types typescript --project-id TU_PROYECTO > src/lib/supabase/types.ts
  ```

## Conectar un modelo de IA real al chat

Hoy `enviarMensajeChat` en `src/app/dashboard/actions.ts` genera una
respuesta simulada con reglas simples (`generarRespuestaIA`). Para
conectar un modelo real (por ejemplo la API de Claude):

1. Agrega tu API key como variable de entorno **server-only** (nunca con
   prefijo `NEXT_PUBLIC_`), por ejemplo `ANTHROPIC_API_KEY`.
2. Sustituye el cuerpo de `generarRespuestaIA` por una llamada a la API
   del proveedor, pasando como contexto la edad del bebé y un resumen de
   las últimas 48 horas (sueño, malestares) tomado de la tabla `registros`.
3. Mantén siempre el recordatorio de "esto no reemplaza a un pediatra" en
   la respuesta.

## PWA (instalable en el teléfono)

`public/manifest.json` ya está listo (con íconos placeholder en
`public/icon-192.png` y `public/icon-512.png` — reemplázalos por el logo
real cuando lo tengas). Al abrir la app en Chrome/Safari desde el
teléfono, aparecerá la opción "Agregar a pantalla de inicio".

## Despliegue

Cualquier proveedor compatible con Next.js (Vercel es el más directo:
`vercel deploy`, configurando las mismas variables de entorno del paso 2).
