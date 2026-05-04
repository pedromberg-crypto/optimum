'use client';

import { Avatar, Card, Page, Topbar } from '@/components/ui';
import { TRILHA_INFO, type TrilhaKey } from '@/lib/types';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';

const TRILHAS: { key: Exclude<TrilhaKey, ''>; group: 'tec' | 'gest' }[] = [
  { key: 'esp1', group: 'tec' }, { key: 'esp2', group: 'tec' }, { key: 'esp3', group: 'tec' },
  { key: 'gest1', group: 'gest' }, { key: 'gest2', group: 'gest' }, { key: 'gest3', group: 'gest' },
];

export default function PlanoYPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  if (!hydrated) return <div className="ct">Carregando…</div>;

  const tec = TRILHAS.filter(t => t.group === 'tec');
  const gest = TRILHAS.filter(t => t.group === 'gest');

  return (
    <>
      <Topbar title="Plano Y de Carreira" />
      <Page>
        <div className="g2c">
          <Card title="🔧 Trilha Técnica" sub="Especialistas / Arquitetos">
            {tec.map(t => <Trilha key={t.key} k={t.key} db={db} />)}
          </Card>
          <Card title="👥 Trilha de Gestão" sub="Lead / Head / Diretor">
            {gest.map(t => <Trilha key={t.key} k={t.key} db={db} />)}
          </Card>
        </div>
      </Page>
    </>
  );
}

function Trilha({ k, db }: { k: Exclude<TrilhaKey, ''>; db: { colabs: { id: string; n: string; trilha?: TrilhaKey }[] } }) {
  const info = TRILHA_INFO[k];
  const ocupantes = db.colabs.filter(c => c.trilha === k);
  return (
    <div style={{ padding: 10, borderLeft: `3px solid ${info.col}`, marginBottom: 10, background: 'var(--g0)' }}>
      <div style={{ fontWeight: 600 }}>{info.label}</div>
      <div style={{ fontSize: 12, color: 'var(--g5)', marginTop: 2 }}>{info.desc}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {ocupantes.length ? ocupantes.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'var(--g1)', borderRadius: 'var(--rs)', fontSize: 12 }}>
            <Avatar name={c.n} idx={i} size={20} />
            {c.n.split(' ')[0]}
          </div>
        )) : <span style={{ fontSize: 11, color: 'var(--g4)' }}>vago</span>}
      </div>
    </div>
  );
}
