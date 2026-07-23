import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Familia, MiembroFamilia } from "./supabase/types";

export interface SessionContext {
  userId: string;
  miembro: MiembroFamilia;
  familia: Familia;
  /** Todas las familias a las que pertenece este usuario (para un futuro selector multi-familia). */
  membresias: MiembroFamilia[];
}

// Cualquier página/acción del dashboard empieza por aquí: obtiene al usuario
// autenticado y la familia "activa" (por ahora, la primera a la que
// pertenece). Si no hay sesión, redirige a /login. Si hay sesión pero
// todavía no tiene ninguna familia, redirige a /signup.
export async function getSessionContext(): Promise<SessionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: filas } = await supabase
    .from("miembros_familia")
    .select("*, familias(*)")
    .eq("user_id", user.id)
    .order("creado_en", { ascending: true });

  if (!filas || filas.length === 0) redirect("/signup");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activo = filas[0] as any;
  const { familias, ...miembro } = activo;

  return {
    userId: user.id,
    miembro: miembro as MiembroFamilia,
    familia: familias as Familia,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    membresias: filas.map((f: any) => {
      const { familias: _fam, ...m } = f;
      return m as MiembroFamilia;
    }),
  };
}

// Lanza un error si quien llama no es el owner de la familia. Se usa en las
// server actions de administración (familia y miembros) para reforzar en
// el servidor lo que RLS ya exige en la base de datos.
export async function requireOwner(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (ctx.familia.owner_user_id !== ctx.userId) {
    throw new Error("Solo quien creó la familia puede hacer esto.");
  }
  return ctx;
}

// Lanza un error si el miembro actual tiene permiso "lector" (solo lectura).
export async function requireEditor(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (ctx.miembro.permiso !== "editor") {
    throw new Error("Tu cuenta es de solo lectura.");
  }
  return ctx;
}

// Solo el owner de la familia o alguien con rol "superadmin" puede administrar
// las preguntas dinámicas (crearlas, marcarlas obligatorias, ponerles ícono).
export function esAdminDePreguntas(ctx: Pick<SessionContext, "miembro" | "familia" | "userId">): boolean {
  return ctx.miembro.rol === "superadmin" || ctx.familia.owner_user_id === ctx.userId;
}

export async function requireAdminDePreguntas(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!esAdminDePreguntas(ctx)) {
    throw new Error("Solo un superadmin o el owner de la familia puede administrar las preguntas.");
  }
  return ctx;
}