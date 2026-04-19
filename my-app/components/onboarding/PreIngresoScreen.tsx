"use client";

import { Brain, LineChart, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PUNTOS = [
  {
    icon: Brain,
    titulo: "IA y señales de carga",
    texto:
      "Modelos de IA interpretan indicadores de estrés y fatiga laboral para entender tu estado actual.",
  },
  {
    icon: LineChart,
    titulo: "Lectura del contexto",
    texto:
      "Cruzamos esas señales con tu día a día laboral para estimar recuperación y demanda cognitiva.",
  },
  {
    icon: Sparkles,
    titulo: "Entrenamiento a medida",
    texto:
      "Ajustamos volumen, intensidad y descansos del plan para que el entrenamiento encaje con tu carga.",
  },
] as const;

export type PreIngresoScreenProps = {
  /** Acción al pulsar el CTA principal (zona del pulgar). */
  onIniciarTest?: () => void;
  className?: string;
};

export function PreIngresoScreen({
  onIniciarTest,
  className,
}: PreIngresoScreenProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh min-h-[100dvh] flex-col bg-[#FAFAF9] text-stone-900",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-10 pb-36 sm:pt-14">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-700">
          Pre-ingreso
        </p>
        <h1 className="mt-3 text-center text-2xl font-bold leading-tight tracking-tight text-teal-950 sm:text-3xl">
          Antes del test
        </h1>
        <p className="mx-auto mt-3 max-w-[22rem] text-center text-[15px] leading-relaxed text-stone-600 sm:text-base">
          Te contamos en tres ideas cómo usamos inteligencia artificial para
          cuidar tu equilibrio entre trabajo y entrenamiento.
        </p>

        <ul className="mt-10 flex flex-col gap-3 sm:mt-12">
          {PUNTOS.map(({ icon: Icon, titulo, texto }, i) => (
            <li
              key={titulo}
              className="flex gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm shadow-stone-900/[0.03]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800 ring-1 ring-teal-700/10">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Punto {i + 1}
                </p>
                <p className="mt-0.5 text-base font-semibold text-stone-900">
                  {titulo}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  {texto}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Zona del pulgar: CTA fijo abajo al centro */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#FAFAF9] via-[#FAFAF9] to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-10">
        <div className="pointer-events-auto mx-auto w-full max-w-lg px-5">
          <Button
            type="button"
            onClick={onIniciarTest}
            className="h-14 w-full rounded-2xl bg-teal-700 text-base font-semibold text-white shadow-lg shadow-teal-900/20 hover:bg-teal-800 sm:h-16 sm:text-lg"
          >
            Iniciar test
          </Button>
        </div>
      </div>
    </div>
  );
}
