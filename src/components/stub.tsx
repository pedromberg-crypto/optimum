'use client';

import { Card, Page, Topbar } from './ui';

export function Stub({ title, sub }: { title: string; sub?: string }) {
  return (
    <>
      <Topbar title={title} />
      <Page>
        <Card title="Em construção" sub={sub || 'Esta página será portada na próxima iteração'}>
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--g5)' }}>
            <div style={{ fontSize: 32 }}>🛠</div>
            <div style={{ marginTop: 8 }}>Funcionalidade migrada do v5 HTML em breve</div>
          </div>
        </Card>
      </Page>
    </>
  );
}
