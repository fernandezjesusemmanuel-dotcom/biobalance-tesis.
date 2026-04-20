# 🧪 Plan de Pruebas Manuales — QA Manual Testing

**Proyecto:** BioBalance AI  
**Versión:** 1.0.0  
**Fecha:** Abril 2026  
**Responsable:** Jesús Emmanuel Fernández  
**Entorno de prueba:** Dispositivo móvil (Android/iOS) + Chrome DevTools (modo responsive)

---

## Resumen de Resultados

| Total de Casos | ✅ Passed | ❌ Failed | ⚠️ Blocked |
|:---:|:---:|:---:|:---:|
| 9 | 9 | 0 | 0 |

---

## Módulo 1 — Autenticación y Onboarding

### TC-001: Redirección y Persistencia del Onboarding
**Objetivo:** Validar que un usuario nuevo vea la fundamentación científica antes de usar la app, pero no sea interrumpido en sesiones futuras.

| Campo | Detalle |
|---|---|
| **Precondiciones** | Usuario autenticado. `localStorage` limpio (sin clave `biobalance_preingreso_v1`). |
| **Estado** | ✅ PASSED |

**Pasos y resultados esperados:**

| # | Acción | Resultado Esperado |
|---|---|---|
| 1 | Ingresar a la raíz `/` | Redirección automática a `/pre-ingreso`. El usuario no puede omitir esta pantalla. |
| 2 | Hacer clic en "Iniciar test" | `localStorage` almacena `biobalance_preingreso_v1 = "1"`. |
| 3 | Recargar la página desde `/` | El usuario accede directamente al Dashboard sin pasar por el pre-ingreso. |

---

### TC-002: Guard de Perfil Incompleto
**Objetivo:** Verificar que un usuario sin perfil completo (sin `first_name` o `age`) sea redirigido a `/onboarding` y no pueda acceder al Dashboard.

| Campo | Detalle |
|---|---|
| **Precondiciones** | Usuario autenticado. Fila en tabla `profiles` con `first_name = NULL`. |
| **Estado** | ✅ PASSED |

**Pasos y resultados esperados:**

| # | Acción | Resultado Esperado |
|---|---|---|
| 1 | Ingresar a `/dashboard` directamente desde la URL | Redirección automática a `/onboarding`. |
| 2 | Completar el formulario de onboarding | Datos guardados en `profiles`. Redirección al Dashboard. |
| 3 | Recargar el Dashboard | No hay nueva redirección a `/onboarding`. |

---

## Módulo 2 — Motor de IA e Inferencia Activa

### TC-003: Validación de Input con Zod
**Objetivo:** Evitar que datos anómalos o maliciosos lleguen al LLM (Gemini), consumiendo tokens innecesarios o generando rutinas peligrosas.

| Campo | Detalle |
|---|---|
| **Precondiciones** | Acceso a Postman o DevTools para manipular el request. |
| **Estado** | ✅ PASSED |

**Pasos y resultados esperados:**

| # | Acción | Resultado Esperado |
|---|---|---|
| 1 | Enviar `stress_level: 15` (rango permitido: 0–10) vía POST a `/api/advisor` | HTTP `400 Bad Request`. Zod intercepta antes de contactar a Gemini. |
| 2 | Enviar `sleepHours: "ocho"` (string en lugar de number) | HTTP `400 Bad Request`. Mensaje de error descriptivo en el body. |
| 3 | Enviar payload vacío `{}` | HTTP `400 Bad Request`. Los campos requeridos son reportados. |
| 4 | Verificar los logs del servidor | Confirmar que ninguna petición inválida alcanzó la llamada a `fetch(GEMINI_URL)`. |

---

### TC-004: Lógica de Fallback por Caída de la IA
**Objetivo:** Garantizar que el usuario reciba una prescripción segura (Recuperación Activa) si la API de Gemini falla o supera el timeout de 15 segundos.

| Campo | Detalle |
|---|---|
| **Precondiciones** | Simular caída de red cortando la conexión justo después de enviar el Log. |
| **Estado** | ✅ PASSED |

**Pasos y resultados esperados:**

| # | Acción | Resultado Esperado |
|---|---|---|
| 1 | Completar el Log Diario (Fatiga = 8) y hacer clic en "Generar Rutina" | Spinner visible. Request enviado. |
| 2 | Cortar la conexión a internet | El `AbortController` interrumpe la petición a los 15 segundos. |
| 3 | Observar el resultado en pantalla | Se prescribe el objeto JSON de contingencia (movilidad articular, intensidad Baja). La app no se bloquea en pantalla de carga infinita. |

---

### TC-005: Prescripción Contextual por Tipo de Día
**Objetivo:** Verificar que la variable `dayContext` modifica la prescripción de la IA de forma coherente con la teoría de Carga Alostática.

| Campo | Detalle |
|---|---|
| **Precondiciones** | Biomarcadores neutros (Fatiga = 4, Estrés = 3, Sueño = 7h). |
| **Estado** | ✅ PASSED |

**Pasos y resultados esperados:**

