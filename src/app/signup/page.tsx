"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signUpFamilia, type FormState } from "./actions";

const initialState: FormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
    >
      {pending ? "Creando…" : "Crear familia"}
    </button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signUpFamilia, initialState);

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="text-center mb-6">
          <span className="text-3xl">🍼</span>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-1">Crea tu familia en Efigenia</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Esta cuenta queda como la única que puede administrar la familia
          </p>
        </div>
        <form action={formAction} className="space-y-3">
          <input
            name="familiaNombre"
            type="text"
            placeholder="Nombre de tu familia (ej. Familia Cano)"
            required
            className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          />
          <input
            name="nombre"
            type="text"
            placeholder="Tu nombre"
            required
            className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Tu correo"
            required
            className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            required
            minLength={6}
            className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          />
          {state?.error && <p className="text-xs text-rose-500">{state.error}</p>}
          {state?.info && <p className="text-xs text-emerald-600 dark:text-emerald-400">{state.info}</p>}
          <SubmitButton />
        </form>
        <p className="text-xs text-slate-400 text-center mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
