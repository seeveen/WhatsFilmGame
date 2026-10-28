import React from 'react';

/** Page title block. `eyebrow` is the small mono label with the play marker. */
export const PageHeader: React.FC<{
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, description, actions }) => (
  <header className="page__header">
    <div style={{ minWidth: 0 }}>
      {eyebrow && <div className="page__eyebrow">{eyebrow}</div>}
      <h1 className="page__title">{title}</h1>
      {description && <p className="page__desc">{description}</p>}
    </div>
    {actions && <div className="page__actions">{actions}</div>}
  </header>
);

/** A titled group of content. Prefer this + dividers over stacks of identical cards. */
export const Section: React.FC<{
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, description, actions, className = '', children }) => (
  <section className={`section ${className}`}>
    {(title || actions) && (
      <div className="section__head">
        <div>
          {title && <h2 className="section__title">{title}</h2>}
          {description && <p className="section__desc">{description}</p>}
        </div>
        {actions}
      </div>
    )}
    {children}
  </section>
);

/** Bordered list of SettingRow items (label + hint on the left, control on the right). */
export const SettingList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="setting-list">{children}</div>
);

export const SettingRow: React.FC<{
  label: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}> = ({ label, hint, htmlFor, children }) => (
  <div className="setting-row">
    <div>
      <label className="setting-row__label" htmlFor={htmlFor}>
        {label}
      </label>
      {hint && <div className="setting-row__hint">{hint}</div>}
    </div>
    <div className="setting-row__control">{children}</div>
  </div>
);

/** Strip of key figures separated by hairlines (instead of a grid of cards). */
export const StatStrip: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="stats">{children}</div>;

export const Stat: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
  meta?: React.ReactNode;
}> = ({ label, value, meta }) => (
  <div className="stat">
    <div className="stat__label">{label}</div>
    <div className="stat__value">{value}</div>
    {meta && <div className="stat__meta">{meta}</div>}
  </div>
);
