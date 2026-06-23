export interface Deputado {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  email?: string;
  urlFoto?: string;
}

export interface DeputadoDespesa {
  ano: number;
  mes: number;
  tipoDespesa: string;
  codDocumento: number;
  tipoDocumento: string;
  codTipoDocumento: number;
  dataDocumento: string;
  numDocumento: string;
  valorDocumento: number;
  urlDocumento: string;
  nomeFornecedor: string;
  cnpjCpfFornecedor: string;
  valorLiquido: number;
  valorGlosa: number;
  numRessarcimento: string;
  codLote: number;
  parcela: number;
}

export interface DeputadoOrgao {
  idOrgao: number;
  siglaOrgao: string;
  nomeOrgao: string;
  titulo: string;
  dataInicio: string;
  dataFim?: string;
}
