import type { Cargo, Colab, DB, MotivoReajuste, SalHist, Sindicato } from './types';
import { AVC } from './types';

export const uid = () => 'x' + Math.random().toString(36).slice(2, 11);
export const ini = (n: string) => n.split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase();
export const ac = (i: number) => AVC[i % AVC.length];
export const fmt = (n: number | null | undefined) => n ? 'R$ ' + Number(n).toLocaleString('pt-BR') : '—';
export const maskFmt = (n: number | null | undefined, oculto: boolean) => oculto ? 'R$ •••••' : fmt(n);
export const maskTxt = (txt: string, oculto: boolean) => oculto ? '•••' : txt;
export const maskColabFmt = (n: number | null | undefined, colabId: string, oculto: boolean, revelados: string[]) =>
  (oculto && !revelados.includes(colabId)) ? 'R$ •••••' : fmt(n);
export const maskColabTxt = (txt: string, colabId: string, oculto: boolean, revelados: string[]) =>
  (oculto && !revelados.includes(colabId)) ? '•••' : txt;
export const isColabMasked = (colabId: string, oculto: boolean, revelados: string[]) =>
  oculto && !revelados.includes(colabId);
export const fd = (d: string | null | undefined) => {
  if (!d) return '—';
  const p = d.split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
};

export const isCEO = (c?: Colab | null) => !!c && c.papel === 'ceo';
export const isAdmin = (c?: Colab | null) => !!c && (c.papel === 'rh_admin' || c.papel === 'ceo');

export function getCargoFaixa(db: DB, cargoNome: string): { p: number; a: number; t: number } | null {
  const k = db.cargos.find(c => c.n === cargoNome);
  if (!k) return null;
  return { p: k.piso, a: k.alvo, t: k.teto };
}

export function getMktStatus(db: DB, c: Colab): 'abaixo' | 'entrada' | 'plena' | 'acima' | null {
  const f = getCargoFaixa(db, c.ca);
  if (!f) return null;
  if (c.sal < f.p) return 'abaixo';
  if (c.sal < f.a) return 'entrada';
  if (c.sal <= f.t) return 'plena';
  return 'acima';
}

export function getSalHist(db: DB, colabId: string): SalHist[] {
  return (db.salHist || []).filter(h => h.p === colabId).sort((a, b) => b.dt.localeCompare(a.dt));
}

export function getUltimoReajuste(db: DB, colabId: string, motivoFiltro?: MotivoReajuste): SalHist | null {
  const lista = getSalHist(db, colabId);
  if (motivoFiltro) return lista.find(h => h.motivo === motivoFiltro) || null;
  return lista.find(h => h.motivo !== 'contratacao') || null;
}

export function temCCTNoAno(db: DB, colabId: string, ano?: number): boolean {
  const y = ano || new Date().getFullYear();
  return (db.salHist || []).some(h => h.p === colabId && h.motivo === 'cct' && h.dt && h.dt.startsWith(String(y)));
}

export function getSindicato(db: DB, id: string): Sindicato | null {
  return (db.sindicatos || []).find(s => s.id === id) || null;
}

export function getSindicatoDoColab(db: DB, c: Colab): Sindicato | null {
  if (!c) return null;
  if (c.sind) return getSindicato(db, c.sind);
  return (db.sindicatos || []).find(s => (s.abrangeAreas || []).includes(c.ar)) || null;
}

export function ultimaCCTAplicadaNoAno(db: DB, colabId: string, ano?: number): SalHist | null {
  const y = ano || new Date().getFullYear();
  return (db.salHist || [])
    .filter(h => h.p === colabId && h.motivo === 'cct' && h.dt && h.dt.startsWith(String(y)))
    .sort((a, b) => b.dt.localeCompare(a.dt))[0] || null;
}

export interface StatusCCT {
  sind: Sindicato;
  jaAplicado: boolean;
  registro: SalHist | null;
  dataBaseAno: string | null;
  atrasada: boolean;
  dias: number | null;
}

