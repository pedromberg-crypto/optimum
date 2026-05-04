'use client';

import { useEffect, useState } from 'react';
import { Button, Modal, NivelBadge } from '../ui';
import { usePCS } from '@/store/use-pcs-store';
import { fmt, getProximosCargos, inferCargoTrack, uid } from '@/lib/helpers';
import { MOTIVOS_REAJUSTE, type Colab, type MotivoReajuste, type Papel, type Vinculo, type Vt } from '@/lib/types';

const VINCULOS: Vinculo[] = ['CLT', 'PJ', 'Estágio', 'Contrato de Horas'];
const PLANOS_COMUNS = ['Bradesco Saúde', 'Unimed', 'Amil', 'SulAmérica', 'Hapvida', 'NotreDame', 'Porto Seguro Saúde', 'Outro'];

export function ColabFormV2({ open, colab, onClose }: { open: boolean; colab: Colab | null; onClose: () => void }) {
  const db = usePCS(s => s.db);
  const saveColab = usePCS(s => s.saveColab);
  const delColab = usePCS(s => s.delColab);

  const [form, setForm] = useState<Colab>(emptyColab());
  const [motivo, setMotivo] = useState<MotivoReajuste>('ajuste');
  const [obsReaj, setObsReaj] = useState('');
  const [branchManual, setBranchManual] = useState<'tec' | 'gest' | null>(null);

  useEffect(() => {
    if (open) {
      setForm(colab ? { ...colab } : emptyColab());
      setMotivo('ajuste');
      setObsReaj('');
    }
  }, [open, colab]);

  const cargoSelecionado = db.cargos.find(k => k.n === form.ca);
  const familiaSelecionada = cargoSelecionado ? db.familias.find(f => f.id === cargoSelecionado.fam) : null;
  const trackAtual = cargoSelecionado ? inferCargoTrack(cargoSelecionado) : null;

  const branchEscolhida: 'tec' | 'gest' | null = (() => {
    if (!form.alvoCargo) return null;
    const target = db.cargos.find(k => k.n === form.alvoCargo);
    return target ? inferCargoTrack(target) : null;
  })();

  useEffect(() => { setBranchManual(branchEscolhida); }, [branchEscolhida]);

  if (!open) return null;

  const isEdit = !!colab;
  const salAntigo = colab?.sal || 0;
  const salMudou = isEdit && form.sal !== salAntigo;

  const branch = branchManual;
  const proximosCargosTec = cargoSelecionado ? getProximosCargos(db, form, 'tec') : [];
  const proximosCargosGest = cargoSelecionado ? getProximosCargos(db, form, 'gest') : [];
  const proximosFiltrados = branch === 'tec' ? proximosCargosTec : branch === 'gest' ? proximosCargosGest : [];

  const planoLivre = !!form.psPlano && !PLANOS_COMUNS.includes(form.psPlano);

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
    const pdis = db.pdis.filter(p => p.p === colab.id).length;
    const aval = db.avals.filter(a => a.p === colab.id).length;
    const msg = `Excluir ${colab.n}?\n\nIsto também apagará:\n· ${pdis} PDI(s)\n· ${aval} avaliação(ões)\n· histórico salarial`;
    if (confirm(msg)) {
      delColab(colab.id);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? `Editar · ${colab.n}` : 'Novo Colaborador'}
      onClose={onClose}
      width={760}
      footer={
        <>
          {isEdit && <Button kind="dng" onClick={remove}>Excluir</Button>}
          <div style={{ flex: 1 }} />
          <Button kind="o" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit}>{isEdit ? 'Salvar' : 'Criar'}</Button>
        </>
      }
    >
      <Section title="Identificação">
        <div className="fr2">
          <Field label="Nome">
            <input className="fi" value={form.n} onChange={e => setForm(f => ({ ...f, n: e.target.value }))} />
          </Field>
          <Field label="Papel no sistema">
            <select className="fs" value={form.papel || ''} onChange={e => setForm(f => ({ ...f, papel: (e.target.value || undefined) as Papel }))}>
              <option value="">Colaborador comum</option>
              <option value="ceo">CEO</option>
              <option value="rh_admin">RH Admin</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Cargo & Vínculo">
        <div className="fr2">
          <Field label="Cargo">
            <select className="fs" value={form.ca} onChange={e => {
              const novoCargoNome = e.target.value;
              const cargoNovo = db.cargos.find(k => k.n === novoCargoNome);
              const familia = cargoNovo ? db.familias.find(f => f.id === cargoNovo.fam) : null;
              setForm(f => ({
                ...f,
                ca: novoCargoNome,
                ar: f.ar || familia?.n || '',
              }));
            }}>
              <option value="">—</option>
              {db.cargos.map(k => <option key={k.id} value={k.n}>{k.n} ({k.nivel})</option>)}
            </select>
          </Field>
          <Field label="Área">
            <input className="fi" value={form.ar} onChange={e => setForm(f => ({ ...f, ar: e.target.value }))} placeholder={familiaSelecionada?.n || 'Auto pelo cargo'} />
          </Field>
        </div>
        <div className="fr3">
          <Field label="Vínculo">
            <select className="fs" value={form.vi} onChange={e => setForm(f => ({ ...f, vi: e.target.value as Vinculo }))}>
              {VINCULOS.map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Data início no cargo">
            <input className="fi" type="date" value={form.dataInicioCargo || ''} onChange={e => setForm(f => ({ ...f, dataInicioCargo: e.target.value || undefined }))} />
          </Field>
          <Field label="Squad / Time">
            <input className="fi" value={form.sq || ''} onChange={e => setForm(f => ({ ...f, sq: e.target.value }))} />
          </Field>
        </div>
        <div className="fr2">
          <Field label="Gestor direto">
            <select className="fs" value={form.gestorId || ''} onChange={e => setForm(f => ({ ...f, gestorId: e.target.value || undefined }))}>
              <option value="">— Sem gestor definido</option>
              {db.colabs.filter(c => c.id !== form.id).map(c => (
                <option key={c.id} value={c.id}>{c.n} · {c.ca}</option>
              ))}
            </select>
          </Field>
          <Field label="Mentor / Par (opcional)">
            <input className="fi" value={form.par || ''} onChange={e => setForm(f => ({ ...f, par: e.target.value }))} />
          </Field>
        </div>
      </Section>

      <Section title="Carreira & Plano Y">
        {!cargoSelecionado ? (
          <div style={{ background: '#fafbfd', border: '1px dashed var(--g3)', borderRadius: 10, padding: 14, textAlign: 'center', fontSize: 12, color: 'var(--g5)' }}>
            Selecione o cargo acima para escolher a trilha de carreira
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--pu0)', borderRadius: 10, padding: 12, border: '1px solid var(--pu2)', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--g6)' }}>
                <strong>Família:</strong> {familiaSelecionada?.n} · <strong>Cargo atual:</strong> {cargoSelecionado.n} ({cargoSelecionado.nivel}) · <strong>Trilha do cargo atual:</strong> {trackAtual === 'gest' ? 'Gestão' : 'Técnica'}
              </div>
            </div>

            <div className="fl">Trilha de carreira que pretende seguir</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {(['tec', 'gest'] as const).map(b => {
                const ativo = branch === b;
                const info = b === 'tec'
                  ? { label: 'Trilha Técnica · Especialização', desc: 'Aprofundamento técnico · referência no domínio', col: 'var(--te)', bg: 'var(--te0)', count: proximosCargosTec.length }
                  : { label: 'Trilha de Gestão · Liderança', desc: 'Liderar pessoas e processos · decisão estratégica', col: 'var(--bl)', bg: 'var(--bl0)', count: proximosCargosGest.length };
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBranchManual(b)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14,
                      borderRadius: 10, border: '2px solid', borderColor: ativo ? info.col : '#eef0f5',
                      background: ativo ? info.bg : 'var(--w)', cursor: 'pointer', textAlign: 'left',
                      transition: 'all .12s',
                    }}
                  >
                    <div style={{ width: 4, height: 36, borderRadius: 3, background: info.col, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, color: info.col }}>{info.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--g6)', marginTop: 3 }}>{info.desc}</div>
                      <div style={{ fontSize: 11, color: info.count > 0 ? 'var(--g5)' : 'var(--am)', marginTop: 5, fontWeight: 500 }}>
                        {info.count > 0 ? `${info.count} cargo(s) disponível(is)` : 'Sem cargos cadastrados nesta trilha'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {branch && proximosFiltrados.length > 0 && (
              <>
                <div className="fl">Próximos cargos · clique para definir alvo</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {proximosFiltrados.map((k, i) => {
                    const ativo = form.alvoCargo === k.n;
                    const ehAtual = k.n === cargoSelecionado.n;
                    const col = branch === 'tec' ? 'var(--te)' : 'var(--bl)';
                    const isLast = i === proximosFiltrados.length - 1;
                    return (
                      <div key={k.id} style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (ehAtual) return;
                            setForm(f => ({ ...f, alvoCargo: ativo ? undefined : k.n }));
                          }}
                          disabled={ehAtual}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                            borderRadius: 10, border: '1px solid', borderColor: ativo ? col : ehAtual ? 'var(--g3)' : '#eef0f5',
                            background: ativo ? (branch === 'tec' ? 'var(--te0)' : 'var(--bl0)') : ehAtual ? 'var(--g1)' : 'var(--w)',
                            cursor: ehAtual ? 'default' : 'pointer', textAlign: 'left',
                          }}
                        >
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: ativo ? col : ehAtual ? 'var(--g4)' : '#f4f6fa', color: ativo || ehAtual ? '#fff' : 'var(--g5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: "'Poppins',sans-serif", flexShrink: 0 }}>
                            {ehAtual ? '•' : i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <strong style={{ fontSize: 13, color: ativo ? col : 'var(--g8)' }}>{k.n}</strong>
                              <NivelBadge nivel={k.nivel} />
                              {ehAtual && <span style={{ fontSize: 9, padding: '1px 6px', background: 'var(--g4)', color: '#fff', borderRadius: 8 }}>VOCÊ</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--g5)', marginTop: 2 }}>{fmt(k.piso)} – {fmt(k.teto)}</div>
                          </div>
                          {ativo && <span style={{ fontSize: 10, padding: '2px 8px', background: col, color: '#fff', borderRadius: 8, fontWeight: 600 }}>ALVO</span>}
                        </button>
                        {!isLast && <div style={{ width: 2, height: 6, background: '#eef0f5', marginLeft: 25 }} />}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {branch && proximosFiltrados.length === 0 && (
              <div style={{ background: 'var(--am0)', border: '1px solid var(--am2)', borderRadius: 10, padding: 12, fontSize: 12, color: 'var(--g7)' }}>
                Família <strong>{familiaSelecionada?.n}</strong> ainda não tem cargos cadastrados na trilha de <strong>{branch === 'tec' ? 'especialização técnica' : 'gestão'}</strong>. Pode cadastrar depois em <em>Cargos & Vagas</em> e voltar pra editar este colaborador.
              </div>
            )}
          </>
        )}
        <div style={{ marginTop: 10 }}>
          <Field label="Aspiração de carreira (declarada pelo colab)">
            <input className="fi" value={form.aspiracao || ''} onChange={e => setForm(f => ({ ...f, aspiracao: e.target.value }))} placeholder="Ex: Quero ir pra Tech Lead em 2 anos / Quero migrar pra área de dados…" />
          </Field>
        </div>
      </Section>

      <Section title="Compensação">
        <div className="fr2">
          <Field label="Salário (R$)">
            <input
              className="fi"
              type="text"
              inputMode="decimal"
              value={form.sal === 0 ? '' : form.sal}
              onChange={e => {
                const cleaned = e.target.value.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
                setForm(f => ({ ...f, sal: cleaned ? Number(cleaned) : 0 }));
              }}
              placeholder="Ex: 4500"
            />
          </Field>
          <Field label="Sindicato">
            <select className="fs" value={form.sind || ''} onChange={e => setForm(f => ({ ...f, sind: e.target.value || undefined }))}>
              <option value="">— Auto pela área</option>
              {db.sindicatos.map(s => <option key={s.id} value={s.id}>{s.sigla}</option>)}
            </select>
          </Field>
        </div>
        <div className="fr3">
          <Field label="Vale Refeição / Alimentação (R$)">
            <input
              className="fi"
              type="text"
              inputMode="decimal"
              value={!form.vr ? '' : form.vr}
              onChange={e => {
                const cleaned = e.target.value.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
                setForm(f => ({ ...f, vr: cleaned ? Number(cleaned) : undefined }));
              }}
              placeholder="Ex: 750"
            />
          </Field>
          <Field label="Vale Transporte">
            <select className="fs" value={form.vt || ''} onChange={e => setForm(f => ({ ...f, vt: (e.target.value || undefined) as Vt }))}>
              <option value="">—</option>
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </Field>
          <Field label="Auxílio Home Office (R$)">
            <input
              className="fi"
              type="text"
              inputMode="decimal"
              value={!form.ho ? '' : form.ho}
              onChange={e => {
                const cleaned = e.target.value.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
                setForm(f => ({ ...f, ho: cleaned ? Number(cleaned) : undefined }));
              }}
              placeholder="Ex: 150"
            />
          </Field>
        </div>
        <div className="fr2">
          <Field label="Plano de saúde — operadora">
            <select
              className="fs"
              value={planoLivre ? 'Outro' : (form.psPlano || '')}
              onChange={e => {
                const v = e.target.value;
                if (v === '') setForm(f => ({ ...f, psPlano: undefined, psDependentes: undefined }));
                else if (v === 'Outro') setForm(f => ({ ...f, psPlano: ' ' }));
                else setForm(f => ({ ...f, psPlano: v }));
              }}
            >
              <option value="">— Sem plano</option>
              {PLANOS_COMUNS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Dependentes (qtd)">
            <input
              className="fi"
              type="number"
              min={0}
              value={form.psDependentes ?? 0}
              onChange={e => setForm(f => ({ ...f, psDependentes: Number(e.target.value) || undefined }))}
              disabled={!form.psPlano}
              placeholder={form.psPlano ? 'Ex: 2' : 'Selecione plano primeiro'}
            />
          </Field>
        </div>
        {planoLivre && (
          <Field label="Nome do plano (custom)">
            <input className="fi" value={(form.psPlano || '').trim()} onChange={e => setForm(f => ({ ...f, psPlano: e.target.value || ' ' }))} placeholder="Ex: Operadora regional X" />
          </Field>
        )}
        <Field label="Estado / Localização">
          <input className="fi" value={form.es || ''} onChange={e => setForm(f => ({ ...f, es: e.target.value }))} placeholder="Ex: Minas Gerais" />
        </Field>
        {salMudou && (
          <div style={{ background: 'var(--am0)', padding: 12, borderRadius: 'var(--rs)', marginTop: 8, border: '1px solid var(--am2)' }}>
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
      </Section>

      <Section title="Currículo & Formação">
        <Field label="Currículo (PDF, DOC, DOCX, TXT — máx 2MB)">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {form.cvNome && (
              <div style={{ flex: 1, padding: '8px 12px', background: 'var(--gr0)', border: '1px solid var(--gr2)', borderRadius: 8, fontSize: 12, color: 'var(--gr)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gr)' }}>CV</span>
                <strong style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.cvNome}</strong>
                <button type="button" onClick={() => setForm(f => ({ ...f, cvNome: undefined, cvData: undefined, cvTipo: undefined }))} style={{ background: 'none', border: 'none', color: 'var(--re)', cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) { alert('Arquivo > 2MB. Reduza ou use link externo.'); e.target.value = ''; return; }
                const reader = new FileReader();
                reader.onload = () => {
                  setForm(f => ({ ...f, cvNome: file.name, cvData: String(reader.result || ''), cvTipo: file.type }));
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
              style={{ flex: 1, fontSize: 12 }}
            />
          </div>
        </Field>
        <Field label="Formação acadêmica">
          <textarea className="fta" rows={2} value={form.formacao || ''} onChange={e => setForm(f => ({ ...f, formacao: e.target.value }))} placeholder="Ex: Graduação em Psicologia (UFMG, 2018) · Pós em Gestão de Pessoas (FGV, 2022)" />
        </Field>
        <Field label="Cursos & certificações">
          <textarea className="fta" rows={2} value={form.cursos || ''} onChange={e => setForm(f => ({ ...f, cursos: e.target.value }))} placeholder="Um por linha · ex: ICP-ACC (2023), Power BI Avançado (2024)…" />
        </Field>
        <Field label="Competências atuais (que já domina)">
          <textarea className="fta" rows={2} value={form.competenciasAtuais || ''} onChange={e => setForm(f => ({ ...f, competenciasAtuais: e.target.value }))} placeholder="Ex: Recrutamento e seleção, OKR, Business Partnering, Excel avançado…" />
        </Field>
      </Section>

      <Section title="Observações">
        <Field label="Notas livres">
          <textarea className="fta" rows={2} value={form.ov || ''} onChange={e => setForm(f => ({ ...f, ov: e.target.value }))} />
        </Field>
      </Section>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--pu)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--g1)' }}>{title}</div>
      {children}
    </div>
  );
}

function emptyColab(): Colab {
  return { id: '', n: '', ca: '', ar: '', vi: 'CLT', sal: 0 };
}
