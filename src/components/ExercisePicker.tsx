import { useMemo, useState } from 'react';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '../data/exercises';
import { useStore } from '../store';
import type { Equipment, ExerciseKind, MuscleGroup } from '../types';
import { ExerciseAvatar } from './ExerciseAvatar';
import { IconCheck, IconSearch, IconX } from './Icons';
import { Header, Sheet } from './Sheet';

const strip = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function useExerciseFilter() {
  const { exercises } = useStore();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const filtered = useMemo(() => {
    const q = strip(query.trim());
    return exercises.filter(
      (e) =>
        (!q || strip(e.name).includes(q)) &&
        (!muscle || e.muscle === muscle) &&
        (!equipment || e.equipment === equipment),
    );
  }, [exercises, query, muscle, equipment]);

  const controls = (
    <div className="col" style={{ padding: '12px 16px', gap: 10 }}>
      <div className="row" style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, color: 'var(--text-3)', display: 'flex' }}>
          <IconSearch size={18} />
        </span>
        <input
          className="input"
          style={{ paddingLeft: 36 }}
          placeholder="Buscar ejercicio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="chips">
        <select
          className="chip"
          value={equipment ?? ''}
          onChange={(e) => setEquipment((e.target.value || null) as Equipment | null)}
          aria-label="Equipamiento"
        >
          <option value="">Todo el equipamiento</option>
          {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button className={`chip${!muscle ? ' on' : ''}`} onClick={() => setMuscle(null)}>
          Todos
        </button>
        {(Object.keys(MUSCLE_LABELS) as MuscleGroup[]).map((m) => (
          <button
            key={m}
            className={`chip${muscle === m ? ' on' : ''}`}
            onClick={() => setMuscle(muscle === m ? null : m)}
          >
            {MUSCLE_LABELS[m]}
          </button>
        ))}
      </div>
    </div>
  );
  return { filtered, controls };
}

export function CustomExerciseForm({
  onCreated,
  onCancel,
}: {
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const { addCustomExercise } = useStore();
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup>('pecho');
  const [equipment, setEquipment] = useState<Equipment>('barra');
  const [kind, setKind] = useState<ExerciseKind>('weight_reps');
  return (
    <>
      <Header
        left={<button className="btn ghost" onClick={onCancel}>Cancelar</button>}
        title="Nuevo ejercicio"
        right={
          <button
            className="btn ghost"
            disabled={!name.trim()}
            onClick={() => onCreated(addCustomExercise({ name: name.trim(), muscle, equipment, kind }).id)}
          >
            Guardar
          </button>
        }
      />
      <div className="page">
        <label className="col">
          <span className="section-title">Nombre</span>
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="col">
          <span className="section-title">Músculo principal</span>
          <select className="select" value={muscle} onChange={(e) => setMuscle(e.target.value as MuscleGroup)}>
            {Object.entries(MUSCLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="col">
          <span className="section-title">Equipamiento</span>
          <select className="select" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
            {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="col">
          <span className="section-title">Tipo de registro</span>
          <select className="select" value={kind} onChange={(e) => setKind(e.target.value as ExerciseKind)}>
            <option value="weight_reps">Peso y repeticiones</option>
            <option value="reps">Solo repeticiones</option>
            <option value="duration">Duración</option>
          </select>
        </label>
      </div>
    </>
  );
}

export function ExercisePicker({
  onPick,
  onClose,
  single,
  title = 'Añadir ejercicios',
}: {
  onPick: (ids: string[]) => void;
  onClose: () => void;
  single?: boolean;
  title?: string;
}) {
  const { filtered, controls } = useExerciseFilter();
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const toggle = (id: string) => {
    if (single) {
      onPick([id]);
      return;
    }
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <Sheet onClose={onClose} full>
      {creating ? (
        <CustomExerciseForm
          onCancel={() => setCreating(false)}
          onCreated={(id) => {
            if (single) onPick([id]);
            else {
              setSelected((s) => [...s, id]);
              setCreating(false);
            }
          }}
        />
      ) : (
        <>
          <Header
            left={
              <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
                <IconX />
              </button>
            }
            title={title}
            right={<button className="btn ghost" onClick={() => setCreating(true)}>Crear</button>}
          />
          {controls}
          <div className="sheet-body">
            <div className="list">
              {filtered.map((e) => {
                const on = selected.includes(e.id);
                return (
                  <button
                    key={e.id}
                    className={`list-item${on ? ' selected' : ''}`}
                    onClick={() => toggle(e.id)}
                  >
                    <ExerciseAvatar exercise={e} />
                    <div className="grow">
                      <div className="ellipsis" style={{ fontWeight: 600 }}>{e.name}</div>
                      <div className="faint" style={{ fontSize: 13 }}>
                        {MUSCLE_LABELS[e.muscle]} · {EQUIPMENT_LABELS[e.equipment]}
                      </div>
                    </div>
                    {on && (
                      <span style={{ color: 'var(--accent)' }}>
                        <IconCheck />
                      </span>
                    )}
                  </button>
                );
              })}
              {!filtered.length && <div className="empty">No se encontraron ejercicios</div>}
            </div>
          </div>
          {!single && selected.length > 0 && (
            <div style={{ padding: 12 }}>
              <button className="btn primary block" onClick={() => onPick(selected)}>
                Añadir {selected.length} {selected.length === 1 ? 'ejercicio' : 'ejercicios'}
              </button>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
