'use client';

import { useEffect, useState } from 'react';
import { Card, KPI, PageHead } from '@/components/v2/kpi';
import { DBTools } from '@/components/db-tools';
import { useToast } from '@/components/toast';
import { isAdmin, isCEO } from '@/lib/helpers';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import type { Regras } from '@/lib/types';

export default function ConfigV2() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const updateRegras = usePCS(s => s.updateRegras);
  const toast = useToast();
  const [form, setForm] = useState<Regras>(db.regras);

  useEffect(() => { if (hydrated) setForm(db.regras); }, [hydrated, db.regras]);

  if (!hydrated) return <div className="v2-page">Carregando…</div>;

  const dirty = JSON.stringify(form) !== JSON.stringify(db.regras);
  const ceos = db.colabs.filter(isCEO);
  const admins = db.colabs.filter(c => isAdmin(c) && !isCEO(c));

  return (
    <div className="v2-page">
      <PageHead
        title="Política & Configuração"
        sub="Regras de promoção · permissões · dados do sistema"
        actions={<button className="v2-btn v2-btn-p" disabled={!dirty} onClick={() => { updateRegras(form); toast.push('Política atualizada', 'ok'); }}>{dirty ? 'Salvar alterações' : 'Tudo salvo'}</button>}
      />

      <div className="v2-grid-4">
        <KPI label="Ciclo avaliação" value={`${form.cicloAvalMeses}m`} />
        <KPI label="Mín. meses promoção" value={form.minMesesPromocao} />
        <KPI label="CEOs" value={ceos.length} />
        <KPI label="RH Admins" value={admins.length} />
      </div>

      <Card title="Regras de promoção" sub="Definições que governam ciclos de avaliação e elegibilidade">
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '10px 0' }}>
            <input type="checkbox" checked={form.exigirAvalParaPromocao} onChange={e => setForm(f => ({ ...f, exigirAvalParaPromocao: e.target.checked }))} />
            Exigir avaliação positiva para promoção
          </label>
        </div>
        <div className="fg">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '10px 0' }}>
            <input type="checkbox" checked={form.exigirPDIConcluido} onChange={e => setForm(f => ({ ...f, exigirPDIConcluido: e.target.checked }))} />
            Exigir PDI concluído para promoção
          </label>
        </div>
        <div className="fg">
          <label className="fl">Política descritiva (texto livre)</label>
          <textarea className="fta" rows={5} value={form.obs} onChange={e => setForm(f => ({ ...f, obs: e.target.value }))} />
        </div>
      </Card>

      <div className="v2-grid-2">
        <Card title="Hierarquia operacional" sub="Quem pode promover quem?">
          <ul style={{ paddingLeft: 18, lineHeight: 1.8, fontSize: 13, color: 'var(--g7)' }}>
            <li><strong>CEO</strong> — promove qualquer cargo, define exceções</li>
            <li><strong>RH Admin</strong> — operacionaliza ciclos, valida elegibilidade, registra histórico</li>
            <li><strong>Gestor direto</strong> — propõe promoção, justifica caso de negócio</li>
          </ul>
          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--g5)' }}>
            Este sistema registra a decisão; o workflow político fica na conversa CEO ↔ Gestor ↔ RH.
          </div>
        </Card>

        <Card title="Permissões atuais" sub="Roles definidos">
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--g5)', marginBottom: 6 }}>CEO</div>
            {ceos.length ? ceos.map(c => (
              <div key={c.id} style={{ padding: '8px 10px', background: 'var(--pu0)', borderRadius: 8, fontSize: 13, marginBottom: 4 }}>
                <strong>{c.n}</strong> · {c.ca}
              </div>
            )) : <div style={{ color: 'var(--g4)', fontSize: 12 }}>Nenhum CEO definido</div>}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--g5)', marginBottom: 6 }}>RH Admin</div>
            {admins.length ? admins.map(c => (
              <div key={c.id} style={{ padding: '8px 10px', background: 'var(--bl0)', borderRadius: 8, fontSize: 13, marginBottom: 4 }}>
                <strong>{c.n}</strong> · {c.ca}
              </div>
            )) : <div style={{ color: 'var(--g4)', fontSize: 12 }}>Nenhum RH Admin definido</div>}
          </div>
        </Card>
      </div>

      <Card title="Backup / Dados" sub="Exportar, importar ou resetar dados locais">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <DBTools />
        </div>
        <div style={{ fontSize: 11, color: 'var(--g5)', marginTop: 12 }}>
          Sistema é local-only (localStorage). Export gera JSON; Import substitui o conteúdo atual; Reset volta para os dados de seed.
        </div>
      </Card>
    </div>
  );
}
