import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExerciseList } from '../components/ExerciseList';
import { Header } from '../components/Sheet';
import { useStore } from '../store';
import type { Workout } from '../types';

const toLocalInput = (ts: number) => {
  const d = new Date(ts);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function WorkoutEdit() {
  const { id } = useParams();
  const { state, saveWorkout } = useStore();
  const navigate = useNavigate();
  const original = state.workouts.find((w) => w.id === id);
  const [w, setW] = useState<Workout | undefined>(original);
  if (!w) return <div className="page empty">Entrenamiento no encontrado.</div>;

  const durationMin = Math.round((w.endedAt - w.startedAt) / 60000);
  const save = () => {
    const exercises = w.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
      .filter((e) => e.sets.length);
    saveWorkout({ ...w, exercises });
    navigate(-1);
  };

  return (
    <>
      <Header
        left={<button className="btn ghost" onClick={() => navigate(-1)}>Cancelar</button>}
        title="Editar entrenamiento"
        right={<button className="btn ghost" onClick={save}>Guardar</button>}
      />
      <div className="page">
        <input className="title-input" value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} />
        <div className="grid-2">
          <label className="col">
            <span className="section-title">Inicio</span>
            <input
              type="datetime-local"
              className="input"
              value={toLocalInput(w.startedAt)}
              onChange={(e) => {
                const ts = new Date(e.target.value).getTime();
                if (!Number.isNaN(ts)) setW({ ...w, startedAt: ts, endedAt: ts + (w.endedAt - w.startedAt) });
              }}
            />
          </label>
          <label className="col">
            <span className="section-title">Duración (min)</span>
            <input
              type="number"
              min={1}
              className="input"
              value={durationMin}
              onChange={(e) => setW({ ...w, endedAt: w.startedAt + Math.max(1, Number(e.target.value)) * 60000 })}
            />
          </label>
        </div>
        <textarea className="textarea" placeholder="Notas" value={w.notes} onChange={(e) => setW({ ...w, notes: e.target.value })} />
        <div className="faint" style={{ fontSize: 13 }}>Solo se guardarán las series marcadas como completadas.</div>
        <ExerciseList
          mode="workout"
          exercises={w.exercises}
          historyBefore={w.startedAt}
          onChange={(exercises) => setW({ ...w, exercises })}
        />
      </div>
    </>
  );
}
