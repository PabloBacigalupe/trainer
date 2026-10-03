import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExerciseList } from '../components/ExerciseList';
import { Header } from '../components/Sheet';
import { useStore } from '../store';
import type { Routine } from '../types';
import { uid } from '../utils';

export default function RoutineEditor() {
  const { id } = useParams();
  const { state, saveRoutine } = useStore();
  const navigate = useNavigate();
  const existing = state.routines.find((r) => r.id === id);
  const [routine, setRoutine] = useState<Routine>(
    () =>
      existing ?? {
        id: uid(),
        name: '',
        notes: '',
        exercises: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
  );

  if (id && !existing) {
    return (
      <div className="page empty">
        Rutina no encontrada.
        <button className="btn" onClick={() => navigate('/train')}>Volver</button>
      </div>
    );
  }

  const canSave = routine.name.trim() && routine.exercises.length > 0;

  return (
    <>
      <Header
        left={<button className="btn ghost" onClick={() => navigate(-1)}>Cancelar</button>}
        title={existing ? 'Editar rutina' : 'Crear rutina'}
        right={
          <button
            className="btn ghost"
            disabled={!canSave}
            onClick={() => {
              saveRoutine({ ...routine, name: routine.name.trim() });
              navigate('/train', { replace: true });
            }}
          >
            Guardar
          </button>
        }
      />
      <div className="page">
        <input
          className="title-input"
          placeholder="Título de la rutina"
          value={routine.name}
          autoFocus={!existing}
          onChange={(e) => setRoutine({ ...routine, name: e.target.value })}
        />
        <textarea
          className="notes-input"
          placeholder="Notas de la rutina"
          rows={1}
          value={routine.notes}
          onChange={(e) => setRoutine({ ...routine, notes: e.target.value })}
        />
        <ExerciseList
          mode="routine"
          exercises={routine.exercises}
          onChange={(exercises) => setRoutine({ ...routine, exercises })}
        />
      </div>
    </>
  );
}
