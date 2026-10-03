import { Link } from 'react-router-dom';
import { WorkoutCard } from '../components/WorkoutCard';
import { IconDumbbell } from '../components/Icons';
import { useStore } from '../store';
import { fmtDuration, fmtKg, startOfWeek, workoutVolume } from '../utils';

export default function Home() {
  const { state } = useStore();
  const workouts = [...state.workouts].sort((a, b) => b.startedAt - a.startedAt);
  const weekStart = startOfWeek(Date.now());
  const thisWeek = workouts.filter((w) => w.startedAt >= weekStart);

  return (
    <div className="page">
      <h1 className="page-title">Inicio</h1>
      <div className="card">
        <div className="section-title" style={{ marginBottom: 8 }}>Esta semana</div>
        <div className="stats">
          <div className="stat"><div className="label">Entrenamientos</div><div className="value">{thisWeek.length}</div></div>
          <div className="stat"><div className="label">Duración</div><div className="value">{fmtDuration(thisWeek.reduce((a, w) => a + w.endedAt - w.startedAt, 0))}</div></div>
          <div className="stat"><div className="label">Volumen</div><div className="value">{fmtKg(thisWeek.reduce((a, w) => a + workoutVolume(w), 0))}</div></div>
        </div>
      </div>
      {workouts.length === 0 ? (
        <div className="card empty">
          <IconDumbbell size={40} />
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>Todavía no hay entrenamientos</div>
          <div>Registra tu primer entrenamiento y aparecerá aquí.</div>
          <Link to="/train" className="btn primary">Empezar a entrenar</Link>
        </div>
      ) : (
        workouts.map((w) => <WorkoutCard key={w.id} workout={w} />)
      )}
    </div>
  );
}
