'use client';

import { ac, ini } from '@/lib/helpers';
import type { ReactNode } from 'react';

export function Topbar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="tb">
      <h1>{title}</h1>
      <div className="tbr">{right}</div>
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="ct">{children}</div>;
}

export function Card({ title, sub, children, className, style }: { title?: string; sub?: string; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`card ${className || ''}`} style={style}>
      {(title || sub) && (
        <div className="ch">
          {title && <div className="cht">{title}</div>}
          {sub && <div className="chs">{sub}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Stat({ icon, bg, num, label }: { icon: string; bg: string; num: ReactNode; label: string }) {
  return (
    <div className="sc">
      <div className="si" style={{ background: bg }}>{icon}</div>
      <div className="sn">{num}</div>
      <div className="sl">{label}</div>
    </div>
  );
}

export function Badge({ children, kind = 'gr', style }: { children: ReactNode; kind?: 'gr' | 'jun' | 'pln' | 'sen' | 'te' | 'bl' | 're' | 'pi' | 'or' | 'am' | 'pu'; style?: React.CSSProperties }) {
  return <span className={`bd b${kind}`} style={style}>{children}</span>;
}

export function NivelBadge({ nivel }: { nivel: 'I' | 'II' | 'III' | string }) {
  const map = { I: 'jun', II: 'pln', III: 'sen' } as const;
  const k = (map as Record<string, 'jun' | 'pln' | 'sen'>)[nivel] || 'gr';
  return <Badge kind={k}>{nivel}</Badge>;
}

export function Avatar({ name, idx, size = 32 }: { name: string; idx: number; size?: number }) {
  const color = ac(idx);
  return (
    <div className="av" style={{ width: size, height: size, fontSize: size * 0.36, background: `${color}18`, color }}>
      {ini(name)}
    </div>
  );
}

export function FaixaBar({ piso, alvo, teto, atual }: { piso: number; alvo: number; teto: number; atual: number }) {
  const seg1 = Math.max(0, atual - piso);
  const seg2 = Math.max(1, alvo - Math.max(atual, piso));
  const seg3 = Math.max(1, teto - alvo);
  const fmt = (n: number) => 'R$ ' + n.toLocaleString('pt-BR');
  return (
    <div>
      <div className="fbar">
        <div className="fbseg" style={{ flex: seg1, background: 'var(--gr)' }} />
        <div className="fbseg" style={{ flex: seg2, background: 'var(--am)' }} />
        <div className="fbseg" style={{ flex: seg3, background: 'var(--pu)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--g4)', marginTop: 2 }}>
        <span>Piso {fmt(piso)}</span>
        <span>Alvo {fmt(alvo)}</span>
        <span>Teto {fmt(teto)}</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, marginTop: 4 }}>▼ Atual: {fmt(atual)}</div>
    </div>
  );
}

export function MktBadge({ status }: { status: 'abaixo' | 'entrada' | 'plena' | 'acima' | null }) {
  if (!status) return <span style={{ color: 'var(--g4)', fontSize: 11 }}>—</span>;
  const m = {
    abaixo: { kind: 're' as const, txt: 'Abaixo do piso' },
    entrada: { kind: 'am' as const, txt: 'Entrada' },
    plena: { kind: 'gr' as const, txt: 'Plena' },
    acima: { kind: 'pu' as const, txt: 'Acima do teto' },
  }[status];
  return <Badge kind={m.kind}>{m.txt}</Badge>;
}

export function Button({ kind = 'p', size, onClick, children, type = 'button', disabled }: { kind?: 'p' | 'o' | 'dng' | 'gn'; size?: 'sm'; onClick?: (e: React.MouseEvent) => void; children: ReactNode; type?: 'button' | 'submit'; disabled?: boolean }) {
  const cls = ['btn', `b${kind}`, size === 'sm' ? 'bsm' : ''].filter(Boolean).join(' ');
  return <button type={type} disabled={disabled} className={cls} onClick={onClick}>{children}</button>;
}

export function Modal({ open, title, onClose, footer, children, width = 600 }: { open: boolean; title: string; onClose: () => void; footer?: ReactNode; children: ReactNode; width?: number }) {
  if (!open) return null;
  return (
    <div className="ov on">
      <div className="modal" style={{ width }}>
        <div className="mh">
          <span className="mt">{title}</span>
          <button className="mx" onClick={onClose}>×</button>
        </div>
        <div className="mb2">{children}</div>
        {footer && <div className="mf">{footer}</div>}
      </div>
    </div>
  );
}
