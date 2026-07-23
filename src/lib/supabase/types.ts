// Tipos de la base de datos. Escritos a mano a partir de
// supabase/migrations/0001_init.sql — una vez tengas el proyecto Supabase
// conectado, puedes regenerarlos automáticamente con:
//   npx supabase gen types typescript --project-id TU_PROYECTO > src/lib/supabase/types.ts

export type RolFamiliar = "padre_madre_1" | "padre_madre_2" | "cuidador" | "familiar" | "superadmin";
export type PermisoFamiliar = "editor" | "lector";
export type CategoriaPregunta = "bebe" | "padre_madre_1" | "padre_madre_2" | "general";
export type TipoEntrada = "texto" | "toggle" | "seleccion_unica" | "numero" | "timer" | "escala_1_5";
export type TipoRegistro = "sueno" | "alimentacion" | "panal" | "salud" | "animo";

export interface Familia {
  id: string;
  nombre: string;
  owner_user_id: string;
  zona_horaria: string;
  creado_en: string;
}

export interface MiembroFamilia {
  id: string;
  familia_id: string;
  user_id: string | null;
  nombre: string;
  email: string;
  rol: RolFamiliar;
  permiso: PermisoFamiliar;
  avatar_url: string | null;
  notificaciones_activas: boolean;
  creado_en: string;
}

export interface Hijo {
  id: string;
  familia_id: string;
  nombre: string;
  fecha_nacimiento: string;
  sexo: "masculino" | "femenino" | "prefiero_no_decir";
  avatar_url: string | null;
  notas_salud: string | null;
  activo: boolean;
  creado_en: string;
}

export interface PreguntaDinamica {
  id: string;
  familia_id: string;
  texto: string;
  categoria: CategoriaPregunta;
  tipo_entrada: TipoEntrada;
  opciones: string[] | null;
  obligatoria: boolean;
  orden: number;
  activa: boolean;
  icono: string | null;
  es_accion_rapida: boolean;
  creado_en: string;
}

export interface RespuestaPregunta {
  id: string;
  pregunta_id: string;
  familia_id: string;
  hijo_id: string | null;
  miembro_id: string;
  valor: string | null;
  respondido_en: string;
  creado_en: string;
}

export interface Registro {
  id: string;
  familia_id: string;
  hijo_id: string;
  miembro_id: string;
  tipo: TipoRegistro;
  detalle: Record<string, unknown>;
  hora_inicio: string;
  hora_fin: string | null;
  creado_en: string;
}

export interface BienestarPadre {
  id: string;
  familia_id: string;
  miembro_id: string;
  fecha: string;
  horas_sueno: number | null;
  estado_animo: string | null;
  comio_bien: boolean | null;
  tomo_agua_suficiente: boolean | null;
  nota_rapida: string | null;
  creado_en: string;
}

export interface MensajeChatIA {
  id: string;
  familia_id: string;
  hijo_id: string | null;
  autor: "padre" | "ia";
  miembro_id: string | null;
  contenido: string;
  creado_en: string;
}

// Tipo genérico mínimo requerido por createBrowserClient/createServerClient.
// No modela cada tabla en detalle (no se generó desde un proyecto real),
// pero es suficiente para tipar los helpers de este proyecto.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export const rolLabels: Record<RolFamiliar, string> = {
  padre_madre_1: "Padre/Madre 1",
  padre_madre_2: "Padre/Madre 2",
  cuidador: "Cuidador",
  familiar: "Familiar (solo lectura)",
  superadmin: "Superadmin (administra preguntas)",
};

export const categoriaLabels: Record<CategoriaPregunta, string> = {
  bebe: "Bebé",
  padre_madre_1: "Padre/Madre 1",
  padre_madre_2: "Padre/Madre 2",
  general: "General",
};

export const tipoEntradaLabels: Record<TipoEntrada, string> = {
  texto: "Texto",
  toggle: "Sí/No",
  seleccion_unica: "Selección única",
  numero: "Número",
  timer: "Timer/Duración (min)",
  escala_1_5: "Escala 1-5",
};

export function permisoDeRol(rol: RolFamiliar): PermisoFamiliar {
  return rol === "familiar" ? "lector" : "editor";
}