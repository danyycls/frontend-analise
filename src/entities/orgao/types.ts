export interface OrgaoPublico {
  codigo: string;
  nome: string;
  sigla?: string;
  cnpj?: string;
}

export interface PessoaPublica {
  nome: string;
  cpf?: string;
  orgao?: string;
}

export interface ServidorPublico {
  cpf: string;
  nome: string;
  orgao?: string;
  cargo?: string;
  remuneracao?: number;
}

export interface Empresa {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  situacaoCadastral?: string;
  capitalSocial?: string;
}
