'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DBTools } from '../db-tools';

const NAV: { group: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    group: 'Visão Geral',
    items: [{ href: '/v1', label: 'Dashboard', icon: '📊' }],
  },
  {
    group: 'Pessoas',
    items: [
      { href: '/v1/time', label: 'Time & Perfis', icon: '👥' },
      { href: '/v1/pdi', label: 'PDI Individual', icon: '📋' },
    ],
  },
  {
    group: 'PCS — Estrutura',
    items: [
      { href: '/v1/familias', label: 'Família de Cargos', icon: '🗂' },
      { href: '/v1/salarios', label: 'Matriz Salarial', icon: '💰' },
      { href: '/v1/plano-y', label: 'Plano Y de Carreira', icon: '🪜' },
      { href: '/v1/avaliacao', label: 'Avaliação & Promoção', icon: '⭐' },
      { href: '/v1/headcount', label: 'Headcount', icon: '📌' },
      { href: '/v1/politica', label: 'Política de Promoção', icon: '📜' },
      { href: '/v1/cct', label: 'Convenções (CCT)', icon: '📅' },
      { href: '/v1/seguranca', label: 'Segurança', icon: '🔒' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sb">
      <div className="brand">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="bi">O</div>
          <div className="bn">Optimum</div>
          <div className="bs2">v1 · clássico</div>
        </Link>
      </div>
      <nav className="nav">
        {NAV.map(g => (
          <div key={g.group}>
            <div className="ng">{g.group}</div>
            {g.items.map(it => {
              const active = it.href === '/v1' ? pathname === '/v1' : pathname?.startsWith(it.href);
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
        <Link href="/" style={{ fontSize: 11, color: 'var(--bl)', textDecoration: 'none' }}>← Trocar versão</Link>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}><DBTools /></div>
        <span>v1.0 · Next 16 · local only</span>
      </div>
    </aside>
  );
}
