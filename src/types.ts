export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'antebrazos'
  | 'abdominales'
  | 'cuadriceps'
  | 'isquiotibiales'
  | 'gluteos'
  | 'pantorrillas'
  | 'trapecio'
  | 'cardio'
  | 'cuerpo_completo';

export type Equipment =
  | 'barra'
  | 'mancuerna'
  | 'maquina'
  | 'polea'
  | 'peso_corporal'
  | 'kettlebell'
  | 'banda'
  | 'otro';

/** How a set of this exercise is measured. */
export type ExerciseKind = 'weight_reps' | 'reps' | 'duration';

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: Equipment;
  kind: ExerciseKind;
  custom?: boolean;
}

export type SetType = 'normal' | 'warmup' | 'failure' | 'drop';

export interface WorkoutSet {
  id: string;
  type: SetType;
  /** kg (weight_reps) */
  weight: number | null;
  reps: number | null;
  /** seconds (duration) */
  duration: number | null;
  done: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  notes: string;
  restSeconds: number;
  sets: WorkoutSet[];
}

export interface Routine {
  id: string;
  name: string;
  notes: string;
  exercises: WorkoutExercise[];
  createdAt: number;
  updatedAt: number;
}

export interface Workout {
  id: string;
  name: string;
  notes: string;
  routineId: string | null;
  startedAt: number;
  endedAt: number;
  exercises: WorkoutExercise[];
}

export interface ActiveWorkout extends Omit<Workout, 'endedAt'> {
  restEndsAt: number | null;
  restTotal: number;
}

export interface Settings {
  defaultRestSeconds: number;
  userName: string;
}

export interface AppState {
  version: 1;
  customExercises: Exercise[];
  routines: Routine[];
  workouts: Workout[];
  active: ActiveWorkout | null;
  settings: Settings;
}
