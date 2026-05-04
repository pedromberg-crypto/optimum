'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Modal } from '@/components/ui';
import { Card, KPI, PageHead } from '@/components/v2/kpi';
import { useToast } from '@/components/toast';
import { colabsAguardandoCCT, fd, fmt, maskColabFmt, uid } from '@/lib/helpers';
import { EyeToggle } from '@/components/v2/eye-toggle';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import { useUI } from '@/store/use-ui';
import type { Sindicato } from '@/lib/types';

export default function CCTV2() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const oculto = useUI(s => s.oculto);
  const revelados = useUI(s => s.revelados);
  const applyCCT = usePCS(s => s.applyCCT);
  const saveSindicato = usePCS(s => s.saveSindicato);
  const delSindicato = usePCS(s => s.delSindicato);
  const toast = useToast();
  const [sindOpen, setSindOpen] = useState<Sindicato | null>(null);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudEdit, setCrudEdit] = useState<Sindicato | null>(null);

  if (!hydrated) return <div className="v2-page">Carregando…</div>;

  const pendentes = colabsAguardandoCCT(db, ano);
  const atrasados = pendentes.filter(x => x.st.atrasada);
  const aplicados = db.sindicatos.filter(s => s.historico.some(h => h.ano === ano)).length;

  return (
    <div className="v2-page">
      <PageHead
        title="Sindicatos & CCT"
        sub="Convenções coletivas · catálogo de sindicatos e aplicação de reajustes"
        actions={
          <>
            <select className="fs" value={ano} onChange={e => setAno(Number(e.target.value))} style={{ width: 110 }}>
              {[ano - 1, ano, ano + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="v2-btn v2-btn-p" onClick={() => { setCrudEdit(null); setCrudOpen(true); }}>+ Sindicato</button>
          </>
        }
      />

      <div className="v2-grid-4">
        <KPI label="Sindicatos" value={db.sindicatos.length} />
        <KPI label={`CCT ${ano} aplicada`} value={`${aplicados}/${db.sindicatos.length}`} deltaKind={aplicados === db.sindicatos.length ? 'up' : undefined} delta={aplicados === db.sindicatos.length ? 'completo' : undefined} />
        <KPI label="Colabs pendentes" value={pendentes.length} />
        <KPI label="Atrasados" value={atrasados.length} deltaKind={atrasados.length > 0 ? 'down' : 'up'} delta={atrasados.length > 0 ? 'requer ação' : 'em dia'} />
      </div>

      <div className="v2-grid-2">
        {db.sindicatos.map(s => {
          const reg = s.historico.find(h => h.ano === ano);
          const atrasNoSind = pendentes.filter(p => p.st.sind.id === s.id && p.st.atrasada).length;
          const vinculados = db.colabs.filter(c => c.sind === s.id || s.abrangeAreas.includes(c.ar)).length;
          return (
            <Card key={s.id} title={s.sigla} sub={s.nome}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, marginBottom: 12 }}>
                <div><span style={{ color: 'var(--g5)' }}>Data-base:</span> <strong>{s.dataBase ? `${s.dataBase.split('-')[1]}/${s.dataBase.split('-')[0]}` : '—'}</strong></div>
                <div><span style={{ color: 'var(--g5)' }}>Vinculados:</span> <strong>{vinculados}</strong></div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--g5)', marginBottom: 10 }}>
                <strong>Áreas:</strong> {s.abrangeAreas.join(' · ') || '—'}
              </div>
              {reg ? (
                <div style={{ background: 'var(--gr0)', padding: 12, borderRadius: 10, fontSize: 12, color: 'var(--gr)' }}>
                  CCT {ano} aplicada — <strong>{reg.perc}%</strong> em {fd(reg.dataAplicacao)}
                  {reg.obs && <div style={{ color: 'var(--g6)', marginTop: 4 }}>{reg.obs}</div>}
                </div>
              ) : (
                <div style={{ background: atrasNoSind > 0 ? 'var(--re0)' : 'var(--am0)', padding: 12, borderRadius: 10, fontSize: 12, color: atrasNoSind > 0 ? 'var(--re)' : 'var(--am)' }}>
                  CCT {ano} não aplicada{atrasNoSind > 0 && ` — ${atrasNoSind} colab(s) atrasado(s)`}
                </div>
              )}
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="v2-btn v2-btn-p v2-btn-sm" onClick={() => setSindOpen(s)}>Aplicar reajuste {ano}</button>
                <button className="v2-btn v2-btn-o v2-btn-sm" onClick={() => { setCrudEdit(s); setCrudOpen(true); }}>Editar</button>
                <button className="v2-btn v2-btn-o v2-btn-sm" style={{ color: 'var(--re)' }} onClick={() => {
                  if (vinculados) { toast.push(`${vinculados} colab(s) vinculados — desvincule antes`, 'err'); return; }
                  if (confirm(`Excluir ${s.sigla}?`)) { delSindicato(s.id); toast.push('Sindicato excluído', 'info'); }
                }}>×</button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card title={`Pendências CCT ${ano}`} sub={`${atrasados.length} atrasado(s) · ${pendentes.length - atrasados.length} aguardando data-base`}>
        <table className="v2-tbl">
          <thead><tr><th>Colaborador</th><th>Sindicato</th><th>Data-base</th><th>Salário atual</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {pendentes.map(({ c, st }) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/v2/colab/${c.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    <strong>{c.n}</strong>
                  </Link>
                </td>
                <td>{st.sind.sigla}</td>
                <td>{fd(st.dataBaseAno)}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <strong>{maskColabFmt(c.sal, c.id, oculto, revelados)}</strong>
                    <EyeToggle colabId={c.id} />
                  </span>
                </td>
                <td>{st.atrasada ? <span className="v2-chip v2-chip-re">{Math.abs(st.dias!)}d atrasado</span> : <span className="v2-chip v2-chip-am">em {st.dias}d</span>}</td>
                <td><button className="v2-btn v2-btn-p v2-btn-sm" onClick={() => setSindOpen(st.sind)}>Aplicar</button></td>
              </tr>
            ))}
            {!pendentes.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--g4)', padding: 24 }}>Nenhuma pendência para {ano}</td></tr>}
          </tbody>
        </table>
      </Card>

      <CCTApplyModal sind={sindOpen} ano={ano} onClose={() => setSindOpen(null)} onApply={(perc, data, obs, aplicarColabs) => {
        if (!sindOpen) return;
        const qtd = applyCCT(sindOpen.id, ano, perc, data, obs, aplicarColabs);
        toast.push(aplicarColabs ? `${qtd} colaborador(es) reajustado(s)` : 'Histórico CCT registrado', 'ok');
        setSindOpen(null);
      }} />
      <SindicatoModal open={crudOpen} editing={crudEdit} onClose={() => setCrudOpen(false)} onSave={(s) => { saveSindicato(s); toast.push('Sindicato salvo', 'ok'); setCrudOpen(false); }} />
    </div>
  );
}

function CCTApplyModal({ sind, ano, onClose, onApply }: {
  sind: Sindicato | null; ano: number;
  onClose: () => void; onApply: (perc: number, data: string, obs: string, aplicarColabs: boolean) => void;
}) {
  const db = usePCS(s => s.db);
  const [perc, setPerc] = useState(0);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [obs, setObs] = useState('');
  const [aplicarColabs, setAplicarColabs] = useState(true);

  useEffect(() => {
    if (sind) { setPerc(0); setData(new Date().toISOString().slice(0, 10)); setObs(''); setAplicarColabs(true); }
  }, [sind]);

  const afetados = useMemo(() => {
    if (!sind || !aplicarColabs) return [];
    return db.colabs.filter(c => c.sind ? c.sind === sind.id : sind.abrangeAreas.includes(c.ar));
  }, [sind, aplicarColabs, db.colabs]);

  if (!sind) return null;
  return (
    <Modal open={!!sind} title={`Reajuste CCT ${ano} · ${sind.sigla}`} onClose={onClose} width={580}
      footer={<><div style={{ flex: 1 }} /><Button kind="o" onClick={onClose}>Cancelar</Button><Button onClick={() => {
        if (!perc) { alert('Informe o percentual'); return; }
        onApply(perc, data, obs, aplicarColabs);
      }}>Aplicar</Button></>}
    >
      <div className="fr2">
        <div className="fg"><label className="fl">Percentual (%)</label><input className="fi" type="number" step="0.01" value={perc} onChange={e => setPerc(Number(e.target.value))} /></div>
        <div className="fg"><label className="fl">Data aplicação</label><input className="fi" type="date" value={data} onChange={e => setData(e.target.value)} /></div>
      </div>
      <div className="fg"><label className="fl">Observação</label><input className="fi" value={obs} onChange={e => setObs(e.target.value)} /></div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginTop: 8 }}>
        <input type="checkbox" checked={aplicarColabs} onChange={e => setAplicarColabs(e.target.checked)} />
        Aplicar nos {afetados.length} colaborador(es) vinculados
      </label>
      {aplicarColabs && afetados.length > 0 && (
        <div style={{ background: 'var(--g1)', padding: 10, borderRadius: 8, fontSize: 11, marginTop: 8, maxHeight: 140, overflowY: 'auto' }}>
          {afetados.map(c => <div key={c.id}>· {c.n} ({c.ar}) — {fmt(c.sal)} → {fmt(Math.round(c.sal * (1 + perc / 100)))}</div>)}
          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--g5)', fontStyle: 'italic' }}>(preview do reajuste · valores sempre visíveis nesta operação crítica)</div>
        </div>
      )}
    </Modal>
  );
}

