export type Papel = 'ceo' | 'rh_admin' | undefined;
export type Vinculo = 'CLT' | 'PJ' | 'Estágio' | 'Contrato de Horas';
export type Vt = 'nao' | 'sim' | 'hibrido';
export type Ps = 'nao' | 'sim';
export type TrilhaKey = 'esp1' | 'esp2' | 'esp3' | 'gest1' | 'gest2' | 'gest3' | '';
export type MotivoReajuste = 'contratacao' | 'cct' | 'merito' | 'promocao' | 'ajuste';
export type PDIStatus = 'pendente' | 'em-andamento' | 'concluido';
export type PDITipo = 'hard' | 'soft' | 'ent';
export type VagaPrio = 'critica' | 'media' | 'baixa';
export type SkillLevel = 'obrigatorio' | 'desejavel';

export interface Familia {
  id: string;
  n: string;
  ic: string;
  col: string;
  desc: string;
}

export interface Cargo {
  id: string;
  fam: string;
  nivel: 'I' | 'II' | 'III';
  n: string;
  desc: string;
  piso: number;
  alvo: number;
  teto: number;
  req: string;
  prog: string;
}

export interface Colab {
  id: string;
  n: string;
  ca: string;
  ar: string;
  vi: Vinculo | string;
  sal: number;
  es?: string;
  sq?: string;
  par?: string;
  ov?: string;
  papel?: Papel;
  trilha?: TrilhaKey;
  sind?: string;
  vr?: number;
  vt?: Vt;
  ps?: Ps;
  ho?: number;
  bouts?: string;
}

export interface PDI {
  id: string;
  p: string;
  o: string;
  a: string;
  pz: string;
  t: PDITipo;
  r?: string;
  m?: string;
  st: PDIStatus;
}

export interface Skill {
  id: string;
  l: string;
  n: SkillLevel;
}

export interface Vaga {
  id: string;
  cargo: string;
  area: string;
  prio: VagaPrio;
  prazo: string;
  vinculo: Vinculo | string;
  just: string;
  smin: number;
  smax: number;
  hard: Skill[];
  soft: Skill[];
}

export interface Aval {
  id: string;
  p: string;
  dt: string;
  tot: number;
  max: number;
  proxima?: string;
  prontidaoPct?: number;
  notas?: Record<string, number>;
}

export interface SalHist {
  id: string;
  p: string;
  dt: string;
  valor: number;
  valorAnterior: number | null;
  motivo: MotivoReajuste;
  perc: number | null;
  sindCCT: string;
  obs: string;
}

export interface SindHist {
  ano: number;
  perc: number;
  dataAplicacao: string;
  obs?: string;
}

export interface Sindicato {
  id: string;
  nome: string;
  sigla: string;
  dataBase: string;
  abrangeAreas: string[];
  historico: SindHist[];
  obs?: string;
}

export interface Requisito {
  id: string;
  prog: string;
  area: string;
  meses: number;
  cert: string;
}

export interface DB {
  familias: Familia[];
  cargos: Cargo[];
  colabs: Colab[];
  pdis: PDI[];
  vagas: Vaga[];
  avals: Aval[];
  salHist: SalHist[];
  sindicatos: Sindicato[];
  requisitos: Requisito[];
  prontidao: Record<string, unknown>;
}

export const MOTIVOS_REAJUSTE: Record<MotivoReajuste, { label: string; cor: string }> = {
  contratacao: { label: 'Contratação', cor: 'var(--bl)' },
  cct: { label: 'CCT (sindicato)', cor: 'var(--te)' },
  merito: { label: 'Mérito', cor: 'var(--gr)' },
  promocao: { label: 'Promoção', cor: 'var(--pu)' },
  ajuste: { label: 'Ajuste interno', cor: 'var(--am)' },
};

export const TRILHA_INFO: Record<Exclude<TrilhaKey, ''>, { label: string; group: 'tec' | 'gest'; col: string; desc: string }> = {
  esp1: { label: 'Especialista I', group: 'tec', col: 'var(--te)', desc: 'Domínio profundo do stack. Referência interna.' },
  esp2: { label: 'Especialista II', group: 'tec', col: 'var(--te)', desc: 'Define padrões. Referência técnica externa.' },
  esp3: { label: 'Arquiteto / Principal', group: 'tec', col: 'var(--te)', desc: 'Decide stack da empresa. Nomeia domínios.' },
  gest1: { label: 'Lead / Coordenador', group: 'gest', col: 'var(--bl)', desc: 'Lidera squad ou subárea. Decisões táticas.' },
  gest2: { label: 'Head / Gerente', group: 'gest', col: 'var(--bl)', desc: 'Gestão da área. Interface com CEO.' },
  gest3: { label: 'Diretor / C-Level', group: 'gest', col: 'var(--bl)', desc: 'Visão estratégica. Sócio em potencial.' },
};

export const AVC = ['#5b21b6', '#059669', '#d97706', '#2563eb', '#0891b2', '#7c3aed', '#dc2626', '#0d9488', '#b45309', '#be185d'];
