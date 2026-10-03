import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExerciseAvatar } from '../components/ExerciseAvatar';
import { CustomExerciseForm, useExerciseFilter } from '../components/ExercisePicker';
import { IconBack, IconChevron } from '../components/Icons';
import { Header, Sheet } from '../components/Sheet';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '../data/exercises';

export default function Exercises() {
  const { filtered, controls } = useExerciseFilter();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  return (
    <>
      <Header
        left={<button className="icon-btn" onClick={() => navigate(-1)} aria-label="Volver"><IconBack /></button>}
        title="Ejercicios"
        right={<button className="btn ghost" onClick={() => setCreating(true)}>Crear</button>}
      />
      {controls}
      <div className="list">
        {filtered.map((e) => (
          <Link key={e.id} to={`/exercises/${e.id}`} className="list-item">
            <ExerciseAvatar exercise={e} />
            <div className="grow">
              <div className="ellipsis" style={{ fontWeight: 600 }}>{e.name}</div>
              <div className="faint" style={{ fontSize: 13 }}>
                {MUSCLE_LABELS[e.muscle]} · {EQUIPMENT_LABELS[e.equipment]}
                {e.custom && ' · Personalizado'}
              </div>
            </div>
            <span className="faint"><IconChevron size={18} /></span>
          </Link>
        ))}
        {!filtered.length && <div className="empty">No se encontraron ejercicios</div>}
      </div>
      {creating && (
        <Sheet onClose={() => setCreating(false)}>
          <CustomExerciseForm
            onCancel={() => setCreating(false)}
            onCreated={(id) => navigate(`/exercises/${id}`)}
          />
        </Sheet>
      )}
    </>
  );
}
