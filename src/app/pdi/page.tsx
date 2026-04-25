'use client';

import { useEffect, useState } from 'react';
import { Avatar, Badge, Button, Card, Modal, Page, Topbar } from '@/components/ui';
import { fd, uid } from '@/lib/helpers';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import type { PDI, PDIStatus, PDITipo } from '@/lib/types';

const TIPO_LABEL: Record<PDITipo, string> = { hard: 'Hard skill', soft: 'Soft skill', ent: 'Entrega' };
const STATUS_KIND: Record<PDIStatus, 'gr' | 'te' | 'jun'> = { concluido: 'gr', 'em-andamento': 'te', pendente: 'jun' };

export default function PDIPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const savePDI = usePCS(s => s.savePDI);
  const delPDI = usePCS(s => s.delPDI);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PDI | null>(null);
  const [filtroSt, setFiltroSt] = useState<PDIStatus | ''>('');

  if (!hydrated) return <div className="ct">Carregando…</div>;

  const lista = db.pdis.filter(p => !filtroSt || p.st === filtroSt);

  return (
    <>
      <Topbar
        title="PDI Individual"
        right={<Button onClick={() => { setEditing(null); setOpen(true); }}>+ Novo Objetivo</Button>}
      />
      <Page>
        <Card title={`${lista.length} objetivo(s)`} sub="Objetivos de desenvolvimento individual">
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <Button kind={!filtroSt ? 'p' : 'o'} size="sm" onClick={() => setFiltroSt('')}>Todos</Button>
            <Button kind={filtroSt === 'pendente' ? 'p' : 'o'} size="sm" onClick={() => setFiltroSt('pendente')}>Pendentes</Button>
            <Button kind={filtroSt === 'em-andamento' ? 'p' : 'o'} size="sm" onClick={() => setFiltroSt('em-andamento')}>Em andamento</Button>
            <Button kind={filtroSt === 'concluido' ? 'p' : 'o'} size="sm" onClick={() => setFiltroSt('concluido')}>Concluídos</Button>
          </div>
          <div className="bd-tbl">
            <table className="tbl">
              <thead><tr><th>Colaborador</th><th>Objetivo</th><th>Tipo</th><th>Prazo</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {lista.map((p, i) => {
                  const colab = db.colabs.find(c => c.id === p.p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {colab && <Avatar name={colab.n} idx={i} size={24} />}
                          {colab?.n || '—'}
                        </div>
                      </td>
                      <td><strong>{p.o}</strong><div style={{ fontSize: 11, color: 'var(--g4)' }}>{p.a}</div></td>
                      <td><span className="chip">{TIPO_LABEL[p.t]}</span></td>
                      <td>{fd(p.pz)}</td>
                      <td><Badge kind={STATUS_KIND[p.st]}>{p.st}</Badge></td>
                      <td>
                        <Button size="sm" kind="o" onClick={() => { setEditing(p); setOpen(true); }}>Editar</Button>
                        {' '}
                        <Button size="sm" kind="dng" onClick={() => { if (confirm('Excluir?')) delPDI(p.id); }}>×</Button>
                      </td>
                    </tr>
                  );
                })}
                {!lista.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--g4)', padding: 20 }}>Nenhum objetivo</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </Page>
      <PDIFormModal
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={(data) => { savePDI(data); setOpen(false); }}
        colabs={db.colabs}
      />
    </>
  );
}

function PDIFormModal({ open, editing, onClose, onSave, colabs }: {
  open: boolean;
  editing: PDI | null;
  onClose: () => void;
  onSave: (p: PDI) => void;
  colabs: { id: string; n: string }[];
}) {
  const [form, setForm] = useState<PDI>(editing || empty());
  const isEdit = !!editing;

  useEffect(() => {
    if (open) setForm(editing ? { ...editing } : empty());
  }, [open, editing]);

  if (!open) return null;

  return (
    <Modal
      open={open}
      title={isEdit ? 'Editar Objetivo' : 'Novo Objetivo PDI'}
      onClose={onClose}
      width={620}
      footer={
        <>
          <div style={{ flex: 1 }} />
          <Button kind="o" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            if (!form.p || !form.o) { alert('Colaborador e objetivo são obrigatórios'); return; }
            onSave({ ...form, id: form.id || uid() });
          }}>{isEdit ? 'Salvar' : 'Criar'}</Button>
        </>
      }
    >
      <div className="fg">
        <label className="fl">Colaborador</label>
        <select className="fs" value={form.p} onChange={e => setForm(f => ({ ...f, p: e.target.value }))}>
          <option value="">—</option>
          {colabs.map(c => <option key={c.id} value={c.id}>{c.n}</option>)}
        </select>
      </div>
      <div className="fg">
        <label className="fl">Objetivo</label>
        <input className="fi" value={form.o} onChange={e => setForm(f => ({ ...f, o: e.target.value }))} />
      </div>
      <div className="fg">
        <label className="fl">Ações / Como</label>
        <textarea className="fta" rows={2} value={form.a} onChange={e => setForm(f => ({ ...f, a: e.target.value }))} />
      </div>
      <div className="fr3">
        <div className="fg">
          <label className="fl">Tipo</label>
          <select className="fs" value={form.t} onChange={e => setForm(f => ({ ...f, t: e.target.value as PDITipo }))}>
            <option value="hard">Hard skill</option>
            <option value="soft">Soft skill</option>
            <option value="ent">Entrega</option>
          </select>
        </div>
        <div className="fg">
          <label className="fl">Prazo</label>
          <input className="fi" type="date" value={form.pz} onChange={e => setForm(f => ({ ...f, pz: e.target.value }))} />
        </div>
        <div className="fg">
          <label className="fl">Status</label>
          <select className="fs" value={form.st} onChange={e => setForm(f => ({ ...f, st: e.target.value as PDIStatus }))}>
            <option value="pendente">Pendente</option>
            <option value="em-andamento">Em andamento</option>
            <option value="concluido">Concluído</option>
          </select>
        </div>
      </div>
      <div className="fg">
        <label className="fl">Recursos</label>
        <input className="fi" value={form.r || ''} onChange={e => setForm(f => ({ ...f, r: e.target.value }))} />
      </div>
      <div className="fg">
        <label className="fl">Métrica de sucesso</label>
        <input className="fi" value={form.m || ''} onChange={e => setForm(f => ({ ...f, m: e.target.value }))} />
      </div>
    </Modal>
  );
}

function empty(): PDI {
  return { id: '', p: '', o: '', a: '', pz: '', t: 'hard', st: 'pendente' };
}
