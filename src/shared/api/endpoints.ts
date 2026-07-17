export const ENDPOINTS = {
  // Licitacoes
  ORGAO_ANALISE_START: '/orgao/analise',
  UF_MUNICIPIO_ANALISE_START: '/uf-municipio/analise',

  // IBGE
  IBGE_ESTADOS: '/ibge/estados',
  IBGE_MUNICIPIOS: '/ibge/municipios',

  // TSE
  TSE_RELACOES: '/busca/relacoes',
  TSE_CARGOS: '/busca/cargos',
  TSE_CANDIDATOS: '/busca/candidatos',
  TSE_PARTIDOS: '/busca/partidos',
  TSE_DOADORES: '/busca/doadores',
  TSE_FORNECEDORES: '/busca/fornecedores',

  // Portal Transparencia
  PORTAL_ORGAOS: '/portal/orgaos',
  PORTAL_PESSOAS: '/portal/pessoas',
  PORTAL_CARTOES: '/portal/cartoes',
  PORTAL_SERVIDORES: '/portal/servidores',
  PORTAL_DESPESAS: '/portal/despesas',
  PORTAL_EMENDAS: '/portal/emendas',

  // Entidades
  ENTIDADE_CANDIDATO: '/entidade/candidato',
  ENTIDADE_DESPESA: '/entidade/despesa',
  ENTIDADE_RECEITA: '/entidade/receita',
  ENTIDADE_PRESTADOR_CONTAS: '/entidade/prestador_contas',
  ENTIDADE_FORNECEDOR: '/entidade/fornecedor',
  ENTIDADE_DOADOR: '/entidade/doador',

  // Deputados
  DEPUTADOS: '/deputados',
  DEPUTADO_DESPESAS: '/deputados/despesas',
  DEPUTADO_ORGAOS: '/deputados/orgaos',

  // Senadores
  SENADORES: '/senadores',

  // TCU
  TCU: '/tcu',
  TCU_CONTAS_IRREGULARES: '/tcu/contas-irregulares',
  TCU_FINS_ELEITORAIS: '/tcu/fins-eleitorais',
  TCU_INABILITADOS: '/tcu/inabilitados',
  TCU_INIDONEOS: '/tcu/inidoneos',

  // Worker Anomalias
  ANOMALIA_WS_CHANNEL: 'anomalia_analise',
  ANOMALIA_INICIAR: '/worker/anomalia/iniciar',
  ANOMALIA_PARAR: '/worker/anomalia/parar',
  ANOMALIA_PROGRESSO: '/worker/anomalia/progression',
  ANOMALIA_RESULTADO: '/worker/anomalia/resultados',
  ANOMALIAS_LISTAR: '/anomalias',

  // Convenios
  CONVENIOS: '/convenios',
} as const;
