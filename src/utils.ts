import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from './types';

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const newSet = (partial: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: uid(),
  type: 'normal',
  weight: null,
  reps: null,
  duration: null,
  done: false,
  ...partial,
});

export const newWorkoutExercise = (exerciseId: string, restSeconds: number): WorkoutExercise => ({
  id: uid(),
  exerciseId,
  notes: '',
  restSeconds,
  sets: [newSet()],
});

/** Estimated one-rep max (Epley). */
export const oneRepMax = (weight: number, reps: number) =>
  reps <= 0 ? 0 : reps === 1 ? weight : weight * (1 + reps / 30);

export const setVolume = (s: WorkoutSet) =>
  s.done && s.weight && s.reps ? s.weight * s.reps : 0;

export const doneSets = (w: { exercises: WorkoutExercise[] }) =>
  w.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);

export const workoutVolume = (w: { exercises: WorkoutExercise[] }) =>
  w.exercises.reduce((v, e) => v + e.sets.reduce((a, s) => a + setVolume(s), 0), 0);

export const workoutReps = (w: { exercises: WorkoutExercise[] }) =>
  w.exercises.reduce(
    (v, e) => v + e.sets.reduce((a, s) => a + (s.done && s.reps ? s.reps : 0), 0),
    0,
  );

export const fmtNumber = (n: number, digits = 1) =>
  n.toLocaleString('es-ES', { maximumFractionDigits: digits });

export const fmtKg = (n: number) => `${fmtNumber(n)} kg`;

export const fmtDuration = (ms: number) => {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h}h ${m}min` : `${m}min`;
};

export const fmtClock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const fmtDate = (ts: number) =>
  capitalize(
    new Date(ts).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

export const fmtShortDate = (ts: number) =>
  new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

export const fmtRelative = (ts: number, now = Date.now()) => {
  const days = Math.floor((startOfDay(now) - startOfDay(ts)) / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return fmtShortDate(ts);
};

export const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Monday-based start of week. */
export const startOfWeek = (ts: number) => {
  const d = new Date(startOfDay(ts));
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.getTime();
};

export const describeSet = (s: WorkoutSet, ex: Exercise | undefined) => {
  if (ex?.kind === 'duration') return s.duration != null ? fmtClock(s.duration) : '-';
  if (ex?.kind === 'reps') return s.reps != null ? `${s.reps} reps` : '-';
  if (s.weight == null && s.reps == null) return '-';
  return `${s.weight ?? 0} kg × ${s.reps ?? 0}`;
};

/** Sets for a given exercise from the most recent workout that contains it. */
export const previousSets = (
  workouts: Workout[],
  exerciseId: string,
): WorkoutSet[] | null => {
  let best: Workout | null = null;
  for (const w of workouts) {
    if (w.exercises.some((e) => e.exerciseId === exerciseId && e.sets.some((s) => s.done))) {
      if (!best || w.startedAt > best.startedAt) best = w;
    }
  }
  if (!best) return null;
  return best.exercises
    .filter((e) => e.exerciseId === exerciseId)
    .flatMap((e) => e.sets.filter((s) => s.done));
};

export interface ExerciseSession {
  workoutId: string;
  date: number;
  sets: WorkoutSet[];
  heaviest: number;
  best1RM: number;
  volume: number;
  bestSetVolume: number;
  maxReps: number;
  maxDuration: number;
}

export const exerciseHistory = (workouts: Workout[], exerciseId: string): ExerciseSession[] =>
  workouts
    .map((w) => {
      const sets = w.exercises
        .filter((e) => e.exerciseId === exerciseId)
        .flatMap((e) => e.sets.filter((s) => s.done));
      if (!sets.length) return null;
      const working = sets.filter((s) => s.type !== 'warmup');
      const src = working.length ? working : sets;
      return {
        workoutId: w.id,
        date: w.startedAt,
        sets,
        heaviest: Math.max(0, ...src.map((s) => s.weight ?? 0)),
        best1RM: Math.max(0, ...src.map((s) => oneRepMax(s.weight ?? 0, s.reps ?? 0))),
        volume: sets.reduce((a, s) => a + setVolume(s), 0),
        bestSetVolume: Math.max(0, ...src.map(setVolume)),
        maxReps: Math.max(0, ...src.map((s) => s.reps ?? 0)),
        maxDuration: Math.max(0, ...src.map((s) => s.duration ?? 0)),
      } satisfies ExerciseSession;
    })
    .filter((x): x is ExerciseSession => x !== null)
    .sort((a, b) => a.date - b.date);

export type RecordKind = 'heaviest' | 'best1RM' | 'bestSetVolume' | 'maxReps' | 'maxDuration';

export const RECORD_LABELS: Record<RecordKind, string> = {
  heaviest: 'Mayor peso',
  best1RM: 'Mejor 1RM estimado',
  bestSetVolume: 'Mejor volumen en una serie',
  maxReps: 'Más repeticiones',
  maxDuration: 'Mayor duración',
};

const recordKindsFor = (ex: Exercise | undefined): RecordKind[] =>
  ex?.kind === 'duration'
    ? ['maxDuration']
    : ex?.kind === 'reps'
      ? ['maxReps']
      : ['heaviest', 'best1RM', 'bestSetVolume'];

/**
 * Personal records set in `workout`, compared to every workout that started before it.
 */
export const workoutRecords = (
  workout: Workout,
  allWorkouts: Workout[],
  getExercise: (id: string) => Exercise | undefined,
): { exerciseId: string; kind: RecordKind; value: number }[] => {
  const before = allWorkouts.filter((w) => w.startedAt < workout.startedAt);
  const ids = [...new Set(workout.exercises.map((e) => e.exerciseId))];
  const out: { exerciseId: string; kind: RecordKind; value: number }[] = [];
  for (const id of ids) {
    const [current] = exerciseHistory([workout], id);
    if (!current) continue;
    const past = exerciseHistory(before, id);
    // The first session of an exercise sets a baseline, not a record.
    if (!past.length) continue;
    for (const kind of recordKindsFor(getExercise(id))) {
      const prevBest = Math.max(0, ...past.map((p) => p[kind]));
      if (current[kind] > 0 && current[kind] > prevBest) {
        out.push({ exerciseId: id, kind, value: current[kind] });
      }
    }
  }
  return out;
};
