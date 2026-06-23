export interface Partido {
  sigla: string;
  nome: string;
  numero?: number;
}

export interface Candidato {
  nome: string;
  cpf?: string;
  cargo?: string;
  partido?: string;
  uf?: string;
  ano?: number;
}
