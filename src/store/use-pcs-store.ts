'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Aval, Cargo, Colab, DB, Familia, MotivoReajuste, PDI, Regras, SalHist, Sindicato, Vaga } from '@/lib/types';
import { buildSeedWithSalHist, seedDB } from '@/lib/seed';
import { uid } from '@/lib/helpers';

interface AddSalHistInput {
  p: string;
  dt?: string;
  valor: number;
  valorAnterior?: number | null;
  motivo: MotivoReajuste;
  perc?: number | null;
  sindCCT?: string;
  obs?: string;
}

interface PCSStore {
  db: DB;
  ready: boolean;

  setDB: (next: DB) => void;
  resetSeed: () => void;

  saveColab: (c: Colab, motivoIfChange?: MotivoReajuste, sindCCT?: string, obsReaj?: string) => Colab;
  delColab: (id: string) => void;

  savePDI: (p: PDI) => PDI;
  delPDI: (id: string) => void;

  addSalHist: (input: AddSalHistInput) => SalHist | null;

  saveSindicato: (s: Sindicato) => void;
  delSindicato: (id: string) => void;
  applyCCT: (sindId: string, ano: number, perc: number, dataAplicacao: string, obs: string, aplicarEmColabs: boolean) => number;

  saveCargo: (c: Cargo) => Cargo;
  delCargo: (id: string) => void;
  saveFamilia: (f: Familia) => Familia;
  delFamilia: (id: string) => void;
  saveVaga: (v: Vaga) => Vaga;
  delVaga: (id: string) => void;
  saveAval: (a: Aval) => Aval;
  delAval: (id: string) => void;
  updateRegras: (r: Regras) => void;

  exportJSON: () => string;
  importJSON: (json: string) => boolean;
}

const initialDB = buildSeedWithSalHist(seedDB);

