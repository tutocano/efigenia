
"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { login, type FormState } from "./actions";

const initialState: FormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, initialState);

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="text-center mb-6">
          <span className="text-3xl">🍼</span>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-1">Efigenia</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Inicia sesión en tu familia</p>
        </div>
        <form action={formAction} className="space-y-3">
          <input
            name="email"
            type="email"
            placeholder="Correo"
            required
            className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            required
            className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          />
          {state?.error && <p className="text-xs text-rose-500">{state.error}</p>}
          <SubmitButton />
        </form>

        <p className="text-xs text-slate-400 text-center mt-3">
          <Link href="/forgot-password" className="text-indigo-600 dark:text-indigo-400 font-medium">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <p className="text-xs text-slate-400 text-center mt-4">
          ¿Tu familia todavía no existe en Efigenia?{" "}
          <Link href="/signup" className="text-indigo-600 dark:text-indigo-400 font-medium">
            Regístrala aquí
          </Link>
        </p>
      </div>
    </main>
  );
}