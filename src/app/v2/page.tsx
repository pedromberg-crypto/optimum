'use client';

import Link from 'next/link';
import { Card, Gauge, KPI, PageHead } from '@/components/v2/kpi';
import { EyeToggle } from '@/components/v2/eye-toggle';
import { colabsAguardandoCCT, getMktStatus, isColabMasked, maskColabFmt } from '@/lib/helpers';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import { useUI } from '@/store/use-ui';

interface BoxCell { perf: 1 | 2 | 3; pot: 1 | 2 | 3; label: string; col: string }
const BOXES: BoxCell[] = [
  { perf: 1, pot: 3, label: 'A desenvolver', col: 'var(--am)' },
  { perf: 2, pot: 3, label: 'Promessa', col: 'var(--bl)' },
  { perf: 3, pot: 3, label: 'Talento estrela', col: 'var(--gr)' },
  { perf: 1, pot: 2, label: 'Inconsistente', col: 'var(--re)' },
  { perf: 2, pot: 2, label: 'Mantenedor', col: 'var(--te)' },
  { perf: 3, pot: 2, label: 'Alto desempenho', col: 'var(--gr)' },
  { perf: 1, pot: 1, label: 'Insuficiente', col: 'var(--re)' },
  { perf: 2, pot: 1, label: 'Eficaz', col: 'var(--g5)' },
  { perf: 3, pot: 1, label: 'Especialista', col: 'var(--pu)' },
];

function bucket(n: number): 1 | 2 | 3 {
  if (n >= 75) return 3;
  if (n >= 50) return 2;
  return 1;
}