| # | Acción | Resultado Esperado |
|---|---|---|
| 1 | Seleccionar "Día Libre" y generar rutina | La IA prescribe intensidad **Alta** o **Media-Alta**. Justificación menciona "ventana de baja carga alostática". |
| 2 | Repetir con "Día Pesado" y los mismos biomarcadores | La IA prescribe intensidad **Baja**. Justificación menciona "demanda cognitiva" o "SNA". |
| 3 | Comparar ambas respuestas | Las prescripciones difieren de forma significativa y científicamente coherente. |

---

## Módulo 3 — Persistencia de Datos (Supabase)

### TC-006: Upsert del Log Diario
**Objetivo:** Verificar que completar el check-in dos veces en el mismo día actualiza el registro existente en lugar de crear un duplicado.

| Campo | Detalle |
|---|---|
| **Precondiciones** | Usuario con un `daily_log` ya existente para la fecha de hoy. |
| **Estado** | ✅ PASSED |

**Pasos y resultados esperados:**

| # | Acción | Resultado Esperado |
|---|---|---|
| 1 | Completar el Log Diario por primera vez (Fatiga = 3) | Registro creado en `daily_logs`. Verificar en Supabase Dashboard. |
| 2 | Volver a `/log` y completarlo nuevamente (Fatiga = 8) | El registro existente se actualiza (`fatigue_level = 8`). No se crea una segunda fila. |
| 3 | Verificar en Supabase | Solo existe **un** registro para `(user_id, log_date)` de hoy. |

---

### TC-007: Cierre del Bucle — Guardado de Feedback Post-Sesión
**Objetivo:** Verificar que al completar el entrenamiento se actualiza el `daily_log` Y se crea una nueva fila en `workout_sessions` de forma simultánea.

| Campo | Detalle |
|---|---|
| **Precondiciones** | Log del día con `suggested_routine` ya generada. |
| **Estado** | ✅ PASSED |

**Pasos y resultados esperados:**

| # | Acción | Resultado Esperado |
|---|---|---|
| 1 | Completar el Modo Ejecución y abrir el modal de Feedback | Modal visible con sliders de RPE y Duración. |
| 2 | Registrar RPE = 7, Duración = 50 min y confirmar | `daily_logs`: `actual_rpe = 7`, `actual_srpe = 350`, `completed = true`. |
| 3 | Verificar en tabla `workout_sessions` | Nueva fila con `session_date` de hoy, `duration_seconds = 3000`, `exercises_performed` poblado. |
| 4 | Verificar redirección | El usuario es redirigido al Dashboard sin errores. |

---

## Módulo 4 — Algoritmo ACWR

### TC-008: Cálculo del Ratio ACWR
**Objetivo:** Verificar que el widget del Dashboard muestra el ratio correcto y la zona de riesgo adecuada según los datos históricos.

| Campo | Detalle |
|---|---|
| **Precondiciones** | Usuario con al menos 7 registros en `daily_logs` con `rpe_score` y `session_duration` distintos de NULL. |
| **Estado** | ✅ PASSED |

**Pasos y resultados esperados:**

| # | Acción | Resultado Esperado |
|---|---|---|
| 1 | Ingresar al Dashboard con datos históricos disponibles | El widget ACWR muestra un ratio numérico (no `--`). |
| 2 | Calcular manualmente: `Carga Aguda = promedio últimos 7 días (RPE × Duración)` | El valor en pantalla coincide con el cálculo manual. |
| 3 | Verificar zona con ratio > 1.5 | Widget en rojo (`bg-rose-600`), ícono `AlertTriangle`, mensaje "Riesgo de Lesión Alto". |
| 4 | Verificar zona con ratio entre 0.8 y 1.3 | Widget en verde (`bg-emerald-50`), ícono `ShieldCheck`, mensaje "Zona Óptima". |

---

## Módulo 5 — UX y Experiencia Móvil

### TC-009: Exportación CSV para Tesis
**Objetivo:** Verificar que el archivo exportado contiene todos los campos necesarios, con BOM UTF-8 para compatibilidad con Excel en español.

| Campo | Detalle |
|---|---|
| **Precondiciones** | Usuario con al menos 3 registros en `daily_logs`. |
| **Estado** | ✅ PASSED |

**Pasos y resultados esperados:**

| # | Acción | Resultado Esperado |
|---|---|---|
| 1 | Hacer clic en el ícono de descarga en el Header | El archivo `BioBalance_Datos_Tesis.csv` se descarga automáticamente. |
| 2 | Abrir el archivo en Microsoft Excel | Las tildes y caracteres especiales se renderizan correctamente (UTF-8 con BOM). |
| 3 | Verificar columnas | Presentes: `Fecha`, `Sueño`, `Estrés`, `Fatiga`, `Dolor`, `RPE`, `Duración`, `Carga`. |
| 4 | Intentar exportar sin datos | El botón muestra un error inline "Sin datos para exportar." Sin `alert()` bloqueante. |

---

## Notas del Evaluador

- Todas las pruebas fueron ejecutadas en **Chrome 124** sobre **iPhone 13 Pro** (modo responsive DevTools) y dispositivo físico **Samsung Galaxy A54**.
- Los casos de prueba de la API (TC-003, TC-004) fueron verificados adicionalmente con **Postman v11**.
- La variable `dayContext` (TC-005) requiere repetición periódica dado que la respuesta de Gemini tiene varianza natural controlada por `temperature: 0.4`.