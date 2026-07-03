import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

export interface ConvenioDTO {
  cnpj: string;
  uf: string;
  municipio: string;
  nome_orgao: string;
  tipo: string;
}

export interface ListarConveniosResultado {
  dados: ConvenioDTO[];
  total: number;
  pagina: number;
  por_pagina: number;
  total_paginas: number;
}

interface UseConveniosParams {
  pagina: number;
  porPagina: number;
  uf?: string;
  municipio?: string;
  tipo?: string;
}

export function useConvenios({ pagina, porPagina, uf, municipio, tipo }: UseConveniosParams) {
  return useQuery({
    queryKey: ['convenios', pagina, porPagina, uf, municipio, tipo],
    queryFn: () =>
      api.get<ListarConveniosResultado>(ENDPOINTS.CONVENIOS, {
        pagina,
        por_pagina: porPagina,
        uf: uf || undefined,
        municipio: municipio || undefined,
        tipo: tipo || undefined,
      }),
    staleTime: 60_000,
  });
}

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
] as const;

export const CONVENIO_UFS = UFS;
