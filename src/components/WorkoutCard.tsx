import { Link } from 'react-router-dom';
import { useStore } from '../store';
import type { Workout } from '../types';
import { fmtDuration, fmtKg, fmtRelative, workoutRecords, workoutVolume } from '../utils';
import { ExerciseAvatar } from './ExerciseAvatar';
import { IconTrophy } from './Icons';

export function WorkoutCard({ workout }: { workout: Workout }) {
  const { state, getExercise } = useStore();
  const records = workoutRecords(workout, state.workouts, getExercise).length;
  const shown = workout.exercises.slice(0, 3);
  return (
    <Link to={`/workouts/${workout.id}`} className="card col" style={{ gap: 12 }}>
      <div className="row">
        <div className="avatar sm">{state.settings.userName.slice(0, 1).toUpperCase()}</div>
        <div className="grow">
          <div style={{ fontWeight: 600, fontSize: 14 }}>{state.settings.userName}</div>
          <div className="faint" style={{ fontSize: 12 }}>{fmtRelative(workout.startedAt)}</div>
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 17 }}>{workout.name}</div>
      <div className="stats">
        <div className="stat"><div className="label">Duración</div><div className="value">{fmtDuration(workout.endedAt - workout.startedAt)}</div></div>
        <div className="stat"><div className="label">Volumen</div><div className="value">{fmtKg(workoutVolume(workout))}</div></div>
        {records > 0 && (
          <div className="stat">
            <div className="label">Récords</div>
            <div className="value row" style={{ gap: 4, color: 'var(--gold)' }}>
              <IconTrophy size={16} /> {records}
            </div>
          </div>
        )}
      </div>
      <div className="col" style={{ gap: 6 }}>
        {shown.map((e) => (
          <div key={e.id} className="row" style={{ fontSize: 14 }}>
            <ExerciseAvatar exercise={getExercise(e.exerciseId)} small />
            <span className="muted ellipsis">
              {e.sets.length} {e.sets.length === 1 ? 'serie' : 'series'} {getExercise(e.exerciseId)?.name}
            </span>
          </div>
        ))}
        {workout.exercises.length > shown.length && (
          <div className="faint" style={{ fontSize: 13, textAlign: 'center' }}>
            Ver {workout.exercises.length - shown.length} ejercicios más
          </div>
        )}
      </div>
    </Link>
  );
}
