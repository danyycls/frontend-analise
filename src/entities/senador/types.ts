export interface Senador {
  CodigoParlamentar: string;
  NomeParlamentar: string;
  NomeCompletoParlamentar?: string;
  FormaTratamento?: string;
  EmailParlamentar?: string;
  UrlFotoParlamentar?: string;
  UrlPaginaParlamentar?: string;
  SiglaPartidoParlamentar: string;
  UfParlamentar: string;
}

export interface SenadorDespesa {
  Ano: number;
  Mes: number;
  TipoDespesa: string;
  CNPJCPF: string;
  Fornecedor: string;
  Data: string;
  Valor: number;
}
