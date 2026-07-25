"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOwner, requireEditor, requireAdminDePreguntas } from "@/lib/familia";
import type { RolFamiliar } from "@/lib/supabase/types";

// ------------------------------------------------------------------
// FAMILIA (solo el owner)
// ------------------------------------------------------------------
export async function actualizarNombreFamilia(nombre: string) {
  const { familia } = await requireOwner();
  const supabase = await createClient();
  const { error } = await supabase.from("familias").update({ nombre }).eq("id", familia.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin");
}

// ------------------------------------------------------------------
// MIEMBROS Y ACCESOS (solo el owner: así nadie más puede modificar
// la lista de cuentas de la familia)
// ------------------------------------------------------------------
export async function crearMiembro(input: {
  nombre: string;
  email: string;
  password: string;
  rol: RolFamiliar;
}) {
  const { familia } = await requireOwner();

  if (input.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const admin = createAdminClient();
  const { data: nuevoUsuario, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (createError || !nuevoUsuario.user) {
    throw new Error(createError?.message ?? "No se pudo crear la cuenta.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("miembros_familia").insert({
    familia_id: familia.id,
    user_id: nuevoUsuario.user.id,
    nombre: input.nombre,
    email: input.email,
    rol: input.rol,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/miembros");
}

export async function actualizarMiembro(
  id: string,
  input: { nombre: string; rol: RolFamiliar; nuevaPassword?: string }
) {
  const { familia } = await requireOwner();
  const supabase = await createClient();

  const { data: miembro } = await supabase
    .from("miembros_familia")
    .select("user_id")
    .eq("id", id)
    .eq("familia_id", familia.id)
    .single();

  if (input.nuevaPassword) {
    if (input.nuevaPassword.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }
    if (miembro?.user_id) {
      const admin = createAdminClient();
      const { error } = await admin.auth.admin.updateUserById(miembro.user_id, {
        password: input.nuevaPassword,
      });
      if (error) throw new Error(error.message);
    }
  }

  const { error } = await supabase
    .from("miembros_familia")
    .update({ nombre: input.nombre, rol: input.rol })
    .eq("id", id)
    .eq("familia_id", familia.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/miembros");
}

export async function eliminarMiembro(id: string) {
  const { familia, userId } = await requireOwner();
  const supabase = await createClient();

  const { data: miembro } = await supabase
    .from("miembros_familia")
    .select("user_id")
    .eq("id", id)
    .eq("familia_id", familia.id)
    .single();

  if (miembro?.user_id === userId) {
    throw new Error("No puedes eliminar tu propia cuenta de owner.");
  }

  const { error } = await supabase.from("miembros_familia").delete().eq("id", id).eq("familia_id", familia.id);
  if (error) throw new Error(error.message);

  if (miembro?.user_id) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(miembro.user_id).catch(() => {});
  }

  revalidatePath("/dashboard/admin/miembros");
}

// ------------------------------------------------------------------
// HIJOS (cualquier miembro con permiso "editor")
// ------------------------------------------------------------------
export async function crearHijo(input: { nombre: string; fechaNacimiento: string; sexo: string }) {
  const { familia } = await requireEditor();
  const supabase = await createClient();
  const { error } = await supabase.from("hijos").insert({
    familia_id: familia.id,
    nombre: input.nombre,
    fecha_nacimiento: input.fechaNacimiento,
    sexo: input.sexo,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/hijos");
  revalidatePath("/dashboard");
}

export async function actualizarHijo(id: string, input: { nombre: string; fechaNacimiento: string; sexo: string }) {
  const { familia } = await requireEditor();
  const supabase = await createClient();
  const { error } = await supabase
    .from("hijos")
    .update({ nombre: input.nombre, fecha_nacimiento: input.fechaNacimiento, sexo: input.sexo })
    .eq("id", id)
    .eq("familia_id", familia.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/hijos");
  revalidatePath("/dashboard");
}

export async function eliminarHijo(id: string) {
  const { familia } = await requireEditor();
  const supabase = await createClient();
  const { error } = await supabase.from("hijos").delete().eq("id", id).eq("familia_id", familia.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/hijos");
  revalidatePath("/dashboard");
}

// ------------------------------------------------------------------
// PREGUNTAS DINÁMICAS (solo el owner de la familia o alguien con rol
// "superadmin" — así el resto de editores no puede tocar el cuestionario)
// ------------------------------------------------------------------
export async function crearPregunta(input: {
  texto: string;
  categoria: string;
  tipoEntrada: string;
  opciones: string[];
  obligatoria: boolean;
  orden: number;
  icono?: string;
  esAccionRapida?: boolean;
}) {
  const { familia } = await requireAdminDePreguntas();
  const supabase = await createClient();
  const esAccionRapida =
    !!input.esAccionRapida &&
    (input.tipoEntrada === "toggle" || input.tipoEntrada === "seleccion_unica" || input.tipoEntrada === "foto");
  const { error } = await supabase.from("preguntas_dinamicas").insert({
    familia_id: familia.id,
    texto: input.texto,
    categoria: input.categoria,
    tipo_entrada: input.tipoEntrada,
    opciones: input.opciones.length ? input.opciones : null,
    obligatoria: input.obligatoria,
    orden: input.orden,
    icono: input.icono?.trim() || null,
    es_accion_rapida: esAccionRapida,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/preguntas");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/padres");
}

export async function actualizarPregunta(
  id: string,
  input: {
    texto: string;
    categoria: string;
    tipoEntrada: string;
    opciones: string[];
    obligatoria: boolean;
    orden: number;
    icono?: string;
    esAccionRapida?: boolean;
  }
) {
  const { familia } = await requireAdminDePreguntas();
  const supabase = await createClient();
  const esAccionRapida =
    !!input.esAccionRapida &&
    (input.tipoEntrada === "toggle" || input.tipoEntrada === "seleccion_unica" || input.tipoEntrada === "foto");
  const { error } = await supabase
    .from("preguntas_dinamicas")
    .update({
      texto: input.texto,
      categoria: input.categoria,
      tipo_entrada: input.tipoEntrada,
      opciones: input.opciones.length ? input.opciones : null,
      obligatoria: input.obligatoria,
      orden: input.orden,
      icono: input.icono?.trim() || null,
      es_accion_rapida: esAccionRapida,
    })
    .eq("id", id)
    .eq("familia_id", familia.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/preguntas");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/padres");
}

export async function eliminarPregunta(id: string) {
  const { familia } = await requireAdminDePreguntas();
  const supabase = await createClient();
  const { error } = await supabase.from("preguntas_dinamicas").delete().eq("id", id).eq("familia_id", familia.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/admin/preguntas");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/padres");
}