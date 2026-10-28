import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { ConfirmDialog } from './feedback.tsx';

/**
 * Substitui window.alert / window.confirm no painel: avisos temáticos que não bloqueiam a interface
 * e confirmações com a mesma semântica (sim/não) via Promise.
 *
 *   const { toast, confirm } = useFeedback();
 *   toast('success', 'Desafio salvo.');
 *   if (await confirm({ title: 'Excluir desafio?', message: '…', confirmLabel: 'Excluir' })) { … }
 */

export type ToastTone = 'success' | 'error' | 'warn' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: React.ReactNode;
  title?: React.ReactNode;
}

export interface ConfirmOptions {
  title: React.ReactNode;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
}

interface FeedbackApi {
  toast: (tone: ToastTone, message: React.ReactNode, title?: React.ReactNode) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const api = useContext(FeedbackContext);
  if (!api) throw new Error('useFeedback precisa estar dentro de <FeedbackProvider>.');
  return api;
}

const ICONS = { success: CircleCheck, error: CircleAlert, warn: TriangleAlert, info: Info } as const;
const LIFETIME_MS: Record<ToastTone, number> = { success: 4000, info: 4500, warn: 6500, error: 8000 };

const ToastView: React.FC<{ item: ToastItem; onClose: (id: number) => void }> = ({ item, onClose }) => {
  const Icon = ICONS[item.tone];
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (hover) return;
    const timeout = setTimeout(() => onClose(item.id), LIFETIME_MS[item.tone]);
    return () => clearTimeout(timeout);
  }, [hover, item.id, item.tone, onClose]);

  return (
    <div
      className={`toast-ui toast-ui--${item.tone}`}
      role={item.tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Icon aria-hidden="true" />
      <div className="toast-ui__body">
        {item.title && <div className="toast-ui__title">{item.title}</div>}
        <div>{item.message}</div>
      </div>
      <button type="button" className="toast-ui__close" onClick={() => onClose(item.id)} aria-label="Dispensar aviso">
        <X />
      </button>
    </div>
  );
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const counter = useRef(0);

  const close = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const toast = useCallback<FeedbackApi['toast']>((tone, message, title) => {
    counter.current += 1;
    const id = counter.current;
    // No máximo 4 avisos empilhados: o mais antigo sai quando chega um novo.
    setToasts((list) => [...list.slice(-3), { id, tone, message, title }]);
  }, []);

  const confirm = useCallback<FeedbackApi['confirm']>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setDialog({ ...options, resolve });
      }),
    []
  );

  const settle = (ok: boolean) => {
    dialog?.resolve(ok);
    setDialog(null);
  };

  const api = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <div className="toast-ui__region" aria-live="polite">
        {toasts.map((item) => (
          <ToastView key={item.id} item={item} onClose={close} />
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.title ?? ''}
        message={dialog?.message}
        confirmLabel={dialog?.confirmLabel}
        cancelLabel={dialog?.cancelLabel}
        tone={dialog?.tone}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </FeedbackContext.Provider>
  );
};
