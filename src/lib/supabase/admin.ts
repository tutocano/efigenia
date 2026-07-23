import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Cliente con la service_role key: SOLO se importa desde Server Actions.
// `import "server-only"` hace que Next.js falle el build si algún día
// alguien intenta importar este archivo desde un Client Component.
//
// Se usa exclusivamente para que el dueño ("owner") de una familia pueda
// crear la cuenta (usuario/contraseña) de otro miembro sin que esa persona
// tenga que registrarse por su cuenta. Cada uso debe estar precedido por
// una verificación explícita de que quien llama es el owner de la familia.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