export function statusCCTColab(db: DB, c: Colab, ano?: number): StatusCCT | null {
  if (c.vi !== 'CLT') return null;
  const sind = getSindicatoDoColab(db, c);
  if (!sind) return null;
  const y = ano || new Date().getFullYear();
  const aplic = ultimaCCTAplicadaNoAno(db, c.id, y);
  let dataBaseAno: string | null = null;
  let atrasada = false;
  let dias: number | null = null;
  if (sind.dataBase) {
    dataBaseAno = `${y}-${sind.dataBase}`;
    const hoje = new Date().toISOString().slice(0, 10);
    atrasada = !aplic && hoje >= dataBaseAno;
    if (!aplic) {
      const diff = (new Date(dataBaseAno).getTime() - new Date(hoje).getTime()) / (1000 * 60 * 60 * 24);
      dias = Math.round(diff);
    }
  }
  return { sind, jaAplicado: !!aplic, registro: aplic, dataBaseAno, atrasada, dias };
}

export function colabsAguardandoCCT(db: DB, ano?: number): { c: Colab; st: StatusCCT }[] {
  const y = ano || new Date().getFullYear();
  return db.colabs
    .filter(c => c.vi === 'CLT')
    .map(c => ({ c, st: statusCCTColab(db, c, y)! }))
    .filter(x => x.st && !x.st.jaAplicado);
}

export function isNivelIII(db: DB, cargo: string): boolean {
  const k = db.cargos.find(c => c.n === cargo);
  return !!k && k.nivel === 'III';
}

export function lvlOfCargo(db: DB, cargo: string): 'I' | 'II' | 'III' | null {
  const k = db.cargos.find(c => c.n === cargo);
  return k?.nivel || null;
}

export function inferCargoTrack(cargo: Cargo): 'tec' | 'gest' {
  if (cargo.track) return cargo.track;
  const n = (cargo.n || '').toLowerCase();
  const gestKeywords = ['gestor', 'gestora', 'head', 'diretor', 'diretora', 'coord', 'lead', 'gerente', 'líder', 'lider', 'sócio', 'socio', 'ceo', 'cto', 'cfo', 'cpo'];
  return gestKeywords.some(k => n.includes(k)) ? 'gest' : 'tec';
}

export function getProximosCargos(db: DB, c: Colab, track?: 'tec' | 'gest'): Cargo[] {
  const atual = db.cargos.find(k => k.n === c.ca);
  if (!atual) return [];
  const ordemNivel = { I: 1, II: 2, III: 3 };
  const nivelAtual = ordemNivel[atual.nivel as 'I' | 'II' | 'III'] || 1;
  return db.cargos
    .filter(k => k.fam === atual.fam)
    .filter(k => k.id !== atual.id)
    .filter(k => (ordemNivel[k.nivel as 'I' | 'II' | 'III'] || 0) >= nivelAtual)
    .filter(k => !track || inferCargoTrack(k) === track)
    .sort((a, b) => (ordemNivel[a.nivel as 'I' | 'II' | 'III'] || 0) - (ordemNivel[b.nivel as 'I' | 'II' | 'III'] || 0));
}

export function classifySal(c: Colab, faixa: { p: number; a: number; t: number } | null): { label: string; cor: string; bg: string } {
  if (!faixa || !c.sal) return { label: '—', cor: 'var(--g4)', bg: 'var(--g1)' };
  if (c.sal < faixa.p) return { label: 'Abaixo do piso', cor: 'var(--re)', bg: 'var(--re0)' };
  if (c.sal < faixa.a) return { label: 'Entrada', cor: 'var(--am)', bg: 'var(--am0)' };
  if (c.sal <= faixa.t) return { label: 'Plena', cor: 'var(--gr)', bg: 'var(--gr0)' };
  return { label: 'Acima do teto', cor: 'var(--pu)', bg: 'var(--pu0)' };
}
