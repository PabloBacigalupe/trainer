import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ExerciseAvatar } from '../components/ExerciseAvatar';
import { setLabels } from '../components/ExerciseEditor';
import { IconBack, IconCopy, IconEdit, IconMore, IconTrash, IconTrophy } from '../components/Icons';
import { ActionMenu, Header } from '../components/Sheet';
import { useStore } from '../store';
import {
  RECORD_LABELS,
  describeSet,
  doneSets,
  fmtClock,
  fmtDate,
  fmtDuration,
  fmtKg,
  oneRepMax,
  workoutRecords,
  workoutVolume,
} from '../utils';

export default function WorkoutDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state, getExercise, deleteWorkout, saveRoutineFromWorkout } = useStore();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const w = state.workouts.find((x) => x.id === id);
  if (!w) {
    return (
      <div className="page empty">
        Entrenamiento no encontrado.
        <Link to="/" className="btn">Ir al inicio</Link>
      </div>
    );
  }
  const records = workoutRecords(w, state.workouts, getExercise);
  const isNew = params.has('nuevo');
  const count = state.workouts.filter((x) => x.startedAt <= w.startedAt).length;

  const fmtRecord = (kind: string, value: number) =>
    kind === 'maxReps' ? `${value} reps` : kind === 'maxDuration' ? fmtClock(value) : fmtKg(value);

  return (
    <>
      <Header
        left={
          <button className="icon-btn" onClick={() => (isNew ? navigate('/') : navigate(-1))} aria-label="Volver">
            <IconBack />
          </button>
        }
        title="Detalle del entrenamiento"
        right={
          <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Opciones">
            <IconMore />
          </button>
        }
      />
      <div className="page">
        {isNew && (
          <div className="card col" style={{ alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 34 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>¡Buen trabajo!</div>
            <div className="muted">Este es tu entrenamiento número {count}.</div>
          </div>
        )}
        <div className="col" style={{ gap: 4 }}>
          <h2 style={{ fontSize: 22 }}>{w.name}</h2>
          <div className="faint" style={{ fontSize: 13 }}>{fmtDate(w.startedAt)}</div>
        </div>
        {w.notes && <div className="muted">{w.notes}</div>}
        <div className="stats">
          <div className="stat"><div className="label">Duración</div><div className="value">{fmtDuration(w.endedAt - w.startedAt)}</div></div>
          <div className="stat"><div className="label">Volumen</div><div className="value">{fmtKg(workoutVolume(w))}</div></div>
          <div className="stat"><div className="label">Series</div><div className="value">{doneSets(w)}</div></div>
          <div className="stat"><div className="label">Récords</div><div className="value">{records.length}</div></div>
        </div>

        {records.length > 0 && (
          <div className="card col">
            <div className="section-title">Récords personales</div>
            {records.map((r) => (
              <div key={r.exerciseId + r.kind} className="pr-row">
                <span style={{ color: 'var(--gold)', display: 'flex' }}><IconTrophy size={18} /></span>
                <span className="grow">
                  <strong>{getExercise(r.exerciseId)?.name}</strong>
                  <span className="muted"> · {RECORD_LABELS[r.kind]}</span>
                </span>
                <strong>{fmtRecord(r.kind, r.value)}</strong>
              </div>
            ))}
          </div>
        )}

        {w.exercises.map((e) => {
          const ex = getExercise(e.exerciseId);
          const labels = setLabels(e.sets);
          const hasPR = records.some((r) => r.exerciseId === e.exerciseId);
          return (
            <div key={e.id} className="ex-card">
              <div className="ex-head">
                <ExerciseAvatar exercise={ex} />
                <Link to={`/exercises/${e.exerciseId}`} className="ex-name ellipsis">{ex?.name ?? 'Ejercicio eliminado'}</Link>
                {hasPR && <span className="badge gold"><IconTrophy size={14} /> PR</span>}
              </div>
              {e.notes && <div className="ex-meta muted">{e.notes}</div>}
              <table className="sets">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>Serie</th>
                    <th style={{ textAlign: 'left' }}>Peso y reps</th>
                    {ex?.kind === 'weight_reps' && <th>1RM est.</th>}
                  </tr>
                </thead>
                <tbody>
                  {e.sets.map((s, i) => (
                    <tr key={s.id}>
                      <td><span className={`set-type ${s.type}`}>{labels[i]}</span></td>
                      <td style={{ textAlign: 'left' }}>{describeSet(s, ex)}</td>
                      {ex?.kind === 'weight_reps' && (
                        <td className="muted">{fmtKg(Math.round(oneRepMax(s.weight ?? 0, s.reps ?? 0)))}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      {menu && (
        <ActionMenu
          onClose={() => setMenu(false)}
          actions={[
            { label: 'Editar entrenamiento', icon: <IconEdit size={18} />, onClick: () => navigate(`/workouts/${w.id}/edit`) },
            {
              label: 'Guardar como rutina',
              icon: <IconCopy size={18} />,
              onClick: () => {
                const rid = saveRoutineFromWorkout(w.id);
                if (rid) navigate(`/routines/${rid}`);
              },
            },
            {
              label: 'Eliminar entrenamiento',
              icon: <IconTrash size={18} />,
              danger: true,
              onClick: () => {
                if (confirm('¿Eliminar este entrenamiento?')) {
                  deleteWorkout(w.id);
                  navigate('/', { replace: true });
                }
              },
            },
          ]}
        />
      )}
    </>
  );
}
