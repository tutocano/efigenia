"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface FormState {
  error?: string;
  info?: string;
}

const PREGUNTAS_POR_DEFECTO = [
  { texto: "¿Cómo durmió?", categoria: "bebe", tipo_entrada: "timer", obligatoria: true, orden: 1 },
  {
    texto: "Calidad del sueño",
    categoria: "bebe",
    tipo_entrada: "seleccion_unica",
    opciones: ["Tranquilo", "Inquieto"],
    obligatoria: false,
    orden: 2,
  },
  {
    texto: "¿Tiene malestar?",
    categoria: "bebe",
    tipo_entrada: "seleccion_unica",
    opciones: ["Cólico", "Gases", "Fiebre", "Brote de crecimiento", "Ninguno"],
    obligatoria: false,
    orden: 3,
  },
  { texto: "Temperatura corporal", categoria: "bebe", tipo_entrada: "numero", obligatoria: false, orden: 4 },
  {
    texto: "Horas de sueño acumuladas",
    categoria: "padre_madre_1",
    tipo_entrada: "numero",
    obligatoria: true,
    orden: 5,
  },
  {
    texto: "Nivel de estrés / ánimo hoy",
    categoria: "padre_madre_1",
    tipo_entrada: "escala_1_5",
    obligatoria: true,
    orden: 6,
  },
  {
    texto: "¿Comiste e hidrataste bien hoy?",
    categoria: "padre_madre_2",
    tipo_entrada: "toggle",
    obligatoria: false,
    orden: 7,
  },
  { texto: "Duda o logro del día", categoria: "general", tipo_entrada: "texto", obligatoria: false, orden: 8 },
];

export async function signUpFamilia(_prevState: FormState, formData: FormData): Promise<FormState> {
  const familiaNombre = String(formData.get("familiaNombre") || "").trim();
  const nombre = String(formData.get("nombre") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!familiaNombre || !nombre || !email || !password) {
    return { error: "Completa todos los campos." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();

  const {
    data: { user: usuarioActual },
  } = await supabase.auth.getUser();

  let userId: string;
  let userEmail: string;

  if (usuarioActual) {
    userId = usuarioActual.id;
    userEmail = usuarioActual.email ?? email;
  } else {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      return { error: signUpError.message };
    }
    if (!signUpData.user) {
      return { error: "No se pudo crear la cuenta." };
    }

    if (!signUpData.session) {
      return {
        info: "Te enviamos un correo de confirmación. Ábrelo y haz clic en el enlace; luego vuelve a esta página para terminar de crear tu familia.",
      };
    }

    userId = signUpData.user.id;
    userEmail = email;
  }

  const { data: familia, error: familiaError } = await supabase
    .from("familias")
    .insert({ nombre: familiaNombre, owner_user_id: userId })
    .select()
    .single();
  if (familiaError || !familia) {
    return { error: familiaError?.message ?? "No se pudo crear la familia." };
  }

  const { error: miembroError } = await supabase.from("miembros_familia").insert({
    familia_id: familia.id,
    user_id: userId,
    nombre,
    email: userEmail,
    rol: "padre_madre_1",
  });
  if (miembroError) {
    return { error: miembroError.message };
  }

  await supabase
    .from("preguntas_dinamicas")
    .insert(PREGUNTAS_POR_DEFECTO.map((p) => ({ ...p, familia_id: familia.id })));

  redirect("/dashboard");
}