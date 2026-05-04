'use client';

import { useEffect, useState } from 'react';
import { Avatar, Badge, Button, Card, Modal, Page, Topbar } from '@/components/ui';
import { useToast } from '@/components/toast';
import { fd, uid } from '@/lib/helpers';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import type { Aval } from '@/lib/types';

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

export default function AvaliacaoPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const saveAval = usePCS(s => s.saveAval);
  const delAval = usePCS(s => s.delAval);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Aval | null>(null);

  if (!hydrated) return <div className="ct">Carregando…</div>;

  const ultimaPorColab = (id: string): Aval | null => {
    const lista = db.avals.filter(a => a.p === id).sort((a, b) => b.dt.localeCompare(a.dt));
    return lista[0] || null;
  };

  const cell = (perf: 1 | 2 | 3, pot: 1 | 2 | 3) => {
    return db.colabs.filter(c => {
      const a = ultimaPorColab(c.id);
      if (!a) return false;
      const p = bucket(a.notas?.performance ?? 0);
      const o = bucket(a.notas?.potencial ?? 0);
      return p === perf && o === pot;
    });
  };

  return (
    <>
      <Topbar
        title="Avaliação & Promoção"
        right={<Button onClick={() => { setEditing(null); setOpen(true); }}>+ Nova Avaliação</Button>}
      />
      <Page>
        <Card className="mb" title="9-Box · Performance × Potencial" sub="Última avaliação registrada de cada colaborador">
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(3, 1fr)', gap: 4 }}>
            <div />
            <Hd>Performance baixa</Hd><Hd>Performance média</Hd><Hd>Performance alta</Hd>
            {[3, 2, 1].map(potRow => (
              <PotRow key={potRow} pot={potRow as 1 | 2 | 3} cell={cell} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--g5)', marginTop: 10 }}>
            Buckets: nota &lt; 50% = baixa · 50–75% = média · &gt; 75% = alta
          </div>
        </Card>

        <Card title={`Histórico de avaliações · ${db.avals.length}`}>
          <div className="bd-tbl">
            <table className="tbl">
              <thead><tr><th>Colaborador</th><th>Data</th><th>Pontuação</th><th>Performance</th><th>Potencial</th><th>Próxima</th><th>Ações</th></tr></thead>
              <tbody>
                {db.avals.sort((a, b) => b.dt.localeCompare(a.dt)).map((a, i) => {
                  const c = db.colabs.find(x => x.id === a.p);
                  const pct = a.max ? Math.round((a.tot / a.max) * 100) : 0;
                  return (
                    <tr key={a.id}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{c && <Avatar name={c.n} idx={i} size={24} />}{c?.n || '—'}</div></td>
                      <td>{fd(a.dt)}</td>
                      <td><strong>{a.tot}/{a.max}</strong> <Badge kind={pct >= 75 ? 'gr' : pct >= 50 ? 'am' : 're'}>{pct}%</Badge></td>
                      <td>{a.notas?.performance ?? '—'}</td>
                      <td>{a.notas?.potencial ?? '—'}</td>
                      <td>{fd(a.proxima)}</td>
                      <td>
                        <Button size="sm" kind="o" onClick={() => { setEditing(a); setOpen(true); }}>Editar</Button>
                        {' '}
                        <Button size="sm" kind="dng" onClick={() => { if (confirm('Excluir?')) { delAval(a.id); toast.push('Avaliação excluída', 'info'); } }}>×</Button>
                      </td>
                    </tr>
                  );
                })}
                {!db.avals.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--g4)', padding: 20 }}>Nenhuma avaliação registrada</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </Page>

      <AvalModal
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={(a) => { saveAval(a); toast.push('Avaliação salva', 'ok'); setOpen(false); }}
      />
    </>
  );
}

function PotRow({ pot, cell }: { pot: 1 | 2 | 3; cell: (perf: 1 | 2 | 3, pot: 1 | 2 | 3) => { id: string; n: string }[] }) {
  const labelMap = { 3: 'Potencial alto', 2: 'Potencial médio', 1: 'Potencial baixo' };
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 10, fontWeight: 600, color: 'var(--g5)', textAlign: 'right', paddingRight: 6 }}>
        {labelMap[pot]}
      </div>
      {[1, 2, 3].map(perf => {
        const box = BOXES.find(b => b.perf === perf && b.pot === pot)!;
        const occ = cell(perf as 1 | 2 | 3, pot);
        return (
          <div key={perf} style={{ minHeight: 120, padding: 8, border: `2px solid ${box.col}`, borderRadius: 'var(--rs)', background: '#fff' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: box.col, marginBottom: 6 }}>{box.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {occ.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <Avatar name={c.n} idx={i} size={20} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.n.split(' ')[0]}</span>
                </div>
              ))}
              {!occ.length && <span style={{ fontSize: 10, color: 'var(--g4)' }}>—</span>}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Hd({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--g5)', textAlign: 'center', padding: 4 }}>{children}</div>;
}

function bucket(n: number): 1 | 2 | 3 {
  if (n >= 75) return 3;
  if (n >= 50) return 2;
  return 1;
}

function AvalModal({ open, editing, onClose, onSave }: { open: boolean; editing: Aval | null; onClose: () => void; onSave: (a: Aval) => void }) {
  const db = usePCS(s => s.db);
  const [form, setForm] = useState<Aval>(empty());

  useEffect(() => { if (open) setForm(editing ? { ...editing } : empty()); }, [open, editing]);
  if (!open) return null;

  return (
    <Modal open={open} title={editing ? 'Editar Avaliação' : 'Nova Avaliação'} onClose={onClose} width={620}
      footer={<><div style={{ flex: 1 }} /><Button kind="o" onClick={onClose}>Cancelar</Button><Button onClick={() => {
        if (!form.p) { alert('Colaborador obrigatório'); return; }
        onSave({ ...form, id: form.id || uid() });
      }}>Salvar</Button></>}
    >
      <div className="fr2">
        <div className="fg"><label className="fl">Colaborador</label>
          <select className="fs" value={form.p} onChange={e => setForm(f => ({ ...f, p: e.target.value }))}>
            <option value="">—</option>
            {db.colabs.map(c => <option key={c.id} value={c.id}>{c.n}</option>)}
          </select>
        </div>
        <div className="fg"><label className="fl">Data</label><input className="fi" type="date" value={form.dt} onChange={e => setForm(f => ({ ...f, dt: e.target.value }))} /></div>
      </div>
      <div className="fr2">
        <div className="fg"><label className="fl">Pontuação</label><input className="fi" type="number" value={form.tot} onChange={e => setForm(f => ({ ...f, tot: Number(e.target.value) }))} /></div>
        <div className="fg"><label className="fl">Pontuação máxima</label><input className="fi" type="number" value={form.max} onChange={e => setForm(f => ({ ...f, max: Number(e.target.value) }))} /></div>
      </div>
      <div className="fr2">
        <div className="fg"><label className="fl">Performance (0–100)</label>
          <input className="fi" type="number" min={0} max={100} value={form.notas?.performance ?? 0} onChange={e => setForm(f => ({ ...f, notas: { ...f.notas, performance: Number(e.target.value) } }))} />
        </div>
        <div className="fg"><label className="fl">Potencial (0–100)</label>
          <input className="fi" type="number" min={0} max={100} value={form.notas?.potencial ?? 0} onChange={e => setForm(f => ({ ...f, notas: { ...f.notas, potencial: Number(e.target.value) } }))} />
        </div>
      </div>
      <div className="fr2">
        <div className="fg"><label className="fl">Prontidão p/ promoção (%)</label><input className="fi" type="number" value={form.prontidaoPct ?? 0} onChange={e => setForm(f => ({ ...f, prontidaoPct: Number(e.target.value) }))} /></div>
        <div className="fg"><label className="fl">Próxima avaliação</label><input className="fi" type="date" value={form.proxima || ''} onChange={e => setForm(f => ({ ...f, proxima: e.target.value }))} /></div>
      </div>
    </Modal>
  );
}

function empty(): Aval { return { id: '', p: '', dt: new Date().toISOString().slice(0, 10), tot: 0, max: 100, proxima: '', prontidaoPct: 0, notas: { performance: 0, potencial: 0 } }; }
