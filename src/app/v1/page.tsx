'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, Badge, Card, MktBadge, NivelBadge, Page, Stat, Topbar } from '@/components/ui';
import { colabsAguardandoCCT, fmt, getCargoFaixa, getMktStatus } from '@/lib/helpers';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';

export default function DashboardPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const router = useRouter();

  if (!hydrated) return <div className="ct">Carregando…</div>;

  const t = db.colabs.length;
  const pi = db.pdis.filter(p => p.st !== 'concluido').length;
  const vt = db.vagas.length;
  const totalPDI = db.pdis.length;

  const cltColabs = db.colabs.filter(c => c.vi === 'CLT' && c.sal);
  const ano = new Date().getFullYear();
  const cctPendentes = colabsAguardandoCCT(db, ano).filter(x => x.st.atrasada);

  return (
    <>
      <Topbar title="Dashboard · Visão geral" />
      <Page>
        {cctPendentes.length > 0 && (
          <Card className="mb" style={{ borderColor: 'var(--am2)' }} title="🔔 Alertas — CCT" sub={`${cctPendentes.length} colaborador(es) com CCT ${ano} atrasada`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {cctPendentes.map(({ c, st }, i) => (
                <Link key={c.id} href={`/v1/colab/${c.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', background: 'var(--am0)', borderRadius: 'var(--rs)', cursor: 'pointer' }}>
                    <Avatar name={c.n} idx={i} size={28} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{c.n.split(' ')[0]}</div>
                      <div style={{ fontSize: 11, color: 'var(--g5)' }}>CCT {ano} · {st.sind.sigla}</div>
                    </div>
                    <Badge kind="re" style={{ fontSize: 10 }}>⚠ {Math.abs(st.dias!)}d</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        <div className="g4c mb">
          <Stat icon="👥" bg="#ede9fe" num={t} label="Colaboradores" />
          <Stat icon="📋" bg="#ecfdf5" num={totalPDI} label="Objetivos PDI" />
          <Stat icon="⏳" bg="#fffbeb" num={pi} label="PDIs ativos" />
          <Stat icon="📌" bg="#fef2f2" num={vt} label="Vagas abertas" />
        </div>

        <div className="g2c mb">
          <Card title="Salário vs Mercado" sub="Posição na faixa cargos × salário CLT">
            {cltColabs.map(c => {
              const f = getCargoFaixa(db, c.ca);
              if (!f) return null;
              const bar = Math.min(100, Math.max(0, Math.round(((c.sal - f.p) / Math.max(1, f.t - f.p)) * 100)));
              const st = getMktStatus(db, c);
              const cor = bar < 20 ? 'var(--re)' : bar < 50 ? 'var(--am)' : 'var(--gr)';
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--g1)' }}>
                  <div style={{ minWidth: 80, fontSize: 12, fontWeight: 500 }}>{c.n.split(' ')[0]}</div>
                  <div style={{ flex: 1 }}><div className="pb"><div className="pf" style={{ width: `${bar}%`, background: cor }} /></div></div>
                  <div style={{ minWidth: 90, fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{fmt(c.sal)}</div>
                  <MktBadge status={st} />
                </div>
              );
            })}
          </Card>

          <Card title="PDI · Status" sub="Distribuição">
            {[
              { l: 'Pendente', c: db.pdis.filter(p => p.st === 'pendente').length, col: 'var(--g3)' },
              { l: 'Em andamento', c: db.pdis.filter(p => p.st === 'em-andamento').length, col: 'var(--te)' },
              { l: 'Concluído', c: db.pdis.filter(p => p.st === 'concluido').length, col: 'var(--gr)' },
            ].map(p => (
              <div key={p.l} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span>{p.l}</span><strong>{p.c}</strong>
                </div>
                <div className="pb"><div className="pf" style={{ width: `${Math.round((p.c / Math.max(1, db.pdis.length)) * 100)}%`, background: p.col }} /></div>
              </div>
            ))}
          </Card>
        </div>

        <Card title="Time" sub="Clique no nome para abrir Ficha 360°">
          <div className="bd-tbl">
            <table className="tbl">
              <thead><tr><th>Nome</th><th>Cargo</th><th>Vínculo</th><th>Salário</th><th>Posição mercado</th><th>PDIs</th></tr></thead>
              <tbody>
                {db.colabs.map((c, i) => {
                  const st = getMktStatus(db, c);
                  const pa = db.pdis.filter(p => p.p === c.id && p.st !== 'concluido').length;
                  const nivel = db.cargos.find(k => k.n === c.ca)?.nivel || null;
                  return (
                    <tr key={c.id} onClick={() => router.push(`/v1/colab/${c.id}`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={c.n} idx={i} size={28} />
                          {c.n}
                        </div>
                      </td>
                      <td>{nivel ? <NivelBadge nivel={nivel} /> : <span style={{ color: 'var(--g4)' }}>—</span>}</td>
                      <td><span className="chip">{c.vi}</span></td>
                      <td><strong>{fmt(c.sal)}</strong></td>
                      <td><MktBadge status={st} /></td>
                      <td>{pa ? <Badge kind="te">{pa}</Badge> : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </Page>
    </>
  );
}
