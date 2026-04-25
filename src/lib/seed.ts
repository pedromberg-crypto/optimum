import type { DB } from './types';

export const seedDB: DB = {
  familias: [
    { id: 'f1', n: 'Engenharia e Produto', ic: '⚙', col: 'pu', desc: 'Desenvolvimento de software sob encomenda' },
    { id: 'f2', n: 'Dados e Inteligência', ic: '📊', col: 'te', desc: 'Analytics, BI e pipelines de dados' },
    { id: 'f3', n: 'Comercial e Suporte', ic: '💼', col: 'gr', desc: 'Vendas, CS e suporte técnico' },
    { id: 'f4', n: 'Gente & Gestão (RH)', ic: '🧑‍💼', col: 'pi', desc: 'Pessoas, cultura e desenvolvimento organizacional' },
    { id: 'f5', n: 'Financeiro / Adm', ic: '💰', col: 'am', desc: 'Finanças, contabilidade e administrativo' },
  ],
  cargos: [
    { id: 'k1', fam: 'f1', nivel: 'I', n: 'Desenvolvedor I', desc: 'Executa tarefas definidas com supervisão do Par. Entrega features com revisão obrigatória.', piso: 3800, alvo: 4700, teto: 5200, req: 'Git, Stack principal (Power Apps/Python/.NET), comunicação assíncrona', prog: 'Entregar sprint sem travar Tech Lead por 3 meses consecutivos' },
    { id: 'k2', fam: 'f1', nivel: 'II', n: 'Desenvolvedor II', desc: 'Atua em múltiplos projetos com autonomia. Decompõe requisitos e revisa código de Juniors.', piso: 6500, alvo: 8500, teto: 9500, req: 'Git avançado, SQL, liderança técnica informal, documentação', prog: 'Liderar entrega completa de módulo do cliente sem suporte do Tech Lead' },
    { id: 'k3', fam: 'f1', nivel: 'III', n: 'Desenvolvedor III', desc: 'Define arquitetura. Representa empresa com cliente. Desenvolve Juniors.', piso: 12000, alvo: 15000, teto: 18000, req: 'Arquitetura de software, liderança técnica, visão de produto', prog: 'Mentorar Dev I até promoção e conduzir reunião solo com cliente' },
    { id: 'k4', fam: 'f1', nivel: 'III', n: 'Arquiteto de Soluções', desc: 'Decide stack da empresa. Atrai clientes pelo domínio técnico.', piso: 14000, alvo: 18000, teto: 25000, req: 'Arquitetura enterprise, cloud, múltiplas stacks', prog: 'Cargo de chegada — não tem próximo nível definido' },
    { id: 'k5', fam: 'f2', nivel: 'I', n: 'Analista de Dados I', desc: 'SQL, dashboards básicos, relatórios com modelo definido.', piso: 4500, alvo: 5500, teto: 6500, req: 'SQL, Power BI ou Tableau, Excel avançado', prog: 'Entrega autônoma de 3 dashboards para clientes distintos' },
    { id: 'k6', fam: 'f2', nivel: 'II', n: 'Analista de Dados II', desc: 'Modelagem de dados, Python, análises estratégicas, interface com cliente.', piso: 6500, alvo: 7500, teto: 9000, req: 'SQL avançado, Python, modelagem dimensional, storytelling com dados', prog: 'Criar pipeline reutilizável ou modelo preditivo em produção' },
    { id: 'k7', fam: 'f3', nivel: 'I', n: 'Assistente Comercial', desc: 'Suporte operacional, comunicação com clientes, atualização de CRM.', piso: 1500, alvo: 2000, teto: 2800, req: 'CRM básico, comunicação escrita, Excel', prog: 'Qualificar e fechar 3 leads sem supervisão direta' },
    { id: 'k8', fam: 'f3', nivel: 'II', n: 'Executivo de Vendas II', desc: 'Prospecção ativa, negociação e fechamento de contratos.', piso: 4000, alvo: 6000, teto: 9000, req: 'CRM avançado, metodologia de vendas, negociação B2B', prog: 'Gerenciar carteira de ≥5 contas com NPS médio ≥8' },
    { id: 'k9', fam: 'f4', nivel: 'I', n: 'Analista de RH I', desc: 'Recrutamento operacional, onboarding, documentação trabalhista.', piso: 2500, alvo: 3500, teto: 4500, req: 'CLT básica, ATS, planilhas de controle, comunicação empática', prog: 'Conduzir processo R&S completo sem supervisão (end-to-end)' },
    { id: 'k10', fam: 'f4', nivel: 'II', n: 'Analista de RH II', desc: 'Desenvolvimento organizacional, PDI, avaliação de desempenho, T&D.', piso: 4000, alvo: 5500, teto: 7000, req: 'HRIS, psicologia organizacional, gestão de desempenho', prog: 'Implementar ciclo completo de avaliação + PDI para o time' },
    { id: 'k11', fam: 'f4', nivel: 'III', n: 'Analista de RH III', desc: 'Cultura, estratégia de pessoas, liderança do setor, interface com CEO.', piso: 6500, alvo: 8500, teto: 12000, req: 'Pós em gestão de pessoas, OKR, D&I, business partnering', prog: 'Cargo sênior — fork para Especialista (CHRO técnico) ou Gestão (Head de Pessoas)' },
    { id: 'k12', fam: 'f5', nivel: 'I', n: 'Analista Financeiro I', desc: 'Contas a pagar/receber, conciliação bancária, relatórios básicos.', piso: 2500, alvo: 3500, teto: 4500, req: 'Excel avançado, ERP básico, contabilidade básica', prog: 'Fechar ciclo mensal sem retrabalho por 6 meses consecutivos' },
    { id: 'k13', fam: 'f5', nivel: 'II', n: 'Analista Financeiro II', desc: 'Fluxo de caixa, planejamento orçamentário, análises financeiras.', piso: 4000, alvo: 5500, teto: 7000, req: 'ERP avançado, Power BI, modelagem financeira, CFC ou cursando', prog: 'Entrega autônoma do budget anual com variância < 5%' },
    { id: 'k14', fam: 'f4', nivel: 'III', n: 'Gestora de Pessoas', desc: 'Lidera o time de RH, define estratégia de pessoas, conduz ciclos de avaliação e PDI, interface com CEO.', piso: 7500, alvo: 10000, teto: 14000, req: 'Gestão de equipe, OKR, business partnering, liderança', prog: 'Cargo de chegada da trilha de gestão em RH' },
    { id: 'k15', fam: 'f5', nivel: 'III', n: 'Analista Financeiro III', desc: 'Análise estratégica, controladoria, suporte a decisões da diretoria.', piso: 6500, alvo: 9000, teto: 13000, req: 'Controladoria, modelagem avançada, CFC ativo, valuation', prog: 'Apresentar análise de cenários para decisões de investimento' },
    { id: 'k16', fam: 'f3', nivel: 'I', n: 'Executivo de Vendas I', desc: 'Prospecção, qualificação e suporte a negociação com supervisão.', piso: 2000, alvo: 3500, teto: 5000, req: 'CRM básico, técnicas de prospecção, comunicação', prog: 'Atingir meta individual de qualificação por 3 meses consecutivos' },
    { id: 'k17', fam: 'f3', nivel: 'III', n: 'Executivo de Vendas III', desc: 'Gestão de grandes contas, negociação estratégica, mentoria comercial.', piso: 7000, alvo: 11000, teto: 16000, req: 'Negociação enterprise, gestão de carteira, liderança comercial', prog: 'Liderar conta-chave com receita ≥30% do total da área' },
    { id: 'k18', fam: 'f3', nivel: 'I', n: 'Estagiária', desc: 'Suporte operacional em treinamento. Carga de 4-6h/dia.', piso: 800, alvo: 1200, teto: 1800, req: 'Cursando ensino superior na área, comunicação, proatividade', prog: 'Efetivação como Assistente após 12 meses (avaliação)' },
  ],
  colabs: [
    { id: 'c1', n: 'Maicon Douglas', ca: 'Desenvolvedor III', ar: 'Engenharia e Produto', vi: 'PJ', sal: 16000, es: 'Paraná', sq: 'Squad Vale', par: '', ov: 'Tech Lead. Mentor dos devs.' },
    { id: 'c2', n: 'Vinícius Silva', ca: 'Desenvolvedor II', ar: 'Engenharia e Produto', vi: 'CLT', sal: 4250, es: 'Minas Gerais', sq: 'Squad Cross', par: 'Maicon Douglas', ov: 'Squad Cross — múltiplos clientes.' },
    { id: 'c3', n: 'Maurício Pavan', ca: 'Desenvolvedor I', ar: 'Engenharia e Produto', vi: 'CLT', sal: 4250, es: 'Rio de Janeiro', sq: 'Squad Vale', par: 'Maicon Douglas', ov: '' },
    { id: 'c4', n: 'Victor Precoma', ca: 'Desenvolvedor I', ar: 'Engenharia e Produto', vi: 'CLT', sal: 4250, es: 'São Paulo', sq: 'Squad Vale', par: 'Maicon Douglas', ov: '' },
    { id: 'c5', n: 'Brenda Cerqueira', ca: 'Desenvolvedor I', ar: 'Engenharia e Produto', vi: 'CLT', sal: 4250, es: 'Bahia', sq: 'Squad Vale', par: 'Maicon Douglas', ov: 'Remota na Bahia.' },
    { id: 'c6', n: 'Camila', ca: 'Assistente Comercial', ar: 'Comercial e Suporte', vi: 'Estágio', sal: 1125, es: '', sq: '', par: 'Maicon Douglas', ov: 'Estagiária.' },
    { id: 'c7', n: 'Fernanda', ca: 'Gestora de Pessoas', ar: 'Gente & Gestão (RH)', vi: 'CLT', sal: 9000, es: '', sq: '', par: '', ov: 'Gestora de RH. Admin do sistema.', papel: 'rh_admin' },
    { id: 'c8', n: 'Lucas', ca: 'Analista de Dados I', ar: 'Dados e Inteligência', vi: 'CLT', sal: 8500, es: '', sq: '', par: '', ov: '' },
    { id: 'c9', n: 'Pedro', ca: 'Analista de Dados I', ar: 'Dados e Inteligência', vi: 'CLT', sal: 6300, es: '', sq: '', par: '', ov: '' },
    { id: 'c10', n: 'Tati', ca: 'Assistente Comercial', ar: 'Comercial e Suporte', vi: 'CLT', sal: 1689, es: '', sq: '', par: '', ov: 'Comercial e suporte.' },
    { id: 'c11', n: 'Rogério', ca: 'CEO / Sócio', ar: 'Gestão e Estratégia', vi: 'CLT', sal: 1621, es: '', sq: '', par: '', ov: 'CEO e fundador. Não entra no plano de cargos padrão.', papel: 'ceo' },
  ],
  pdis: [
    { id: 'p1', p: 'c3', o: 'Reduzir dependência do Tech Lead', a: '30 min solo antes de escalonar; registrar no canal', pz: '2025-09-30', t: 'soft', r: 'Zero custo', m: 'Freq. de escalações', st: 'em-andamento' },
    { id: 'p2', p: 'c3', o: 'Autonomia em subtarefa de sprint', a: 'Assumir 1 subtarefa completa por sprint', pz: '2025-12-31', t: 'ent', r: 'Mentoria Maicon', m: 'Entregas autônomas/sprint', st: 'pendente' },
    { id: 'p3', p: 'c4', o: 'Qualidade de código', a: '5 revisões de PR como revisor secundário', pz: '2025-09-30', t: 'hard', r: 'Orientação Par', m: '% PRs ≤2 rodadas', st: 'em-andamento' },
    { id: 'p4', p: 'c5', o: 'Documentar processos SIP', a: 'SOP dos 3 processos recorrentes', pz: '2025-08-31', t: 'ent', r: 'Template Notion', m: 'Doc publicado e validado', st: 'pendente' },
    { id: 'p5', p: 'c2', o: 'Reunião técnica solo com cliente', a: 'Liderar 1 refinamento com stakeholder', pz: '2025-10-31', t: 'ent', r: 'Apoio Maicon', m: 'Feedback cliente', st: 'pendente' },
  ],
  vagas: [
    { id: 'v1', cargo: 'Product Owner', area: 'Engenharia e Produto', prio: 'critica', prazo: '2025-09-01', vinculo: 'CLT', just: 'Sem PO, o Rogério toma todas as decisões de produto — gargalo crítico.', smin: 8000, smax: 14000, hard: [{ id: 'h1', l: 'Gestão de backlog (Jira/Azure)', n: 'obrigatorio' }, { id: 'h2', l: 'Escrita de user stories e critérios de aceite', n: 'obrigatorio' }, { id: 'h3', l: 'Conhecimento de processos de mineração/engenharia', n: 'desejavel' }], soft: [{ id: 's1', l: 'Comunicação com stakeholders técnicos e de negócio', n: 'obrigatorio' }, { id: 's2', l: 'Autonomia e tomada de decisão', n: 'obrigatorio' }, { id: 's3', l: 'Colaboração remota', n: 'desejavel' }] },
    { id: 'v2', cargo: 'QA / Tester', area: 'Engenharia e Produto', prio: 'media', prazo: '2025-10-01', vinculo: 'CLT', just: 'Sem QA, os bugs chegam ao cliente. Risco de perda da Vale.', smin: 4000, smax: 7000, hard: [{ id: 'h4', l: 'Testes manuais de interface', n: 'obrigatorio' }, { id: 'h5', l: 'Escrita de casos de teste', n: 'obrigatorio' }, { id: 'h6', l: 'Ferramentas de automação (Cypress, Selenium)', n: 'desejavel' }], soft: [{ id: 's4', l: 'Atenção a detalhes e raciocínio crítico', n: 'obrigatorio' }, { id: 's5', l: 'Comunicação assíncrona proativa', n: 'obrigatorio' }] },
    { id: 'v3', cargo: 'UX/UI Designer', area: 'Engenharia e Produto', prio: 'media', prazo: '2025-11-01', vinculo: 'CLT', just: 'Design feito por devs — qualidade baixa nos produtos entregues.', smin: 5000, smax: 9000, hard: [{ id: 'h7', l: 'Figma (protótipos e design system)', n: 'obrigatorio' }, { id: 'h8', l: 'Pesquisa com usuário (entrevistas, usability test)', n: 'desejavel' }], soft: [{ id: 's6', l: 'Escuta ativa e empatia com usuário final', n: 'obrigatorio' }, { id: 's7', l: 'Colaboração com devs em ambiente remoto', n: 'obrigatorio' }] },
    { id: 'v4', cargo: 'Analista de RH I', area: 'Gente & Gestão', prio: 'media', prazo: '2025-10-01', vinculo: 'CLT', just: 'RH hoje é acumulado com outras funções. Time crescendo exige estrutura.', smin: 2500, smax: 4500, hard: [{ id: 'h9', l: 'CLT e legislação trabalhista básica', n: 'obrigatorio' }, { id: 'h10', l: 'Processos de R&S (recrutamento e seleção)', n: 'obrigatorio' }, { id: 'h11', l: 'Excel / Google Sheets para controles de RH', n: 'obrigatorio' }], soft: [{ id: 's8', l: 'Escuta ativa e sigilo profissional', n: 'obrigatorio' }, { id: 's9', l: 'Organização e gestão de múltiplas demandas', n: 'obrigatorio' }, { id: 's10', l: 'Empatia e comunicação não-violenta', n: 'desejavel' }] },
    { id: 'v5', cargo: 'Executivo de Vendas II', area: 'Comercial e Suporte', prio: 'baixa', prazo: '2026-01-01', vinculo: 'CLT', just: 'Expansão de carteira de clientes além da Vale.', smin: 4000, smax: 9000, hard: [{ id: 'h12', l: 'CRM (HubSpot ou Salesforce)', n: 'obrigatorio' }, { id: 'h13', l: 'Prospecção B2B e cold outreach', n: 'obrigatorio' }, { id: 'h14', l: 'Conhecimento em TI / software sob encomenda', n: 'desejavel' }], soft: [{ id: 's11', l: 'Resiliência e gestão de rejeição', n: 'obrigatorio' }, { id: 's12', l: 'Negociação e persuasão', n: 'obrigatorio' }, { id: 's13', l: 'Autonomia em ambiente remoto', n: 'obrigatorio' }] },
  ],
  avals: [],
  salHist: [],
  sindicatos: [
    { id: 'sd1', nome: 'SINDPD-MG (Sind. dos Profissionais de TI)', sigla: 'SINDPD-MG', dataBase: '09-01', abrangeAreas: ['Engenharia e Produto', 'Dados e Inteligência'], historico: [{ ano: 2024, perc: 5.5, dataAplicacao: '2024-09-15', obs: 'Convenção 2024/2025' }], obs: 'Reajuste anual em setembro. Acompanhar publicação no MTE.' },
    { id: 'sd2', nome: 'Sindicato Comerciários', sigla: 'SINDICOM', dataBase: '01-01', abrangeAreas: ['Comercial e Suporte', 'Financeiro / Adm', 'Gente & Gestão (RH)'], historico: [{ ano: 2024, perc: 4.8, dataAplicacao: '2024-01-20', obs: 'Convenção 2024/2025' }], obs: 'Reajuste em janeiro. Comerciários e administrativo.' },
  ],
  requisitos: [],
  prontidao: {},
};

export function buildSeedWithSalHist(db: DB): DB {
  const salHist = db.colabs.map(c => ({
    id: 'sh' + c.id + '_init',
    p: c.id,
    dt: '2024-01-15',
    valor: c.sal,
    valorAnterior: null,
    motivo: 'contratacao' as const,
    perc: null,
    sindCCT: '',
    obs: 'Salário inicial (registro retroativo)',
  }));
  return { ...db, salHist };
}
