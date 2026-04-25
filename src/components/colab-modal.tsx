'use client';

import { useEffect, useState } from 'react';
import { Button, Modal } from './ui';
import { usePCS } from '@/store/use-pcs-store';
import { uid } from '@/lib/helpers';
import { MOTIVOS_REAJUSTE, type Colab, type MotivoReajuste, type Papel, type TrilhaKey } from '@/lib/types';

const VINCULOS = ['CLT', 'PJ', 'Estágio', 'Contrato de Horas'];

export function ColabModal({ open, colab, onClose }: { open: boolean; colab: Colab | null; onClose: () => void }) {
  const db = usePCS(s => s.db);
  const saveColab = usePCS(s => s.saveColab);
  const delColab = usePCS(s => s.delColab);

  const [form, setForm] = useState<Colab>(emptyColab());
  const [motivo, setMotivo] = useState<MotivoReajuste>('ajuste');
  const [obsReaj, setObsReaj] = useState('');

  useEffect(() => {
    if (open) {
      setForm(colab ? { ...colab } : emptyColab());
      setMotivo('ajuste');
      setObsReaj('');
    }
  }, [open, colab]);

  if (!open) return null;

  const isEdit = !!colab;
  const salAntigo = colab?.sal || 0;
  const salMudou = isEdit && form.sal !== salAntigo;

  const submit = () => {
    if (!form.n || !form.ca || !form.ar) {
      alert('Nome, cargo e área são obrigatórios');
      return;
    }
    saveColab({ ...form, id: form.id || uid() }, salMudou ? motivo : undefined, undefined, salMudou ? obsReaj : undefined);
    onClose();
  };

  const remove = () => {
    if (!colab) return;
    if (confirm(`Excluir ${colab.n}? Isto apagará PDIs vinculados.`)) {
      delColab(colab.id);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? `Editar · ${colab.n}` : 'Novo Colaborador'}
      onClose={onClose}
      width={720}
      footer={
        <>
          {isEdit && <Button kind="dng" onClick={remove}>Excluir</Button>}
          <div style={{ flex: 1 }} />
          <Button kind="o" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit}>{isEdit ? 'Salvar' : 'Criar'}</Button>
        </>
      }
    >
      <div className="fr2">
        <Field label="Nome">
          <input className="fi" value={form.n} onChange={e => setForm(f => ({ ...f, n: e.target.value }))} />
        </Field>
        <Field label="Cargo">
          <select className="fs" value={form.ca} onChange={e => setForm(f => ({ ...f, ca: e.target.value }))}>
            <option value="">—</option>
            {db.cargos.map(k => <option key={k.id} value={k.n}>{k.n} ({k.nivel})</option>)}
          </select>
        </Field>
      </div>
      <div className="fr2">
        <Field label="Área">
          <input className="fi" value={form.ar} onChange={e => setForm(f => ({ ...f, ar: e.target.value }))} />
        </Field>
        <Field label="Vínculo">
          <select className="fs" value={form.vi} onChange={e => setForm(f => ({ ...f, vi: e.target.value }))}>
            {VINCULOS.map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
      </div>
      <div className="fr2">
        <Field label="Salário (R$)">
          <input className="fi" type="number" value={form.sal} onChange={e => setForm(f => ({ ...f, sal: Number(e.target.value) }))} />
        </Field>
        <Field label="Sindicato">
          <select className="fs" value={form.sind || ''} onChange={e => setForm(f => ({ ...f, sind: e.target.value || undefined }))}>
            <option value="">— (auto pela área)</option>
            {db.sindicatos.map(s => <option key={s.id} value={s.id}>{s.sigla}</option>)}
          </select>
        </Field>
      </div>
      <div className="fr2">
        <Field label="Squad">
          <input className="fi" value={form.sq || ''} onChange={e => setForm(f => ({ ...f, sq: e.target.value }))} />
        </Field>
        <Field label="Mentor (nome)">
          <input className="fi" value={form.par || ''} onChange={e => setForm(f => ({ ...f, par: e.target.value }))} />
        </Field>
      </div>
      <div className="fr2">
        <Field label="Trilha (Plano Y)">
          <select className="fs" value={form.trilha || ''} onChange={e => setForm(f => ({ ...f, trilha: e.target.value as TrilhaKey }))}>
            <option value="">—</option>
            <option value="esp1">Especialista I</option>
            <option value="esp2">Especialista II</option>
            <option value="esp3">Arquiteto / Principal</option>
            <option value="gest1">Lead / Coord</option>
            <option value="gest2">Head / Gerente</option>
            <option value="gest3">Diretor / C-Level</option>
          </select>
        </Field>
        <Field label="Papel">
          <select className="fs" value={form.papel || ''} onChange={e => setForm(f => ({ ...f, papel: (e.target.value || undefined) as Papel }))}>
            <option value="">—</option>
            <option value="ceo">CEO</option>
            <option value="rh_admin">RH Admin</option>
          </select>
        </Field>
      </div>
      {salMudou && (
        <div style={{ background: 'var(--am0)', padding: 10, borderRadius: 'var(--rs)', marginTop: 8 }}>
          <div className="fl">Salário mudou — registrar histórico</div>
          <div className="fr2">
            <Field label="Motivo">
              <select className="fs" value={motivo} onChange={e => setMotivo(e.target.value as MotivoReajuste)}>
                {Object.entries(MOTIVOS_REAJUSTE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Observação">
              <input className="fi" value={obsReaj} onChange={e => setObsReaj(e.target.value)} />
            </Field>
          </div>
        </div>
      )}
      <Field label="Observações gerais">
        <textarea className="fta" rows={2} value={form.ov || ''} onChange={e => setForm(f => ({ ...f, ov: e.target.value }))} />
      </Field>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="fg">
      <label className="fl">{label}</label>
      {children}
    </div>
  );
}

function emptyColab(): Colab {
  return { id: '', n: '', ca: '', ar: '', vi: 'CLT', sal: 0 };
}
