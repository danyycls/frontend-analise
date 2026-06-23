export interface TseDespesa {
  sq_despesa: number;
  data_despesa: string;
  valor: number;
  descricao?: string;
  origem_despesa_descricao?: string;
  tipo: string;
  candidato?: {
    sq_candidato: number;
  };
  partido?: {
    sigla: string;
    nome: string;
  };
}

export interface TseReceita {
  sq_receita: number;
  data_receita: string;
  valor: number;
  descricao?: string;
  origem_receita_descricao?: string;
  tipo: string;
  candidato?: {
    sq_candidato: number;
  };
  partido?: {
    sigla: string;
    nome: string;
  };
}

export interface TseEmpresaResult {
  total_despesas: number;
  total_receitas: number;
  fornecedor?: {
    cpf_cnpj: string;
    nome: string;
  };
  doador?: {
    cpf_cnpj: string;
    nome: string;
  };
  despesas: TseDespesa[];
  receitas: TseReceita[];
}

export interface TseDoadorResult {
  total_receitas?: number;
  doador?: {
    cpf_cnpj: string;
    nome: string;
  };
  receitas: TseReceita[];
}

export interface TseFornecedorResult {
  total_despesas?: number;
  fornecedor?: {
    cpf_cnpj: string;
    nome: string;
  };
  despesas: TseDespesa[];
}

export interface Candidato {
  sq_candidato: number;
  nome_completo: string;
  nome_urna: string;
  cpf?: string;
  numero_candidato: string;
  cargo_nome: string;
  sg_uf: string;
  eleito: boolean;
  partido?: {
    sigla: string;
    nome: string;
  };
}

export interface CandidatosResult {
  candidatos: Candidato[];
}

export interface CargoOption {
  valor: string;
  label: string;
}

export interface PartidoOption {
  valor: string;
  label: string;
}

export interface OpcoesResult<T> {
  opcoes: T[];
}

export interface TseResultItem {
  id: number;
  method: string;
  searchParams?: string;
  data: any;
  timestamp?: string;
}

export interface TseSavedItem {
  id: number;
  method: string;
  cnpj?: string;
  data: any;
  timestamp: string;
}
