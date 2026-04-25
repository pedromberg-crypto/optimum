'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, Modal, NivelBadge, Page, Topbar } from '@/components/ui';
import { useToast } from '@/components/toast';
import { fmt } from '@/lib/helpers';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import type { Cargo, Familia } from '@/lib/types';

export default function FamiliasPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const saveFamilia = usePCS(s => s.saveFamilia);
  const delFamilia = usePCS(s => s.delFamilia);
  const saveCargo = usePCS(s => s.saveCargo);
  const delCargo = usePCS(s => s.delCargo);
  const toast = useToast();

  const [famOpen, setFamOpen] = useState(false);
  const [famEdit, setFamEdit] = useState<Familia | null>(null);
  const [cargoOpen, setCargoOpen] = useState(false);
  const [cargoEdit, setCargoEdit] = useState<Cargo | null>(null);
  const [cargoFam, setCargoFam] = useState<string>('');

  if (!hydrated) return <div className="ct">Carregando…</div>;

  const removerFam = (f: Familia) => {
    const cargos = db.cargos.filter(k => k.fam === f.id);
    if (cargos.length) { toast.push(`Família tem ${cargos.length} cargo(s) — remova antes`, 'err'); return; }
    if (confirm(`Excluir ${f.n}?`)) { delFamilia(f.id); toast.push('Família excluída', 'info'); }
  };

  const removerCargo = (k: Cargo) => {
    const ocup = db.colabs.filter(c => c.ca === k.n).length;
    if (ocup) { toast.push(`${ocup} colab(s) usam esse cargo — reatribua antes`, 'err'); return; }
    if (confirm(`Excluir cargo ${k.n}?`)) { delCargo(k.id); toast.push('Cargo excluído', 'info'); }
  };

  return (
    <>
      <Topbar
        title="Família de Cargos"
        right={<Button onClick={() => { setFamEdit(null); setFamOpen(true); }}>+ Família</Button>}
      />
      <Page>
        <div className="g3c">
          {db.familias.map(f => {
            const cargos = db.cargos.filter(k => k.fam === f.id).sort((a, b) => a.nivel.localeCompare(b.nivel));
            return (
              <Card key={f.id} title={`${f.ic} ${f.n}`} sub={f.desc}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <Button size="sm" kind="o" onClick={() => { setFamEdit(f); setFamOpen(true); }}>Editar</Button>
                  <Button size="sm" kind="dng" onClick={() => removerFam(f)}>×</Button>
                  <div style={{ flex: 1 }} />
                  <Button size="sm" kind="gn" onClick={() => { setCargoEdit(null); setCargoFam(f.id); setCargoOpen(true); }}>+ Cargo</Button>
                </div>
                {cargos.map(k => {
                  const ocup = db.colabs.filter(c => c.ca === k.n).length;
                  return (
                    <div key={k.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--g1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><strong>{k.n}</strong> <NivelBadge nivel={k.nivel} /></span>
                        <span style={{ fontSize: 11, color: 'var(--g5)' }}>{ocup} ocup.</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--g5)', marginTop: 2 }}>{fmt(k.piso)} – {fmt(k.teto)}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <Button size="sm" kind="o" onClick={() => { setCargoEdit(k); setCargoFam(f.id); setCargoOpen(true); }}>Editar</Button>
                        <Button size="sm" kind="dng" onClick={() => removerCargo(k)}>×</Button>
                      </div>
                    </div>
                  );
                })}
                {!cargos.length && <div style={{ color: 'var(--g4)', fontSize: 12 }}>Sem cargos</div>}
              </Card>
            );
          })}
        </div>
      </Page>

      <FamiliaModal
        open={famOpen}
        editing={famEdit}
        onClose={() => setFamOpen(false)}
        onSave={(f) => { saveFamilia(f); toast.push('Família salva', 'ok'); setFamOpen(false); }}
      />
      <CargoModal
        open={cargoOpen}
        editing={cargoEdit}
        famId={cargoFam}
        onClose={() => setCargoOpen(false)}
        onSave={(k) => { saveCargo(k); toast.push('Cargo salvo', 'ok'); setCargoOpen(false); }}
      />
    </>
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
        onSave(form);
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

function CargoModal({ open, editing, famId, onClose, onSave }: { open: boolean; editing: Cargo | null; famId: string; onClose: () => void; onSave: (k: Cargo) => void }) {
  const [form, setForm] = useState<Cargo>(empty(famId));
  useEffect(() => { if (open) setForm(editing ? { ...editing } : empty(famId)); }, [open, editing, famId]);
  if (!open) return null;
  return (
    <Modal open={open} title={editing ? 'Editar Cargo' : 'Novo Cargo'} onClose={onClose} width={620}
      footer={<><div style={{ flex: 1 }} /><Button kind="o" onClick={onClose}>Cancelar</Button><Button onClick={() => {
        if (!form.n) { alert('Nome obrigatório'); return; }
        onSave(form);
      }}>Salvar</Button></>}
    >
      <div className="fr2">
        <div className="fg"><label className="fl">Nome</label><input className="fi" value={form.n} onChange={e => setForm(f => ({ ...f, n: e.target.value }))} /></div>
        <div className="fg"><label className="fl">Nível</label>
          <select className="fs" value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value as 'I' | 'II' | 'III' }))}>
            <option value="I">I (Júnior)</option>
            <option value="II">II (Pleno)</option>
            <option value="III">III (Sênior)</option>
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
