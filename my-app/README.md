# BioBalance AI 🧠⚡

**Sistema Predictivo de Biogestión y Entrenamiento Funcional**

BioBalance es una plataforma HealthTech Full-Stack desarrollada como proyecto de tesis de Maestría en Educación Física, titulada oficialmente **"Diseño, Prototipado y Validación del Sistema BioBalance: Un Modelo de Prescripción de Ejercicio Adaptativo Basado en Inferencia Activa para la Gestión de la Carga Alostática"**, con orientación en Neurociencia Computacional y Tecnología Educativa.

El sistema aborda un problema crítico en la población universitaria: el **burnout y la deserción estudiantil** provocados por la acumulación de carga alostática no gestionada. BioBalance actúa como regulador neurobiológico, prescribiendo ejercicio físico de forma personalizada y dinámica para fomentar la **autorregulación en estudiantes universitarios**, tratando el movimiento no como un estresor adicional, sino como una herramienta de retorno a la homeostasis.

---

## 📸 Vista Previa

> **Nota:** Reemplaza estas imágenes con capturas reales de tu app. Las más importantes son el Dashboard (widget ACWR) y la pantalla de Prescripción de la IA.

| Dashboard & ACWR | Prescripción IA | Modo Ejecución |
|:---:|:---:|:---:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Prescripcion](docs/screenshots/prescripcion.png) | ![Workout](docs/screenshots/workout.png) |

---

## 🧬 Fundamento Científico

El motor de prescripción se construye sobre tres pilares teóricos:

| Concepto | Autor | Aplicación en BioBalance |
|---|---|---|
| **Minimización de Energía Libre** | Karl Friston (2010) | La IA prescribe sesiones que minimizan la "sorpresa fisiológica" (lesión, sobreentrenamiento) actualizando un Prior Bayesiano diario |
| **Session RPE (sRPE)** | Foster et al. (1998) | Métrica de carga interna real = RPE × Duración. Se registra post-sesión y retroalimenta el modelo al día siguiente |
| **ACWR** | Gabbett (2016) | Ratio Carga Aguda:Crónica (últimos 7 vs 28 días) como predictor de riesgo de lesión. Zona óptima: 0.8–1.3 |

### Módulo de Simulación de Biomarcadores (MVP)
En ausencia de wearable conectado, el sistema infiere el **rMSSD** (variabilidad de frecuencia cardíaca) y el **sRPE previo** desde la percepción subjetiva del atleta, correlación validada en literatura (Buchheit, 2014; Borg, 1998).

```
rMSSD simulado = 85 - (estrés × 5) - (fatiga × 4)   → rango [15, 85] ms
sRPE previo    = fatiga ≥ 7 ? 9 : fatiga ≤ 3 ? 3 : 6
```

---

## 🛠️ Stack Técnico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 14 (App Router), React, TypeScript |
| **Estilos** | Tailwind CSS, shadcn/ui — diseño Mobile-First (Thumb Zone UI) |
| **Backend** | Next.js API Routes (Edge-compatible) |
| **Base de datos** | Supabase (PostgreSQL + Auth + Storage) |
| **IA / LLM** | Google Gemini 1.5 Flash vía REST API |
| **Validación** | Zod (input sanitization en todas las rutas API) |

---

## 🗂️ Arquitectura del Proyecto

```
src/
├── app/
│   ├── api/advisor/route.ts        # Motor IA: Inferencia Activa + Gemini
│   ├── dashboard/page.tsx          # Dashboard principal (ACWR + rutina del día)
│   ├── dashboard/history/page.tsx  # Historial de carga (health logs + workout sessions)
│   ├── workout/page.tsx            # Modo Ejecución (cronómetro + ejercicios)
│   ├── workout/WorkoutFeedback.tsx # Modal post-sesión (cierre del bucle IA)
│   └── log/page.tsx                # Check-in diario de biomarcadores
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx              # Clima, avatar, export CSV
│   │   ├── RecommendationCard.tsx  # Tarjeta de rutina generada por IA
│   │   └── TrendChart.tsx          # Gráfico de evolución de carga
│   └── balance/
│       └── BalanceCard.tsx         # Check-in por voz o sliders manuales
├── context/
│   └── WorkoutSessionContext.tsx   # Estado global de sesión (evita prop drilling)
├── hooks/
│   └── useWorkoutSession.ts        # useTimer, useExerciseProgress, useSubmitFeedback
└── lib/
    ├── supabase/                   # Cliente servidor y cliente browser
    ├── dashboard/
    │   ├── acwr.ts                 # Lógica ACWR pura (testeable)
    │   └── exportService.ts        # Generación de CSV para tesis
    └── workout/
        ├── biomarkers.ts           # sRPE, rMSSD, error de predicción
        └── workoutService.ts       # Capa de acceso a datos Supabase
```

---

## 🔄 Flujo de Inferencia Activa