function SindicatoModal({ open, editing, onClose, onSave }: { open: boolean; editing: Sindicato | null; onClose: () => void; onSave: (s: Sindicato) => void }) {
  const [form, setForm] = useState<Sindicato>(empty());
  useEffect(() => { if (open) setForm(editing ? { ...editing } : empty()); }, [open, editing]);
  if (!open) return null;
  const setAreas = (v: string) => setForm(f => ({ ...f, abrangeAreas: v.split(',').map(s => s.trim()).filter(Boolean) }));
  return (
    <Modal open={open} title={editing ? `Editar ${editing.sigla}` : 'Novo Sindicato'} onClose={onClose} width={620}
      footer={<><div style={{ flex: 1 }} /><Button kind="o" onClick={onClose}>Cancelar</Button><Button onClick={() => {
        if (!form.sigla || !form.nome) { alert('Sigla e nome obrigatórios'); return; }
        onSave({ ...form, id: form.id || uid() });
      }}>Salvar</Button></>}
    >
      <div className="fr2">
        <div className="fg"><label className="fl">Sigla</label><input className="fi" value={form.sigla} onChange={e => setForm(f => ({ ...f, sigla: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Data-base (MM-DD)</label><input className="fi" placeholder="09-01" value={form.dataBase} onChange={e => setForm(f => ({ ...f, dataBase: e.target.value }))} /></div>
      </div>
      <div className="fg"><label className="fl">Nome completo</label><input className="fi" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
      <div className="fg"><label className="fl">Áreas abrangidas (separadas por vírgula)</label>
        <input className="fi" value={form.abrangeAreas.join(', ')} onChange={e => setAreas(e.target.value)} />
      </div>
      <div className="fg"><label className="fl">Observação</label><textarea className="fta" rows={2} value={form.obs || ''} onChange={e => setForm(f => ({ ...f, obs: e.target.value }))} /></div>
    </Modal>
  );
  function empty(): Sindicato { return { id: '', sigla: '', nome: '', dataBase: '', abrangeAreas: [], historico: [], obs: '' }; }
}
