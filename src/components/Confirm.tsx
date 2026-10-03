import { useEffect, useState } from 'react';

interface Request {
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  /** Only an OK button (replacement for alert). */
  info?: boolean;
  resolve: (ok: boolean) => void;
}

let push: ((r: Request) => void) | null = null;

/** In-page replacement for window.confirm (native dialogs are blocked in some embeds). */
export const askConfirm = (
  message: string,
  opts: { confirmLabel?: string; danger?: boolean } = {},
) =>
  new Promise<boolean>((resolve) => {
    if (!push) return resolve(false);
    push({ message, ...opts, resolve });
  });

export const showMessage = (message: string) =>
  new Promise<void>((resolve) => {
    if (!push) return resolve();
    push({ message, info: true, resolve: () => resolve() });
  });

export function ConfirmHost() {
  const [req, setReq] = useState<Request | null>(null);
  useEffect(() => {
    push = setReq;
    return () => {
      push = null;
    };
  }, []);
  if (!req) return null;
  const close = (ok: boolean) => {
    req.resolve(ok);
    setReq(null);
  };
  return (
    <div className="overlay center" onClick={() => close(false)}>
      <div className="dialog" role="alertdialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-msg">{req.message}</div>
        <div className="row">
          {!req.info && (
            <button className="btn grow" onClick={() => close(false)}>
              Cancelar
            </button>
          )}
          <button
            className={`btn grow ${req.danger ? 'danger-fill' : 'primary'}`}
            autoFocus
            onClick={() => close(true)}
          >
            {req.info ? 'Entendido' : req.confirmLabel ?? 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}
