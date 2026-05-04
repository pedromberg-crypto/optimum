'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, FaixaBar, Modal, NivelBadge, Page, Topbar } from '@/components/ui';
import { useToast } from '@/components/toast';
import { fmt, getMktStatus } from '@/lib/helpers';
import { usePCS } from '@/store/use-pcs-store';
import { useHydratedPCS } from '@/store/use-pcs-hydrated';
import type { Cargo } from '@/lib/types';

export default function SalariosPage() {
  const hydrated = useHydratedPCS();
  const db = usePCS(s => s.db);
  const saveCargo = usePCS(s => s.saveCargo);
  const toast = useToast();
  const [editing, setEditing] = useState<Cargo | null>(null);

  if (!hydrated) return <div className="ct">Carregando…</div>;

  return (
    <>
      <Topbar title="Matriz Salarial" />
      <Page>
        {db.familias.map(f => {
          const cargos = db.cargos.filter(k => k.fam === f.id).sort((a, b) => a.nivel.localeCompare(b.nivel));
          if (!cargos.length) return null;
          return (
            <Card key={f.id} className="mb" title={`${f.ic} ${f.n}`} sub={f.desc}>
              <div className="bd-tbl">
                <table className="tbl">
                  <thead><tr><th>Cargo</th><th>Nível</th><th>Piso</th><th>Alvo</th><th>Teto</th><th>Ocup.</th><th>Distribuição</th><th></th></tr></thead>
                  <tbody>
                    {cargos.map(k => {
                      const ocupantes = db.colabs.filter(c => c.ca === k.n);
                      const stats = ocupantes.reduce((acc, c) => {
                        const st = getMktStatus(db, c);
                        if (st) acc[st]++;
                        return acc;
                      }, { abaixo: 0, entrada: 0, plena: 0, acima: 0 });
                      return (
                        <tr key={k.id}>
                          <td><strong>{k.n}</strong></td>
                          <td><NivelBadge nivel={k.nivel} /></td>
                          <td>{fmt(k.piso)}</td>
                          <td>{fmt(k.alvo)}</td>
                          <td>{fmt(k.teto)}</td>
                          <td>{ocupantes.length}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {stats.abaixo > 0 && <Badge kind="re">{stats.abaixo} ↓</Badge>}
                              {stats.entrada > 0 && <Badge kind="am">{stats.entrada} →</Badge>}
                              {stats.plena > 0 && <Badge kind="gr">{stats.plena} ●</Badge>}
                              {stats.acima > 0 && <Badge kind="pu">{stats.acima} ↑</Badge>}
                              {!ocupantes.length && <span style={{ color: 'var(--g4)' }}>—</span>}
                            </div>
                          </td>
                          <td><Button size="sm" kind="o" onClick={() => setEditing(k)}>Editar faixa</Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}

        <Card title="Posicionamento individual" sub="Salário atual vs faixa do cargo">
          {db.colabs.filter(c => c.vi === 'CLT').map(c => {
            const k = db.cargos.find(x => x.n === c.ca);
            if (!k) return null;
            return (
              <div key={c.id} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--g1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  <span>{c.n} <span style={{ color: 'var(--g5)', fontWeight: 400 }}>· {c.ca}</span></span>
                  <span>{fmt(c.sal)}</span>
                </div>
                <FaixaBar piso={k.piso} alvo={k.alvo} teto={k.teto} atual={c.sal} />
              </div>
            );
          })}
        </Card>
      </Page>

      <FaixaModal cargo={editing} onClose={() => setEditing(null)} onSave={(k) => { saveCargo(k); toast.push('Faixa atualizada', 'ok'); setEditing(null); }} />
    </>
  );
}

function FaixaModal({ cargo, onClose, onSave }: { cargo: Cargo | null; onClose: () => void; onSave: (k: Cargo) => void }) {
  const [piso, setPiso] = useState(0);
  const [alvo, setAlvo] = useState(0);
  const [teto, setTeto] = useState(0);

  useEffect(() => { if (cargo) { setPiso(cargo.piso); setAlvo(cargo.alvo); setTeto(cargo.teto); } }, [cargo]);

  if (!cargo) return null;
  return (
    <Modal open={!!cargo} title={`Editar faixa · ${cargo.n}`} onClose={onClose} width={500}
      footer={<><div style={{ flex: 1 }} /><Button kind="o" onClick={onClose}>Cancelar</Button><Button onClick={() => {
        if (piso > alvo || alvo > teto) { alert('Piso ≤ Alvo ≤ Teto'); return; }
        onSave({ ...cargo, piso, alvo, teto });
      }}>Salvar</Button></>}
    >
      <div className="fr3">
        <div className="fg"><label className="fl">Piso</label><input className="fi" type="number" value={piso} onChange={e => setPiso(Number(e.target.value))} /></div>
        <div className="fg"><label className="fl">Alvo</label><input className="fi" type="number" value={alvo} onChange={e => setAlvo(Number(e.target.value))} /></div>
        <div className="fg"><label className="fl">Teto</label><input className="fi" type="number" value={teto} onChange={e => setTeto(Number(e.target.value))} /></div>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--g5)' }}>
        Amplitude: {teto - piso > 0 ? `${Math.round(((teto - piso) / piso) * 100)}%` : '—'}
      </div>
    </Modal>
  );
}
