import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import type { SetType, WorkoutExercise, WorkoutSet } from '../types';
import { describeSet, newSet } from '../utils';
import { ExerciseAvatar } from './ExerciseAvatar';
import {
  IconCheck,
  IconClock,
  IconDown,
  IconMore,
  IconPlus,
  IconSwap,
  IconTrash,
  IconUp,
} from './Icons';
import { ActionMenu, Sheet } from './Sheet';

export const SET_TYPE_LABELS: Record<SetType, string> = {
  normal: 'Serie normal',
  warmup: 'Calentamiento',
  failure: 'Al fallo',
  drop: 'Drop set',
};
const SET_TYPE_SHORT: Record<Exclude<SetType, 'normal'>, string> = {
  warmup: 'C',
  failure: 'F',
  drop: 'D',
};

export const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
export const fmtRest = (s: number) =>
  s === 0 ? 'Desactivado' : s < 60 ? `${s}s` : `${Math.floor(s / 60)}min${s % 60 ? ` ${s % 60}s` : ''}`;

/** Label for each set: warm-ups/failure/drop get letters, normal sets are numbered. */
export const setLabels = (sets: WorkoutSet[]) => {
  let n = 0;
  return sets.map((s) => (s.type === 'normal' ? String(++n) : SET_TYPE_SHORT[s.type]));
};

const parseNum = (v: string) => {
  if (v.trim() === '') return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

function NumInput({
  value,
  placeholder,
  onChange,
  decimal,
  label,
}: {
  value: number | null;
  placeholder?: string;
  onChange: (v: number | null) => void;
  decimal?: boolean;
  label: string;
}) {
  const [text, setText] = useState<string | null>(null);
  return (
    <input
      className="set-input"
      inputMode={decimal ? 'decimal' : 'numeric'}
      aria-label={label}
      placeholder={placeholder ?? '-'}
      value={text ?? (value == null ? '' : String(value))}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseNum(e.target.value));
      }}
      onBlur={() => setText(null)}
    />
  );
}

