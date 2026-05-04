'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, KPI, PageHead } from '@/components/v2/kpi';
import { ColabFormV2 } from '@/components/v2/colab-form';
import { getMktStatus, isColabMasked, maskColabFmt } from '@/lib/helpers';
import { EyeToggle } from '@/components/v2/eye-toggle';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import { useUI } from '@/store/use-ui';
import type { Colab, PDIStatus } from '@/lib/types';

export default function ColaboradoresV2() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const router = useRouter();
  const oculto = useUI(s => s.oculto);
  const revelados = useUI(s => s.revelados);
  const [editing, setEditing] = useState<Colab | null>(null);
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroVi, setFiltroVi] = useState('');
  const [filtroPdi, setFiltroPdi] = useState<'' | PDIStatus | 'sem'>('');
  const [filtroGestor, setFiltroGestor] = useState('');

  if (!hydrated) return <div className="v2-page">Carregando…</div>;

  const lista = db.colabs.filter(c => {
    if (busca && !c.n.toLowerCase().includes(busca.toLowerCase()) && !c.ca.toLowerCase().includes(busca.toLowerCase()) && !c.ar.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroVi && c.vi !== filtroVi) return false;
    if (filtroGestor && c.gestorId !== filtroGestor) return false;
    if (filtroPdi) {
      const pdis = db.pdis.filter(p => p.p === c.id);
      if (filtroPdi === 'sem' && pdis.length > 0) return false;
      if (filtroPdi !== 'sem' && !pdis.some(p => p.st === filtroPdi)) return false;
    }
    return true;
  });

  const gestores = Array.from(new Set(db.colabs.map(c => c.gestorId).filter(Boolean) as string[]))
    .map(id => db.colabs.find(c => c.id === id)).filter(Boolean) as typeof db.colabs;

  const total = db.colabs.length;
  const ativos = db.colabs.filter(c => c.papel !== 'ceo').length;
  const ceos = db.colabs.filter(c => c.papel === 'ceo').length;
  const admins = db.colabs.filter(c => c.papel === 'rh_admin').length;

  return (
    <div className="v2-page">
      <PageHead
        title="Colaboradores"
        sub="Hub central · cadastro, perfil 360°, PDI e avaliações"
        actions={<button className="v2-btn v2-btn-p" onClick={() => { setEditing(null); setOpen(true); }}>+ Novo colaborador</button>}
      />

      <div className="v2-grid-4">
        <KPI label="Total" value={total} hint={`${ativos} time + ${ceos + admins} sistema`} />
        <KPI label="CLT" value={db.colabs.filter(c => c.vi === 'CLT').length} />
        <KPI label="Estagiários" value={db.colabs.filter(c => c.vi === 'Estágio').length} />
        <KPI label="PJ / Outros" value={db.colabs.filter(c => c.vi !== 'CLT' && c.vi !== 'Estágio').length} />
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            className="fi"
            placeholder="Buscar por nome, cargo ou área…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <select className="fs" value={filtroVi} onChange={e => setFiltroVi(e.target.value)} style={{ width: 160 }}>
            <option value="">Todos os vínculos</option>
            <option value="CLT">CLT</option>
            <option value="PJ">PJ</option>
            <option value="Estágio">Estágio</option>
            <option value="Contrato de Horas">Contrato de Horas</option>
          </select>
          <select className="fs" value={filtroPdi} onChange={e => setFiltroPdi(e.target.value as PDIStatus | 'sem' | '')} style={{ width: 180 }}>
            <option value="">PDI · todos</option>
            <option value="pendente">Com PDI pendente</option>
            <option value="em-andamento">PDI em andamento</option>
            <option value="concluido">PDI concluído</option>
            <option value="sem">Sem PDI</option>
          </select>
          {gestores.length > 0 && (
            <select className="fs" value={filtroGestor} onChange={e => setFiltroGestor(e.target.value)} style={{ width: 220 }}>
              <option value="">Gestor · todos</option>
              {gestores.map(g => <option key={g.id} value={g.id}>Time de {g.n}</option>)}
            </select>
          )}
        </div>

        <table className="v2-tbl">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Área</th>
              <th>Vínculo</th>
              <th>Salário</th>
              <th>Posição</th>
              <th>PDI</th>
              <th>Trilha</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(c => {
              const st = getMktStatus(db, c);
              const pdiTotal = db.pdis.filter(p => p.p === c.id).length;
              const pdiAtivos = db.pdis.filter(p => p.p === c.id && p.st !== 'concluido').length;
              return (
                <tr key={c.id}>
                  <td onClick={() => router.push(`/v2/colab/${c.id}`)}>
                    <strong>{c.n}</strong>
                    {c.papel === 'ceo' && <span className="v2-chip v2-chip-pu" style={{ marginLeft: 6, fontSize: 9 }}>CEO</span>}
                    {c.papel === 'rh_admin' && <span className="v2-chip v2-chip-bl" style={{ marginLeft: 6, fontSize: 9 }}>RH</span>}
                  </td>
                  <td onClick={() => router.push(`/v2/colab/${c.id}`)}>{c.ca}</td>
                  <td onClick={() => router.push(`/v2/colab/${c.id}`)}>{c.ar}</td>
                  <td onClick={() => router.push(`/v2/colab/${c.id}`)}><span className="v2-chip">{c.vi}</span></td>
                  <td onClick={() => router.push(`/v2/colab/${c.id}`)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <strong>{maskColabFmt(c.sal, c.id, oculto, revelados)}</strong>
                      <EyeToggle colabId={c.id} />
                    </span>
                  </td>
                  <td onClick={() => router.push(`/v2/colab/${c.id}`)}>
                    {isColabMasked(c.id, oculto, revelados) ? <span className="v2-chip">•••</span> : !st ? '—' : st === 'plena' ? <span className="v2-chip v2-chip-gr">Plena</span> : st === 'entrada' ? <span className="v2-chip v2-chip-am">Entrada</span> : st === 'abaixo' ? <span className="v2-chip v2-chip-re">Abaixo</span> : <span className="v2-chip v2-chip-pu">Acima</span>}
                  </td>
                  <td onClick={() => router.push(`/v2/colab/${c.id}`)}>
                    {pdiTotal === 0 ? <span style={{ color: 'var(--g4)' }}>—</span> : <span className="v2-chip v2-chip-te">{pdiAtivos}/{pdiTotal}</span>}
                  </td>
                  <td onClick={() => router.push(`/v2/colab/${c.id}`)}>
                    {c.trilha ? <span className="v2-chip v2-chip-pu">{c.trilha}</span> : <span style={{ color: 'var(--g4)' }}>—</span>}
                  </td>
                  <td>
                    <button className="v2-btn v2-btn-o v2-btn-sm" onClick={(e) => { e.stopPropagation(); setEditing(c); setOpen(true); }}>Editar</button>
                  </td>
                </tr>
              );
            })}
            {!lista.length && (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--g4)', padding: 24 }}>Nenhum colaborador encontrado</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <ColabFormV2 open={open} colab={editing} onClose={() => setOpen(false)} />
    </div>
  );
}
