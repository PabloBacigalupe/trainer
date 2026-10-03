import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { BUILTIN_EXERCISES } from './data/exercises';
import type { ActiveWorkout, AppState, Exercise, Routine, Settings, Workout } from './types';
import { newSet, uid } from './utils';

const STORAGE_KEY = 'trainer-state-v1';

export const initialState = (): AppState => ({
  version: 1,
  customExercises: [],
  routines: [],
  workouts: [],
  active: null,
  settings: { defaultRestSeconds: 90, userName: 'Atleta' },
});

const load = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = initialState();
    return { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } };
  } catch {
    return initialState();
  }
};

/** Copy exercises/sets with fresh ids and un-done sets. */
const cloneExercises = (exercises: Routine['exercises']) =>
  exercises.map((e) => ({
    ...e,
    id: uid(),
    sets: e.sets.map((s) => newSet({ ...s, id: uid(), done: false })),
  }));

interface Store {
  state: AppState;
  exercises: Exercise[];
  getExercise: (id: string) => Exercise | undefined;
  startWorkout: (routine?: Routine) => void;
  updateActive: (fn: (a: ActiveWorkout) => ActiveWorkout) => void;
  discardWorkout: () => void;
  /** Saves the active workout (completed sets only). Returns the new workout id. */
  finishWorkout: (opts: { name: string; notes: string; updateRoutine: boolean }) => string | null;
  startRest: (seconds: number) => void;
  stopRest: () => void;
  saveRoutine: (r: Routine) => void;
  deleteRoutine: (id: string) => void;
  duplicateRoutine: (id: string) => void;
  saveWorkout: (w: Workout) => void;
  deleteWorkout: (id: string) => void;
  saveRoutineFromWorkout: (id: string) => string | null;
  addCustomExercise: (e: Omit<Exercise, 'id' | 'custom'>) => Exercise;
  deleteCustomExercise: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  replaceState: (s: AppState) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  // Latest state, for actions that need to return a value synchronously.
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state]);

  const exercises = useMemo(
    () =>
      [...BUILTIN_EXERCISES, ...state.customExercises].sort((a, b) =>
        a.name.localeCompare(b.name, 'es'),
      ),
    [state.customExercises],
  );
  const byId = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const getExercise = useCallback((id: string) => byId.get(id), [byId]);

  const startWorkout = useCallback((routine?: Routine) => {
    setState((s) => ({
      ...s,
      active: {
        id: uid(),
        name: routine?.name ?? 'Entrenamiento',
        notes: '',
        routineId: routine?.id ?? null,
        startedAt: Date.now(),
        exercises: routine ? cloneExercises(routine.exercises) : [],
        restEndsAt: null,
        restTotal: 0,
      },
    }));
  }, []);

  const updateActive = useCallback((fn: (a: ActiveWorkout) => ActiveWorkout) => {
    setState((s) => (s.active ? { ...s, active: fn(s.active) } : s));
  }, []);

  const discardWorkout = useCallback(() => setState((s) => ({ ...s, active: null })), []);

  const finishWorkout: Store['finishWorkout'] = useCallback(({ name, notes, updateRoutine }) => {
    const s = stateRef.current;
    const a = s.active;
    if (!a) return null;
    const exercises = a.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
      .filter((e) => e.sets.length);
    if (!exercises.length) return null;
    const { restEndsAt: _r, restTotal: _t, ...rest } = a;
    const workout: Workout = {
      ...rest,
      name: name.trim() || a.name,
      notes,
      endedAt: Date.now(),
      exercises,
    };
    const routines =
      updateRoutine && a.routineId
        ? s.routines.map((r) =>
            r.id === a.routineId
              ? {
                  ...r,
                  updatedAt: Date.now(),
                  exercises: a.exercises.map((e) => ({
                    ...e,
                    id: uid(),
                    sets: e.sets.map((x) => ({ ...x, id: uid(), done: false })),
                  })),
                }
              : r,
          )
        : s.routines;
    const next = { ...s, routines, active: null, workouts: [workout, ...s.workouts] };
    stateRef.current = next;
    setState(next);
    return workout.id;
  }, []);

  const startRest = useCallback((seconds: number) => {
    updateActive((a) =>
      seconds > 0 ? { ...a, restEndsAt: Date.now() + seconds * 1000, restTotal: seconds } : a,
    );
  }, [updateActive]);
  const stopRest = useCallback(
    () => updateActive((a) => ({ ...a, restEndsAt: null, restTotal: 0 })),
    [updateActive],
  );

  const saveRoutine = useCallback((r: Routine) => {
    setState((s) => {
      const exists = s.routines.some((x) => x.id === r.id);
      const routine = { ...r, updatedAt: Date.now() };
      return {
        ...s,
        routines: exists
          ? s.routines.map((x) => (x.id === r.id ? routine : x))
          : [...s.routines, routine],
      };
    });
  }, []);

  const deleteRoutine = useCallback(
    (id: string) => setState((s) => ({ ...s, routines: s.routines.filter((r) => r.id !== id) })),
    [],
  );

  const duplicateRoutine = useCallback((id: string) => {
    setState((s) => {
      const r = s.routines.find((x) => x.id === id);
      if (!r) return s;
      const copy: Routine = {
        ...r,
        id: uid(),
        name: `${r.name} (copia)`,
        exercises: cloneExercises(r.exercises),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return { ...s, routines: [...s.routines, copy] };
    });
  }, []);

  const saveWorkout = useCallback(
    (w: Workout) =>
      setState((s) => ({ ...s, workouts: s.workouts.map((x) => (x.id === w.id ? w : x)) })),
    [],
  );

  const deleteWorkout = useCallback(
    (id: string) => setState((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) })),
    [],
  );

  const saveRoutineFromWorkout = useCallback((id: string) => {
    const s = stateRef.current;
    const w = s.workouts.find((x) => x.id === id);
    if (!w) return null;
    const routine: Routine = {
      id: uid(),
      name: w.name,
      notes: '',
      exercises: cloneExercises(w.exercises),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = { ...s, routines: [...s.routines, routine] };
    stateRef.current = next;
    setState(next);
    return routine.id;
  }, []);

  const addCustomExercise = useCallback((e: Omit<Exercise, 'id' | 'custom'>) => {
    const ex: Exercise = { ...e, id: `custom-${uid()}`, custom: true };
    setState((s) => ({ ...s, customExercises: [...s.customExercises, ex] }));
    return ex;
  }, []);

  const deleteCustomExercise = useCallback(
    (id: string) =>
      setState((s) => ({ ...s, customExercises: s.customExercises.filter((e) => e.id !== id) })),
    [],
  );

  const updateSettings = useCallback(
    (p: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...p } })),
    [],
  );

  const replaceState = useCallback((s: AppState) => setState({ ...initialState(), ...s }), []);

  const value: Store = {
    state,
    exercises,
    getExercise,
    startWorkout,
    updateActive,
    discardWorkout,
    finishWorkout,
    startRest,
    stopRest,
    saveRoutine,
    deleteRoutine,
    duplicateRoutine,
    saveWorkout,
    deleteWorkout,
    saveRoutineFromWorkout,
    addCustomExercise,
    deleteCustomExercise,
    updateSettings,
    replaceState,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
};

/** Re-render every `ms` milliseconds (for live timers). */
export const useNow = (ms = 1000) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
};
