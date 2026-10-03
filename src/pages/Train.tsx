import { useState } from 'react';
import { askConfirm } from '../components/Confirm';
import { Link, useNavigate } from 'react-router-dom';
import { ActionMenu } from '../components/Sheet';
import { IconCopy, IconEdit, IconList, IconMore, IconPlay, IconPlus, IconTrash } from '../components/Icons';
import { useStore } from '../store';
import type { Routine } from '../types';

export default function Train() {
  const { state, startWorkout, getExercise, deleteRoutine, duplicateRoutine } = useStore();
  const navigate = useNavigate();
  const [menuFor, setMenuFor] = useState<Routine | null>(null);

  const start = async (r?: Routine) => {
    if (
      state.active &&
      !(await askConfirm('Ya tienes un entrenamiento en curso. ¿Descartarlo y empezar uno nuevo?', {
        confirmLabel: 'Descartar y empezar',
        danger: true,
      }))
    ) {
      return;
    }
    startWorkout(r);
    navigate('/workout');
  };

  return (
    <div className="page">
      <h1 className="page-title">Entrenar</h1>
      <div className="section-title">Inicio rápido</div>
      <button className="btn block" onClick={() => start()}>
        <IconPlus size={18} /> Empezar entrenamiento vacío
      </button>

      <div className="row between">
        <div className="section-title">Rutinas</div>
      </div>
      <div className="grid-2">
        <Link to="/routines/new" className="btn">
          <IconList size={18} /> Nueva rutina
        </Link>
        <Link to="/exercises" className="btn">
          Ejercicios
        </Link>
      </div>

      <div className="section-title">Mis rutinas ({state.routines.length})</div>
      {state.routines.length === 0 && (
        <div className="card empty">
          <div>Aún no tienes rutinas.</div>
          <div className="faint">Crea una rutina para empezar tus entrenamientos más rápido.</div>
        </div>
      )}
      {state.routines.map((r) => (
        <div key={r.id} className="card col">
          <div className="row between">
            <Link to={`/routines/${r.id}`} style={{ fontWeight: 700, fontSize: 17 }} className="ellipsis grow">
              {r.name}
            </Link>
            <button className="icon-btn" onClick={() => setMenuFor(r)} aria-label="Opciones de rutina">
              <IconMore />
            </button>
          </div>
          <div className="muted" style={{ fontSize: 14, lineHeight: 1.4 }}>
            {r.exercises.length
              ? r.exercises.map((e) => getExercise(e.exerciseId)?.name ?? '?').join(', ')
              : 'Sin ejercicios'}
          </div>
          <button className="btn primary block" onClick={() => start(r)}>
            <IconPlay size={16} /> Empezar rutina
          </button>
        </div>
      ))}

      {menuFor && (
        <ActionMenu
          onClose={() => setMenuFor(null)}
          actions={[
            { label: 'Editar rutina', icon: <IconEdit size={18} />, onClick: () => navigate(`/routines/${menuFor.id}`) },
            { label: 'Duplicar rutina', icon: <IconCopy size={18} />, onClick: () => duplicateRoutine(menuFor.id) },
            {
              label: 'Eliminar rutina',
              icon: <IconTrash size={18} />,
              danger: true,
              onClick: async () =>
                (await askConfirm(`¿Eliminar la rutina «${menuFor.name}»?`, { confirmLabel: 'Eliminar', danger: true })) &&
                deleteRoutine(menuFor.id),
            },
          ]}
        />
      )}
    </div>
  );
}
