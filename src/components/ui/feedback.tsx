import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { Button, IconButton } from './controls.tsx';

/* ── Notice (inline feedback; replaces alert()) ─────────────────────── */

const NOTICE_ICON = {
  success: CircleCheck,
  error: CircleAlert,
  warn: TriangleAlert,
  info: Info,
} as const;

export const Notice: React.FC<{
  tone?: keyof typeof NOTICE_ICON;
  onDismiss?: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ tone = 'info', onDismiss, className = '', children }) => {
  const Icon = NOTICE_ICON[tone];
  return (
    <div className={`notice notice--${tone} ${className}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden />
      <div className="notice__body">{children}</div>
      {onDismiss && (
        <button type="button" className="notice__close" onClick={onDismiss} aria-label="Dispensar aviso">
          <X />
        </button>
      )}
    </div>
  );
};

/* ── Dialog ─────────────────────────────────────────────────────────── */

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Footer content (usually Buttons). Omit for a footer-less dialog. */
  footer?: React.ReactNode;
  splitFooter?: boolean;
  children?: React.ReactNode;
}> = ({ open, onClose, title, description, size = 'md', footer, splitFooter, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const firstField = panel?.querySelector<HTMLElement>('.dialog__body input, .dialog__body select, .dialog__body textarea');
    (firstField ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`dialog ${size === 'md' ? '' : `dialog--${size}`}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
      >
        <div className="dialog__header">
          <div>
            <h2 className="dialog__title">{title}</h2>
            {description && <p className="dialog__desc">{description}</p>}
          </div>
          <IconButton label="Fechar" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </div>
        <div className="dialog__body">{children}</div>
        {footer && <div className={`dialog__footer ${splitFooter ? 'dialog__footer--split' : ''}`}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

/** Replaces window.confirm(): same yes/no contract, themed and non-blocking. */
export const ConfirmDialog: React.FC<{
  open: boolean;
  title: React.ReactNode;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'danger', onConfirm, onCancel }) => (
  <Dialog
    open={open}
    onClose={onCancel}
    size="sm"
    title={title}
    footer={
      <>
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    {message && <p style={{ color: 'var(--fg-2)', fontSize: 13.5 }}>{message}</p>}
  </Dialog>
);

/* ── Empty state & spinner ──────────────────────────────────────────── */

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="empty">
    {icon && <span className="empty__icon">{icon}</span>}
    <div className="empty__title">{title}</div>
    {description && <div>{description}</div>}
    {action}
  </div>
);

export const Spinner: React.FC = () => <span className="spinner" role="status" aria-label="Carregando" />;
