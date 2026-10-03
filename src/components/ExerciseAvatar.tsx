import type { Exercise } from '../types';

export function ExerciseAvatar({ exercise, small }: { exercise?: Exercise; small?: boolean }) {
  const initials = (exercise?.name ?? '?')
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  return <div className={`avatar${small ? ' sm' : ''}`}>{initials || '?'}</div>;
}
