import { useEffect, type ReactNode } from 'react';

export function Sheet({
  onClose,
  children,
  full,
}: {
  onClose: () => void;
  children: ReactNode;
  full?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className={`sheet${full ? ' full' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog">
        {children}
      </div>
    </div>
  );
}

export interface MenuAction {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick: () => void;
}

export function ActionMenu({ actions, onClose }: { actions: MenuAction[]; onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <div className="menu">
        {actions.map((a) => (
          <button
            key={a.label}
            className={a.danger ? 'danger' : ''}
            onClick={() => {
              onClose();
              a.onClick();
            }}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
        <button onClick={onClose} style={{ justifyContent: 'center', fontWeight: 600 }}>
          Cancelar
        </button>
      </div>
    </Sheet>
  );
}

export function Header({
  title,
  left,
  right,
}: {
  title?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="header">
      <div className="side">{left}</div>
      <h1>{title}</h1>
      <div className="side right">{right}</div>
    </header>
  );
}
