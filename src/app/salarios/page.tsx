'use client';

import { Badge, Card, FaixaBar, NivelBadge, Page, Topbar } from '@/components/ui';
import { fmt, getMktStatus } from '@/lib/helpers';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';

export default function SalariosPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);

  if (!hydrated) return <div className="ct">Carregando…</div>;

  const familias = db.familias;

  return (
    <>
      <Topbar title="Matriz Salarial" />
      <Page>
        {familias.map(f => {
          const cargos = db.cargos.filter(k => k.fam === f.id).sort((a, b) => a.nivel.localeCompare(b.nivel));
          if (!cargos.length) return null;
          return (
            <Card key={f.id} className="mb" title={`${f.ic} ${f.n}`} sub={f.desc}>
              <div className="bd-tbl">
                <table className="tbl">
                  <thead><tr><th>Cargo</th><th>Nível</th><th>Piso</th><th>Alvo</th><th>Teto</th><th>Ocupantes</th><th>Distribuição</th></tr></thead>
                  <tbody>
                    {cargos.map(k => {
                      const ocupantes = db.colabs.filter(c => c.ca === k.n);
                      const stats = ocupantes.reduce((acc, c) => {
                        const st = getMktStatus(db, c);
                        if (st) acc[st]++;
                        return acc;
                      }, { abaixo: 0, entrada: 0, plena: 0, acima: 0 });
                      return (
                        <tr key={k.id}>
                          <td><strong>{k.n}</strong></td>
                          <td><NivelBadge nivel={k.nivel} /></td>
                          <td>{fmt(k.piso)}</td>
                          <td>{fmt(k.alvo)}</td>
                          <td>{fmt(k.teto)}</td>
                          <td>{ocupantes.length}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, fontSize: 10 }}>
                              {stats.abaixo > 0 && <Badge kind="re">{stats.abaixo} ↓</Badge>}
                              {stats.entrada > 0 && <Badge kind="am">{stats.entrada} →</Badge>}
                              {stats.plena > 0 && <Badge kind="gr">{stats.plena} ●</Badge>}
                              {stats.acima > 0 && <Badge kind="pu">{stats.acima} ↑</Badge>}
                              {ocupantes.length === 0 && <span style={{ color: 'var(--g4)' }}>—</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}

        <Card title="Posicionamento individual" sub="Salário atual vs faixa do cargo">
          {db.colabs.filter(c => c.vi === 'CLT').map(c => {
            const k = db.cargos.find(x => x.n === c.ca);
            if (!k) return null;
            return (
              <div key={c.id} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--g1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  <span>{c.n} <span style={{ color: 'var(--g5)', fontWeight: 400 }}>· {c.ca}</span></span>
                  <span>{fmt(c.sal)}</span>
                </div>
                <FaixaBar piso={k.piso} alvo={k.alvo} teto={k.teto} atual={c.sal} />
              </div>
            );
          })}
        </Card>
      </Page>
    </>
  );
}
