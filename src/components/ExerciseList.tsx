import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { WorkoutExercise } from '../types';
import { newWorkoutExercise, previousSets } from '../utils';
import { ExerciseEditor } from './ExerciseEditor';
import { ExercisePicker } from './ExercisePicker';
import { IconDumbbell, IconPlus } from './Icons';

/** Editable list of exercises with sets, shared by workouts and routines. */
export function ExerciseList({
  exercises,
  onChange,
  mode,
  historyBefore = Infinity,
  onSetCompleted,
}: {
  exercises: WorkoutExercise[];
  onChange: (exercises: WorkoutExercise[]) => void;
  mode: 'workout' | 'routine';
  /** Only workouts that started before this timestamp count as "previous". */
  historyBefore?: number;
  onSetCompleted?: (restSeconds: number) => void;
}) {
  const { state } = useStore();
  const [picker, setPicker] = useState<{ replace: number | null } | null>(null);
  const history = useMemo(
    () => state.workouts.filter((w) => w.startedAt < historyBefore),
    [state.workouts, historyBefore],
  );

  const pick = (ids: string[]) => {
    const rest = state.settings.defaultRestSeconds;
    if (picker?.replace != null) {
      const i = picker.replace;
      onChange(
        exercises.map((e, j) =>
          j === i ? { ...newWorkoutExercise(ids[0]!, e.restSeconds), sets: e.sets.map((s) => ({ ...s, done: false })) } : e,
        ),
      );
    } else {
      onChange([...exercises, ...ids.map((id) => newWorkoutExercise(id, rest))]);
    }
    setPicker(null);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= exercises.length) return;
    const copy = [...exercises];
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    onChange(copy);
  };

  return (
    <>
      {exercises.length === 0 && (
        <div className="empty">
          <IconDumbbell size={40} />
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>Empieza añadiendo un ejercicio</div>
        </div>
      )}
      {exercises.map((we, i) => (
        <ExerciseEditor
          key={we.id}
          we={we}
          mode={mode}
          previous={previousSets(history, we.exerciseId)}
          onChange={(next) => onChange(exercises.map((e) => (e.id === we.id ? next : e)))}
          onRemove={() => onChange(exercises.filter((e) => e.id !== we.id))}
          onReplace={() => setPicker({ replace: i })}
          onMove={(dir) => move(i, dir)}
          onSetCompleted={onSetCompleted}
        />
      ))}
      <button className="btn primary block" onClick={() => setPicker({ replace: null })}>
        <IconPlus size={18} /> Añadir ejercicio
      </button>
      {picker && (
        <ExercisePicker
          single={picker.replace != null}
          title={picker.replace != null ? 'Reemplazar ejercicio' : 'Añadir ejercicios'}
          onClose={() => setPicker(null)}
          onPick={pick}
        />
      )}
    </>
  );
}
