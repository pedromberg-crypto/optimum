'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, Badge, Button, Card, FaixaBar, MktBadge, NivelBadge, Page, Topbar } from '@/components/ui';
import { ColabModal } from '@/components/v1/colab-modal';
import { fd, fmt, getCargoFaixa, getMktStatus, getSalHist, getSindicatoDoColab, statusCCTColab } from '@/lib/helpers';
import { MOTIVOS_REAJUSTE } from '@/lib/types';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';

export default function ColabFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  if (!hydrated) return <div className="ct">Carregando…</div>;

  const c = db.colabs.find(x => x.id === id);
  if (!c) {
    return (
      <>
        <Topbar title="Colaborador não encontrado" />
        <Page><Card><Link href="/v1/time">← Voltar para Time</Link></Card></Page>
      </>
    );
  }

  const cargo = db.cargos.find(k => k.n === c.ca);
  const faixa = getCargoFaixa(db, c.ca);
  const mkt = getMktStatus(db, c);
  const sind = getSindicatoDoColab(db, c);
  const stCCT = statusCCTColab(db, c);
  const hist = getSalHist(db, c.id);
  const pdis = db.pdis.filter(p => p.p === c.id);

  return (
    <>
      <Topbar
        title="Ficha 360°"
        right={
          <>
            <Button kind="o" size="sm" onClick={() => router.push('/v1/time')}>← Time</Button>
            {' '}
            <Button size="sm" onClick={() => setEditOpen(true)}>Editar</Button>
          </>
        }
      />
      <Page>
        <Card className="mb">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={c.n} idx={0} size={64} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 22 }}>{c.n}</h2>
                {c.papel === 'ceo' && <Badge kind="pu">CEO</Badge>}
                {c.papel === 'rh_admin' && <Badge kind="bl">RH Admin</Badge>}
                {cargo && <NivelBadge nivel={cargo.nivel} />}
              </div>
              <div style={{ color: 'var(--g5)', marginTop: 4 }}>{c.ca} · {c.ar} · {c.vi}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(c.sal)}</div>
              <MktBadge status={mkt} />
            </div>
          </div>
        </Card>

        <div className="g2c mb">
          <Card title="Identificação" sub="Dados básicos">
            <Row label="Squad">{c.sq || '—'}</Row>
            <Row label="Mentor">{c.par || '—'}</Row>
            <Row label="Trilha">{c.trilha || '—'}</Row>
            <Row label="Sindicato">{sind ? `${sind.sigla} · base ${sind.dataBase}` : '—'}</Row>
            <Row label="Vale Refeição">{c.vr ? fmt(c.vr) : '—'}</Row>
            <Row label="Vale Transporte">{c.vt || '—'}</Row>
            <Row label="Plano de Saúde">{c.ps || '—'}</Row>
            <Row label="Home Office">{c.ho ? `${c.ho} dias/semana` : '—'}</Row>
          </Card>

          <Card title="Cargo & Faixa" sub={cargo?.n || '—'}>
            {faixa ? (
              <FaixaBar piso={faixa.p} alvo={faixa.a} teto={faixa.t} atual={c.sal} />
            ) : <div style={{ color: 'var(--g4)' }}>Cargo sem faixa configurada</div>}
            {cargo && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--g5)' }}>
                <strong>Requisitos:</strong> {cargo.req}
                <br />
                <strong>Progressão:</strong> {cargo.prog}
              </div>
            )}
          </Card>
        </div>

        {stCCT && (
          <Card className="mb" title="Status CCT" sub={`${stCCT.sind.sigla} · ${new Date().getFullYear()}`}>
            {stCCT.jaAplicado && stCCT.registro ? (
              <div style={{ background: 'var(--gr0)', padding: 10, borderRadius: 'var(--rs)' }}>
                ✓ CCT aplicada em {fd(stCCT.registro.dt)} — <strong>{stCCT.registro.perc?.toFixed(2)}%</strong>
                <div style={{ fontSize: 12, color: 'var(--g5)' }}>{fmt(stCCT.registro.valorAnterior!)} → {fmt(stCCT.registro.valor)}</div>
              </div>
            ) : (
              <div style={{ background: stCCT.atrasada ? 'var(--re0)' : 'var(--am0)', padding: 10, borderRadius: 'var(--rs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {stCCT.atrasada ? '⚠ CCT atrasada' : '⏳ CCT pendente'}
                  <div style={{ fontSize: 12, color: 'var(--g5)' }}>
                    Data-base: {fd(stCCT.dataBaseAno)} · {stCCT.atrasada ? `${Math.abs(stCCT.dias!)}d em atraso` : `em ${stCCT.dias}d`}
                  </div>
                </div>
                <Link href="/v1/cct"><Button size="sm">Aplicar agora</Button></Link>
              </div>
            )}
          </Card>
        )}

        <Card className="mb" title="Histórico Salarial" sub={`${hist.length} registro(s)`}>
          <div className="bd-tbl">
            <table className="tbl">
              <thead><tr><th>Data</th><th>Motivo</th><th>De</th><th>Para</th><th>%</th><th>Obs</th></tr></thead>
              <tbody>
                {hist.map(h => (
                  <tr key={h.id}>
                    <td>{fd(h.dt)}</td>
                    <td><Badge kind="te">{MOTIVOS_REAJUSTE[h.motivo].label}</Badge></td>
                    <td>{h.valorAnterior ? fmt(h.valorAnterior) : '—'}</td>
                    <td><strong>{fmt(h.valor)}</strong></td>
                    <td>{h.perc ? `${h.perc.toFixed(2)}%` : '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--g5)' }}>{h.obs || '—'}</td>
                  </tr>
                ))}
                {!hist.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--g4)' }}>Sem histórico</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="PDIs" sub={`${pdis.length} objetivo(s)`}>
          {pdis.length ? (
            <div className="bd-tbl">
              <table className="tbl">
                <thead><tr><th>Objetivo</th><th>Tipo</th><th>Prazo</th><th>Status</th></tr></thead>
                <tbody>
                  {pdis.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.o}</strong></td>
                      <td><span className="chip">{p.t}</span></td>
                      <td>{fd(p.pz)}</td>
                      <td><Badge kind={p.st === 'concluido' ? 'gr' : p.st === 'em-andamento' ? 'te' : 'jun'}>{p.st}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div style={{ color: 'var(--g4)' }}>Sem PDIs registrados — <Link href="/v1/pdi">criar</Link></div>}
        </Card>

        {c.ov && (
          <Card className="mb" title="Observações">
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{c.ov}</div>
          </Card>
        )}
      </Page>
      <ColabModal open={editOpen} colab={c} onClose={() => setEditOpen(false)} />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--g1)', fontSize: 13 }}>
      <span style={{ color: 'var(--g5)' }}>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}