export const usePCS = create<PCSStore>()(
  persist(
    (set, get) => ({
      db: initialDB,
      ready: false,

      setDB: (next) => set({ db: next }),
      resetSeed: () => set({ db: buildSeedWithSalHist(seedDB) }),

      saveColab: (c, motivoIfChange, sindCCT, obsReaj) => {
        const isNew = !get().db.colabs.find(x => x.id === c.id);
        const id = c.id || uid();
        const colab: Colab = { ...c, id };
        let salHistAdd: SalHist | null = null;
        if (isNew) {
          salHistAdd = {
            id: 'sh' + Date.now(),
            p: id,
            dt: new Date().toISOString().slice(0, 10),
            valor: colab.sal,
            valorAnterior: null,
            motivo: 'contratacao',
            perc: null,
            sindCCT: '',
            obs: 'Salário inicial de contratação',
          };
        } else {
          const antigo = get().db.colabs.find(x => x.id === id);
          const salAntigo = antigo?.sal || 0;
          if (salAntigo !== colab.sal) {
            const motivo = motivoIfChange || 'ajuste';
            const perc = salAntigo ? ((colab.sal - salAntigo) / salAntigo) * 100 : null;
            salHistAdd = {
              id: 'sh' + Date.now(),
              p: id,
              dt: new Date().toISOString().slice(0, 10),
              valor: colab.sal,
              valorAnterior: salAntigo,
              motivo,
              perc,
              sindCCT: sindCCT || '',
              obs: obsReaj || '',
            };
          }
        }
        set(s => {
          const colabs = isNew ? [...s.db.colabs, colab] : s.db.colabs.map(x => x.id === id ? colab : x);
          const salHist = salHistAdd ? [...s.db.salHist, salHistAdd] : s.db.salHist;
          return { db: { ...s.db, colabs, salHist } };
        });
        return colab;
      },

      delColab: (id) => set(s => ({
        db: {
          ...s.db,
          colabs: s.db.colabs.filter(c => c.id !== id),
          pdis: s.db.pdis.filter(p => p.p !== id),
        },
      })),

      savePDI: (p) => {
        const isNew = !p.id || !get().db.pdis.find(x => x.id === p.id);
        const id = p.id || uid();
        const pdi: PDI = { ...p, id };
        set(s => ({
          db: {
            ...s.db,
            pdis: isNew ? [...s.db.pdis, pdi] : s.db.pdis.map(x => x.id === id ? pdi : x),
          },
        }));
        return pdi;
      },

      delPDI: (id) => set(s => ({
        db: { ...s.db, pdis: s.db.pdis.filter(p => p.id !== id) },
      })),

      addSalHist: (input) => {
        if (!input.p || !input.motivo || input.valor == null) return null;
        const reg: SalHist = {
          id: 'sh' + Date.now() + Math.random().toString(36).slice(2, 6),
          p: input.p,
          dt: input.dt || new Date().toISOString().slice(0, 10),
          valor: input.valor,
          valorAnterior: input.valorAnterior ?? null,
          motivo: input.motivo,
          perc: input.perc ?? null,
          sindCCT: input.sindCCT || '',
          obs: input.obs || '',
        };
        set(s => ({ db: { ...s.db, salHist: [...s.db.salHist, reg] } }));
        return reg;
      },

      saveSindicato: (s) => set(state => ({
        db: {
          ...state.db,
          sindicatos: state.db.sindicatos.find(x => x.id === s.id)
            ? state.db.sindicatos.map(x => x.id === s.id ? s : x)
            : [...state.db.sindicatos, s],
        },
      })),

      delSindicato: (id) => set(s => ({ db: { ...s.db, sindicatos: s.db.sindicatos.filter(x => x.id !== id) } })),

      saveCargo: (c) => {
        const id = c.id || uid();
        const cargo: Cargo = { ...c, id };
        set(s => {
          const exists = s.db.cargos.find(x => x.id === id);
          return { db: { ...s.db, cargos: exists ? s.db.cargos.map(x => x.id === id ? cargo : x) : [...s.db.cargos, cargo] } };
        });
        return cargo;
      },
      delCargo: (id) => set(s => ({ db: { ...s.db, cargos: s.db.cargos.filter(x => x.id !== id) } })),

      saveFamilia: (f) => {
        const id = f.id || uid();
        const fam: Familia = { ...f, id };
        set(s => {
          const exists = s.db.familias.find(x => x.id === id);
          return { db: { ...s.db, familias: exists ? s.db.familias.map(x => x.id === id ? fam : x) : [...s.db.familias, fam] } };
        });
        return fam;
      },
      delFamilia: (id) => set(s => ({ db: { ...s.db, familias: s.db.familias.filter(x => x.id !== id) } })),

      saveVaga: (v) => {
        const id = v.id || uid();
        const vaga: Vaga = { ...v, id };
        set(s => {
          const exists = s.db.vagas.find(x => x.id === id);
          return { db: { ...s.db, vagas: exists ? s.db.vagas.map(x => x.id === id ? vaga : x) : [...s.db.vagas, vaga] } };
        });
        return vaga;
      },
      delVaga: (id) => set(s => ({ db: { ...s.db, vagas: s.db.vagas.filter(x => x.id !== id) } })),

      saveAval: (a) => {
        const id = a.id || uid();
        const aval: Aval = { ...a, id };
        set(s => {
          const exists = s.db.avals.find(x => x.id === id);
          return { db: { ...s.db, avals: exists ? s.db.avals.map(x => x.id === id ? aval : x) : [...s.db.avals, aval] } };
        });
        return aval;
      },
      delAval: (id) => set(s => ({ db: { ...s.db, avals: s.db.avals.filter(x => x.id !== id) } })),

      updateRegras: (r) => set(s => ({ db: { ...s.db, regras: r } })),

      exportJSON: () => JSON.stringify(get().db, null, 2),
      importJSON: (json) => {
        try {
          const parsed = JSON.parse(json) as Partial<DB>;
          const merged: DB = { ...initialDB, ...parsed } as DB;
          set({ db: merged });
          return true;
        } catch {
          return false;
        }
      },

      applyCCT: (sindId, ano, perc, dataAplicacao, obs, aplicarEmColabs) => {
        const state = get();
        const sind = state.db.sindicatos.find(s => s.id === sindId);
        if (!sind) return 0;
        const novoHist = sind.historico.find(h => h.ano === ano)
          ? sind.historico.map(h => h.ano === ano ? { ...h, perc, dataAplicacao, obs } : h)
          : [...sind.historico, { ano, perc, dataAplicacao, obs }];
        const sindAtualizado = { ...sind, historico: novoHist };
        let qtd = 0;
        let novosColabs = state.db.colabs;
        const novosSalHist: SalHist[] = [...state.db.salHist];
        if (aplicarEmColabs) {
          novosColabs = state.db.colabs.map(c => {
            const sindDoColab = c.sind ? sindId === c.sind : (sind.abrangeAreas || []).includes(c.ar);
            if (sindDoColab) {
              const novoSal = Math.round(c.sal * (1 + perc / 100));
              novosSalHist.push({
                id: 'sh' + Date.now() + Math.random().toString(36).slice(2, 6),
                p: c.id,
                dt: dataAplicacao,
                valor: novoSal,
                valorAnterior: c.sal,
                motivo: 'cct',
                perc,
                sindCCT: sindId,
                obs: `CCT ${ano} ${sind.sigla} ${perc}%`,
              });
              qtd++;
              return { ...c, sal: novoSal };
            }
            return c;
          });
        }
        set({
          db: {
            ...state.db,
            sindicatos: state.db.sindicatos.map(s => s.id === sindId ? sindAtualizado : s),
            colabs: novosColabs,
            salHist: novosSalHist,
          },
        });
        return qtd;
      },
    }),
    {
      name: 'optimum-pcs-v6',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: unknown, version: number) => {
        const p = persisted as { db?: Partial<DB> } | null;
        if (!p) return p as never;
        if (version < 2 && p.db && !(p.db as DB).regras) {
          (p.db as DB).regras = initialDB.regras;
        }
        if (version < 3 && p.db) {
          const sinds = (p.db as DB).sindicatos || [];
          for (const s of sinds) {
            if (s.sigla === 'SINDPD-MG') {
              s.sigla = 'SINDADOS';
              s.nome = 'SINDADOS (Sind. dos Profissionais de Processamento de Dados)';
            }
            if (s.sigla === 'SINDICOM') {
              s.sigla = 'SINDIFOR';
              s.nome = 'SINDIFOR (Sind. das Empresas de Informática)';
            }
          }
        }
        return p as never;
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.ready = true;
      },
    },
  ),
);
