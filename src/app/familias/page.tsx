'use client';

import { Card, Page, Topbar } from '@/components/ui';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';

export default function FamiliasPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  if (!hydrated) return <div className="ct">Carregando…</div>;
  return (
    <>
      <Topbar title="Família de Cargos" />
      <Page>
        <div className="g3c">
          {db.familias.map(f => {
            const cargos = db.cargos.filter(k => k.fam === f.id);
            return (
              <Card key={f.id} title={`${f.ic} ${f.n}`} sub={`${cargos.length} cargo(s)`}>
                <div style={{ fontSize: 12, color: 'var(--g5)', marginBottom: 10 }}>{f.desc}</div>
                {cargos.map(k => (
                  <div key={k.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--g1)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span><strong>{k.n}</strong> · {k.nivel}</span>
                    <span style={{ color: 'var(--g5)', fontSize: 11 }}>R$ {k.piso.toLocaleString('pt-BR')} – {k.teto.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      </Page>
    </>
  );
}
