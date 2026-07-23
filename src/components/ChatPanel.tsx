"use client";

import { useState, useTransition } from "react";
import { enviarMensajeChat } from "@/app/dashboard/actions";

export interface ChatMsg {
  id: string;
  autor: "padre" | "ia";
  contenido: string;
}

export default function ChatPanel({ hijoId, mensajesIniciales }: { hijoId: string | null; mensajesIniciales: ChatMsg[] }) {
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const [texto, setTexto] = useState("");
  const [pending, startTransition] = useTransition();

  function enviar() {
    const contenido = texto.trim();
    if (!contenido) return;
    setMensajes((m) => [...m, { id: "local-" + Date.now(), autor: "padre", contenido }]);
    setTexto("");
    startTransition(async () => {
      const respuesta = await enviarMensajeChat(hijoId, contenido);
      setMensajes((m) => [...m, { id: "local-" + Date.now() + "-ia", autor: "ia", contenido: respuesta }]);
    });
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 480 }}>
      <div className="flex-1 space-y-3 overflow-y-auto mb-3 pr-1">
        {mensajes.map((m) => (
          <div key={m.id} className={`flex ${m.autor === "ia" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[80%] text-xs px-3 py-2 rounded-2xl ${
                m.autor === "ia"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm"
                  : "bg-indigo-600 text-white rounded-br-sm"
              }`}
            >
              {m.contenido}
            </div>
          </div>
        ))}
        {pending && <p className="text-[11px] text-slate-400">Escribiendo…</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          type="text"
          placeholder="Escribe tu duda..."
          className="flex-1 text-sm rounded-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
        />
        <button
          onClick={enviar}
          className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
