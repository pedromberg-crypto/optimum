'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, Badge, Button, FaixaBar, Modal, NivelBadge } from '@/components/ui';
import { Card, KPI, PageHead } from '@/components/v2/kpi';
import { Tabs } from '@/components/v2/tabs';
import { ColabFormV2 } from '@/components/v2/colab-form';
import { useToast } from '@/components/toast';
import { checarElegibilidadePromocao, fd, fmt, getCargoFaixa, getMktStatus, getProximosCargos, getSalHist, getSindicatoDoColab, inferCargoTrack, isColabMasked, maskColabFmt, mesesNoCargo, statusCCTColab, uid } from '@/lib/helpers';
import { useUI } from '@/store/use-ui';
import { EyeToggle } from '@/components/v2/eye-toggle';
import { COMPS_PADRAO_COMPORTAMENTAL, CRIT_STATUS_LABEL, MOTIVOS_REAJUSTE, TIPO_AVAL_LABEL, TRILHA_INFO, type Aval, type AvalTipo, type Colab, type CompAval, type CritProgAval, type CritStatus, type PDI, type PDIStatus, type PDITipo } from '@/lib/types';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';

type Tab = 'sobre' | 'comp' | 'carreira' | 'pdi' | 'avaliacao';

export default function ColabHubV2({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const router = useRouter();
  const oculto = useUI(s => s.oculto);
  const revelados = useUI(s => s.revelados);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('sobre');

  if (!hydrated) return <div className="v2-page">Carregando…</div>;

  const c = db.colabs.find(x => x.id === id);
  if (!c) {
    return (
      <div className="v2-page">
        <Card>
          <Link href="/v2/colaboradores">← Voltar</Link>
          <div style={{ marginTop: 16 }}>Colaborador não encontrado.</div>
        </Card>
      </div>
    );
  }

  const cargo = db.cargos.find(k => k.n === c.ca);
  const faixa = getCargoFaixa(db, c.ca);
  const mkt = getMktStatus(db, c);
  const sind = getSindicatoDoColab(db, c);
  const stCCT = statusCCTColab(db, c);
  const hist = getSalHist(db, c.id);
  const pdis = db.pdis.filter(p => p.p === c.id);
  const avals = db.avals.filter(a => a.p === c.id).sort((a, b) => b.dt.localeCompare(a.dt));

  return (
    <div className="v2-page">
      <PageHead
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={c.n} idx={0} size={44} />
            <span>{c.n}</span>
            {c.papel === 'ceo' && <Badge kind="pu">CEO</Badge>}
            {c.papel === 'rh_admin' && <Badge kind="bl">RH Admin</Badge>}
            {cargo && <NivelBadge nivel={cargo.nivel} />}
          </span>
        }
        sub={`${c.ca} · ${c.ar} · ${c.vi}`}
        actions={
          <>
            <button className="v2-btn v2-btn-o" onClick={() => router.push('/v2/colaboradores')}>← Voltar</button>
            <button className="v2-btn v2-btn-p" onClick={() => setEditOpen(true)}>Editar</button>
          </>
        }
      />

      <div className="v2-grid-4">
        <KPI label={<span>Salário atual <EyeToggle colabId={c.id} /></span>} value={maskColabFmt(c.sal, c.id, oculto, revelados)} hint={isColabMasked(c.id, oculto, revelados) ? 'oculto — use o botão ao lado' : faixa ? `piso ${fmt(faixa.p)} · teto ${fmt(faixa.t)}` : 'sem faixa'} />
        <KPI label="Posição" value={isColabMasked(c.id, oculto, revelados) ? '•••' : mkt ? mkt[0].toUpperCase() + mkt.slice(1) : '—'} />
        <KPI label="PDIs ativos" value={pdis.filter(p => p.st !== 'concluido').length} hint={`${pdis.length} total`} />
        <KPI label="Avaliações" value={avals.length} hint={avals[0] ? `última ${fd(avals[0].dt)}` : 'nenhuma'} />
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'sobre', label: 'Sobre' },
          { key: 'comp', label: 'Compensação', badge: hist.length },
          { key: 'carreira', label: 'Carreira', badge: c.alvoCargo ? 'alvo' : '—' },
          { key: 'pdi', label: 'PDI', badge: pdis.length },
          { key: 'avaliacao', label: 'Avaliação', badge: avals.length },
        ]}
      />

      {tab === 'sobre' && (
        <div className="v2-grid-2">
          <Card title="Identificação">
            <Row l="Nome">{c.n}</Row>
            <Row l="Cargo">{c.ca}</Row>
            <Row l="Área">{c.ar}</Row>
            <Row l="Vínculo">{c.vi}</Row>
            <Row l="Squad / Time">{c.sq || '—'}</Row>
            <Row l="Gestor direto">{c.gestorId ? db.colabs.find(g => g.id === c.gestorId)?.n || '—' : '—'}</Row>
            <Row l="Mentor / Par">{c.par || '—'}</Row>
            <Row l="Estado">{c.es || '—'}</Row>
            <Row l="Papel sistema">{c.papel || 'colaborador'}</Row>
          </Card>
          <Card title="Benefícios & Trabalho">
            <Row l="Vale Refeição">{c.vr ? fmt(c.vr) : '—'}</Row>
            <Row l="Vale Transporte">{c.vt || '—'}</Row>
            <Row l="Plano de Saúde">
              {c.psPlano ? (
                <span>{c.psPlano.trim()}{c.psDependentes ? ` · ${c.psDependentes} dep.` : ''}</span>
              ) : c.ps === 'sim' ? 'Sim (plano não detalhado)' : '—'}
            </Row>
            <Row l="Auxílio Home Office">{c.ho ? fmt(c.ho) : '—'}</Row>
            <Row l="Sindicato">{sind ? `${sind.sigla} (base ${sind.dataBase})` : '—'}</Row>
          </Card>

          <Card title="Currículo & Formação" span="full">
            <div style={{ marginBottom: 14 }}>
              {c.cvData && c.cvNome ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--gr0)', border: '1px solid var(--gr2)', borderRadius: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gr)' }}>CV</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 13 }}>{c.cvNome}</strong>
                    <div style={{ fontSize: 11, color: 'var(--g5)' }}>{c.cvTipo || 'arquivo'}</div>
                  </div>
                  <a href={c.cvData} download={c.cvNome} className="v2-btn v2-btn-o v2-btn-sm">↓ Baixar</a>
                  <a href={c.cvData} target="_blank" rel="noreferrer" className="v2-btn v2-btn-p v2-btn-sm">Abrir</a>
                </div>
              ) : (
                <div style={{ padding: 14, background: '#fafbfd', border: '1px dashed #c9cdd8', borderRadius: 10, textAlign: 'center', color: 'var(--g5)', fontSize: 13 }}>
                  Sem currículo anexado · clique em <strong>Editar</strong> para fazer upload
                </div>
              )}
            </div>

            <div className="v2-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--g5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Formação</div>
                <div style={{ fontSize: 12, color: c.formacao ? 'var(--g7)' : 'var(--g4)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{c.formacao || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--g5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Cursos & Certificações</div>
                <div style={{ fontSize: 12, color: c.cursos ? 'var(--g7)' : 'var(--g4)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{c.cursos || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--g5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Competências atuais</div>
                <div style={{ fontSize: 12, color: c.competenciasAtuais ? 'var(--g7)' : 'var(--g4)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{c.competenciasAtuais || '—'}</div>
              </div>
            </div>
          </Card>

          {c.ov && (
            <Card title="Observações" span="full">
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--g7)' }}>{c.ov}</div>
            </Card>
          )}
        </div>
      )}

      {tab === 'comp' && (
        <>
          <div className="v2-grid-2">
            <Card title="Cargo & Faixa" sub={cargo?.n || '—'}>
              {!faixa ? (
                <div style={{ color: 'var(--g4)' }}>Cargo sem faixa configurada</div>
              ) : isColabMasked(c.id, oculto, revelados) ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--g4)', background: 'var(--am0)', borderRadius: 10 }}>
                  Faixa salarial oculta
                  <div style={{ fontSize: 11, marginTop: 4 }}>Clique no olho do KPI Salário pra revelar este colab</div>
                </div>
              ) : (
                <FaixaBar piso={faixa.p} alvo={faixa.a} teto={faixa.t} atual={c.sal} />
              )}
              {cargo && (
                <div style={{ marginTop: 14, fontSize: 12, color: 'var(--g6)', lineHeight: 1.6 }}>
                  <div><strong>Requisitos:</strong> {cargo.req}</div>
                  <div><strong>Progressão:</strong> {cargo.prog}</div>
                </div>
              )}
            </Card>

            <Card title="Status CCT" sub={stCCT ? `${stCCT.sind.sigla} · ${new Date().getFullYear()}` : c.vi !== 'CLT' ? `Vínculo ${c.vi} · sem CCT` : 'Sem sindicato vinculado'}>
              {!stCCT ? (
                <div style={{ color: 'var(--g4)', textAlign: 'center', padding: 20 }}>
                  {c.vi !== 'CLT' ? `Vínculo ${c.vi} não é regido por CCT` : 'Sem sindicato vinculado'}
                </div>
              ) : stCCT.jaAplicado && stCCT.registro ? (
                <div style={{ background: 'var(--gr0)', padding: 12, borderRadius: 10, color: 'var(--gr)', fontSize: 13 }}>
                  CCT aplicada em {fd(stCCT.registro.dt)} — <strong>{stCCT.registro.perc?.toFixed(2)}%</strong>
                  <div style={{ fontSize: 11, color: 'var(--g6)', marginTop: 4 }}>{maskColabFmt(stCCT.registro.valorAnterior, c.id, oculto, revelados)} → {maskColabFmt(stCCT.registro.valor, c.id, oculto, revelados)}</div>
                </div>
              ) : (
                <div style={{ background: stCCT.atrasada ? 'var(--re0)' : 'var(--am0)', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: stCCT.atrasada ? 'var(--re)' : 'var(--am)' }}>
                      {stCCT.atrasada ? 'CCT atrasada' : 'CCT pendente'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--g6)', marginTop: 4 }}>
                      Data-base: {fd(stCCT.dataBaseAno)} · {stCCT.atrasada ? `${Math.abs(stCCT.dias!)}d em atraso` : `em ${stCCT.dias}d`}
                    </div>
                  </div>
                  <Link href="/v2/cct" className="v2-btn v2-btn-p v2-btn-sm">Aplicar →</Link>
                </div>
              )}
            </Card>
          </div>

          <Card title="Histórico Salarial" sub={`${hist.length} registro(s)${isColabMasked(c.id, oculto, revelados) ? ' · valores ocultos' : ''}`}>
            <table className="v2-tbl">
              <thead><tr><th>Data</th><th>Motivo</th><th>De</th><th>Para</th><th>%</th><th>Observação</th></tr></thead>
              <tbody>
                {hist.map(h => (
                  <tr key={h.id}>
                    <td>{fd(h.dt)}</td>
                    <td><span className="v2-chip v2-chip-te">{MOTIVOS_REAJUSTE[h.motivo].label}</span></td>
                    <td>{maskColabFmt(h.valorAnterior, c.id, oculto, revelados)}</td>
                    <td><strong>{maskColabFmt(h.valor, c.id, oculto, revelados)}</strong></td>
                    <td>{h.perc ? `${h.perc.toFixed(2)}%` : '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--g5)' }}>{h.obs || '—'}</td>
                  </tr>
                ))}
                {!hist.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--g4)' }}>Sem histórico</td></tr>}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {tab === 'carreira' && (
        <CarreiraTab colabId={c.id} />
      )}

      {tab === 'pdi' && (
        <PDITab colabId={c.id} pdis={pdis} />
      )}

      {tab === 'avaliacao' && (
        <AvalTab colabId={c.id} avals={avals} />
      )}

      <ColabFormV2 open={editOpen} colab={c} onClose={() => setEditOpen(false)} />
    </div>
  );
}