export default function DashboardV2() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const oculto = useUI(s => s.oculto);
  const revelados = useUI(s => s.revelados);

  if (!hydrated) return <div className="v2-page">Carregando…</div>;

  const totalColabs = db.colabs.length;
  const vagas = db.vagas.length;
  const pdiAtivos = db.pdis.filter(p => p.st !== 'concluido').length;
  const totalPDI = db.pdis.length;
  const pdiConcluidos = totalPDI - pdiAtivos;
  const pctPDIConcluido = totalPDI ? Math.round((pdiConcluidos / totalPDI) * 100) : 0;

  const ano = new Date().getFullYear();
  const cctPendentes = colabsAguardandoCCT(db, ano);
  const cctAtrasados = cctPendentes.filter(x => x.st.atrasada);

  const mktStats = db.colabs.reduce((acc, c) => {
    const st = getMktStatus(db, c);
    if (st) acc[st]++;
    return acc;
  }, { abaixo: 0, entrada: 0, plena: 0, acima: 0 });
  const totalMkt = mktStats.abaixo + mktStats.entrada + mktStats.plena + mktStats.acima;
  const pctPlena = totalMkt ? Math.round((mktStats.plena / totalMkt) * 100) : 0;

  const ultimaPorColab = (id: string) => {
    const lista = db.avals.filter(a => a.p === id).sort((a, b) => b.dt.localeCompare(a.dt));
    return lista[0] || null;
  };
  const cell = (perf: 1 | 2 | 3, pot: 1 | 2 | 3) => db.colabs.filter(c => {
    const a = ultimaPorColab(c.id);
    if (!a) return false;
    return bucket(a.notas?.performance ?? 0) === perf && bucket(a.notas?.potencial ?? 0) === pot;
  });

  return (
    <div className="v2-page">
      <PageHead
        title="Dashboard"
        sub="Visão geral · indicadores e pendências"
        actions={
          <>
            <span className="v2-pill">{new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
            <Link href="/v2/colaboradores" className="v2-btn v2-btn-p">+ Novo colaborador</Link>
          </>
        }
      />

      <div className="v2-grid-4">
        <KPI label="Colaboradores" value={totalColabs} hint="ativos no time" />
        <KPI label="PDIs ativos" value={pdiAtivos} delta={`${pctPDIConcluido}% concluídos`} deltaKind="up" />
        <KPI label="Vagas abertas" value={vagas} hint={vagas > 0 ? 'em pipeline' : 'sem demandas'} />
        <KPI label="CCT atrasadas" value={cctAtrasados.length} delta={cctAtrasados.length > 0 ? 'requer ação' : 'tudo em dia'} deltaKind={cctAtrasados.length > 0 ? 'down' : 'up'} />
      </div>

      <div className="v2-grid-2-3">
        <Card
          title="9-Box · Performance × Potencial"
          sub="Última avaliação registrada de cada colaborador"
          action={<Link href="/v2/colaboradores" className="v2-card-act">Ver todos →</Link>}
        >
          <div className="v2-9b">
            <div />
            {(['Performance baixa', 'Performance média', 'Performance alta'] as const).map(h => (
              <div key={h} className="v2-9b-axis" style={{ justifyContent: 'center', textAlign: 'center', paddingRight: 0 }}>{h}</div>
            ))}
            {[3, 2, 1].map(potRow => (
              <PotRowV2 key={potRow} pot={potRow as 1 | 2 | 3} cell={cell} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--g4)', marginTop: 12 }}>
            Buckets: nota &lt; 50% = baixa · 50–75% = média · &gt; 75% = alta
          </div>
        </Card>

        <Card title="Posicionamento salarial" sub={oculto ? 'Valores ocultos' : 'Distribuição vs faixa de mercado'}>
          {oculto ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--g4)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Posicionamento oculto</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Use o botão da topbar para revelar</div>
            </div>
          ) : (
            <>
              <Gauge value={pctPlena} max={100} label={`${pctPlena}% na faixa Plena`} color="var(--gr)" />
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <MktRow label="Abaixo do piso" count={mktStats.abaixo} total={totalMkt} color="var(--re)" />
                <MktRow label="Entrada" count={mktStats.entrada} total={totalMkt} color="var(--am)" />
                <MktRow label="Plena" count={mktStats.plena} total={totalMkt} color="var(--gr)" />
                <MktRow label="Acima do teto" count={mktStats.acima} total={totalMkt} color="var(--pu)" />
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="v2-grid-2">
        <Card title="Pendências CCT" sub={`${ano} · ${cctPendentes.length} colaboradores aguardando`} action={<Link href="/v2/cct" className="v2-card-act">Aplicar →</Link>}>
          {cctPendentes.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cctPendentes.slice(0, 5).map(({ c, st }) => (
                <Link key={c.id} href={`/v2/colab/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: st.atrasada ? 'var(--re0)' : 'var(--am0)' }}>
                  <span className={`v2-chip ${st.atrasada ? 'v2-chip-re' : 'v2-chip-am'}`}>
                    {st.atrasada ? `${Math.abs(st.dias!)}d atrasado` : `em ${st.dias}d`}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.n}</span>
                  <span style={{ fontSize: 11, color: 'var(--g5)' }}>{st.sind.sigla}</span>
                </Link>
              ))}
              {cctPendentes.length > 5 && <div style={{ fontSize: 11, color: 'var(--g5)', textAlign: 'center', marginTop: 4 }}>+{cctPendentes.length - 5} restantes</div>}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--g5)' }}>Nenhuma pendência</div>
          )}
        </Card>

        <Card title="PDI · Status" sub="Distribuição entre os objetivos de desenvolvimento" action={<Link href="/v2/colaboradores" className="v2-card-act">Ver →</Link>}>
          {[
            { l: 'Pendente', c: db.pdis.filter(p => p.st === 'pendente').length, col: 'var(--g3)' },
            { l: 'Em andamento', c: db.pdis.filter(p => p.st === 'em-andamento').length, col: 'var(--te)' },
            { l: 'Concluído', c: db.pdis.filter(p => p.st === 'concluido').length, col: 'var(--gr)' },
          ].map(p => (
            <div key={p.l} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{p.l}</span><strong>{p.c}</strong>
              </div>
              <div className="v2-mbar"><div className="v2-mbar-f" style={{ width: `${Math.round((p.c / Math.max(1, db.pdis.length)) * 100)}%`, background: p.col }} /></div>
            </div>
          ))}
          {db.pdis.length === 0 && <div style={{ textAlign: 'center', color: 'var(--g5)', padding: 16 }}>Nenhum PDI registrado</div>}
        </Card>
      </div>

      <Card title="Time" sub={`${db.colabs.length} colaboradores · clique para abrir hub completo`}>
        <table className="v2-tbl">
          <thead>
            <tr><th>Nome</th><th>Cargo</th><th>Vínculo</th><th>Salário</th><th>Posição</th><th>PDIs</th></tr>
          </thead>
          <tbody>
            {db.colabs.map(c => {
              const st = getMktStatus(db, c);
              const pa = db.pdis.filter(p => p.p === c.id && p.st !== 'concluido').length;
              const masked = isColabMasked(c.id, oculto, revelados);
              const stChip = masked ? <span className="v2-chip">•••</span> : !st ? '—' : st === 'plena' ? <span className="v2-chip v2-chip-gr">Plena</span> : st === 'entrada' ? <span className="v2-chip v2-chip-am">Entrada</span> : st === 'abaixo' ? <span className="v2-chip v2-chip-re">Abaixo</span> : <span className="v2-chip v2-chip-pu">Acima</span>;
              return (
                <tr key={c.id} onClick={() => window.location.assign(`/v2/colab/${c.id}`)}>
                  <td><strong>{c.n}</strong></td>
                  <td>{c.ca}</td>
                  <td><span className="v2-chip">{c.vi}</span></td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <strong>{maskColabFmt(c.sal, c.id, oculto, revelados)}</strong>
                      <EyeToggle colabId={c.id} />
                    </span>
                  </td>
                  <td>{stChip}</td>
                  <td>{pa ? <span className="v2-chip v2-chip-te">{pa}</span> : <span style={{ color: 'var(--g4)' }}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function MktRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
        <span>{label}</span><strong>{count}</strong>
      </div>
      <div className="v2-mbar"><div className="v2-mbar-f" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

function PotRowV2({ pot, cell }: { pot: 1 | 2 | 3; cell: (perf: 1 | 2 | 3, pot: 1 | 2 | 3) => { id: string; n: string }[] }) {
  const labelMap = { 3: 'Pot. alto', 2: 'Pot. médio', 1: 'Pot. baixo' };
  return (
    <>
      <div className="v2-9b-axis">{labelMap[pot]}</div>
      {[1, 2, 3].map(perf => {
        const box = BOXES.find(b => b.perf === perf && b.pot === pot)!;
        const occ = cell(perf as 1 | 2 | 3, pot);
        return (
          <div key={perf} className="v2-9b-cell" style={{ borderColor: box.col + '40' }}>
            <div className="v2-9b-lbl" style={{ color: box.col }}>{box.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {occ.map(c => (
                <div key={c.id} style={{ fontSize: 11, fontWeight: 500, color: 'var(--g7)' }}>{c.n.split(' ')[0]}</div>
              ))}
              {!occ.length && <span style={{ fontSize: 10, color: 'var(--g4)' }}>—</span>}
            </div>
          </div>
        );
      })}
    </>
  );
}