```
CHECK-IN DIARIO          PRESCRIPCIÓN IA           EJECUCIÓN           FEEDBACK
─────────────────    ──────────────────────    ─────────────────    ──────────────────
Sueño, estrés,   →  Gemini analiza el      →  Modo Ejecución:  →  RPE real +
fatiga, dolor       Prior Bayesiano y          cronómetro +        duración →
+ contexto día      prescribe sesión           lista de            sRPE real
(Libre/Normal/      con justificación           ejercicios          se guarda
Pesado)             científica                  interactiva         como nuevo Prior
```

---

## 🚀 Instalación y Ejecución Local

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/fernandezjesusemmanuel-puntocom/biobalance-tesis.git
cd biobalance-tesis
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Google Gemini
GEMINI_API_KEY=tu-api-key
```

### 3. Configurar la base de datos

Ejecuta las siguientes migraciones en el SQL Editor de Supabase:

```sql
-- Tabla principal de logs diarios
CREATE TABLE daily_logs (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date                 DATE NOT NULL,
  sleep_hours              NUMERIC(4,1),
  stress_level             INT CHECK (stress_level BETWEEN 0 AND 10),
  fatigue_level            INT CHECK (fatigue_level BETWEEN 0 AND 10),
  soreness_level           INT CHECK (soreness_level BETWEEN 0 AND 10),
  rpe_score                INT CHECK (rpe_score BETWEEN 1 AND 10),
  session_duration         INT,
  notes                    TEXT,
  suggested_routine        JSONB,
  actual_rpe               INT,
  actual_duration_min      INT,
  actual_srpe              INT,
  completed                BOOLEAN DEFAULT FALSE,
  simulated_rmssd          NUMERIC(5,1),
  simulated_srpe_previous  NUMERIC(4,1),
  UNIQUE(user_id, log_date)
);

-- Historial de sesiones de entrenamiento
CREATE TABLE workout_sessions (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_id               UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
  session_date         DATE NOT NULL,
  session_type         TEXT,
  duration_seconds     INT,
  rpe                  INT CHECK (rpe BETWEEN 1 AND 10),
  exercises_performed  JSONB,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- Perfiles de usuario
CREATE TABLE profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name  TEXT,
  age         INT,
  avatar_url  TEXT
);

-- Row Level Security (RLS)
ALTER TABLE daily_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own logs"     ON daily_logs       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own workouts" ON workout_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own profile"  ON profiles         FOR ALL USING (auth.uid() = id);
```

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

---

## 📊 Exportación de Datos para Tesis

El sistema incluye exportación directa a `.csv` desde el header del dashboard:

```
Fecha | Horas_Sueño | Nivel_Estrés | Nivel_Fatiga | Dolor_Muscular |
RPE_Esfuerzo | Duración_Min | Carga_Sesión_sRPE | Notas
```

El archivo se genera con BOM UTF-8 para compatibilidad con Excel y se nombra automáticamente con fecha y nombre de usuario.

---

## 🧪 Quality Assurance

- **Validación de inputs:** Zod en todas las rutas API — rechaza datos malformados con `400` antes de contactar a Gemini
- **Fallback offline:** Si Gemini no responde en 15s (AbortController) o devuelve JSON malformado, el sistema prescribe una sesión de recuperación activa segura
- **Manejo de errores UI:** Sin `alert()` bloqueantes — todos los errores aparecen como banners inline
- **Fechas robustas:** Parseo explícito `new Date(year, month-1, day)` para evitar bugs de timezone UTC en Argentina (UTC-3)
- **Queries paralelas:** `Promise.all` en todos los dashboards — latencia ~300ms vs ~900ms secuencial

---

## 📚 Referencias

- Friston, K. (2010). The free-energy principle: a unified brain theory. *Nature Reviews Neuroscience*, 11, 127–138.
- Gabbett, T.J. (2016). The training-injury prevention paradox. *British Journal of Sports Medicine*, 50(5), 273–280.
- Foster, C. et al. (2001). A new approach to monitoring exercise training. *Journal of Strength and Conditioning Research*, 15(1), 109–115.
- Shaffer, F. & Ginsberg, J.P. (2017). An overview of heart rate variability metrics and norms. *Frontiers in Public Health*, 5, 258.
- Buchheit, M. (2014). Monitoring training status with HR measures. *Frontiers in Physiology*, 5, 112.

---

## 👤 Autor

Desarrollado por **Jesús Emmanuel Fernández**, Licenciado en Educación Física.  
Maestría en Educación Física — Universidad Juan Agustín Maza — 2026

---

## 📄 Licencia

© 2026 Jesús Emmanuel Fernández. Todos los derechos reservados.  
Este repositorio es de acceso público exclusivamente con fines de evaluación académica (Universidad Juan Agustín Maza) y demostración de portafolio profesional. Queda prohibida su reproducción, distribución o uso comercial sin el consentimiento expreso y por escrito del autor. Ver archivo `LICENSE` para más detalle.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Conectar-blue)](https://www.linkedin.com/in/jesus-emmanuel-fernandez-0b9a23153)
[![GitHub](https://img.shields.io/badge/GitHub-Repositorio-black)](https://github.com/fernandezjesusemmanuel-puntocom/biobalance-tesis)