'use client';

import { Badge, Card, Page, Topbar } from '@/components/ui';
import { fd } from '@/lib/helpers';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';

export default function HeadcountPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  if (!hydrated) return <div className="ct">Carregando…</div>;

  return (
    <>
      <Topbar title="Headcount · Vagas Abertas" />
      <Page>
        <Card title={`${db.vagas.length} vaga(s) aberta(s)`}>
          <div className="bd-tbl">
            <table className="tbl">
              <thead><tr><th>Cargo</th><th>Área</th><th>Prioridade</th><th>Prazo</th><th>Vínculo</th><th>Faixa</th></tr></thead>
              <tbody>
                {db.vagas.map(v => (
                  <tr key={v.id}>
                    <td><strong>{v.cargo}</strong></td>
                    <td>{v.area}</td>
                    <td><Badge kind={v.prio === 'critica' ? 're' : v.prio === 'media' ? 'am' : 'gr'}>{v.prio}</Badge></td>
                    <td>{fd(v.prazo)}</td>
                    <td><span className="chip">{v.vinculo}</span></td>
                    <td>R$ {v.smin.toLocaleString('pt-BR')} – {v.smax.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
                {!db.vagas.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--g4)', padding: 20 }}>Nenhuma vaga aberta</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </Page>
    </>
  );
}
