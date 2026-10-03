import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart } from '../components/Charts';
import { REST_OPTIONS, fmtRest } from '../components/ExerciseEditor';
import { IconBack, IconChevron, IconDumbbell } from '../components/Icons';
import { useStore } from '../store';
import type { AppState } from '../types';
import {
  capitalize,
  fmtDuration,
  fmtKg,
  fmtNumber,
  fmtShortDate,
  startOfDay,
  startOfWeek,
  workoutReps,
  workoutVolume,
} from '../utils';

type Metric = 'duration' | 'volume' | 'reps';
const WEEKS = 12;

function Calendar() {
  const { state } = useStore();
  const [offset, setOffset] = useState(0);
  const base = new Date();
  const month = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (month.getDay() + 6) % 7;
  const trained = useMemo(
    () => new Set(state.workouts.map((w) => startOfDay(w.startedAt))),
    [state.workouts],
  );
  const today = startOfDay(Date.now());
  const count = state.workouts.filter((w) => {
    const d = new Date(w.startedAt);
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
  }).length;
  return (
    <div className="card col">
      <div className="row between">
        <button className="icon-btn" onClick={() => setOffset(offset - 1)} aria-label="Mes anterior"><IconBack size={18} /></button>
        <div style={{ fontWeight: 600 }}>
          {capitalize(month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }))}
          <span className="faint" style={{ fontWeight: 400 }}> · {count} {count === 1 ? 'entreno' : 'entrenos'}</span>
        </div>
        <button className="icon-btn" onClick={() => setOffset(offset + 1)} disabled={offset >= 0} aria-label="Mes siguiente"><IconChevron size={18} /></button>
      </div>
      <div className="cal">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <div key={d} className="dow">{d}</div>)}
        {Array.from({ length: lead }, (_, i) => <div key={`l${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const ts = new Date(month.getFullYear(), month.getMonth(), i + 1).getTime();
          return (
            <div key={i} className={`day${trained.has(ts) ? ' on' : ''}${ts === today ? ' today' : ''}`}>
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Profile() {
  const { state, updateSettings, replaceState } = useStore();
  const [metric, setMetric] = useState<Metric>('duration');
  const fileRef = useRef<HTMLInputElement>(null);
  const workouts = state.workouts;

  const weekly = useMemo(() => {
    const now = startOfWeek(Date.now());
    return Array.from({ length: WEEKS }, (_, i) => {
      const start = new Date(now);
      start.setDate(start.getDate() - 7 * (WEEKS - 1 - i));
      const s = start.getTime();
      const e = new Date(s).setDate(new Date(s).getDate() + 7);
      const ws = workouts.filter((w) => w.startedAt >= s && w.startedAt < e);
      const value =
        metric === 'duration'
          ? ws.reduce((a, w) => a + Math.round((w.endedAt - w.startedAt) / 60000), 0)
          : metric === 'volume'
            ? ws.reduce((a, w) => a + workoutVolume(w), 0)
            : ws.reduce((a, w) => a + workoutReps(w), 0);
      return { label: fmtShortDate(s), detail: `Semana del ${fmtShortDate(s)}`, value };
    });
  }, [workouts, metric]);

  const fmt =
    metric === 'duration'
      ? (v: number) => fmtDuration(v * 60000)
      : metric === 'volume'
        ? fmtKg
        : (v: number) => `${fmtNumber(v, 0)} reps`;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `trainer-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as AppState;
      if (!Array.isArray(data.workouts) || !Array.isArray(data.routines)) throw new Error();
      if (confirm('Esto reemplazará todos tus datos actuales. ¿Continuar?')) replaceState(data);
    } catch {
      alert('El archivo no es válido.');
    }
  };

  const totalTime = workouts.reduce((a, w) => a + w.endedAt - w.startedAt, 0);
  const totalVolume = workouts.reduce((a, w) => a + workoutVolume(w), 0);

  return (
    <div className="page">
      <h1 className="page-title">Perfil</h1>
      <div className="row">
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
          {state.settings.userName.slice(0, 1).toUpperCase()}
        </div>
        <div className="grow col" style={{ gap: 4 }}>
          <input
            className="title-input"
            value={state.settings.userName}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            aria-label="Tu nombre"
          />
          <div className="stats">
            <div className="stat"><div className="label">Entrenamientos</div><div className="value">{workouts.length}</div></div>
            <div className="stat"><div className="label">Tiempo total</div><div className="value">{fmtDuration(totalTime)}</div></div>
            <div className="stat"><div className="label">Volumen total</div><div className="value">{fmtKg(totalVolume)}</div></div>
          </div>
        </div>
      </div>

      <div className="card col">
        <div className="section-title">Últimas {WEEKS} semanas</div>
        <BarChart data={weekly} format={fmt} />
        <div className="segmented">
          <button className={metric === 'duration' ? 'on' : ''} onClick={() => setMetric('duration')}>Duración</button>
          <button className={metric === 'volume' ? 'on' : ''} onClick={() => setMetric('volume')}>Volumen</button>
          <button className={metric === 'reps' ? 'on' : ''} onClick={() => setMetric('reps')}>Repeticiones</button>
        </div>
      </div>

      <Calendar />

      <Link to="/exercises" className="card row">
        <IconDumbbell />
        <span className="grow" style={{ fontWeight: 600 }}>Ejercicios y estadísticas</span>
        <IconChevron size={18} />
      </Link>

      <div className="card col">
        <div className="section-title">Ajustes</div>
        <label className="row between">
          <span>Descanso por defecto</span>
          <select
            className="select"
            style={{ width: 'auto' }}
            value={state.settings.defaultRestSeconds}
            onChange={(e) => updateSettings({ defaultRestSeconds: Number(e.target.value) })}
          >
            {REST_OPTIONS.map((r) => <option key={r} value={r}>{fmtRest(r)}</option>)}
          </select>
        </label>
        <div className="grid-2">
          <button className="btn" onClick={exportData}>Exportar datos</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Importar datos</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importData(f);
            e.target.value = '';
          }}
        />
        <div className="faint" style={{ fontSize: 12 }}>
          Tus datos se guardan en este dispositivo. Exporta una copia de seguridad de vez en cuando.
        </div>
      </div>
    </div>
  );
}
