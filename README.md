# Cozy Journal Web

Web de diario/libreta digital tipo scrapbook, pensada para desplegarse en Vercel.

## Stack

- Next.js App Router
- React + TypeScript
- CSS propio
- Supabase Auth
- Supabase Database
- Supabase Storage

## Ejecutar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sin Supabase configurado, la web funciona en modo DEMO para que puedas explorar el editor. Ese modo guarda cambios en `localStorage` y no sirve como almacenamiento público compartido entre dispositivos.

Para persistencia real y URLs públicas compartibles, configura Supabase siguiendo `supabase/schema.sql`.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Abre SQL Editor y ejecuta `supabase/schema.sql`.
3. Crea un usuario en Authentication > Users.
4. Copia URL y anon key a `.env.local` y, posteriormente, a las Environment Variables de Vercel.
5. Inicia sesión en `/admin/login`.
6. En el primer acceso, el editor crea automáticamente una libreta inicial si todavía no existe una para ese usuario.
7. La URL pública será `/blog/<slug>`.

## Despliegue en Vercel

Sube este proyecto a GitHub/GitLab/Bitbucket y conéctalo con Vercel.

Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Después ejecuta el despliegue. No hay backend adicional que configurar fuera de Supabase.

## Rutas

- `/` — presentación
- `/blog/my-journal` — libreta pública demo
- `/blog/<slug>` — libreta pública real
- `/admin/login` — acceso al editor
- `/admin` — editor privado

El modo demo permite probar el editor antes de configurar Supabase. Para que las modificaciones sean realmente públicas y persistentes, usa Supabase + Vercel Environment Variables.
