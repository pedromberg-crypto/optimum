'use client';

import { Avatar, Badge, Card, Page, Topbar } from '@/components/ui';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';

export default function SegurancaPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  if (!hydrated) return <div className="ct">Carregando…</div>;

  const ceos = db.colabs.filter(c => c.papel === 'ceo');
  const admins = db.colabs.filter(c => c.papel === 'rh_admin');

  return (
    <>
      <Topbar title="Segurança & Permissões" />
      <Page>
        <Card className="mb" title="Modelo" sub="Role-based — CEO + RH Admin com acesso completo">
          <div style={{ fontSize: 13, color: 'var(--g5)' }}>
            Por enquanto sistema é <strong>local-only</strong> (localStorage). Sem autenticação. Roles servem para diferenciar dados sensíveis na Ficha 360°.
          </div>
        </Card>
        <div className="g2c">
          <Card title="CEO" sub="Acesso total + visibilidade estratégica">
            {ceos.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6 }}>
                <Avatar name={c.n} idx={i} size={28} />
                <span><strong>{c.n}</strong> · {c.ca}</span>
                <Badge kind="pu" style={{ marginLeft: 'auto' }}>CEO</Badge>
              </div>
            ))}
            {!ceos.length && <div style={{ color: 'var(--g4)' }}>Nenhum CEO definido</div>}
          </Card>
          <Card title="RH Admin" sub="Gestão de pessoas e folha">
            {admins.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6 }}>
                <Avatar name={c.n} idx={i} size={28} />
                <span><strong>{c.n}</strong> · {c.ca}</span>
                <Badge kind="bl" style={{ marginLeft: 'auto' }}>RH</Badge>
              </div>
            ))}
            {!admins.length && <div style={{ color: 'var(--g4)' }}>Nenhum RH Admin definido</div>}
          </Card>
        </div>
      </Page>
    </>
  );
}
