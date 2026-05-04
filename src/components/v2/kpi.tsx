'use client';

import type { ReactNode } from 'react';

export function KPI({ label, value, icon, delta, deltaKind, hint }: {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  delta?: string;
  deltaKind?: 'up' | 'down' | 'neutral';
  hint?: string;
}) {
  return (
    <div className="v2-kpi">
      <div className="v2-kpi-h">
        <div className="v2-kpi-l">{label}</div>
        {icon && <div className="v2-kpi-icon">{icon}</div>}
      </div>
      <div className="v2-kpi-n">{value}</div>
      {(delta || hint) && (
        <div className="v2-kpi-d">
          {delta && (
            <span className={deltaKind === 'up' ? 'v2-kpi-up' : deltaKind === 'down' ? 'v2-kpi-down' : ''}>
              {deltaKind === 'up' ? '▲' : deltaKind === 'down' ? '▼' : ''} {delta}
            </span>
          )}
          {hint && <span style={{ color: 'var(--g4)' }}>{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function Gauge({ value, max = 100, label, color = 'var(--gr)' }: {
  value: number;
  max?: number;
  label?: string;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const r = 50;
  const c = Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="v2-gauge">
        <svg viewBox="0 0 120 70">
          <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#f0f2f7" strokeWidth="10" strokeLinecap="round" />
          <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
        </svg>
        <div className="v2-gauge-num">{Math.round(pct)}%</div>
      </div>
      {label && <div style={{ fontSize: 11, color: 'var(--g5)', marginTop: 4 }}>{label}</div>}
    </div>
  );
}

export function Card({ title, sub, action, children, span }: {
  title?: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  span?: 'full';
}) {
  return (
    <div className="v2-card" style={span === 'full' ? { gridColumn: '1 / -1' } : undefined}>
      {(title || sub || action) && (
        <div className="v2-card-h">
          <div>
            {title && <div className="v2-card-t">{title}</div>}
            {sub && <div className="v2-card-s">{sub}</div>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function PageHead({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="v2-page-head">
      <div>
        <div className="v2-page-title">{title}</div>
        {sub && <div className="v2-page-sub">{sub}</div>}
      </div>
      {actions && <div className="v2-page-actions">{actions}</div>}
    </div>
  );
}
