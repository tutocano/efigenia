"use client";

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface DiaSueno { dia: string; horas: number }
export interface DiaColico { dia: string; episodios: number }
export interface DiaSuenoPadres { dia: string; [nombre: string]: string | number }

export default function WeeklyCharts({
  sueno,
  colico,
  suenoPadres,
  nombresPadres,
}: {
  sueno: DiaSueno[];
  colico: DiaColico[];
  suenoPadres: DiaSuenoPadres[];
  nombresPadres: string[];
}) {
  const colores = ["#f472b6", "#60a5fa", "#34d399", "#fbbf24"];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Sueño del bebé (última semana)</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sueno}>
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="horas" fill="#818cf8" radius={[6, 6, 0, 0]} name="Horas de sueño" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Episodios de cólico por día</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={colico}>
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="episodios" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Sueño de los padres/cuidadores</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={suenoPadres}>
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {nombresPadres.map((n, i) => (
                <Bar key={n} dataKey={n} fill={colores[i % colores.length]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
