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

export type CargoTrack = 'tec' | 'gest';

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
  track?: CargoTrack;
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
  cvNome?: string;
  cvData?: string;
  cvTipo?: string;
  formacao?: string;
  cursos?: string;
  competenciasAtuais?: string;
  alvoCargo?: string;
  psPlano?: string;
  psDependentes?: number;
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

export type AvalTipo = 'auto' | 'gestor' | '360' | '1:1' | 'ciclo';
export type CritStatus = 'atende' | 'parcial' | 'nao' | 'na';
export type CompCategoria = 'comportamental' | 'tecnica';

export interface CompAval {
  id: string;
  nome: string;
  categoria: CompCategoria;
  nota: number;
  obs?: string;
}

export interface CritProgAval {
  id: string;
  desc: string;
  status: CritStatus;
  obs?: string;
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
  avaliadorId?: string;
  tipo?: AvalTipo;
  cargoNaData?: string;
  proximoCargo?: string;
  competencias?: CompAval[];
  criterios?: CritProgAval[];
  fortes?: string;
  desenvolver?: string;
  recomendacoes?: string;
}

export const COMPS_PADRAO_COMPORTAMENTAL: { nome: string }[] = [
  { nome: 'Comunicação' },
  { nome: 'Colaboração / Time' },
  { nome: 'Autonomia' },
  { nome: 'Ownership / Responsabilidade' },
  { nome: 'Adaptabilidade' },
  { nome: 'Aprendizagem contínua' },
];

export const TIPO_AVAL_LABEL: Record<AvalTipo, string> = {
  auto: 'Autoavaliação',
  gestor: 'Avaliação do gestor',
  '360': 'Avaliação 360°',
  '1:1': '1:1 / informal',
  ciclo: 'Ciclo formal',
};

export const CRIT_STATUS_LABEL: Record<CritStatus, { label: string; col: string; bg: string; chip: string }> = {
  atende: { label: 'Atende', col: 'var(--gr)', bg: 'var(--gr0)', chip: 'gr' },
  parcial: { label: 'Parcial', col: 'var(--am)', bg: 'var(--am0)', chip: 'am' },
  nao: { label: 'Não atende', col: 'var(--re)', bg: 'var(--re0)', chip: 're' },
  na: { label: 'N/A', col: 'var(--g5)', bg: 'var(--g1)', chip: 'gr' },
};

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

export interface Regras {
  cicloAvalMeses: number;
  minMesesPromocao: number;
  exigirAvalParaPromocao: boolean;
  exigirPDIConcluido: boolean;
  obs: string;
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
  regras: Regras;
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
