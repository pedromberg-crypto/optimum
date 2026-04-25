'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Page, Topbar } from '@/components/ui';
import { useToast } from '@/components/toast';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import type { Regras } from '@/lib/types';

export default function PoliticaPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const updateRegras = usePCS(s => s.updateRegras);
  const toast = useToast();
  const [form, setForm] = useState<Regras>(db.regras);

  useEffect(() => { if (hydrated) setForm(db.regras); }, [hydrated, db.regras]);

  if (!hydrated) return <div className="ct">Carregando…</div>;

  const dirty = JSON.stringify(form) !== JSON.stringify(db.regras);

  return (
    <>
      <Topbar
        title="Política de Promoção"
        right={<Button disabled={!dirty} onClick={() => { updateRegras(form); toast.push('Política atualizada', 'ok'); }}>Salvar</Button>}
      />
      <Page>
        <Card className="mb" title="Regras configuráveis" sub="Definições que governam ciclos de avaliação e elegibilidade para promoção">
          <div className="fr2">
            <div className="fg">
              <label className="fl">Ciclo de avaliação (meses)</label>
              <input className="fi" type="number" min={1} value={form.cicloAvalMeses} onChange={e => setForm(f => ({ ...f, cicloAvalMeses: Number(e.target.value) }))} />
            </div>
            <div className="fg">
              <label className="fl">Mínimo de meses no cargo p/ promoção</label>
              <input className="fi" type="number" min={0} value={form.minMesesPromocao} onChange={e => setForm(f => ({ ...f, minMesesPromocao: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="fg">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={form.exigirAvalParaPromocao} onChange={e => setForm(f => ({ ...f, exigirAvalParaPromocao: e.target.checked }))} />
              Exigir avaliação positiva para promoção
            </label>
          </div>
          <div className="fg">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={form.exigirPDIConcluido} onChange={e => setForm(f => ({ ...f, exigirPDIConcluido: e.target.checked }))} />
              Exigir PDI concluído para promoção
            </label>
          </div>
          <div className="fg">
            <label className="fl">Política descritiva (texto livre)</label>
            <textarea className="fta" rows={5} value={form.obs} onChange={e => setForm(f => ({ ...f, obs: e.target.value }))} />
          </div>
        </Card>

        <Card title="Quem pode promover quem?" sub="Hierarquia operacional">
          <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: 13 }}>
            <li><strong>CEO</strong> — promove qualquer cargo, define exceções</li>
            <li><strong>RH Admin</strong> — operacionaliza ciclos, valida elegibilidade, registra histórico</li>
            <li><strong>Gestor direto</strong> — propõe promoção, justifica caso de negócio</li>
          </ul>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--g5)' }}>
            Este sistema registra a decisão; o workflow político fica na conversa CEO ↔ Gestor ↔ RH.
          </div>
        </Card>
      </Page>
    </>
  );
}
