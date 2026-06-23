export interface Socio {
  nome_socio: string;
  cnpj_cpf_socio: string;
  qualificacao_socio?: string;
  identificador_socio?: string;
  faixa_etaria?: string;
  codigo_pais?: string;
  pais?: { descricao?: string; codigo?: string };
  data_entrada_sociedade?: string;
  nome_representante?: string;
  qualificacao_representante?: { descricao?: string; codigo?: string };
  representante_legal?: string;
}

export interface Fornecedor {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  situacaoCadastral?: string;
  capitalSocial?: string;
  qsa: Socio[];
}

export interface OrgaoEntidade {
  cnpj?: string;
  razaoSocial?: string;
  esferaId?: string;
  poderId?: string;
}

export interface UnidadeOrgao {
  codigoIbge?: string;
  nomeUnidade?: string;
  codigoUnidade?: string;
  municipioNome?: string;
  ufSigla?: string;
  ufNome?: string;
}

export interface FonteOrcamentaria {
  codigo?: string;
  nome?: string;
  descricao?: string;
  dataInclusao?: string;
}

export interface AmparoLegal {
  codigo?: string;
  nome?: string;
  descricao?: string;
}

export interface TipoContrato {
  nome?: string;
  id?: number;
}

export interface Contrato {
  numeroControlePNCP: string;
  anoContrato?: string;
  numeroContrato?: string;
  codigoContrato?: string;
  codigoTipoContrato?: string;
  numeroLicitacao?: string;
  tipoContrato?: TipoContrato;
  modalidadeNome?: string;
  categoriaProcesso?: { nome?: string; id?: number };
  origemLicitacao?: string;
  produto?: string;
  subtipoContrato?: string;
  cnpjOrgaoSub?: string;
  numeroCNPJ?: string;
  numeroCPF?: string;
  srp?: boolean;

  dataAssinatura?: string;
  dataVigenciaInicio?: string;
  dataVigenciaFim?: string;
  dataPublicacaoPncp?: string;
  prazoInicioVigencia?: string;
  prazoTerminoVigencia?: string;

  valorGlobal?: number;
  valorInicial?: number;
  valorParcela?: number;
  valorTotalEstimado?: number;
  valorTotalHomologado?: number;

  objetoContrato?: string;

  fonteOrcamentaria?: FonteOrcamentaria;
  codigoFonteOrcamentaria?: string;

  amparoLegal?: AmparoLegal;

  fornecedor?: Fornecedor;
  niFornecedor?: string;
  nomeRazaoSocialFornecedor?: string;

  orgaoEntidade?: OrgaoEntidade;
  cnpjOrgao?: string;
  nomeOrgao?: string;
  codigoOrgao?: string;
  codigoUg?: string;

  orgaoSub?: OrgaoEntidade;
  nomeOrgaoSub?: string;

  unidadeOrgao?: UnidadeOrgao;
  orgaoVinculado?: UnidadeOrgao;
  unidadeSub?: UnidadeOrgao;
}

export interface ResultadoOrgao {
  cnpj: string;
  nome?: string;
  contratos: Contrato[];
}

export interface Consulta {
  id: number;
  timestamp: string;
  meta: {
    cnpjs?: string[];
    paginasErro?: unknown;
  };
  resultados: ResultadoOrgao[];
}

export interface JobMeta {
  cnpjs: string[];
  total: number;
  dataInicial: string;
  dataFinal: string;
  tipo?: string;
}

export interface AnaliseResponse {
  jobId: string;
}