function Row({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="v2-row">
      <span className="v2-row-l">{l}</span>
      <span className="v2-row-v">{children}</span>
    </div>
  );
}

function CarreiraTab({ colabId }: { colabId: string }) {
  const db = usePCS(s => s.db);
  const saveColab = usePCS(s => s.saveColab);
  const toast = useToast();
  const c = db.colabs.find(x => x.id === colabId)!;
  const cargoAtual = db.cargos.find(k => k.n === c.ca);
  const familia = cargoAtual ? db.familias.find(f => f.id === cargoAtual.fam) : null;
  const meses = mesesNoCargo(c);
  const elegib = checarElegibilidadePromocao(db, c);

  const branchFromAlvo = (alvo?: string): 'tec' | 'gest' | null => {
    if (!alvo) return null;
    const target = db.cargos.find(k => k.n === alvo);
    return target ? inferCargoTrack(target) : null;
  };

  const [branch, setBranch] = useState<'tec' | 'gest' | null>(branchFromAlvo(c.alvoCargo));
  useEffect(() => { setBranch(branchFromAlvo(c.alvoCargo)); }, [c.alvoCargo]);

  const proximosTec = cargoAtual ? getProximosCargos(db, c, 'tec') : [];
  const proximosGest = cargoAtual ? getProximosCargos(db, c, 'gest') : [];
  const cargosBranch = branch === 'tec' ? proximosTec : branch === 'gest' ? proximosGest : [];

  const branchInfo = {
    tec: { label: 'Trilha Técnica · Especialização', desc: `Aprofundar na área de ${familia?.n || 'origem'}. Referência técnica, especialista no domínio.`, col: 'var(--te)', count: proximosTec.length },
    gest: { label: 'Trilha de Gestão · Liderança', desc: 'Liderar pessoas e processos. Decisão tática e estratégica, gestão de time.', col: 'var(--bl)', count: proximosGest.length },
  };

  return (
    <div className="v2-grid-2">
      <Card title="Posição atual" sub={familia ? `Família · ${familia.n}` : 'Sem família vinculada'}>
        {cargoAtual ? (
          <>
            <div style={{ padding: 14, background: 'var(--pu0)', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <NivelBadge nivel={cargoAtual.nivel} />
                <strong style={{ fontSize: 16, color: 'var(--pu)' }}>{cargoAtual.n}</strong>
                <span className={`v2-chip ${inferCargoTrack(cargoAtual) === 'gest' ? 'v2-chip-bl' : 'v2-chip-te'}`}>
                  {inferCargoTrack(cargoAtual) === 'gest' ? 'Gestão' : 'Técnico'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--g6)', marginTop: 8 }}>{cargoAtual.desc}</div>
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--g5)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span>Faixa: <strong>{fmt(cargoAtual.piso)} – {fmt(cargoAtual.teto)}</strong></span>
                <span>Tempo no cargo: <strong>{meses === null ? 'sem data' : `${meses} meses`}</strong></span>
              </div>
            </div>

            <div style={{ padding: 12, background: elegib.elegivel ? 'var(--gr0)' : '#fafbfd', border: `1px solid ${elegib.elegivel ? 'var(--gr2)' : '#eef0f5'}`, borderRadius: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 13, color: elegib.elegivel ? 'var(--gr)' : 'var(--g7)' }}>
                  {elegib.elegivel ? 'Elegível para promoção' : 'Não elegível para promoção'}
                </strong>
                <span className={`v2-chip ${elegib.elegivel ? 'v2-chip-gr' : ''}`}>{elegib.elegivel ? 'Apto' : 'Pendente'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tempo mínimo no cargo ({db.regras.minMesesPromocao} meses)</span>
                  <span style={{ color: elegib.okTempo ? 'var(--gr)' : 'var(--re)', fontWeight: 600 }}>{elegib.okTempo ? 'OK' : 'Pendente'}</span>
                </div>
                {db.regras.exigirAvalParaPromocao && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Avaliação positiva (≥75%)</span>
                    <span style={{ color: elegib.okAval ? 'var(--gr)' : 'var(--re)', fontWeight: 600 }}>{elegib.okAval ? 'OK' : 'Pendente'}</span>
                  </div>
                )}
                {db.regras.exigirPDIConcluido && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>PDIs concluídos</span>
                    <span style={{ color: elegib.okPDI ? 'var(--gr)' : 'var(--re)', fontWeight: 600 }}>{elegib.okPDI ? 'OK' : 'Pendente'}</span>
                  </div>
                )}
              </div>
              {elegib.motivos.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--g5)' }}>
                  Faltam: {elegib.motivos.join(' · ')}
                </div>
              )}
            </div>

            {c.aspiracao && (
              <div style={{ padding: 10, background: 'var(--bl0)', borderRadius: 8, fontSize: 12, color: 'var(--bl)', marginBottom: 8 }}>
                <strong>Aspiração do colaborador:</strong> {c.aspiracao}
              </div>
            )}
            {c.alvoCargo && (
              <div style={{ padding: 10, background: 'var(--pu0)', borderRadius: 8, fontSize: 12, color: 'var(--pu)' }}>
                Alvo definido pelo gestor: <strong>{c.alvoCargo}</strong>
              </div>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--g4)', textAlign: 'center', padding: 20 }}>Cargo atual sem dados estruturados</div>
        )}
      </Card>

      <Card
        title={branch ? `Plano Y · ${branchInfo[branch].label}` : 'Plano Y · Escolher ramo'}
        sub={branch ? 'Próximos passos dentro deste caminho' : 'Decida o caminho de carreira (Y bifurcado)'}
        action={branch ? (
          <button className="v2-card-act" onClick={() => setBranch(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>← trocar ramo</button>
        ) : null}
      >
        {!cargoAtual ? (
          <div style={{ color: 'var(--g4)', textAlign: 'center', padding: 20 }}>Defina o cargo do colaborador primeiro</div>
        ) : !branch ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['tec', 'gest'] as const).map(b => {
              const info = branchInfo[b];
              const vazia = info.count === 0;
              return (
                <button
                  key={b}
                  onClick={() => setBranch(b)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                    borderRadius: 12, border: '2px solid #eef0f5', background: 'var(--w)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                    opacity: vazia ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = info.col; e.currentTarget.style.background = b === 'tec' ? 'var(--te0)' : 'var(--bl0)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#eef0f5'; e.currentTarget.style.background = 'var(--w)'; }}
                >
                  <div style={{ width: 4, height: 44, borderRadius: 4, background: info.col, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: info.col }}>{info.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--g5)', marginTop: 3 }}>{info.desc}</div>
                    <div style={{ fontSize: 11, marginTop: 4, color: vazia ? 'var(--am)' : 'var(--g4)' }}>
                      {vazia ? `Família ${familia?.n || ''} ainda sem cargos nesta trilha — clique para entender e cadastrar` : `${info.count} cargo(s) disponível(is) na família`}
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--g4)' }}>→</span>
                </button>
              );
            })}
            {c.alvoCargo && (
              <button
                onClick={() => { saveColab({ ...c, alvoCargo: undefined }); toast.push('Alvo removido', 'info'); }}
                style={{ marginTop: 4, padding: 8, fontSize: 12, color: 'var(--re)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Remover cargo alvo atual ({c.alvoCargo})
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cargosBranch.length === 0 ? (
              <div style={{ padding: 16, background: 'var(--am0)', borderRadius: 10, border: '1px solid var(--am2)', fontSize: 13, color: 'var(--g7)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--am)', marginBottom: 8 }}>Por que essa trilha está vazia?</div>
                <div style={{ marginBottom: 10 }}>
                  Família <strong>{familia?.n}</strong> não tem cargos classificados como <strong>{branch === 'tec' ? 'técnicos' : 'gestão'}</strong> ainda.
                </div>
                <div style={{ fontSize: 12, color: 'var(--g6)', marginBottom: 10, lineHeight: 1.6 }}>
                  Sistema infere a trilha pelo nome do cargo (keywords: <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 3 }}>gestor, head, coord, lead, gerente, líder…</code>). Cargos sem essas palavras viram trilha técnica por padrão.
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Como resolver:</div>
                <ul style={{ paddingLeft: 18, fontSize: 12, color: 'var(--g6)', lineHeight: 1.7, marginBottom: 12 }}>
                  <li>Cadastrar novo cargo de {branch === 'tec' ? 'especialização técnica' : 'gestão'} (ex: {branch === 'gest' ? '"Tech Lead", "Head de Engenharia", "Engineering Manager"' : '"Especialista", "Arquiteto", "Principal"'})</li>
                  <li>Marcar cargo existente como <strong>{branch === 'tec' ? 'tec' : 'gest'}</strong> via campo <em>track</em> ao editar o cargo</li>
                </ul>
                <Link href="/v2/cargos" className="v2-btn v2-btn-p v2-btn-sm" style={{ display: 'inline-block', textDecoration: 'none' }}>→ Ir para Cargos & Vagas</Link>
              </div>
            ) : cargosBranch.map((k, i) => {
              const ativo = c.alvoCargo === k.n;
              const col = branch === 'tec' ? 'var(--te)' : 'var(--bl)';
              const ehAtual = k.n === cargoAtual.n;
              const isLast = i === cargosBranch.length - 1;
              return (
                <div key={k.id} style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      if (ehAtual) return;
                      saveColab({ ...c, alvoCargo: ativo ? undefined : k.n });
                      toast.push(ativo ? 'Alvo removido' : `Alvo: ${k.n}`, 'ok');
                    }}
                    disabled={ehAtual}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 14px', borderRadius: 10,
                      border: '1px solid', borderColor: ativo ? col : ehAtual ? 'var(--g3)' : '#eef0f5',
                      background: ativo ? (branch === 'tec' ? 'var(--te0)' : 'var(--bl0)') : ehAtual ? 'var(--g1)' : 'var(--w)',
                      cursor: ehAtual ? 'default' : 'pointer', textAlign: 'left'
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: ativo ? col : ehAtual ? 'var(--g4)' : '#f4f6fa', color: ativo || ehAtual ? '#fff' : 'var(--g5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, fontFamily: "'Poppins',sans-serif", flexShrink: 0 }}>
                      {ehAtual ? '•' : i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <strong style={{ fontSize: 13, color: ativo ? col : 'var(--g8)' }}>{k.n}</strong>
                        <NivelBadge nivel={k.nivel} />
                        {ehAtual && <span className="v2-chip" style={{ fontSize: 9, background: 'var(--g4)', color: '#fff' }}>VOCÊ</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--g5)' }}>
                        {fmt(k.piso)} – {fmt(k.teto)}
                      </div>
                      {k.prog && !ehAtual && (
                        <div style={{ fontSize: 11, color: 'var(--g5)', marginTop: 4, fontStyle: 'italic' }}>
                          → {k.prog}
                        </div>
                      )}
                    </div>
                    {ativo && <span className="v2-chip v2-chip-pu" style={{ background: col + '20', color: col }}>alvo</span>}
                  </button>
                  {!isLast && <div style={{ width: 2, height: 8, background: '#eef0f5', marginLeft: 29 }} />}
                </div>
              );
            })}
            {c.alvoCargo && (
              <button
                onClick={() => { saveColab({ ...c, alvoCargo: undefined }); toast.push('Alvo removido', 'info'); }}
                style={{ marginTop: 8, padding: 8, fontSize: 12, color: 'var(--re)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Remover alvo
              </button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function PDITab({ colabId, pdis }: { colabId: string; pdis: PDI[] }) {
  const savePDI = usePCS(s => s.savePDI);
  const delPDI = usePCS(s => s.delPDI);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PDI | null>(null);
  const [fStatus, setFStatus] = useState<'' | PDIStatus>('');
  const [fTipo, setFTipo] = useState<'' | PDITipo>('');
  const [fData, setFData] = useState<'' | 'vencidos' | 'proximos7' | 'proximos30' | 'sem-prazo'>('');
  const [dataIni, setDataIni] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [sort, setSort] = useState<'prazo-asc' | 'prazo-desc'>('prazo-asc');
  const TIPO_LABEL: Record<PDITipo, string> = { hard: 'Hard skill', soft: 'Soft skill', ent: 'Entrega' };
  const ST_NEXT: Record<PDIStatus, PDIStatus> = { pendente: 'em-andamento', 'em-andamento': 'concluido', concluido: 'pendente' };
  const ST_LABEL: Record<PDIStatus, string> = { pendente: 'Pendente', 'em-andamento': 'Em andamento', concluido: 'Concluído' };

  const hoje = new Date().toISOString().slice(0, 10);
  const addDays = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

  const filtrados = pdis.filter(p => {
    if (fStatus && p.st !== fStatus) return false;
    if (fTipo && p.t !== fTipo) return false;
    if (fData === 'sem-prazo' && p.pz) return false;
    if (fData === 'vencidos' && (!p.pz || p.pz >= hoje || p.st === 'concluido')) return false;
    if (fData === 'proximos7' && (!p.pz || p.pz < hoje || p.pz > addDays(7))) return false;
    if (fData === 'proximos30' && (!p.pz || p.pz < hoje || p.pz > addDays(30))) return false;
    if (dataIni && p.pz && p.pz < dataIni) return false;
    if (dataFim && p.pz && p.pz > dataFim) return false;
    return true;
  }).sort((a, b) => {
    const av = a.pz || '9999';
    const bv = b.pz || '9999';
    return sort === 'prazo-asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const cycleStatus = (p: PDI, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = ST_NEXT[p.st];
    savePDI({ ...p, st: next });
    toast.push(`Status → ${ST_LABEL[next]}`, 'ok');
  };

  const limpar = () => { setFStatus(''); setFTipo(''); setFData(''); setDataIni(''); setDataFim(''); };
  const filtroAtivo = !!(fStatus || fTipo || fData || dataIni || dataFim);

  return (
    <Card
      title="Plano de Desenvolvimento Individual"
      sub={`${filtrados.length} de ${pdis.length} objetivo(s)${filtroAtivo ? ' · filtros ativos' : ''}`}
      action={<button className="v2-btn v2-btn-p v2-btn-sm" onClick={() => { setEditing(null); setOpen(true); }}>+ Novo objetivo</button>}
    >
      {pdis.length > 0 && <PDIFiltros
        fStatus={fStatus} setFStatus={setFStatus}
        fTipo={fTipo} setFTipo={setFTipo}
        fData={fData} setFData={setFData}
        dataIni={dataIni} setDataIni={setDataIni}
        dataFim={dataFim} setDataFim={setDataFim}
        sort={sort} setSort={setSort}
        filtroAtivo={filtroAtivo} limpar={limpar}
        ST_LABEL={ST_LABEL} TIPO_LABEL={TIPO_LABEL}
      />}

      {filtrados.length ? (
        <table className="v2-tbl">
          <thead><tr><th>Objetivo</th><th>Tipo</th><th>Prazo</th><th>Status (clique p/ trocar)</th><th>Métrica</th><th>Ações</th></tr></thead>
          <tbody>
            {filtrados.map(p => {
              const vencido = p.pz && p.pz < hoje && p.st !== 'concluido';
              return (
                <tr key={p.id}>
                  <td>
                    <strong>{p.o}</strong>
                    {p.a && <div style={{ fontSize: 11, color: 'var(--g5)', marginTop: 2 }}>{p.a}</div>}
                  </td>
                  <td><span className="v2-chip">{TIPO_LABEL[p.t]}</span></td>
                  <td>
                    {fd(p.pz)}
                    {vencido && <div style={{ fontSize: 10, color: 'var(--re)', fontWeight: 600, marginTop: 2 }}>vencido</div>}
                  </td>
                  <td>
                    <button
                      onClick={(e) => cycleStatus(p, e)}
                      title="Clique pra avançar status"
                      className={`v2-chip ${p.st === 'concluido' ? 'v2-chip-gr' : p.st === 'em-andamento' ? 'v2-chip-te' : 'v2-chip-am'}`}
                      style={{ border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {ST_LABEL[p.st]}
                    </button>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--g5)' }}>{p.m || '—'}</td>
                  <td>
                    <button className="v2-btn v2-btn-o v2-btn-sm" onClick={() => { setEditing(p); setOpen(true); }}>Editar</button>
                    {' '}
                    <button className="v2-btn v2-btn-o v2-btn-sm" style={{ color: 'var(--re)' }} onClick={() => { if (confirm('Excluir?')) { delPDI(p.id); toast.push('PDI excluído', 'info'); } }}>×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : pdis.length > 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--g5)' }}>
          Nenhum PDI bate com os filtros.
          <div style={{ marginTop: 10 }}>
            <button className="v2-btn v2-btn-o" onClick={limpar}>Limpar filtros</button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--g5)' }}>
          Sem PDIs registrados.
          <div style={{ marginTop: 10 }}>
            <button className="v2-btn v2-btn-p" onClick={() => { setEditing(null); setOpen(true); }}>+ Criar primeiro objetivo</button>
          </div>
        </div>
      )}
      <PDIModal open={open} editing={editing} colabId={colabId} onClose={() => setOpen(false)} onSave={(p) => { savePDI(p); toast.push('PDI salvo', 'ok'); setOpen(false); }} />
    </Card>
  );
}

function PDIModal({ open, editing, colabId, onClose, onSave }: { open: boolean; editing: PDI | null; colabId: string; onClose: () => void; onSave: (p: PDI) => void }) {
  const [form, setForm] = useState<PDI>(empty(colabId));
  useEffect(() => { if (open) setForm(editing ? { ...editing } : empty(colabId)); }, [open, editing, colabId]);
  if (!open) return null;
  return (
    <Modal open={open} title={editing ? 'Editar Objetivo' : 'Novo Objetivo PDI'} onClose={onClose} width={620}
      footer={<><div style={{ flex: 1 }} /><Button kind="o" onClick={onClose}>Cancelar</Button><Button onClick={() => {
        if (!form.o) { alert('Objetivo obrigatório'); return; }
        onSave({ ...form, id: form.id || uid() });
      }}>{editing ? 'Salvar' : 'Criar'}</Button></>}
    >
      <div className="fg"><label className="fl">Objetivo</label><input className="fi" value={form.o} onChange={e => setForm(f => ({ ...f, o: e.target.value }))} /></div>
      <div className="fg"><label className="fl">Ações / Como atingir</label><textarea className="fta" rows={2} value={form.a} onChange={e => setForm(f => ({ ...f, a: e.target.value }))} /></div>
      <div className="fr3">
        <div className="fg"><label className="fl">Tipo</label>
          <select className="fs" value={form.t} onChange={e => setForm(f => ({ ...f, t: e.target.value as PDITipo }))}>
            <option value="hard">Hard skill</option><option value="soft">Soft skill</option><option value="ent">Entrega</option>
          </select>
        </div>
        <div className="fg"><label className="fl">Prazo</label><input className="fi" type="date" value={form.pz} onChange={e => setForm(f => ({ ...f, pz: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Status</label>
          <select className="fs" value={form.st} onChange={e => setForm(f => ({ ...f, st: e.target.value as PDIStatus }))}>
            <option value="pendente">Pendente</option><option value="em-andamento">Em andamento</option><option value="concluido">Concluído</option>
          </select>
        </div>
      </div>
      <div className="fg"><label className="fl">Recursos</label><input className="fi" value={form.r || ''} onChange={e => setForm(f => ({ ...f, r: e.target.value }))} /></div>
      <div className="fg"><label className="fl">Métrica de sucesso</label><input className="fi" value={form.m || ''} onChange={e => setForm(f => ({ ...f, m: e.target.value }))} /></div>
    </Modal>
  );
  function empty(p: string): PDI { return { id: '', p, o: '', a: '', pz: '', t: 'hard', st: 'pendente' }; }
}

function PDIFiltros({
  fStatus, setFStatus, fTipo, setFTipo, fData, setFData,
  dataIni, setDataIni, dataFim, setDataFim, sort, setSort,
  filtroAtivo, limpar, ST_LABEL, TIPO_LABEL,
}: {
  fStatus: '' | PDIStatus; setFStatus: (s: '' | PDIStatus) => void;
  fTipo: '' | PDITipo; setFTipo: (t: '' | PDITipo) => void;
  fData: '' | 'vencidos' | 'proximos7' | 'proximos30' | 'sem-prazo'; setFData: (d: '' | 'vencidos' | 'proximos7' | 'proximos30' | 'sem-prazo') => void;
  dataIni: string; setDataIni: (s: string) => void;
  dataFim: string; setDataFim: (s: string) => void;
  sort: 'prazo-asc' | 'prazo-desc'; setSort: (s: 'prazo-asc' | 'prazo-desc') => void;
  filtroAtivo: boolean; limpar: () => void;
  ST_LABEL: Record<PDIStatus, string>; TIPO_LABEL: Record<PDITipo, string>;
}) {
  const [showCustom, setShowCustom] = useState(!!(dataIni || dataFim));

  const SegStatus = (
    <div className="v2-seg">
      {(['', 'pendente', 'em-andamento', 'concluido'] as const).map(s => (
        <button key={s || 'all'} className={`v2-seg-btn${s === fStatus ? ' on' : ''}`} onClick={() => setFStatus(s)}>
          {s ? ST_LABEL[s] : 'Todos'}
        </button>
      ))}
    </div>
  );
  const SegTipo = (
    <div className="v2-seg">
      {(['', 'hard', 'soft', 'ent'] as const).map(t => (
        <button key={t || 'all'} className={`v2-seg-btn${t === fTipo ? ' on' : ''}`} onClick={() => setFTipo(t)}>
          {t ? TIPO_LABEL[t] : 'Todos'}
        </button>
      ))}
    </div>
  );
  const SegPrazo = (
    <div className="v2-seg">
      {([
        { v: '', l: 'Todos' },
        { v: 'vencidos', l: 'Vencidos' },
        { v: 'proximos7', l: '7d' },
        { v: 'proximos30', l: '30d' },
        { v: 'sem-prazo', l: 'Sem prazo' },
      ] as const).map(o => (
        <button key={o.v || 'all'} className={`v2-seg-btn${o.v === fData ? ' on' : ''}`} onClick={() => setFData(o.v as typeof fData)}>
          {o.l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="v2-filters">
      <div className="v2-filters-head">
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--g6)' }}>Filtros</span>
        <div style={{ flex: 1 }} />
        <div className="v2-seg" style={{ flexShrink: 0 }}>
          <button className={`v2-seg-btn${sort === 'prazo-asc' ? ' on' : ''}`} onClick={() => setSort('prazo-asc')} title="Próximos primeiro">↑ Próximos</button>
          <button className={`v2-seg-btn${sort === 'prazo-desc' ? ' on' : ''}`} onClick={() => setSort('prazo-desc')} title="Distantes primeiro">↓ Distantes</button>
        </div>
        {filtroAtivo && (
          <button onClick={limpar} className="v2-filter-clear">× Limpar</button>
        )}
      </div>
      <div className="v2-filter-row">
        <div className="v2-filter-l">Status</div>{SegStatus}
      </div>
      <div className="v2-filter-row">
        <div className="v2-filter-l">Tipo</div>{SegTipo}
      </div>
      <div className="v2-filter-row">
        <div className="v2-filter-l">Prazo</div>{SegPrazo}
        <button
          className={`v2-seg-btn${showCustom ? ' on' : ''}`}
          style={{ marginLeft: 6 }}
          onClick={() => { setShowCustom(s => !s); if (showCustom) { setDataIni(''); setDataFim(''); } }}
        >
          Período
        </button>
      </div>
      {showCustom && (
        <div className="v2-filter-row">
          <div className="v2-filter-l">Período</div>
          <input type="date" className="fi" value={dataIni} onChange={e => setDataIni(e.target.value)} style={{ width: 160 }} />
          <span style={{ fontSize: 11, color: 'var(--g5)' }}>até</span>
          <input type="date" className="fi" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ width: 160 }} />
        </div>
      )}
    </div>
  );
}

function AvalTab({ colabId, avals }: { colabId: string; avals: Aval[] }) {
  const db = usePCS(s => s.db);
  const saveAval = usePCS(s => s.saveAval);
  const delAval = usePCS(s => s.delAval);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Aval | null>(null);
  const [fTipo, setFTipo] = useState<'' | AvalTipo>('');
  const [fAvaliador, setFAvaliador] = useState<string>('');
  const [fPeriodo, setFPeriodo] = useState<'' | 'ano' | 'sem' | 'tri' | 'mes'>('');
  const [dataIni, setDataIni] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [sort, setSort] = useState<'data-desc' | 'data-asc' | 'pct-desc'>('data-desc');

  const colab = db.colabs.find(c => c.id === colabId);
  const hoje = new Date();
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const inicioPeriodo: string | null = (() => {
    if (!fPeriodo) return null;
    const d = new Date(hoje);
    if (fPeriodo === 'ano') d.setFullYear(d.getFullYear() - 1);
    if (fPeriodo === 'sem') d.setMonth(d.getMonth() - 6);
    if (fPeriodo === 'tri') d.setMonth(d.getMonth() - 3);
    if (fPeriodo === 'mes') d.setMonth(d.getMonth() - 1);
    return ymd(d);
  })();

  const filtradas = avals.filter(a => {
    if (fTipo && a.tipo !== fTipo) return false;
    if (fAvaliador && a.avaliadorId !== fAvaliador) return false;
    if (inicioPeriodo && a.dt < inicioPeriodo) return false;
    if (dataIni && a.dt < dataIni) return false;
    if (dataFim && a.dt > dataFim) return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'data-asc') return a.dt.localeCompare(b.dt);
    if (sort === 'pct-desc') {
      const pa = a.max ? a.tot / a.max : 0;
      const pb = b.max ? b.tot / b.max : 0;
      return pb - pa;
    }
    return b.dt.localeCompare(a.dt);
  });

  const filtroAtivo = !!(fTipo || fAvaliador || fPeriodo || dataIni || dataFim);
  const limpar = () => { setFTipo(''); setFAvaliador(''); setFPeriodo(''); setDataIni(''); setDataFim(''); };

  const avaliadoresUsados = Array.from(new Set(avals.map(a => a.avaliadorId).filter(Boolean) as string[]))
    .map(id => db.colabs.find(c => c.id === id)).filter(Boolean) as typeof db.colabs;

  return (
    <>
      <Card
        title="Avaliações"
        sub={`${filtradas.length} de ${avals.length} ciclo(s)${filtroAtivo ? ' · filtros ativos' : ''}`}
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            {filtradas.length > 0 && colab && <button className="v2-btn v2-btn-o v2-btn-sm" onClick={() => gerarRelatorioConsolidado(colab, filtradas, db)}>↓ Relatório consolidado</button>}
            <button className="v2-btn v2-btn-p v2-btn-sm" onClick={() => { setEditing(null); setOpen(true); }}>+ Nova avaliação</button>
          </div>
        }
      >
        {avals.length > 0 && (
          <div className="v2-filters">
            <div className="v2-filters-head">
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--g6)' }}>Filtros</span>
              <div style={{ flex: 1 }} />
              <div className="v2-seg" style={{ flexShrink: 0 }}>
                <button className={`v2-seg-btn${sort === 'data-desc' ? ' on' : ''}`} onClick={() => setSort('data-desc')}>↓ Recente</button>
                <button className={`v2-seg-btn${sort === 'data-asc' ? ' on' : ''}`} onClick={() => setSort('data-asc')}>↑ Antiga</button>
                <button className={`v2-seg-btn${sort === 'pct-desc' ? ' on' : ''}`} onClick={() => setSort('pct-desc')}>★ Maior nota</button>
              </div>
              {filtroAtivo && <button onClick={limpar} className="v2-filter-clear">× Limpar</button>}
            </div>
            <div className="v2-filter-row">
              <div className="v2-filter-l">Período</div>
              <div className="v2-seg">
                {([
                  { v: '', l: 'Todos' },
                  { v: 'mes', l: 'Último mês' },
                  { v: 'tri', l: 'Trimestre' },
                  { v: 'sem', l: 'Semestre' },
                  { v: 'ano', l: 'Último ano' },
                ] as const).map(o => (
                  <button key={o.v || 'all'} className={`v2-seg-btn${o.v === fPeriodo ? ' on' : ''}`} onClick={() => setFPeriodo(o.v as typeof fPeriodo)}>{o.l}</button>
                ))}
              </div>
            </div>
            <div className="v2-filter-row">
              <div className="v2-filter-l">Tipo</div>
              <div className="v2-seg">
                <button className={`v2-seg-btn${fTipo === '' ? ' on' : ''}`} onClick={() => setFTipo('')}>Todos</button>
                {(Object.keys(TIPO_AVAL_LABEL) as AvalTipo[]).map(t => (
                  <button key={t} className={`v2-seg-btn${fTipo === t ? ' on' : ''}`} onClick={() => setFTipo(t)}>{TIPO_AVAL_LABEL[t]}</button>
                ))}
              </div>
            </div>
            {avaliadoresUsados.length > 0 && (
              <div className="v2-filter-row">
                <div className="v2-filter-l">Avaliador</div>
                <select className="fs" value={fAvaliador} onChange={e => setFAvaliador(e.target.value)} style={{ width: 240 }}>
                  <option value="">Todos</option>
                  {avaliadoresUsados.map(c => <option key={c.id} value={c.id}>{c.n}</option>)}
                </select>
              </div>
            )}
            <div className="v2-filter-row">
              <div className="v2-filter-l">Custom</div>
              <input type="date" className="fi" value={dataIni} onChange={e => setDataIni(e.target.value)} style={{ width: 160 }} />
              <span style={{ fontSize: 11, color: 'var(--g5)' }}>até</span>
              <input type="date" className="fi" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ width: 160 }} />
            </div>
          </div>
        )}

        {filtradas.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtradas.map(a => <AvalCard key={a.id} aval={a} colab={colab} onEdit={() => { setEditing(a); setOpen(true); }} onDel={() => { if (confirm('Excluir avaliação?')) { delAval(a.id); toast.push('Avaliação excluída', 'info'); } }} />)}
          </div>
        ) : avals.length > 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--g5)' }}>
            Nenhuma avaliação bate com os filtros.
            <div style={{ marginTop: 10 }}>
              <button className="v2-btn v2-btn-o" onClick={limpar}>Limpar filtros</button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--g5)' }}>
            Nenhuma avaliação registrada.
            <div style={{ marginTop: 10 }}>
              <button className="v2-btn v2-btn-p" onClick={() => { setEditing(null); setOpen(true); }}>+ Registrar primeira</button>
            </div>
          </div>
        )}
      </Card>
      <AvalModal open={open} editing={editing} colabId={colabId} onClose={() => setOpen(false)} onSave={(a) => { saveAval(a); toast.push('Avaliação salva', 'ok'); setOpen(false); }} />
    </>
  );
}

function AvalCard({ aval, colab, onEdit, onDel }: { aval: Aval; colab?: Colab; onEdit: () => void; onDel: () => void }) {
  const db = usePCS(s => s.db);
  const savePDI = usePCS(s => s.savePDI);
  const toast = useToast();
  const [expandido, setExpandido] = useState(false);

  const gerarPDIs = () => {
    if (!colab) return;
    const novos: PDI[] = [];
    const prazoPad = (() => {
      const d = new Date(); d.setDate(d.getDate() + 90);
      return d.toISOString().slice(0, 10);
    })();

    (aval.criterios || []).forEach(cr => {
      if (cr.status === 'nao' || cr.status === 'parcial') {
        novos.push({
          id: uid(), p: colab.id,
          o: `Atingir critério: ${cr.desc.slice(0, 80)}`,
          a: cr.obs || `Trabalhar para atender o critério de progressão pro cargo ${aval.proximoCargo || 'alvo'}`,
          pz: prazoPad, t: 'ent', st: 'pendente',
          r: '', m: cr.status === 'parcial' ? 'Status atual: parcial · meta: atende' : 'Status atual: não atende · meta: atende',
        });
      }
    });

    (aval.competencias || []).forEach(c => {
      if (c.nota < 3) {
        novos.push({
          id: uid(), p: colab.id,
          o: `Desenvolver competência: ${c.nome}`,
          a: c.obs || `Plano de desenvolvimento para a competência ${c.nome}`,
          pz: prazoPad,
          t: c.categoria === 'tecnica' ? 'hard' : 'soft',
          st: 'pendente',
          r: '',
          m: `Nota atual: ${c.nota}/5 · meta: ≥4/5`,
        });
      }
    });

    if (aval.desenvolver?.trim()) {
      const linhas = aval.desenvolver.split('\n').map(l => l.trim()).filter(Boolean);
      linhas.forEach(l => {
        novos.push({
          id: uid(), p: colab.id,
          o: l.slice(0, 80),
          a: l,
          pz: prazoPad, t: 'soft', st: 'pendente', r: '', m: '',
        });
      });
    }

    if (aval.recomendacoes?.trim()) {
      const linhas = aval.recomendacoes.split('\n').map(l => l.trim()).filter(Boolean);
      linhas.forEach(l => {
        novos.push({
          id: uid(), p: colab.id,
          o: l.slice(0, 80),
          a: l,
          pz: prazoPad, t: 'ent', st: 'pendente', r: '', m: '',
        });
      });
    }

    if (novos.length === 0) {
      toast.push('Nenhum gap encontrado nesta avaliação para gerar PDI', 'info');
      return;
    }

    if (!confirm(`Gerar ${novos.length} PDI(s) a partir desta avaliação?\n\n· Critérios pendentes/parciais → entregas\n· Competências < 3/5 → hard/soft skill\n· Pontos a desenvolver → soft\n· Recomendações → entregas\n\nPrazo padrão: 90 dias`)) return;
    novos.forEach(p => savePDI(p));
    toast.push(`${novos.length} PDI(s) criado(s) na aba PDI`, 'ok');
  };

  const podeGerar = !!colab && (
    (aval.criterios || []).some(c => c.status === 'nao' || c.status === 'parcial') ||
    (aval.competencias || []).some(c => c.nota < 3) ||
    !!aval.desenvolver?.trim() ||
    !!aval.recomendacoes?.trim()
  );


  const pct = aval.max ? Math.round((aval.tot / aval.max) * 100) : 0;
  const avaliador = aval.avaliadorId ? db.colabs.find(c => c.id === aval.avaliadorId) : null;
  const cargoAlvo = aval.proximoCargo ? db.cargos.find(k => k.n === aval.proximoCargo) : null;
  const comps = aval.competencias || [];
  const compsComp = comps.filter(c => c.categoria === 'comportamental');
  const compsTec = comps.filter(c => c.categoria === 'tecnica');
  const crits = aval.criterios || [];
  const critsAtende = crits.filter(c => c.status === 'atende').length;
  const critsParcial = crits.filter(c => c.status === 'parcial').length;
  const critsNao = crits.filter(c => c.status === 'nao').length;

  return (
    <div style={{ border: '1px solid #eef0f5', borderRadius: 12, background: 'var(--w)', overflow: 'hidden' }}>
      <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: pct >= 75 ? 'var(--gr0)' : pct >= 50 ? 'var(--am0)' : 'var(--re0)', color: pct >= 75 ? 'var(--gr)' : pct >= 50 ? 'var(--am)' : 'var(--re)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins',sans-serif", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
          {pct}%
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <strong style={{ fontSize: 14 }}>{fd(aval.dt)}</strong>
            {aval.tipo && <span className="v2-chip v2-chip-pu">{TIPO_AVAL_LABEL[aval.tipo]}</span>}
            <span className="v2-chip">{aval.tot}/{aval.max} pts</span>
            {aval.prontidaoPct !== undefined && aval.prontidaoPct > 0 && (
              <span className={`v2-chip ${aval.prontidaoPct >= 75 ? 'v2-chip-gr' : aval.prontidaoPct >= 50 ? 'v2-chip-am' : 'v2-chip-re'}`}>
                Prontidão {aval.prontidaoPct}%
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--g5)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {avaliador && <span>Por: <strong style={{ color: 'var(--g7)' }}>{avaliador.n}</strong></span>}
            {aval.cargoNaData && <span>Cargo: {aval.cargoNaData}</span>}
            {cargoAlvo && <span>→ Alvo: <strong style={{ color: 'var(--pu)' }}>{cargoAlvo.n}</strong></span>}
            {aval.proxima && <span>Próxima: {fd(aval.proxima)}</span>}
          </div>
          {(comps.length > 0 || crits.length > 0) && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--g5)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {compsComp.length > 0 && <span>{compsComp.length} comp. comportamentais</span>}
              {compsTec.length > 0 && <span>{compsTec.length} comp. técnicas</span>}
              {crits.length > 0 && (
                <span>
                  Critérios próximo cargo:
                  {' '}{critsAtende > 0 && <span style={{ color: 'var(--gr)' }}>{critsAtende} ok</span>}
                  {' '}{critsParcial > 0 && <span style={{ color: 'var(--am)' }}>{critsParcial} parcial</span>}
                  {' '}{critsNao > 0 && <span style={{ color: 'var(--re)' }}>{critsNao} falta</span>}
                </span>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          <button className="v2-btn v2-btn-o v2-btn-sm" onClick={() => setExpandido(!expandido)}>{expandido ? '▲ Recolher' : '▼ Detalhes'}</button>
          {podeGerar && <button className="v2-btn v2-btn-p v2-btn-sm" onClick={gerarPDIs} title="Cria PDIs automaticamente a partir dos critérios pendentes, competências fracas e textos de desenvolvimento">→ Gerar PDIs</button>}
          {colab && <button className="v2-btn v2-btn-o v2-btn-sm" onClick={() => gerarRelatorioAval(colab, aval, db)} title="Baixar relatório (PDF via impressão)">↓ Relatório</button>}
          <button className="v2-btn v2-btn-o v2-btn-sm" onClick={onEdit}>Editar</button>
          <button className="v2-btn v2-btn-o v2-btn-sm" style={{ color: 'var(--re)' }} onClick={onDel}>×</button>
        </div>
      </div>

      {expandido && (
        <div style={{ borderTop: '1px solid #eef0f5', padding: 16, background: '#fafbfd' }}>
          {(aval.notas?.performance !== undefined || aval.notas?.potencial !== undefined) && (
            <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
              {aval.notas?.performance !== undefined && <div style={{ flex: 1, padding: 12, background: 'var(--w)', borderRadius: 10, border: '1px solid #eef0f5' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--g5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Performance</div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 800 }}>{aval.notas.performance}</div>
              </div>}
              {aval.notas?.potencial !== undefined && <div style={{ flex: 1, padding: 12, background: 'var(--w)', borderRadius: 10, border: '1px solid #eef0f5' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--g5)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Potencial</div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 800 }}>{aval.notas.potencial}</div>
              </div>}
            </div>
          )}

          {compsComp.length > 0 && (
            <Section title="Competências comportamentais">
              {compsComp.map(c => <CompRow key={c.id} comp={c} />)}
            </Section>
          )}
          {compsTec.length > 0 && (
            <Section title="Competências técnicas">
              {compsTec.map(c => <CompRow key={c.id} comp={c} />)}
            </Section>
          )}
          {crits.length > 0 && (
            <Section title={`Critérios para próximo cargo${cargoAlvo ? ` (${cargoAlvo.n})` : ''}`}>
              {crits.map(cr => (
                <div key={cr.id} style={{ padding: '8px 0', borderBottom: '1px solid #f4f6fa', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span className={`v2-chip v2-chip-${CRIT_STATUS_LABEL[cr.status].chip}`} style={{ flexShrink: 0, marginTop: 2 }}>{CRIT_STATUS_LABEL[cr.status].label}</span>
                  <div style={{ flex: 1, fontSize: 13 }}>
                    {cr.desc}
                    {cr.obs && <div style={{ fontSize: 11, color: 'var(--g5)', marginTop: 2 }}>{cr.obs}</div>}
                  </div>
                </div>
              ))}
            </Section>
          )}
          {aval.fortes && (
            <Section title="Pontos fortes">
              <div style={{ fontSize: 13, color: 'var(--g7)', whiteSpace: 'pre-wrap' }}>{aval.fortes}</div>
            </Section>
          )}
          {aval.desenvolver && (
            <Section title="Pontos a desenvolver">
              <div style={{ fontSize: 13, color: 'var(--g7)', whiteSpace: 'pre-wrap' }}>{aval.desenvolver}</div>
            </Section>
          )}
          {aval.recomendacoes && (
            <Section title="Recomendações / próximos passos">
              <div style={{ fontSize: 13, color: 'var(--g7)', whiteSpace: 'pre-wrap' }}>{aval.recomendacoes}</div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--pu)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{title}</div>
      <div style={{ background: 'var(--w)', borderRadius: 10, padding: 12, border: '1px solid #eef0f5' }}>
        {children}
      </div>
    </div>
  );
}

function CompRow({ comp }: { comp: CompAval }) {
  const pct = (comp.nota / 5) * 100;
  const cor = comp.nota >= 4 ? 'var(--gr)' : comp.nota >= 3 ? 'var(--am)' : comp.nota >= 2 ? 'var(--or)' : 'var(--re)';
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f4f6fa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{comp.nome}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: cor }}>{comp.nota}/5</span>
      </div>
      <div className="v2-mbar"><div className="v2-mbar-f" style={{ width: `${pct}%`, background: cor }} /></div>
      {comp.obs && <div style={{ fontSize: 11, color: 'var(--g5)', marginTop: 4 }}>{comp.obs}</div>}
    </div>
  );
}

function AvalModal({ open, editing, colabId, onClose, onSave }: { open: boolean; editing: Aval | null; colabId: string; onClose: () => void; onSave: (a: Aval) => void }) {
  const db = usePCS(s => s.db);
  const colab = db.colabs.find(c => c.id === colabId);
  const cargoAtual = colab ? db.cargos.find(k => k.n === colab.ca) : null;

  const proximosCargos = cargoAtual ? db.cargos.filter(k =>
    k.fam === cargoAtual.fam && k.nivel > cargoAtual.nivel
  ).sort((a, b) => a.nivel.localeCompare(b.nivel)) : [];

  const [form, setForm] = useState<Aval>(empty(colabId, colab?.ca));
  const [secao, setSecao] = useState<'geral' | 'comp' | 'critprog' | 'feedback'>('geral');

  useEffect(() => {
    if (open) {
      const init = editing ? { ...editing } : empty(colabId, colab?.ca);
      if (!init.competencias?.length) {
        init.competencias = COMPS_PADRAO_COMPORTAMENTAL.map(c => ({ id: uid(), nome: c.nome, categoria: 'comportamental', nota: 0 }));
      }
      setForm(init);
      setSecao('geral');
    }
  }, [open, editing, colabId, colab?.ca]);

  if (!open) return null;

  const updateForm = (patch: Partial<Aval>) => setForm(f => ({ ...f, ...patch }));
  const updateComp = (id: string, patch: Partial<CompAval>) => setForm(f => ({ ...f, competencias: (f.competencias || []).map(c => c.id === id ? { ...c, ...patch } : c) }));
  const addComp = (cat: 'comportamental' | 'tecnica') => setForm(f => ({ ...f, competencias: [...(f.competencias || []), { id: uid(), nome: '', categoria: cat, nota: 0 }] }));
  const delComp = (id: string) => setForm(f => ({ ...f, competencias: (f.competencias || []).filter(c => c.id !== id) }));
  const updateCrit = (id: string, patch: Partial<CritProgAval>) => setForm(f => ({ ...f, criterios: (f.criterios || []).map(c => c.id === id ? { ...c, ...patch } : c) }));
  const addCrit = () => setForm(f => ({ ...f, criterios: [...(f.criterios || []), { id: uid(), desc: '', status: 'na' }] }));
  const delCrit = (id: string) => setForm(f => ({ ...f, criterios: (f.criterios || []).filter(c => c.id !== id) }));

  const importarCriteriosDoCargo = () => {
    const target = form.proximoCargo ? db.cargos.find(k => k.n === form.proximoCargo) : null;
    if (!target) { alert('Selecione um cargo alvo primeiro'); return; }
    const novos: CritProgAval[] = [];
    if (target.prog) novos.push({ id: uid(), desc: target.prog, status: 'na', obs: 'Critério de progressão' });
    if (target.req) {
      target.req.split(',').map(r => r.trim()).filter(Boolean).forEach(r => {
        novos.push({ id: uid(), desc: r, status: 'na', obs: 'Requisito do cargo' });
      });
    }
    setForm(f => ({ ...f, criterios: [...(f.criterios || []), ...novos] }));
  };

  const compsComp = (form.competencias || []).filter(c => c.categoria === 'comportamental');
  const compsTec = (form.competencias || []).filter(c => c.categoria === 'tecnica');

  return (
    <Modal open={open} title={editing ? 'Editar Avaliação' : 'Nova Avaliação'} onClose={onClose} width={820}
      footer={<><div style={{ flex: 1 }} /><Button kind="o" onClick={onClose}>Cancelar</Button><Button onClick={() => {
        onSave({ ...form, id: form.id || uid() });
      }}>Salvar</Button></>}
    >
      <div className="v2-tabs" style={{ marginBottom: 14 }}>
        <button className={`v2-tab${secao === 'geral' ? ' on' : ''}`} onClick={() => setSecao('geral')}>① Geral</button>
        <button className={`v2-tab${secao === 'comp' ? ' on' : ''}`} onClick={() => setSecao('comp')}>② Competências{(form.competencias?.length || 0) > 0 && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--g4)' }}>({form.competencias!.length})</span>}</button>
        <button className={`v2-tab${secao === 'critprog' ? ' on' : ''}`} onClick={() => setSecao('critprog')}>③ Próximo cargo{(form.criterios?.length || 0) > 0 && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--g4)' }}>({form.criterios!.length})</span>}</button>
        <button className={`v2-tab${secao === 'feedback' ? ' on' : ''}`} onClick={() => setSecao('feedback')}>④ Feedback</button>
      </div>

      {secao === 'geral' && (
        <>
          <div className="fr2">
            <div className="fg"><label className="fl">Tipo de avaliação</label>
              <select className="fs" value={form.tipo || 'gestor'} onChange={e => updateForm({ tipo: e.target.value as AvalTipo })}>
                {Object.entries(TIPO_AVAL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Avaliador (quem registrou)</label>
              <select className="fs" value={form.avaliadorId || ''} onChange={e => updateForm({ avaliadorId: e.target.value || undefined })}>
                <option value="">— Selecione</option>
                {db.colabs.filter(c => c.id !== colabId).map(c => (
                  <option key={c.id} value={c.id}>{c.n} {c.papel === 'rh_admin' ? '(RH)' : c.papel === 'ceo' ? '(CEO)' : `· ${c.ca}`}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="fr2">
            <div className="fg"><label className="fl">Data da avaliação</label><input className="fi" type="date" value={form.dt} onChange={e => updateForm({ dt: e.target.value })} /></div>
            <div className="fg"><label className="fl">Próxima avaliação</label><input className="fi" type="date" value={form.proxima || ''} onChange={e => updateForm({ proxima: e.target.value })} /></div>
          </div>
          <div className="fr2">
            <div className="fg"><label className="fl">Cargo na data</label>
              <input className="fi" value={form.cargoNaData || ''} onChange={e => updateForm({ cargoNaData: e.target.value })} placeholder={colab?.ca || ''} />
            </div>
            <div className="fg"><label className="fl">Cargo alvo (próximo)</label>
              <select className="fs" value={form.proximoCargo || ''} onChange={e => updateForm({ proximoCargo: e.target.value || undefined })}>
                <option value="">— Sem alvo definido</option>
                {proximosCargos.map(k => <option key={k.id} value={k.n}>{k.n} (Nível {k.nivel})</option>)}
                {!proximosCargos.length && <option disabled>Sem cargos superiores na família</option>}
              </select>
            </div>
          </div>
          <div className="fr3">
            <div className="fg"><label className="fl">Pontuação obtida</label><input className="fi" type="number" value={form.tot} onChange={e => updateForm({ tot: Number(e.target.value) })} /></div>
            <div className="fg"><label className="fl">Pontuação máxima</label><input className="fi" type="number" value={form.max} onChange={e => updateForm({ max: Number(e.target.value) })} /></div>
            <div className="fg"><label className="fl">Prontidão promoção (%)</label><input className="fi" type="number" min={0} max={100} value={form.prontidaoPct ?? 0} onChange={e => updateForm({ prontidaoPct: Number(e.target.value) })} /></div>
          </div>
          <div className="fr2">
            <div className="fg"><label className="fl">Performance (0–100, p/ 9-Box)</label>
              <input className="fi" type="number" min={0} max={100} value={form.notas?.performance ?? 0} onChange={e => updateForm({ notas: { ...form.notas, performance: Number(e.target.value) } })} />
            </div>
            <div className="fg"><label className="fl">Potencial (0–100, p/ 9-Box)</label>
              <input className="fi" type="number" min={0} max={100} value={form.notas?.potencial ?? 0} onChange={e => updateForm({ notas: { ...form.notas, potencial: Number(e.target.value) } })} />
            </div>
          </div>
        </>
      )}

      {secao === 'comp' && (
        <>
          <div style={{ background: 'var(--pu0)', padding: 10, borderRadius: 8, fontSize: 12, color: 'var(--pu)', marginBottom: 14 }}>
            Avalie cada competência de 0 a 5. Use 0 = não observado, 1 = abaixo, 3 = adequado, 5 = excelência.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 13 }}>Competências comportamentais</strong>
            <Button kind="o" size="sm" onClick={() => addComp('comportamental')}>+ Adicionar</Button>
          </div>
          {compsComp.map(c => <CompFormRow key={c.id} comp={c} onChange={p => updateComp(c.id, p)} onDelete={() => delComp(c.id)} />)}
          {!compsComp.length && <div style={{ fontSize: 12, color: 'var(--g4)', textAlign: 'center', padding: 10 }}>Nenhuma — clique em + Adicionar</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 8 }}>
            <strong style={{ fontSize: 13 }}>Competências técnicas (do cargo)</strong>
            <Button kind="o" size="sm" onClick={() => addComp('tecnica')}>+ Adicionar</Button>
          </div>
          {cargoAtual?.req && compsTec.length === 0 && (
            <div style={{ background: 'var(--am0)', padding: 10, borderRadius: 8, fontSize: 12, color: 'var(--am)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span>Requisitos do cargo {cargoAtual.n}: {cargoAtual.req}</span>
              <button
                className="v2-btn v2-btn-o v2-btn-sm"
                onClick={() => {
                  const lista = cargoAtual.req.split(',').map(r => r.trim()).filter(Boolean);
                  const novas: CompAval[] = lista.map(nome => ({ id: uid(), nome, categoria: 'tecnica', nota: 0 }));
                  setForm(f => ({ ...f, competencias: [...(f.competencias || []), ...novas] }));
                }}
              >
                Importar
              </button>
            </div>
          )}
          {compsTec.map(c => <CompFormRow key={c.id} comp={c} onChange={p => updateComp(c.id, p)} onDelete={() => delComp(c.id)} />)}
          {!compsTec.length && <div style={{ fontSize: 12, color: 'var(--g4)', textAlign: 'center', padding: 10 }}>Nenhuma — adicione manualmente ou importe do cargo</div>}
        </>
      )}

      {secao === 'critprog' && (
        <>
          <div style={{ background: 'var(--pu0)', padding: 10, borderRadius: 8, fontSize: 12, color: 'var(--pu)', marginBottom: 14 }}>
            Critérios específicos pra alcançar o próximo cargo. Marque cada um como Atende, Parcial, Não atende ou N/A.
          </div>

          {form.proximoCargo && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: 10, background: '#fafbfd', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--g5)', textTransform: 'uppercase', fontWeight: 600 }}>Cargo alvo</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--pu)' }}>{form.proximoCargo}</div>
              </div>
              <Button kind="o" size="sm" onClick={importarCriteriosDoCargo}>↓ Importar critérios do cargo</Button>
            </div>
          )}
          {!form.proximoCargo && (
            <div style={{ background: 'var(--am0)', padding: 10, borderRadius: 8, fontSize: 12, color: 'var(--am)', marginBottom: 14 }}>
              Nenhum cargo alvo na aba ① Geral. Critérios viram genéricos.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ fontSize: 13 }}>Critérios</strong>
            <Button kind="o" size="sm" onClick={addCrit}>+ Adicionar critério</Button>
          </div>
          {(form.criterios || []).map(cr => <CritFormRow key={cr.id} crit={cr} onChange={p => updateCrit(cr.id, p)} onDelete={() => delCrit(cr.id)} />)}
          {!form.criterios?.length && <div style={{ fontSize: 12, color: 'var(--g4)', textAlign: 'center', padding: 20 }}>Nenhum critério — adicione manualmente ou importe do cargo alvo</div>}
        </>
      )}

      {secao === 'feedback' && (
        <>
          <div className="fg">
            <label className="fl">Pontos fortes</label>
            <textarea className="fta" rows={3} value={form.fortes || ''} onChange={e => updateForm({ fortes: e.target.value })} placeholder="O que se destaca, comportamentos a manter…" />
          </div>
          <div className="fg">
            <label className="fl">Pontos a desenvolver</label>
            <textarea className="fta" rows={3} value={form.desenvolver || ''} onChange={e => updateForm({ desenvolver: e.target.value })} placeholder="Habilidades / comportamentos a melhorar…" />
          </div>
          <div className="fg">
            <label className="fl">Recomendações / próximos passos</label>
            <textarea className="fta" rows={3} value={form.recomendacoes || ''} onChange={e => updateForm({ recomendacoes: e.target.value })} placeholder="Ações concretas (PDI, mentoria, treinamento, projeto)…" />
          </div>
        </>
      )}
    </Modal>
  );

  function empty(p: string, cargo?: string): Aval {
    return {
      id: '', p,
      dt: new Date().toISOString().slice(0, 10),
      tot: 0, max: 100,
      proxima: '', prontidaoPct: 0,
      notas: { performance: 0, potencial: 0 },
      tipo: 'gestor',
      avaliadorId: undefined,
      cargoNaData: cargo,
      competencias: [],
      criterios: [],
      fortes: '', desenvolver: '', recomendacoes: '',
    };
  }
}

function CompFormRow({ comp, onChange, onDelete }: { comp: CompAval; onChange: (p: Partial<CompAval>) => void; onDelete: () => void }) {
  return (
    <div style={{ padding: 10, background: '#fafbfd', borderRadius: 10, marginBottom: 8, border: '1px solid #eef0f5' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="fi" placeholder="Nome da competência" value={comp.nome} onChange={e => onChange({ nome: e.target.value })} style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ nota: n })}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid',
                borderColor: comp.nota === n ? 'var(--pu)' : '#e7eaf0',
                background: comp.nota === n ? 'var(--pu)' : 'var(--w)',
                color: comp.nota === n ? '#fff' : 'var(--g6)',
                fontWeight: 700, cursor: 'pointer', fontSize: 13,
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <Button kind="dng" size="sm" onClick={onDelete}>×</Button>
      </div>
      <input className="fi" placeholder="Observação opcional…" value={comp.obs || ''} onChange={e => onChange({ obs: e.target.value })} style={{ marginTop: 6, fontSize: 12 }} />
    </div>
  );
}

function CritFormRow({ crit, onChange, onDelete }: { crit: CritProgAval; onChange: (p: Partial<CritProgAval>) => void; onDelete: () => void }) {
  return (
    <div style={{ padding: 10, background: '#fafbfd', borderRadius: 10, marginBottom: 8, border: '1px solid #eef0f5' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <textarea className="fta" placeholder="Descreva o critério (ex: Liderar entrega completa de módulo sem suporte)" value={crit.desc} onChange={e => onChange({ desc: e.target.value })} style={{ flex: 1, minHeight: 50 }} />
        <Button kind="dng" size="sm" onClick={onDelete}>×</Button>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        {(['atende', 'parcial', 'nao', 'na'] as CritStatus[]).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => onChange({ status: s })}
            className={`v2-chip v2-chip-${CRIT_STATUS_LABEL[s].chip}`}
            style={{ border: 'none', cursor: 'pointer', fontWeight: crit.status === s ? 700 : 500, opacity: crit.status === s ? 1 : 0.45 }}
          >
            {CRIT_STATUS_LABEL[s].label}
          </button>
        ))}
      </div>
      <input className="fi" placeholder="Observação opcional…" value={crit.obs || ''} onChange={e => onChange({ obs: e.target.value })} style={{ marginTop: 6, fontSize: 12 }} />
    </div>
  );
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function avalToHtml(aval: Aval, colab: Colab, db: { colabs: Colab[]; cargos: { n: string; nivel: string }[] }, isolado: boolean): string {
  const pct = aval.max ? Math.round((aval.tot / aval.max) * 100) : 0;
  const avaliador = aval.avaliadorId ? db.colabs.find(c => c.id === aval.avaliadorId) : null;
  const cargo = aval.cargoNaData || colab.ca;
  const tipo = aval.tipo ? TIPO_AVAL_LABEL[aval.tipo] : '—';
  const comps = aval.competencias || [];
  const compsComp = comps.filter(c => c.categoria === 'comportamental');
  const compsTec = comps.filter(c => c.categoria === 'tecnica');
  const crits = aval.criterios || [];
  const fdReport = (d?: string) => d ? d.split('-').reverse().join('/') : '—';

  return `
    <section class="aval-block${isolado ? ' aval-isolated' : ''}">
      <div class="aval-head">
        <div>
          <div class="aval-title">Avaliação · ${fdReport(aval.dt)}</div>
          <div class="aval-meta">${escapeHtml(tipo)}${aval.proximoCargo ? ` · alvo: ${escapeHtml(aval.proximoCargo)}` : ''}</div>
        </div>
        <div class="aval-score">
          <div class="aval-pct" style="color:${pct >= 75 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626'}">${pct}%</div>
          <div class="aval-pts">${aval.tot}/${aval.max} pts</div>
        </div>
      </div>

      <table class="aval-info">
        <tr><th>Cargo na data</th><td>${escapeHtml(cargo)}</td><th>Cargo alvo</th><td>${escapeHtml(aval.proximoCargo || '—')}</td></tr>
        <tr><th>Avaliador</th><td>${escapeHtml(avaliador?.n || '—')}${avaliador ? ` (${escapeHtml(avaliador.ca)})` : ''}</td><th>Tipo</th><td>${escapeHtml(tipo)}</td></tr>
        <tr><th>Performance</th><td>${aval.notas?.performance ?? '—'}</td><th>Potencial</th><td>${aval.notas?.potencial ?? '—'}</td></tr>
        <tr><th>Prontidão p/ promoção</th><td>${aval.prontidaoPct ?? 0}%</td><th>Próxima avaliação</th><td>${fdReport(aval.proxima)}</td></tr>
      </table>

      ${compsComp.length ? `
        <h3>Competências comportamentais</h3>
        <table class="aval-comp">
          <thead><tr><th>Competência</th><th>Nota</th><th>Observação</th></tr></thead>
          <tbody>${compsComp.map(c => `<tr><td>${escapeHtml(c.nome)}</td><td><strong>${c.nota}/5</strong></td><td>${escapeHtml(c.obs || '')}</td></tr>`).join('')}</tbody>
        </table>
      ` : ''}

      ${compsTec.length ? `
        <h3>Competências técnicas</h3>
        <table class="aval-comp">
          <thead><tr><th>Competência</th><th>Nota</th><th>Observação</th></tr></thead>
          <tbody>${compsTec.map(c => `<tr><td>${escapeHtml(c.nome)}</td><td><strong>${c.nota}/5</strong></td><td>${escapeHtml(c.obs || '')}</td></tr>`).join('')}</tbody>
        </table>
      ` : ''}

      ${crits.length ? `
        <h3>Critérios para próximo cargo${aval.proximoCargo ? ` (${escapeHtml(aval.proximoCargo)})` : ''}</h3>
        <table class="aval-crit">
          <thead><tr><th>Critério</th><th>Status</th><th>Observação</th></tr></thead>
          <tbody>${crits.map(c => `<tr><td>${escapeHtml(c.desc)}</td><td><span class="status status-${c.status}">${CRIT_STATUS_LABEL[c.status].label}</span></td><td>${escapeHtml(c.obs || '')}</td></tr>`).join('')}</tbody>
        </table>
      ` : ''}

      ${aval.fortes ? `<h3>Pontos fortes</h3><div class="aval-text">${escapeHtml(aval.fortes).replace(/\n/g, '<br>')}</div>` : ''}
      ${aval.desenvolver ? `<h3>Pontos a desenvolver</h3><div class="aval-text">${escapeHtml(aval.desenvolver).replace(/\n/g, '<br>')}</div>` : ''}
      ${aval.recomendacoes ? `<h3>Recomendações / próximos passos</h3><div class="aval-text">${escapeHtml(aval.recomendacoes).replace(/\n/g, '<br>')}</div>` : ''}
    </section>
  `;
}

const RELATORIO_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#1f2937;line-height:1.5;padding:32px;max-width:820px;margin:0 auto;background:#fff}
  header{border-bottom:3px solid #5b21b6;padding-bottom:16px;margin-bottom:24px}
  header h1{font-size:22px;font-weight:800;color:#5b21b6;margin-bottom:4px}
  header .subtitle{font-size:13px;color:#6b7280}
  header .colab-info{margin-top:12px;padding:12px;background:#f5f3ff;border-radius:8px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
  header .colab-info div{font-size:11px;color:#6b7280}
  header .colab-info strong{display:block;font-size:13px;color:#1f2937;margin-top:2px}
  h2{font-size:15px;font-weight:700;color:#5b21b6;margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid #e4e7f0}
  h3{font-size:12px;font-weight:700;color:#5b21b6;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.04em}
  .aval-block{padding:16px;border:1px solid #e4e7f0;border-radius:10px;margin-bottom:18px;page-break-inside:avoid}
  .aval-isolated{border:none;padding:0}
  .aval-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #e4e7f0}
  .aval-title{font-size:14px;font-weight:700}
  .aval-meta{font-size:11px;color:#6b7280;margin-top:2px}
  .aval-score{text-align:right}
  .aval-pct{font-size:24px;font-weight:800;line-height:1}
  .aval-pts{font-size:10px;color:#6b7280}
  table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:11px}
  .aval-info th{text-align:left;background:#f5f3ff;color:#5b21b6;padding:6px 8px;font-weight:600;width:18%;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
  .aval-info td{padding:6px 8px;border-bottom:1px solid #f1f3f9}
  .aval-comp th,.aval-crit th{background:#f1f3f9;text-align:left;padding:6px 8px;font-size:10px;color:#374151;font-weight:600;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #e4e7f0}
  .aval-comp td,.aval-crit td{padding:6px 8px;border-bottom:1px solid #f4f6fa;vertical-align:top}
  .aval-text{padding:10px;background:#fafbfd;border-left:3px solid #5b21b6;border-radius:4px;font-size:12px;color:#374151}
  .status{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}
  .status-atende{background:#ecfdf5;color:#059669}
  .status-parcial{background:#fffbeb;color:#d97706}
  .status-nao{background:#fef2f2;color:#dc2626}
  .status-na{background:#f1f3f9;color:#6b7280}
  footer{margin-top:32px;padding-top:16px;border-top:1px solid #e4e7f0;display:flex;justify-content:space-between;font-size:10px;color:#9399aa}
  .actions{position:fixed;top:12px;right:12px;display:flex;gap:6px}
  .actions button{background:#5b21b6;color:#fff;border:none;padding:8px 14px;font-size:12px;border-radius:6px;cursor:pointer;font-weight:600}
  .actions button.outline{background:#fff;color:#5b21b6;border:1px solid #5b21b6}
  @media print{.actions{display:none}body{padding:18px;font-size:11px}}
`;

function gerarRelatorioAval(colab: Colab, aval: Aval, db: { colabs: Colab[]; cargos: { n: string; nivel: string }[] }) {
  const fdReport = (d?: string) => d ? d.split('-').reverse().join('/') : '—';
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Avaliação · ${escapeHtml(colab.n)} · ${fdReport(aval.dt)}</title><style>${RELATORIO_CSS}</style></head>
<body>
  <div class="actions">
    <button class="outline" onclick="window.close()">Fechar</button>
    <button onclick="window.print()">Imprimir / Salvar PDF</button>
  </div>
  <header>
    <h1>Relatório de Avaliação</h1>
    <div class="subtitle">Optimum · Plano de Cargos e Salários</div>
    <div class="colab-info">
      <div>Colaborador<strong>${escapeHtml(colab.n)}</strong></div>
      <div>Cargo<strong>${escapeHtml(colab.ca)}</strong></div>
      <div>Área<strong>${escapeHtml(colab.ar)}</strong></div>
      <div>Vínculo<strong>${escapeHtml(colab.vi)}</strong></div>
      <div>Data da avaliação<strong>${fdReport(aval.dt)}</strong></div>
    </div>
  </header>
  ${avalToHtml(aval, colab, db, true)}
  <footer>
    <span>Documento gerado em ${new Date().toLocaleString('pt-BR')}</span>
    <span>Optimum · ID ${aval.id}</span>
  </footer>
  <script>setTimeout(() => window.print(), 400);</script>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) { alert('Pop-up bloqueado. Libere para o relatório abrir.'); return; }
  w.document.write(html);
  w.document.close();
}

function gerarRelatorioConsolidado(colab: Colab, avals: Aval[], db: { colabs: Colab[]; cargos: { n: string; nivel: string }[] }) {
  const fdReport = (d?: string) => d ? d.split('-').reverse().join('/') : '—';
  const periodo = avals.length > 0 ? `${fdReport([...avals].sort((a, b) => a.dt.localeCompare(b.dt))[0].dt)} → ${fdReport([...avals].sort((a, b) => b.dt.localeCompare(a.dt))[0].dt)}` : '—';

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Histórico de Avaliações · ${escapeHtml(colab.n)}</title><style>${RELATORIO_CSS}</style></head>
<body>
  <div class="actions">
    <button class="outline" onclick="window.close()">Fechar</button>
    <button onclick="window.print()">Imprimir / Salvar PDF</button>
  </div>
  <header>
    <h1>Histórico de Avaliações</h1>
    <div class="subtitle">Optimum · Plano de Cargos e Salários</div>
    <div class="colab-info">
      <div>Colaborador<strong>${escapeHtml(colab.n)}</strong></div>
      <div>Cargo atual<strong>${escapeHtml(colab.ca)}</strong></div>
      <div>Área<strong>${escapeHtml(colab.ar)}</strong></div>
      <div>Avaliações<strong>${avals.length} ciclos</strong></div>
      <div>Período<strong>${periodo}</strong></div>
    </div>
  </header>
  ${avals.map(a => `<h2>Ciclo · ${fdReport(a.dt)}</h2>${avalToHtml(a, colab, db, true)}`).join('')}
  <footer>
    <span>Documento gerado em ${new Date().toLocaleString('pt-BR')}</span>
    <span>Optimum · ${avals.length} avaliação(ões)</span>
  </footer>
  <script>setTimeout(() => window.print(), 400);</script>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) { alert('Pop-up bloqueado. Libere para o relatório abrir.'); return; }
  w.document.write(html);
  w.document.close();
}
