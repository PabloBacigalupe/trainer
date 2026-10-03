import { describe, expect, it } from 'vitest';
import { BUILTIN_EXERCISES } from './data/exercises';
import type { Workout } from './types';
import {
  exerciseHistory,
  newSet,
  oneRepMax,
  previousSets,
  workoutRecords,
  workoutVolume,
} from './utils';

const getExercise = (id: string) => BUILTIN_EXERCISES.find((e) => e.id === id);

const workout = (id: string, day: number, sets: [number, number, boolean?][]): Workout => ({
  id,
  name: id,
  notes: '',
  routineId: null,
  startedAt: day * 86400000,
  endedAt: day * 86400000 + 3600000,
  exercises: [
    {
      id: `${id}-e`,
      exerciseId: 'bench-press',
      notes: '',
      restSeconds: 90,
      sets: sets.map(([weight, reps, done = true]) => newSet({ weight, reps, done })),
    },
  ],
});

describe('utils', () => {
  it('estimates 1RM with Epley', () => {
    expect(oneRepMax(100, 1)).toBe(100);
    expect(oneRepMax(100, 10)).toBeCloseTo(133.33, 1);
    expect(oneRepMax(100, 0)).toBe(0);
  });

  it('counts volume only for completed sets', () => {
    expect(workoutVolume(workout('a', 1, [[100, 5], [100, 5, false]]))).toBe(500);
  });

  it('returns sets of the most recent workout for an exercise', () => {
    const ws = [workout('old', 1, [[60, 8]]), workout('new', 5, [[70, 6], [70, 5]])];
    expect(previousSets(ws, 'bench-press')?.map((s) => s.weight)).toEqual([70, 70]);
    expect(previousSets(ws, 'squat')).toBeNull();
  });

  it('builds exercise history sorted by date', () => {
    const ws = [workout('b', 3, [[80, 5]]), workout('a', 1, [[60, 10]])];
    const h = exerciseHistory(ws, 'bench-press');
    expect(h.map((x) => x.workoutId)).toEqual(['a', 'b']);
    expect(h[1]!.heaviest).toBe(80);
  });

  it('detects personal records against earlier workouts only', () => {
    const first = workout('a', 1, [[60, 10]]);
    const second = workout('b', 2, [[70, 5]]);
    const third = workout('c', 3, [[65, 5]]);
    const all = [first, second, third];
    expect(workoutRecords(second, all, getExercise).map((r) => r.kind)).toContain('heaviest');
    expect(workoutRecords(third, all, getExercise)).toEqual([]);
    expect(workoutRecords(first, all, getExercise)).toEqual([]);
  });
});
