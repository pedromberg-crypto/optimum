'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Badge, Button, Card, MktBadge, NivelBadge, Page, Topbar } from '@/components/ui';
import { ColabModal } from '@/components/v1/colab-modal';
import { fmt, getMktStatus } from '@/lib/helpers';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import type { Colab } from '@/lib/types';

export default function TimePage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const router = useRouter();
  const [editing, setEditing] = useState<Colab | null>(null);
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState('');

  if (!hydrated) return <div className="ct">Carregando…</div>;

  const lista = db.colabs.filter(c => !filtro || c.n.toLowerCase().includes(filtro.toLowerCase()) || c.ca.toLowerCase().includes(filtro.toLowerCase()) || c.ar.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <>
      <Topbar
        title="Time & Perfis"
        right={<Button onClick={() => { setEditing(null); setOpen(true); }}>+ Novo Colaborador</Button>}
      />
      <Page>
        <Card title={`${lista.length} colaborador(es)`} sub="Clique para abrir Ficha 360°">
          <input className="fi mb" placeholder="Buscar por nome, cargo ou área…" value={filtro} onChange={e => setFiltro(e.target.value)} style={{ marginBottom: 12 }} />
          <div className="bd-tbl">
            <table className="tbl">
              <thead><tr><th>Nome</th><th>Cargo</th><th>Área</th><th>Vínculo</th><th>Salário</th><th>Mercado</th><th>Ações</th></tr></thead>
              <tbody>
                {lista.map((c, i) => {
                  const st = getMktStatus(db, c);
                  const nivel = db.cargos.find(k => k.n === c.ca)?.nivel || null;
                  return (
                    <tr key={c.id}>
                      <td onClick={() => router.push(`/v1/colab/${c.id}`)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={c.n} idx={i} size={28} />
                          <span>{c.n}</span>
                          {c.papel === 'ceo' && <Badge kind="pu" style={{ fontSize: 9 }}>CEO</Badge>}
                          {c.papel === 'rh_admin' && <Badge kind="bl" style={{ fontSize: 9 }}>RH</Badge>}
                        </div>
                      </td>
                      <td>{c.ca} {nivel && <NivelBadge nivel={nivel} />}</td>
                      <td>{c.ar}</td>
                      <td><span className="chip">{c.vi}</span></td>
                      <td><strong>{fmt(c.sal)}</strong></td>
                      <td><MktBadge status={st} /></td>
                      <td>
                        <Button size="sm" kind="o" onClick={() => { setEditing(c); setOpen(true); }}>Editar</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </Page>
      <ColabModal open={open} colab={editing} onClose={() => setOpen(false)} />
    </>
  );
}
