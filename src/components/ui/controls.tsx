import React from 'react';

/* ── Button ─────────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon (a lucide element). */
  icon?: React.ReactNode;
  block?: boolean;
  loading?: boolean;
}

/** One red primary action per view; everything else stays secondary / ghost. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, block, loading, className = '', children, disabled, type = 'button', ...rest },
  ref
) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button ref={ref} type={type} className={cls} disabled={disabled || loading} {...rest}>
      {loading ? <span className="spinner" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'children'> {
  /** Required: accessible name + tooltip. */
  label: string;
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', className = '', children, ...rest },
  ref
) {
  return (
    <Button ref={ref} variant={variant} size={size} className={`btn--icon ${className}`} aria-label={label} title={label} {...rest}>
      {children}
    </Button>
  );
});

/* ── Inputs ─────────────────────────────────────────────────────────── */

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const TextInput = React.forwardRef<HTMLInputElement, InputProps & { mono?: boolean; emoji?: boolean }>(
  function TextInput({ className = '', mono, emoji, ...rest }, ref) {
    const cls = ['input', mono && 'input--mono', emoji && 'input--emoji', className].filter(Boolean).join(' ');
    return <input ref={ref} type="text" className={cls} {...rest} />;
  }
);

/** Number input with an optional unit shown inside the field (e.g. "s", "pts"). */
export const NumberInput = React.forwardRef<HTMLInputElement, InputProps & { unit?: string }>(function NumberInput(
  { className = '', unit, ...rest },
  ref
) {
  const input = <input ref={ref} type="number" className={`input input--num ${className}`} {...rest} />;
  if (!unit) return input;
  return (
    <span className="affix affix--post">
      {input}
      <span className="affix__post" aria-hidden>
        {unit}
      </span>
    </span>
  );
});

/** Text input with a fixed leading glyph (e.g. "@" or a search icon). */
export const PrefixInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'prefix'> & { prefix: React.ReactNode }>(
  function PrefixInput({ className = '', prefix, ...rest }, ref) {
    return (
      <span className="affix affix--pre">
        <span className="affix__pre" aria-hidden>
          {prefix}
        </span>
        <input ref={ref} type="text" className={`input ${className}`} {...rest} />
      </span>
    );
  }
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = '', children, ...rest },
  ref
) {
  return (
    <select ref={ref} className={`select ${className}`} {...rest}>
      {children}
    </select>
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }
>(function Textarea({ className = '', mono, ...rest }, ref) {
  return <textarea ref={ref} className={`textarea ${mono ? 'textarea--mono' : ''} ${className}`} {...rest} />;
});

/** Label + control + hint/error. Pass the control as children; give it an id and match `htmlFor`. */
export const Field: React.FC<{
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, hint, error, required, htmlFor, className = '', children }) => (
  <div className={`field ${className}`}>
    {label && (
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {required && <em aria-hidden>*</em>}
      </label>
    )}
    {children}
    {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
  </div>
);

/* ── Switch ─────────────────────────────────────────────────────────── */

export const Switch: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}> = ({ checked, onChange, label, disabled, id, className = '' }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    className={`switch ${className}`}
    onClick={() => onChange(!checked)}
  >
    <span className="switch__track" aria-hidden />
    {label !== undefined && <span>{label}</span>}
  </button>
);

/* ── Segmented control (radio semantics) ────────────────────────────── */

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  block,
  label,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (next: T) => void;
  block?: boolean;
  label?: string;
}) {
  return (
    <div className={`segmented ${block ? 'segmented--block' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className="segmented__item"
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ── Chip & difficulty meter ────────────────────────────────────────── */

export const Chip: React.FC<{
  tone?: 'neutral' | 'brand' | 'solid' | 'success' | 'warn';
  mono?: boolean;
  dot?: 'ok' | 'warn' | 'brand' | 'idle';
  icon?: React.ReactNode;
  className?: string;
  title?: string;
  children: React.ReactNode;
}> = ({ tone = 'neutral', mono, dot, icon, className = '', title, children }) => (
  <span
    title={title}
    className={['chip', tone !== 'neutral' && `chip--${tone}`, mono && 'chip--mono', className].filter(Boolean).join(' ')}
  >
    {dot && <span className={`dot ${dot === 'idle' ? '' : `dot--${dot}`}`} aria-hidden />}
    {icon}
    {children}
  </span>
);

export const DIFFICULTY_LABEL: Record<'facil' | 'medio' | 'dificil', string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

export const DifficultyMeter: React.FC<{ level?: 'facil' | 'medio' | 'dificil'; showLabel?: boolean }> = ({
  level = 'medio',
  showLabel = true,
}) => {
  const n = level === 'facil' ? 1 : level === 'dificil' ? 3 : 2;
  return (
    <span className="inline-flex items-center gap-2" title={`Dificuldade: ${DIFFICULTY_LABEL[level]}`}>
      <span className="meter" aria-hidden>
        <i className={n >= 1 ? 'on' : ''} />
        <i className={n >= 2 ? 'on' : ''} />
        <i className={n >= 3 ? 'on' : ''} />
      </span>
      {showLabel && <span>{DIFFICULTY_LABEL[level]}</span>}
    </span>
  );
};
