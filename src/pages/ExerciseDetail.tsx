import { useMemo, useState } from 'react';
import { askConfirm } from '../components/Confirm';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LineChart } from '../components/Charts';
import { setLabels } from '../components/ExerciseEditor';
import { ExerciseAvatar } from '../components/ExerciseAvatar';
import { IconBack, IconTrash, IconTrophy } from '../components/Icons';
import { Header } from '../components/Sheet';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '../data/exercises';
import { useStore } from '../store';
import {
  RECORD_LABELS,
  describeSet,
  exerciseHistory,
  fmtClock,
  fmtDate,
  fmtKg,
  fmtShortDate,
  type ExerciseSession,
  type RecordKind,
} from '../utils';

type Metric = { key: RecordKind | 'volume'; label: string; fmt: (v: number) => string };

export default function ExerciseDetail() {
  const { id = '' } = useParams();
  const { state, getExercise, deleteCustomExercise } = useStore();
  const navigate = useNavigate();
  const ex = getExercise(id);
  const [tab, setTab] = useState<'summary' | 'history'>('summary');
  const history = useMemo(() => exerciseHistory(state.workouts, id), [state.workouts, id]);

  const metrics: Metric[] =
    ex?.kind === 'duration'
      ? [{ key: 'maxDuration', label: 'Mayor duración', fmt: fmtClock }]
      : ex?.kind === 'reps'
        ? [{ key: 'maxReps', label: 'Más repeticiones', fmt: (v) => `${v} reps` }]
        : [
            { key: 'heaviest', label: 'Mayor peso', fmt: fmtKg },
            { key: 'best1RM', label: '1RM estimado', fmt: (v) => fmtKg(Math.round(v * 10) / 10) },
            { key: 'volume', label: 'Volumen sesión', fmt: fmtKg },
          ];
  const [metricKey, setMetricKey] = useState(0);
  const metric = metrics[Math.min(metricKey, metrics.length - 1)]!;

  if (!ex) {
    return (
      <div className="page empty">
        Ejercicio no encontrado.
        <Link to="/exercises" className="btn">Ver ejercicios</Link>
      </div>
    );
  }

  const best = (k: keyof ExerciseSession) => Math.max(0, ...history.map((h) => h[k] as number));
  const recordKinds: RecordKind[] =
    ex.kind === 'duration' ? ['maxDuration'] : ex.kind === 'reps' ? ['maxReps'] : ['heaviest', 'best1RM', 'bestSetVolume'];
  const usedInWorkouts = state.workouts.some((w) => w.exercises.some((e) => e.exerciseId === id));
  const usedInRoutines = state.routines.some((r) => r.exercises.some((e) => e.exerciseId === id));

  return (
    <>
      <Header
        left={<button className="icon-btn" onClick={() => navigate(-1)} aria-label="Volver"><IconBack /></button>}
        title={ex.name}
        right={
          ex.custom && !usedInWorkouts && !usedInRoutines ? (
            <button
              className="icon-btn"
              aria-label="Eliminar ejercicio"
              onClick={async () => {
                if (await askConfirm('¿Eliminar este ejercicio personalizado?', { confirmLabel: 'Eliminar', danger: true })) {
                  deleteCustomExercise(ex.id);
                  navigate(-1);
                }
              }}
            >
              <IconTrash />
            </button>
          ) : undefined
        }
      />
      <div className="page">
        <div className="row">
          <ExerciseAvatar exercise={ex} />
          <div>
            <div style={{ fontWeight: 700 }}>{ex.name}</div>
            <div className="faint" style={{ fontSize: 13 }}>
              Principal: {MUSCLE_LABELS[ex.muscle]} · {EQUIPMENT_LABELS[ex.equipment]}
            </div>
          </div>
        </div>
        <div className="segmented">
          <button className={tab === 'summary' ? 'on' : ''} onClick={() => setTab('summary')}>Resumen</button>
          <button className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>Historial</button>
        </div>

        {tab === 'summary' ? (
          <>
            <div className="card col">
              <div className="row between">
                <div className="section-title">{metric.label}</div>
              </div>
              <LineChart
                format={metric.fmt}
                data={history.slice(-20).map((h) => ({
                  label: fmtShortDate(h.date),
                  detail: fmtShortDate(h.date),
                  value: h[metric.key],
                }))}
              />
              {metrics.length > 1 && (
                <div className="chips">
                  {metrics.map((m, i) => (
                    <button key={m.key} className={`chip${i === metricKey ? ' on' : ''}`} onClick={() => setMetricKey(i)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="card col">
              <div className="section-title">Récords personales</div>
              {recordKinds.map((k) => (
                <div key={k} className="pr-row">
                  <span style={{ color: 'var(--gold)', display: 'flex' }}><IconTrophy size={18} /></span>
                  <span className="grow">{RECORD_LABELS[k]}</span>
                  <strong>
                    {best(k) ? (k === 'maxReps' ? `${best(k)} reps` : k === 'maxDuration' ? fmtClock(best(k)) : fmtKg(Math.round(best(k) * 10) / 10)) : '-'}
                  </strong>
                </div>
              ))}
              <div className="pr-row">
                <span className="grow muted">Sesiones registradas</span>
                <strong>{history.length}</strong>
              </div>
            </div>
          </>
        ) : history.length === 0 ? (
          <div className="card empty">Aún no has registrado este ejercicio.</div>
        ) : (
          [...history].reverse().map((h) => {
            const w = state.workouts.find((x) => x.id === h.workoutId);
            const labels = setLabels(h.sets);
            return (
              <Link key={h.workoutId} to={`/workouts/${h.workoutId}`} className="card col">
                <div style={{ fontWeight: 600 }}>{w?.name}</div>
                <div className="faint" style={{ fontSize: 13 }}>{fmtDate(h.date)}</div>
                {h.sets.map((s, i) => (
                  <div key={s.id} className="row" style={{ fontSize: 14 }}>
                    <span className={`set-type ${s.type}`} style={{ padding: 0 }}>{labels[i]}</span>
                    <span>{describeSet(s, ex)}</span>
                  </div>
                ))}
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