export function ExerciseEditor({
  we,
  mode,
  previous,
  onChange,
  onRemove,
  onReplace,
  onMove,
  onSetCompleted,
}: {
  we: WorkoutExercise;
  mode: 'workout' | 'routine';
  previous: WorkoutSet[] | null;
  onChange: (we: WorkoutExercise) => void;
  onRemove: () => void;
  onReplace: () => void;
  onMove: (dir: -1 | 1) => void;
  onSetCompleted?: (restSeconds: number) => void;
}) {
  const { getExercise } = useStore();
  const ex = getExercise(we.exerciseId);
  const kind = ex?.kind ?? 'weight_reps';
  const [menu, setMenu] = useState(false);
  const [setMenuFor, setSetMenuFor] = useState<string | null>(null);
  const [restPicker, setRestPicker] = useState(false);
  const labels = setLabels(we.sets);

  const updateSet = (id: string, patch: Partial<WorkoutSet>) =>
    onChange({ ...we, sets: we.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const addSet = () => {
    const last = we.sets[we.sets.length - 1];
    onChange({
      ...we,
      sets: [
        ...we.sets,
        newSet(
          last
            ? { type: last.type === 'warmup' ? 'normal' : last.type, weight: last.weight, reps: last.reps, duration: last.duration }
            : {},
        ),
      ],
    });
  };

  const toggleDone = (s: WorkoutSet, i: number) => {
    if (s.done) {
      updateSet(s.id, { done: false });
      return;
    }
    const prev = previous?.[i];
    const filled: Partial<WorkoutSet> = {
      weight: s.weight ?? prev?.weight ?? null,
      reps: s.reps ?? prev?.reps ?? null,
      duration: s.duration ?? prev?.duration ?? null,
    };
    const ok =
      kind === 'duration' ? filled.duration != null : filled.reps != null;
    if (!ok) return;
    if (kind === 'weight_reps' && filled.weight == null) filled.weight = 0;
    updateSet(s.id, { ...filled, done: true });
    onSetCompleted?.(we.restSeconds);
  };

  const fillFromPrevious = (s: WorkoutSet, i: number) => {
    const prev = previous?.[i];
    if (prev) updateSet(s.id, { weight: prev.weight, reps: prev.reps, duration: prev.duration });
  };

  const menuSet = we.sets.find((s) => s.id === setMenuFor);

  return (
    <div className="ex-card">
      <div className="ex-head">
        <ExerciseAvatar exercise={ex} />
        <Link to={`/exercises/${we.exerciseId}`} className="ex-name ellipsis">
          {ex?.name ?? 'Ejercicio eliminado'}
        </Link>
        <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Opciones del ejercicio">
          <IconMore />
        </button>
      </div>
      <div className="ex-meta col" style={{ gap: 4 }}>
        <textarea
          className="notes-input"
          rows={1}
          placeholder="Añadir notas aquí..."
          value={we.notes}
          onChange={(e) => onChange({ ...we, notes: e.target.value })}
        />
        <button
          className="btn ghost small"
          style={{ alignSelf: 'flex-start', padding: '4px 0' }}
          onClick={() => setRestPicker(true)}
        >
          <IconClock size={16} /> Descanso: {fmtRest(we.restSeconds)}
        </button>
      </div>
      <table className="sets">
        <thead>
          <tr>
            <th style={{ width: 44 }}>Serie</th>
            {mode === 'workout' && <th>Anterior</th>}
            {kind === 'weight_reps' && <th>Kg</th>}
            {kind !== 'duration' && <th>Reps</th>}
            {kind === 'duration' && <th>Seg</th>}
            <th style={{ width: 44 }}>{mode === 'workout' ? <IconCheck size={16} /> : ''}</th>
          </tr>
        </thead>
        <tbody>
          {we.sets.map((s, i) => {
            const prev = previous?.[i];
            return (
              <tr key={s.id} className={s.done ? 'done' : ''}>
                <td>
                  <button className={`set-type ${s.type}`} onClick={() => setSetMenuFor(s.id)}>
                    {labels[i]}
                  </button>
                </td>
                {mode === 'workout' && (
                  <td>
                    <button className="prev" onClick={() => fillFromPrevious(s, i)} disabled={!prev}>
                      {prev ? describeSet(prev, ex) : '-'}
                    </button>
                  </td>
                )}
                {kind === 'weight_reps' && (
                  <td>
                    <NumInput
                      label="Peso en kg"
                      decimal
                      value={s.weight}
                      placeholder={prev?.weight != null ? String(prev.weight) : undefined}
                      onChange={(v) => updateSet(s.id, { weight: v })}
                    />
                  </td>
                )}
                {kind !== 'duration' && (
                  <td>
                    <NumInput
                      label="Repeticiones"
                      value={s.reps}
                      placeholder={prev?.reps != null ? String(prev.reps) : undefined}
                      onChange={(v) => updateSet(s.id, { reps: v == null ? null : Math.round(v) })}
                    />
                  </td>
                )}
                {kind === 'duration' && (
                  <td>
                    <NumInput
                      label="Duración en segundos"
                      value={s.duration}
                      placeholder={prev?.duration != null ? String(prev.duration) : undefined}
                      onChange={(v) => updateSet(s.id, { duration: v == null ? null : Math.round(v) })}
                    />
                  </td>
                )}
                <td>
                  {mode === 'workout' ? (
                    <button
                      className={`check${s.done ? ' on' : ''}`}
                      onClick={() => toggleDone(s, i)}
                      aria-label={s.done ? 'Marcar como no completada' : 'Completar serie'}
                    >
                      <IconCheck size={18} />
                    </button>
                  ) : (
                    <button
                      className="icon-btn swipe-del"
                      onClick={() => onChange({ ...we, sets: we.sets.filter((x) => x.id !== s.id) })}
                      aria-label="Eliminar serie"
                    >
                      <IconTrash size={18} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button className="btn small add-set" onClick={addSet}>
        <IconPlus size={16} /> Añadir serie
      </button>

      {menu && (
        <ActionMenu
          onClose={() => setMenu(false)}
          actions={[
            { label: 'Reemplazar ejercicio', icon: <IconSwap size={18} />, onClick: onReplace },
            { label: 'Mover arriba', icon: <IconUp size={18} />, onClick: () => onMove(-1) },
            { label: 'Mover abajo', icon: <IconDown size={18} />, onClick: () => onMove(1) },
            { label: 'Eliminar ejercicio', icon: <IconTrash size={18} />, danger: true, onClick: onRemove },
          ]}
        />
      )}
      {menuSet && (
        <ActionMenu
          onClose={() => setSetMenuFor(null)}
          actions={[
            ...(Object.keys(SET_TYPE_LABELS) as SetType[]).map((t) => ({
              label: `${SET_TYPE_LABELS[t]}${menuSet.type === t ? ' ✓' : ''}`,
              onClick: () => updateSet(menuSet.id, { type: t }),
            })),
            {
              label: 'Eliminar serie',
              danger: true,
              icon: <IconTrash size={18} />,
              onClick: () => onChange({ ...we, sets: we.sets.filter((x) => x.id !== menuSet.id) }),
            },
          ]}
        />
      )}
      {restPicker && (
        <Sheet onClose={() => setRestPicker(false)}>
          <div className="menu">
            <div className="section-title" style={{ padding: 8 }}>Temporizador de descanso</div>
            {REST_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  onChange({ ...we, restSeconds: r });
                  setRestPicker(false);
                }}
              >
                {fmtRest(r)} {we.restSeconds === r && '✓'}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

