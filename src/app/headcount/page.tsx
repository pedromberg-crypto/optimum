'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, Modal, Page, Topbar } from '@/components/ui';
import { useToast } from '@/components/toast';
import { fd, fmt, uid } from '@/lib/helpers';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import type { Skill, Vaga, VagaPrio } from '@/lib/types';

export default function HeadcountPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const saveVaga = usePCS(s => s.saveVaga);
  const delVaga = usePCS(s => s.delVaga);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vaga | null>(null);

  if (!hydrated) return <div className="ct">Carregando…</div>;

  return (
    <>
      <Topbar title="Headcount · Vagas Abertas" right={<Button onClick={() => { setEditing(null); setOpen(true); }}>+ Nova Vaga</Button>} />
      <Page>
        <Card title={`${db.vagas.length} vaga(s) aberta(s)`} sub="Headcount aprovado / pipeline de contratação">
          <div className="bd-tbl">
            <table className="tbl">
              <thead><tr><th>Cargo</th><th>Área</th><th>Prioridade</th><th>Prazo</th><th>Vínculo</th><th>Faixa</th><th>Skills</th><th>Ações</th></tr></thead>
              <tbody>
                {db.vagas.map(v => (
                  <tr key={v.id}>
                    <td><strong>{v.cargo}</strong><div style={{ fontSize: 11, color: 'var(--g5)', maxWidth: 280 }}>{v.just}</div></td>
                    <td>{v.area}</td>
                    <td><Badge kind={v.prio === 'critica' ? 're' : v.prio === 'media' ? 'am' : 'gr'}>{v.prio}</Badge></td>
                    <td>{fd(v.prazo)}</td>
                    <td><span className="chip">{v.vinculo}</span></td>
                    <td>{fmt(v.smin)} – {fmt(v.smax)}</td>
                    <td><span style={{ fontSize: 11 }}>{v.hard.length} hard · {v.soft.length} soft</span></td>
                    <td>
                      <Button size="sm" kind="o" onClick={() => { setEditing(v); setOpen(true); }}>Editar</Button>
                      {' '}
                      <Button size="sm" kind="dng" onClick={() => { if (confirm('Excluir vaga?')) { delVaga(v.id); toast.push('Vaga excluída', 'info'); } }}>×</Button>
                    </td>
                  </tr>
                ))}
                {!db.vagas.length && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--g4)', padding: 20 }}>Nenhuma vaga aberta</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </Page>

      <VagaModal
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={(v) => { saveVaga(v); toast.push('Vaga salva', 'ok'); setOpen(false); }}
      />
    </>
  );
}

function VagaModal({ open, editing, onClose, onSave }: { open: boolean; editing: Vaga | null; onClose: () => void; onSave: (v: Vaga) => void }) {
  const [form, setForm] = useState<Vaga>(empty());
  useEffect(() => { if (open) setForm(editing ? { ...editing } : empty()); }, [open, editing]);
  if (!open) return null;

  const addSkill = (group: 'hard' | 'soft') => {
    const s: Skill = { id: uid(), l: '', n: 'obrigatorio' };
    setForm(f => ({ ...f, [group]: [...f[group], s] }));
  };
  const updSkill = (group: 'hard' | 'soft', id: string, patch: Partial<Skill>) => {
    setForm(f => ({ ...f, [group]: f[group].map(s => s.id === id ? { ...s, ...patch } : s) }));
  };
  const delSkill = (group: 'hard' | 'soft', id: string) => {
    setForm(f => ({ ...f, [group]: f[group].filter(s => s.id !== id) }));
  };

  return (
    <Modal open={open} title={editing ? 'Editar Vaga' : 'Nova Vaga'} onClose={onClose} width={760}
      footer={<><div style={{ flex: 1 }} /><Button kind="o" onClick={onClose}>Cancelar</Button><Button onClick={() => {
        if (!form.cargo || !form.area) { alert('Cargo e área obrigatórios'); return; }
        onSave({ ...form, id: form.id || uid() });
      }}>Salvar</Button></>}
    >
      <div className="fr2">
        <div className="fg"><label className="fl">Cargo</label><input className="fi" value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Área</label><input className="fi" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} /></div>
      </div>
      <div className="fr3">
        <div className="fg"><label className="fl">Prioridade</label>
          <select className="fs" value={form.prio} onChange={e => setForm(f => ({ ...f, prio: e.target.value as VagaPrio }))}>
            <option value="critica">Crítica</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
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

      <SkillSection title="Hard skills" group="hard" list={form.hard} onAdd={() => addSkill('hard')} onUpd={(id, p) => updSkill('hard', id, p)} onDel={id => delSkill('hard', id)} />
      <SkillSection title="Soft skills" group="soft" list={form.soft} onAdd={() => addSkill('soft')} onUpd={(id, p) => updSkill('soft', id, p)} onDel={id => delSkill('soft', id)} />
    </Modal>
  );
}

function SkillSection({ title, list, onAdd, onUpd, onDel }: {
  title: string; group: 'hard' | 'soft'; list: Skill[]; onAdd: () => void;
  onUpd: (id: string, patch: Partial<Skill>) => void; onDel: (id: string) => void;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ fontSize: 12 }}>{title}</strong>
        <Button size="sm" kind="o" onClick={onAdd}>+ Adicionar</Button>
      </div>
      {list.map(s => (
        <div key={s.id} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          <input className="fi" placeholder="Skill" value={s.l} onChange={e => onUpd(s.id, { l: e.target.value })} style={{ flex: 1 }} />
          <select className="fs" value={s.n} onChange={e => onUpd(s.id, { n: e.target.value as Skill['n'] })} style={{ width: 130 }}>
            <option value="obrigatorio">Obrigatório</option>
            <option value="desejavel">Desejável</option>
          </select>
          <Button size="sm" kind="dng" onClick={() => onDel(s.id)}>×</Button>
        </div>
      ))}
    </div>
  );
}

function empty(): Vaga {
  return { id: '', cargo: '', area: '', prio: 'media', prazo: '', vinculo: 'CLT', just: '', smin: 0, smax: 0, hard: [], soft: [] };
}
