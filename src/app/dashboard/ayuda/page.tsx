import { getSessionContext } from "@/lib/familia";
import { rolLabels } from "@/lib/supabase/types";
import GuidedTour from "@/components/GuidedTour";

export default async function AyudaPage() {
  const { miembro } = await getSessionContext();
  const esLector = miembro.permiso === "lector";
  const esAdminPreguntas = miembro.rol === "superadmin";
  const variantDemo = esLector ? "lector" : esAdminPreguntas ? "superadmin" : "editor";

  return (
    <div className="space-y-5 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
      <div>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Ayuda</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Estás conectado como <strong>{miembro.nombre}</strong> — {rolLabels[miembro.rol]}.
        </p>
      </div>
      <GuidedTour variant={variantDemo} />
            <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Video: cómo funciona Efigenia</p>
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
          <iframe
            src="https://www.youtube.com/embed/5-5Xj6laZAM"
            title="Cómo funciona Efigenia"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4">
        <p className="font-medium text-indigo-700 dark:text-indigo-300 mb-1">Lo que puedes hacer con tu rol</p>
        {esLector ? (
          <p>
            Como <strong>Familiar (solo lectura)</strong> puedes ver el Historial y la Semana de la familia, pero no
            puedes registrar nada nuevo ni usar el Chat IA — esas pantallas solo las ven quienes tienen permiso de
            edición.
          </p>
        ) : esAdminPreguntas ? (
          <p>
            Como <strong>Superadmin</strong> puedes hacer todo: registrar actividades, usar el Chat IA, administrar
            la familia y los hijos, y además crear o editar las preguntas dinámicas desde <strong>Admin</strong>.
          </p>
        ) : (
          <p>
            Con tu rol puedes registrar actividades del día a día (tomas, siestas, pañales, etc.), ver el Historial y
            la Semana, y usar el Chat IA. La administración de preguntas dinámicas está reservada al Superadmin.
          </p>
        )}
      </div>

      <section>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Recorrido por las pantallas</h2>
        <div className="space-y-3">
          <div>
            <p className="font-medium">🏠 Inicio</p>
            <p className="text-slate-600 dark:text-slate-300">
              Botones de un toque para registrar lo más común: siesta, comida, pañal, llanto, malestar y juego.
              También aparecen las preguntas guiadas configuradas y la actividad más reciente.
            </p>
          </div>
          <div>
            <p className="font-medium">📜 Historial</p>
            <p className="text-slate-600 dark:text-slate-300">
              Todo lo registrado, agrupado por semana, del más reciente al más antiguo. Quien puede editar ve un
              ícono de basura para borrar un registro por error.
            </p>
          </div>
          {!esLector && (
            <div>
              <p className="font-medium">🧑‍🧑‍🧒 Padres</p>
              <p className="text-slate-600 dark:text-slate-300">
                Espacio para que cada cuidador registre su propio descanso y bienestar, y ver cómo está el resto de
                la familia hoy.
              </p>
            </div>
          )}
          <div>
            <p className="font-medium">📊 Semana</p>
            <p className="text-slate-600 dark:text-slate-300">
              Gráficas de los últimos 7 días: sueño del bebé, cólicos/malestar, y descanso de los cuidadores.
            </p>
          </div>
          {!esLector && (
            <div>
              <p className="font-medium">💬 Chat IA</p>
              <p className="text-slate-600 dark:text-slate-300">
                Escribe cualquier duda del día a día. Primero verás una orientación general, y debajo un
                complemento generado con inteligencia artificial (Google Gemini). Nunca reemplaza al pediatra. El
                botón "Vaciar chat" borra todo el historial de esa conversación.
              </p>
            </div>
          )}
          <div>
            <p className="font-medium">⚙️ Admin</p>
            <p className="text-slate-600 dark:text-slate-300">
              Familia y miembros, datos de los hijos, y (solo Superadmin) las preguntas dinámicas que aparecen como
              acciones rápidas.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Instalar Efigenia en tu teléfono</h2>
        <div className="space-y-2">
          <p>
            <strong>iPhone:</strong> abre la app en Safari → toca el ícono de compartir (el cuadrado con la flecha
            hacia arriba) → "Agregar a pantalla de inicio".
          </p>
          <p>
            <strong>Android:</strong> abre la app en Chrome → toca los tres puntos (⋮) arriba a la derecha →
            "Instalar app".
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Así queda como un ícono más en tu pantalla de inicio, se abre directo sin buscarla en el navegador.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Preguntas frecuentes</h2>
        <div className="space-y-3">
          <div>
            <p className="font-medium">¿El Chat IA da diagnósticos confiables?</p>
            <p className="text-slate-600 dark:text-slate-300">
              No — nunca da diagnósticos ni dosis de medicamentos. Es solo una primera orientación; ante cualquier
              duda real, siempre el médico o pediatra.
            </p>
          </div>
          <div>
            <p className="font-medium">Borré un registro por error, ¿se puede recuperar?</p>
            <p className="text-slate-600 dark:text-slate-300">
              No, al día de hoy borrar es definitivo — así que confirma bien antes de tocar el ícono de basura.
            </p>
          </div>
          <div>
            <p className="font-medium">¿Otras familias ven mis datos?</p>
            <p className="text-slate-600 dark:text-slate-300">
              No, cada familia está completamente separada. Solo quienes agregaste a tu familia ven sus datos.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}