'use client';

import type { ReactNode } from 'react';

export function Tabs<T extends string>({ tabs, value, onChange }: {
  tabs: { key: T; label: string; badge?: ReactNode }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <div className="v2-tabs">
      {tabs.map(t => (
        <button
          key={t.key}
          className={`v2-tab${value === t.key ? ' on' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {t.badge !== undefined && t.badge !== null && (
            <span style={{ marginLeft: 6, fontSize: 10, color: value === t.key ? 'var(--pu)' : 'var(--g4)' }}>
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
