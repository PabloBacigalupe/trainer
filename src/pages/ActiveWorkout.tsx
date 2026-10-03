import { useEffect, useRef, useState } from 'react';
import { askConfirm } from '../components/Confirm';
import { Navigate, useNavigate } from 'react-router-dom';
import { ExerciseList } from '../components/ExerciseList';
import { IconDown } from '../components/Icons';
import { Header, Sheet } from '../components/Sheet';
import { useNow, useStore } from '../store';
import { doneSets, fmtClock, fmtKg, workoutVolume } from '../utils';

const beep = () => {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.2, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* audio not available */
  }
};

/** Mounted app-wide so the rest alarm fires even when the workout is minimized. */
export function RestWatcher() {
  const { state, stopRest } = useStore();
  const endsAt = state.active?.restEndsAt ?? null;
  const fired = useRef<number | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    const t = setTimeout(() => {
      if (fired.current === endsAt) return;
      fired.current = endsAt;
      beep();
      stopRest();
    }, Math.max(0, endsAt - Date.now()));
    return () => clearTimeout(t);
  }, [endsAt, stopRest]);
  return null;
}

function RestTimer() {
  const { state, updateActive, stopRest } = useStore();
  const now = useNow(250);
  const a = state.active!;
  const remaining = a.restEndsAt ? Math.ceil((a.restEndsAt - now) / 1000) : 0;

  if (!a.restEndsAt || remaining <= 0) return null;
  const adjust = (d: number) =>
    updateActive((x) =>
      x.restEndsAt ? { ...x, restEndsAt: x.restEndsAt + d * 1000, restTotal: Math.max(1, x.restTotal + d) } : x,
    );
  return (
    <div className="rest-bar">
      <div>
        <div className="row between">
          <button className="btn small" onClick={() => adjust(-15)}>-15</button>
          <div className="col" style={{ alignItems: 'center', gap: 0 }}>
            <span className="faint" style={{ fontSize: 12 }}>Descanso</span>
            <span className="big-clock">{fmtClock(remaining)}</span>
          </div>
          <div className="row">
            <button className="btn small" onClick={() => adjust(15)}>+15</button>
            <button className="btn small primary" onClick={stopRest}>Saltar</button>
          </div>
        </div>
        <div className="progress">
          <div style={{ width: `${Math.min(100, (remaining / a.restTotal) * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

function FinishSheet({ onClose }: { onClose: () => void }) {
  const { state, finishWorkout } = useStore();
  const navigate = useNavigate();
  const a = state.active!;
  const [name, setName] = useState(a.name);
  const [notes, setNotes] = useState(a.notes);
  const [updateRoutine, setUpdateRoutine] = useState(false);
  const sets = doneSets(a);
  const pending = a.exercises.reduce((n, e) => n + e.sets.filter((s) => !s.done).length, 0);
  const routine = state.routines.find((r) => r.id === a.routineId);

  return (
    <Sheet onClose={onClose}>
      <Header
        left={<button className="btn ghost" onClick={onClose}>Volver</button>}
        title="Guardar entrenamiento"
        right={
          <button
            className="btn ghost"
            disabled={!sets}
            onClick={() => {
              const id = finishWorkout({ name, notes, updateRoutine });
              if (id) navigate(`/workouts/${id}?nuevo=1`, { replace: true });
            }}
          >
            Guardar
          </button>
        }
      />
      <div className="page sheet-body">
        <input className="title-input" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="stats">
          <div className="stat"><div className="label">Duración</div><div className="value">{fmtClock((Date.now() - a.startedAt) / 1000)}</div></div>
          <div className="stat"><div className="label">Volumen</div><div className="value">{fmtKg(workoutVolume(a))}</div></div>
          <div className="stat"><div className="label">Series</div><div className="value">{sets}</div></div>
        </div>
        <textarea
          className="textarea"
          placeholder="¿Cómo fue tu entrenamiento? Deja algunas notas..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {!sets && <div className="card tight" style={{ color: 'var(--danger)' }}>Completa al menos una serie para poder guardar.</div>}
        {sets > 0 && pending > 0 && (
          <div className="card tight muted">
            Hay {pending} {pending === 1 ? 'serie sin completar que se descartará' : 'series sin completar que se descartarán'}.
          </div>
        )}
        {routine && (
          <label className="row card tight">
            <input type="checkbox" checked={updateRoutine} onChange={(e) => setUpdateRoutine(e.target.checked)} />
            <span>Actualizar la rutina «{routine.name}» con los valores de hoy</span>
          </label>
        )}
      </div>
    </Sheet>
  );
}

export default function ActiveWorkout() {
  const { state, updateActive, discardWorkout, startRest } = useStore();
  const navigate = useNavigate();
  const now = useNow();
  const [finishing, setFinishing] = useState(false);
  const a = state.active;
  if (!a) return <Navigate to="/train" replace />;

  return (
    <>
      <Header
        left={
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Minimizar">
            <IconDown />
          </button>
        }
        title="Registrar entrenamiento"
        right={<button className="btn small primary" onClick={() => setFinishing(true)}>Terminar</button>}
      />
      <div className="page" style={{ paddingBottom: a.restEndsAt ? 120 : 16 }}>
        <input
          className="title-input"
          value={a.name}
          onChange={(e) => updateActive((x) => ({ ...x, name: e.target.value }))}
          aria-label="Nombre del entrenamiento"
        />
        <div className="stats">
          <div className="stat"><div className="label">Duración</div><div className="value" style={{ color: 'var(--accent)' }}>{fmtClock((now - a.startedAt) / 1000)}</div></div>
          <div className="stat"><div className="label">Volumen</div><div className="value">{fmtKg(workoutVolume(a))}</div></div>
          <div className="stat"><div className="label">Series</div><div className="value">{doneSets(a)}</div></div>
        </div>
        <ExerciseList
          mode="workout"
          exercises={a.exercises}
          historyBefore={a.startedAt}
          onChange={(exercises) => updateActive((x) => ({ ...x, exercises }))}
          onSetCompleted={startRest}
        />
        <button
          className="btn danger block"
          onClick={async () => {
            if (await askConfirm('¿Descartar este entrenamiento? Se perderá todo el progreso.', { confirmLabel: 'Descartar', danger: true })) {
              discardWorkout();
              navigate('/train', { replace: true });
            }
          }}
        >
          Descartar entrenamiento
        </button>
      </div>
      <RestTimer />
      {finishing && <FinishSheet onClose={() => setFinishing(false)} />}
    </>
  );
}
