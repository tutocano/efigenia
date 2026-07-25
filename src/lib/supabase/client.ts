"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Cliente de Supabase para Client Components (usa las cookies del navegador).
// flowType "implicit": el enlace de recuperación de contraseña trae el token
// completo dentro de la URL (no depende de una "llave" guardada de antes),
// así funciona aunque el correo se abra desde otra app/navegador distinto
// al que pidió el enlace.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
      },
    }
  );
}