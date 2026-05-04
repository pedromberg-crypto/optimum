'use client';

import { useEffect, useState } from 'react';
import { Button, FaixaBar, Modal, NivelBadge } from '@/components/ui';
import { Card, KPI, PageHead } from '@/components/v2/kpi';
import { Tabs } from '@/components/v2/tabs';
import { useToast } from '@/components/toast';
import { fd, fmt, getMktStatus, inferCargoTrack, isColabMasked, maskColabFmt, maskFmt, uid } from '@/lib/helpers';
import { EyeToggle } from '@/components/v2/eye-toggle';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import { useUI } from '@/store/use-ui';
import { NIVEL_LABEL, type Cargo, type CargoTrack, type Familia, type Skill, type Vaga, type VagaPrio } from '@/lib/types';

type Tab = 'matriz' | 'familias' | 'vagas';

export default function CargosV2() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const oculto = useUI(s => s.oculto);
  const revelados = useUI(s => s.revelados);
  const saveCargo = usePCS(s => s.saveCargo);
  const delCargo = usePCS(s => s.delCargo);
  const saveFamilia = usePCS(s => s.saveFamilia);
  const delFamilia = usePCS(s => s.delFamilia);
  const saveVaga = usePCS(s => s.saveVaga);
  const delVaga = usePCS(s => s.delVaga);
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('matriz');
  const [famOpen, setFamOpen] = useState(false);
  const [famEdit, setFamEdit] = useState<Familia | null>(null);
  const [cargoOpen, setCargoOpen] = useState(false);
  const [cargoEdit, setCargoEdit] = useState<Cargo | null>(null);
  const [cargoFam, setCargoFam] = useState('');
  const [vagaOpen, setVagaOpen] = useState(false);
  const [vagaEdit, setVagaEdit] = useState<Vaga | null>(null);

  if (!hydrated) return <div className="v2-page">Carregando…</div>;

  const totalCargos = db.cargos.length;
  const totalFams = db.familias.length;
  const totalVagas = db.vagas.length;
  const cargosOcupados = db.cargos.filter(k => db.colabs.some(c => c.ca === k.n)).length;

  const removerFam = (f: Familia) => {
    const cargos = db.cargos.filter(k => k.fam === f.id);
    if (cargos.length) { toast.push(`${cargos.length} cargo(s) usam essa família`, 'err'); return; }
    if (confirm(`Excluir ${f.n}?`)) { delFamilia(f.id); toast.push('Família excluída', 'info'); }
  };
  const removerCargo = (k: Cargo) => {
    const ocup = db.colabs.filter(c => c.ca === k.n).length;
    if (ocup) { toast.push(`${ocup} colab(s) usam esse cargo`, 'err'); return; }
    if (confirm(`Excluir cargo ${k.n}?`)) { delCargo(k.id); toast.push('Cargo excluído', 'info'); }
  };

  return (
    <div className="v2-page">
      <PageHead
        title="Cargos & Vagas"
        sub="Famílias · matriz salarial · vagas abertas (headcount)"
        actions={
          <>
            <button className="v2-btn v2-btn-o" onClick={() => { setFamEdit(null); setFamOpen(true); }}>+ Família</button>
            <button className="v2-btn v2-btn-o" onClick={() => { setCargoEdit(null); setCargoFam(db.familias[0]?.id || ''); setCargoOpen(true); }}>+ Cargo</button>
            <button className="v2-btn v2-btn-p" onClick={() => { setVagaEdit(null); setVagaOpen(true); }}>+ Vaga</button>
          </>
        }
      />

      <div className="v2-grid-4">
        <KPI label="Famílias" value={totalFams} />
        <KPI label="Cargos" value={totalCargos} hint={`${cargosOcupados} ocupados`} />
        <KPI label="Vagas abertas" value={totalVagas} hint={totalVagas > 0 ? 'pipeline ativo' : '—'} />
        <KPI label="Vagas críticas" value={db.vagas.filter(v => v.prio === 'critica').length} deltaKind={db.vagas.filter(v => v.prio === 'critica').length > 0 ? 'down' : 'up'} delta={db.vagas.filter(v => v.prio === 'critica').length > 0 ? 'urgentes' : 'sem'} />
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'matriz', label: 'Matriz Salarial' },
          { key: 'familias', label: 'Famílias' },
          { key: 'vagas', label: 'Vagas Abertas', badge: totalVagas },
        ]}
      />

      {tab === 'matriz' && (
        <>
          {db.familias.map(f => {
            const todosCargos = db.cargos.filter(k => k.fam === f.id);
            if (!todosCargos.length) return null;
            const ordemNivel: Record<string, number> = { I: 1, II: 2, III: 3 };
            const cargosTec = todosCargos.filter(k => inferCargoTrack(k) === 'tec').sort((a, b) => (ordemNivel[a.nivel] || 0) - (ordemNivel[b.nivel] || 0));
            const cargosGest = todosCargos.filter(k => inferCargoTrack(k) === 'gest').sort((a, b) => (ordemNivel[a.nivel] || 0) - (ordemNivel[b.nivel] || 0));

            const renderTrilha = (titulo: string, cor: string, lista: typeof todosCargos, trackKey: 'tec' | 'gest') => (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingLeft: 4 }}>
                  <div style={{ width: 4, height: 16, borderRadius: 2, background: cor }} />
                  <strong style={{ fontSize: 12, color: cor, textTransform: 'uppercase', letterSpacing: '.04em' }}>{titulo}</strong>
                  <span style={{ fontSize: 11, color: 'var(--g5)' }}>· {lista.length} cargo(s)</span>
                </div>
                {lista.length > 0 ? (
                  <table className="v2-tbl">
                    <thead><tr><th>Cargo</th><th>Nível</th><th>Piso</th><th>Alvo</th><th>Teto</th><th>Ocup.</th><th>Distribuição</th><th>Ações</th></tr></thead>
                    <tbody>
                      {lista.map(k => {
                        const ocup = db.colabs.filter(c => c.ca === k.n);
                        const stats = ocup.reduce((acc, c) => {
                          const st = getMktStatus(db, c);
                          if (st) acc[st]++;
                          return acc;
                        }, { abaixo: 0, entrada: 0, plena: 0, acima: 0 });
                        return (
                          <tr key={k.id}>
                            <td><strong>{k.n}</strong></td>
                            <td><NivelBadge nivel={k.nivel} /></td>
                            <td>{maskFmt(k.piso, oculto)}</td>
                            <td>{maskFmt(k.alvo, oculto)}</td>
                            <td>{maskFmt(k.teto, oculto)}</td>
                            <td>{ocup.length}</td>
                            <td>
                              {oculto ? (
                                <span className="v2-chip">•••</span>
                              ) : (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  {stats.abaixo > 0 && <span className="v2-chip v2-chip-re">{stats.abaixo} abaixo</span>}
                                  {stats.entrada > 0 && <span className="v2-chip v2-chip-am">{stats.entrada} entrada</span>}
                                  {stats.plena > 0 && <span className="v2-chip v2-chip-gr">{stats.plena} plena</span>}
                                  {stats.acima > 0 && <span className="v2-chip v2-chip-pu">{stats.acima} acima</span>}
                                  {!ocup.length && <span style={{ color: 'var(--g4)' }}>—</span>}
                                </div>
                              )}
                            </td>
                            <td>
                              <button className="v2-btn v2-btn-o v2-btn-sm" onClick={() => { setCargoEdit(k); setCargoFam(f.id); setCargoOpen(true); }}>Editar</button>
                              {' '}
                              <button className="v2-btn v2-btn-o v2-btn-sm" style={{ color: 'var(--re)' }} onClick={() => removerCargo(k)}>×</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ background: 'var(--am0)', border: '1px dashed var(--am2)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--g6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span>Nenhum cargo de <strong>{trackKey === 'tec' ? 'especialização técnica' : 'gestão / liderança'}</strong> nesta família.</span>
                    <button
                      className="v2-btn v2-btn-p v2-btn-sm"
                      onClick={() => { setCargoEdit(null); setCargoFam(f.id); setCargoOpen(true); }}
                    >
                      + Cadastrar cargo de {trackKey === 'tec' ? 'técnica' : 'gestão'}
                    </button>
                  </div>
                )}
              </div>
            );

            return (
              <Card key={f.id} title={f.n} sub={f.desc}>
                {renderTrilha('Trilha Técnica · Especialização', 'var(--te)', cargosTec, 'tec')}
                {renderTrilha('Trilha de Gestão · Liderança', 'var(--bl)', cargosGest, 'gest')}
              </Card>
            );
          })}

          <Card title="Posicionamento individual (CLT)" sub="Salário atual vs faixa do cargo · use o botão ao lado do nome para revelar">
            {db.colabs.filter(c => c.vi === 'CLT').map(c => {
              const k = db.cargos.find(x => x.n === c.ca);
              if (!k) return null;
              const masked = isColabMasked(c.id, oculto, revelados);
              return (
                <div key={c.id} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--g1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {c.n} <span style={{ color: 'var(--g5)', fontWeight: 400 }}>&nbsp;· {c.ca}</span>
                      <EyeToggle colabId={c.id} />
                    </span>
                    <span>{maskColabFmt(c.sal, c.id, oculto, revelados)}</span>
                  </div>
                  {masked ? (
                    <div style={{ padding: 12, background: 'var(--am0)', borderRadius: 8, fontSize: 11, color: 'var(--am)', textAlign: 'center' }}>
                      Faixa oculta · clique no botão para revelar
                    </div>
                  ) : (
                    <FaixaBar piso={k.piso} alvo={k.alvo} teto={k.teto} atual={c.sal} />
                  )}
                </div>
              );
            })}
          </Card>
        </>
      )}

      {tab === 'familias' && (
        <div className="v2-grid-3">
          {db.familias.map(f => {
            const cargos = db.cargos.filter(k => k.fam === f.id);
            return (
              <Card key={f.id} title={`${f.ic} ${f.n}`} sub={`${cargos.length} cargo(s)`}>
                <div style={{ fontSize: 12, color: 'var(--g5)', marginBottom: 12 }}>{f.desc}</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <button className="v2-btn v2-btn-o v2-btn-sm" onClick={() => { setFamEdit(f); setFamOpen(true); }}>Editar</button>
                  <button className="v2-btn v2-btn-o v2-btn-sm" style={{ color: 'var(--re)' }} onClick={() => removerFam(f)}>×</button>
                  <div style={{ flex: 1 }} />
                  <button className="v2-btn v2-btn-p v2-btn-sm" onClick={() => { setCargoEdit(null); setCargoFam(f.id); setCargoOpen(true); }}>+ Cargo</button>
                </div>
                {cargos.map(k => (
                  <div key={k.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--g1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span><strong>{k.n}</strong> <NivelBadge nivel={k.nivel} /></span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--g5)' }}>{maskFmt(k.piso, oculto)} – {maskFmt(k.teto, oculto)} · {db.colabs.filter(c => c.ca === k.n).length} ocup.</div>
                  </div>
                ))}
                {!cargos.length && <div style={{ color: 'var(--g4)', fontSize: 12 }}>Sem cargos</div>}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'vagas' && (
        <Card title={`${totalVagas} vaga(s) aberta(s)`} sub="Headcount aprovado / pipeline de contratação">
          <table className="v2-tbl">
            <thead><tr><th>Cargo</th><th>Posição</th><th>Área</th><th>Prioridade</th><th>Prazo</th><th>Vínculo</th><th>Faixa</th><th>Skills</th><th>Ações</th></tr></thead>
            <tbody>
              {db.vagas.map(v => {
                const nivelInferido = v.nivel || db.cargos.find(k => k.n === v.cargo)?.nivel;
                return (
                <tr key={v.id}>
                  <td><strong>{v.cargo}</strong><div style={{ fontSize: 11, color: 'var(--g5)', maxWidth: 280 }}>{v.just}</div></td>
                  <td>
                    {nivelInferido ? (
                      <span className={`v2-chip ${nivelInferido === 'III' ? 'v2-chip-pu' : nivelInferido === 'II' ? 'v2-chip-am' : 'v2-chip-gr'}`}>
                        {NIVEL_LABEL[nivelInferido as 'I' | 'II' | 'III']}
                      </span>
                    ) : <span style={{ color: 'var(--g4)' }}>—</span>}
                  </td>
                  <td>{v.area}</td>
                  <td><span className={`v2-chip ${v.prio === 'critica' ? 'v2-chip-re' : v.prio === 'media' ? 'v2-chip-am' : 'v2-chip-gr'}`}>{v.prio}</span></td>
                  <td>{fd(v.prazo)}</td>
                  <td><span className="v2-chip">{v.vinculo}</span></td>
                  <td>{maskFmt(v.smin, oculto)} – {maskFmt(v.smax, oculto)}</td>
                  <td><span style={{ fontSize: 11 }}>{v.hard.length} hard · {v.soft.length} soft</span></td>
                  <td>
                    <button className="v2-btn v2-btn-o v2-btn-sm" onClick={() => { setVagaEdit(v); setVagaOpen(true); }}>Editar</button>
                    {' '}
                    <button className="v2-btn v2-btn-o v2-btn-sm" style={{ color: 'var(--re)' }} onClick={() => { if (confirm('Excluir vaga?')) { delVaga(v.id); toast.push('Vaga excluída', 'info'); } }}>×</button>
                  </td>
                </tr>
                );
              })}
              {!totalVagas && <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--g4)', padding: 24 }}>Nenhuma vaga aberta</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      <FamiliaModal open={famOpen} editing={famEdit} onClose={() => setFamOpen(false)} onSave={(f) => { saveFamilia(f); toast.push('Família salva', 'ok'); setFamOpen(false); }} />
      <CargoModal open={cargoOpen} editing={cargoEdit} famId={cargoFam} familias={db.familias} onClose={() => setCargoOpen(false)} onSave={(k) => { saveCargo(k); toast.push('Cargo salvo', 'ok'); setCargoOpen(false); }} />
      <VagaModal open={vagaOpen} editing={vagaEdit} onClose={() => setVagaOpen(false)} onSave={(v) => { saveVaga(v); toast.push('Vaga salva', 'ok'); setVagaOpen(false); }} />
    </div>
  );
}

function FamiliaModal({ open, editing, onClose, onSave }: { open: boolean; editing: Familia | null; onClose: () => void; onSave: (f: Familia) => void }) {
  const [form, setForm] = useState<Familia>(empty());
  useEffect(() => { if (open) setForm(editing ? { ...editing } : empty()); }, [open, editing]);
  if (!open) return null;
  return (
    <Modal open={open} title={editing ? 'Editar Família' : 'Nova Família'} onClose={onClose} width={520}
      footer={<><div style={{ flex: 1 }} /><Button kind="o" onClick={onClose}>Cancelar</Button><Button onClick={() => {
        if (!form.n) { alert('Nome obrigatório'); return; }
        onSave({ ...form, id: form.id || uid() });
      }}>Salvar</Button></>}
    >
      <div className="fr2">
        <div className="fg"><label className="fl">Nome</label><input className="fi" value={form.n} onChange={e => setForm(f => ({ ...f, n: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Ícone (emoji)</label><input className="fi" value={form.ic} onChange={e => setForm(f => ({ ...f, ic: e.target.value }))} /></div>
      </div>
      <div className="fg"><label className="fl">Descrição</label><input className="fi" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} /></div>
    </Modal>
  );
  function empty(): Familia { return { id: '', n: '', ic: '📁', col: 'pu', desc: '' }; }
}

function CargoModal({ open, editing, famId, familias, onClose, onSave }: { open: boolean; editing: Cargo | null; famId: string; familias: Familia[]; onClose: () => void; onSave: (k: Cargo) => void }) {
  const [form, setForm] = useState<Cargo>(empty(famId));
  useEffect(() => { if (open) setForm(editing ? { ...editing } : empty(famId)); }, [open, editing, famId]);
  if (!open) return null;
  return (
    <Modal open={open} title={editing ? 'Editar Cargo' : 'Novo Cargo'} onClose={onClose} width={620}
      footer={<><div style={{ flex: 1 }} /><Button kind="o" onClick={onClose}>Cancelar</Button><Button onClick={() => {
        if (!form.n) { alert('Nome obrigatório'); return; }
        if (form.piso > form.alvo || form.alvo > form.teto) { alert('Piso ≤ Alvo ≤ Teto'); return; }
        onSave({ ...form, id: form.id || uid() });
      }}>Salvar</Button></>}
    >
      <div className="fr2">
        <div className="fg"><label className="fl">Família</label>
          <select className="fs" value={form.fam} onChange={e => setForm(f => ({ ...f, fam: e.target.value }))}>
            {familias.map(fa => <option key={fa.id} value={fa.id}>{fa.n}</option>)}
          </select>
        </div>
        <div className="fg"><label className="fl">Nível</label>
          <select className="fs" value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value as 'I' | 'II' | 'III' }))}>
            <option value="I">I (Júnior)</option><option value="II">II (Pleno)</option><option value="III">III (Sênior)</option>
          </select>
        </div>
      </div>
      <div className="fr2">
        <div className="fg"><label className="fl">Nome</label><input className="fi" value={form.n} onChange={e => setForm(f => ({ ...f, n: e.target.value }))} /></div>
        <div className="fg">
          <label className="fl">Trilha (Plano Y)</label>
          <select className="fs" value={form.track || ''} onChange={e => setForm(f => ({ ...f, track: (e.target.value || undefined) as CargoTrack | undefined }))}>
            <option value="">Auto (inferido pelo nome)</option>
            <option value="tec">Técnica · Especialização</option>
            <option value="gest">Gestão · Liderança</option>
          </select>
        </div>
      </div>
      <div className="fr3">
        <div className="fg"><label className="fl">Piso</label><input className="fi" type="number" value={form.piso} onChange={e => setForm(f => ({ ...f, piso: Number(e.target.value) }))} /></div>
        <div className="fg"><label className="fl">Alvo</label><input className="fi" type="number" value={form.alvo} onChange={e => setForm(f => ({ ...f, alvo: Number(e.target.value) }))} /></div>
        <div className="fg"><label className="fl">Teto</label><input className="fi" type="number" value={form.teto} onChange={e => setForm(f => ({ ...f, teto: Number(e.target.value) }))} /></div>
      </div>
      <div className="fg"><label className="fl">Descrição</label><textarea className="fta" rows={2} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} /></div>
      <div className="fg"><label className="fl">Requisitos</label><input className="fi" value={form.req} onChange={e => setForm(f => ({ ...f, req: e.target.value }))} /></div>
      <div className="fg"><label className="fl">Critério de progressão</label><input className="fi" value={form.prog} onChange={e => setForm(f => ({ ...f, prog: e.target.value }))} /></div>
    </Modal>
  );
  function empty(fam: string): Cargo { return { id: '', fam, nivel: 'I', n: '', desc: '', piso: 0, alvo: 0, teto: 0, req: '', prog: '' }; }
}

function VagaModal({ open, editing, onClose, onSave }: { open: boolean; editing: Vaga | null; onClose: () => void; onSave: (v: Vaga) => void }) {
  const [form, setForm] = useState<Vaga>(empty());
  useEffect(() => { if (open) setForm(editing ? { ...editing } : empty()); }, [open, editing]);
  if (!open) return null;
  const addSkill = (group: 'hard' | 'soft') => setForm(f => ({ ...f, [group]: [...f[group], { id: uid(), l: '', n: 'obrigatorio' as const }] }));
  const updSkill = (group: 'hard' | 'soft', id: string, patch: Partial<Skill>) => setForm(f => ({ ...f, [group]: f[group].map(s => s.id === id ? { ...s, ...patch } : s) }));
  const delSkill = (group: 'hard' | 'soft', id: string) => setForm(f => ({ ...f, [group]: f[group].filter(s => s.id !== id) }));
  return (
    <Modal open={open} title={editing ? 'Editar Vaga' : 'Nova Vaga'} onClose={onClose} width={760}
      footer={<><div style={{ flex: 1 }} /><Button kind="o" onClick={onClose}>Cancelar</Button><Button onClick={() => {
        if (!form.cargo || !form.area) { alert('Cargo e área obrigatórios'); return; }
        onSave({ ...form, id: form.id || uid() });
      }}>Salvar</Button></>}
    >
      <div className="fr3">
        <div className="fg"><label className="fl">Cargo</label><input className="fi" value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Área</label><input className="fi" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Posição (nível)</label>
          <select className="fs" value={form.nivel || ''} onChange={e => setForm(f => ({ ...f, nivel: (e.target.value || undefined) as 'I' | 'II' | 'III' | undefined }))}>
            <option value="">— Auto pelo cargo</option>
            <option value="I">Júnior (I)</option>
            <option value="II">Pleno (II)</option>
            <option value="III">Sênior (III)</option>
          </select>
        </div>
      </div>
      <div className="fr3">
        <div className="fg"><label className="fl">Prioridade</label>
          <select className="fs" value={form.prio} onChange={e => setForm(f => ({ ...f, prio: e.target.value as VagaPrio }))}>
            <option value="critica">Crítica</option><option value="media">Média</option><option value="baixa">Baixa</option>
          </select>
        </div>
        <div className="fg"><label className="fl">Prazo</label><input className="fi" type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Vínculo</label>
          <select className="fs" value={form.vinculo} onChange={e => setForm(f => ({ ...f, vinculo: e.target.value }))}>
            <option>CLT</option><option>PJ</option><option>Estágio</option><option>Contrato de Horas</option>
          </select>
        </div>
      </div>
      <div className="fr2">
        <div className="fg"><label className="fl">Salário mín</label><input className="fi" type="number" value={form.smin} onChange={e => setForm(f => ({ ...f, smin: Number(e.target.value) }))} /></div>
        <div className="fg"><label className="fl">Salário máx</label><input className="fi" type="number" value={form.smax} onChange={e => setForm(f => ({ ...f, smax: Number(e.target.value) }))} /></div>
      </div>
      <div className="fg"><label className="fl">Justificativa</label><textarea className="fta" rows={2} value={form.just} onChange={e => setForm(f => ({ ...f, just: e.target.value }))} /></div>

      {(['hard', 'soft'] as const).map(g => (
        <div key={g} style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ fontSize: 12 }}>{g === 'hard' ? 'Hard skills' : 'Soft skills'}</strong>
            <Button size="sm" kind="o" onClick={() => addSkill(g)}>+ Adicionar</Button>
          </div>
          {form[g].map(s => (
            <div key={s.id} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <input className="fi" placeholder="Skill" value={s.l} onChange={e => updSkill(g, s.id, { l: e.target.value })} style={{ flex: 1 }} />
              <select className="fs" value={s.n} onChange={e => updSkill(g, s.id, { n: e.target.value as Skill['n'] })} style={{ width: 130 }}>
                <option value="obrigatorio">Obrigatório</option><option value="desejavel">Desejável</option>
              </select>
              <Button size="sm" kind="dng" onClick={() => delSkill(g, s.id)}>×</Button>
            </div>
          ))}
        </div>
      ))}
    </Modal>
  );
  function empty(): Vaga { return { id: '', cargo: '', area: '', prio: 'media', prazo: '', vinculo: 'CLT', just: '', smin: 0, smax: 0, hard: [], soft: [] }; }
}
