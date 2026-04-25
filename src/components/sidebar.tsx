'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DBTools } from './db-tools';

const NAV: { group: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    group: 'Visão Geral',
    items: [{ href: '/', label: 'Dashboard', icon: '📊' }],
  },
  {
    group: 'Pessoas',
    items: [
      { href: '/time', label: 'Time & Perfis', icon: '👥' },
      { href: '/pdi', label: 'PDI Individual', icon: '📋' },
    ],
  },
  {
    group: 'PCS — Estrutura',
    items: [
      { href: '/familias', label: 'Família de Cargos', icon: '🗂' },
      { href: '/salarios', label: 'Matriz Salarial', icon: '💰' },
      { href: '/plano-y', label: 'Plano Y de Carreira', icon: '🪜' },
      { href: '/avaliacao', label: 'Avaliação & Promoção', icon: '⭐' },
      { href: '/headcount', label: 'Headcount', icon: '📌' },
      { href: '/politica', label: 'Política de Promoção', icon: '📜' },
      { href: '/cct', label: 'Convenções (CCT)', icon: '📅' },
      { href: '/seguranca', label: 'Segurança', icon: '🔒' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sb">
      <div className="brand">
        <div className="bi">O</div>
        <div className="bn">Optimum</div>
        <div className="bs2">PCS · Gestão de Pessoas</div>
      </div>
      <nav className="nav">
        {NAV.map(g => (
          <div key={g.group}>
            <div className="ng">{g.group}</div>
            {g.items.map(it => {
              const active = it.href === '/' ? pathname === '/' : pathname?.startsWith(it.href);
              return (
                <Link key={it.href} href={it.href} className={`na${active ? ' on' : ''}`}>
                  <span style={{ width: 14, display: 'inline-flex', justifyContent: 'center' }}>{it.icon}</span>
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sbf" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}><DBTools /></div>
        <span>v6.0 · Next 16 · local only</span>
      </div>
    </aside>
  );
}
