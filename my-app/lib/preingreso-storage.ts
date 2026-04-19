/** Clave en localStorage: el usuario ya vio y aceptó la pantalla de pre-ingreso. */
export const PREINGRESO_STORAGE_KEY = "biobalance_preingreso_v1";

export function hasCompletedPreIngreso(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PREINGRESO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPreIngresoCompleted(): void {
  try {
    window.localStorage.setItem(PREINGRESO_STORAGE_KEY, "1");
  } catch {
    /* modo privado o storage bloqueado */
  }
}
