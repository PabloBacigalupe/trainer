import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { IconDumbbell, IconHome, IconUser } from './components/Icons';
import ActiveWorkout, { RestWatcher } from './pages/ActiveWorkout';
import ExerciseDetail from './pages/ExerciseDetail';
import Exercises from './pages/Exercises';
import Home from './pages/Home';
import Profile from './pages/Profile';
import RoutineEditor from './pages/RoutineEditor';
import Train from './pages/Train';
import WorkoutDetail from './pages/WorkoutDetail';
import WorkoutEdit from './pages/WorkoutEdit';
import { useNow, useStore } from './store';
import { fmtClock } from './utils';

function MiniWorkoutBar() {
  const { state } = useStore();
  const navigate = useNavigate();
  const now = useNow();
  const a = state.active;
  if (!a) return null;
  const rest = a.restEndsAt ? Math.ceil((a.restEndsAt - now) / 1000) : 0;
  return (
    <div className="mini-bar">
      <div role="button" onClick={() => navigate('/workout')} style={{ cursor: 'pointer' }}>
        <div className="grow">
          <div style={{ fontWeight: 700 }} className="ellipsis">{a.name}</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            {fmtClock((now - a.startedAt) / 1000)}
            {rest > 0 && ` · Descanso ${fmtClock(rest)}`}
          </div>
        </div>
        <span className="btn small" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>
          Continuar
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const { state } = useStore();
  const { pathname } = useLocation();
  const fullScreen =
    pathname === '/workout' ||
    pathname.startsWith('/routines/') ||
    pathname.endsWith('/edit');
  const showMini = !!state.active && !fullScreen;

  return (
    <div className={`app${showMini ? ' has-mini' : ''}`}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/train" element={<Train />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/workout" element={<ActiveWorkout />} />
        <Route path="/routines/new" element={<RoutineEditor />} />
        <Route path="/routines/:id" element={<RoutineEditor />} />
        <Route path="/workouts/:id" element={<WorkoutDetail />} />
        <Route path="/workouts/:id/edit" element={<WorkoutEdit />} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/exercises/:id" element={<ExerciseDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <RestWatcher />
      {showMini && <MiniWorkoutBar />}
      {!fullScreen && (
        <div className="tabbar">
          <nav>
            <NavLink to="/" end>
              <IconHome />
              Inicio
            </NavLink>
            <NavLink to="/train">
              <IconDumbbell />
              Entrenar
            </NavLink>
            <NavLink to="/profile">
              <IconUser />
              Perfil
            </NavLink>
          </nav>
        </div>
      )}
    </div>
  );
}
