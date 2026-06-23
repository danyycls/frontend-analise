import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { ENDPOINTS } from '@/shared/api/endpoints'

interface TseSearchBody {
  cnpj?: string
  cpf?: string
  nome?: string
  cargo?: string
  partido?: string
}

export function useEntitySearch(query: string, enabled = false) {
  return useQuery({
    queryKey: ['entitySearch', query],
    queryFn: async () => {
      const results: unknown[] = []

      if (query.length >= 3) {
        try {
          const tse = await api.post<unknown>(ENDPOINTS.TSE_RELACOES, {
            cnpj: query,
          } as TseSearchBody)
          if (tse) results.push(tse)
        } catch {
          // ignora
        }

        try {
          const doadores = await api.post<unknown>(ENDPOINTS.TSE_DOADORES, {
            documento: query,
          })
          if (doadores) results.push({ type: 'doador', data: doadores })
        } catch {
          // ignora
        }

        try {
          const fornecedores = await api.post<unknown>(ENDPOINTS.TSE_FORNECEDORES, {
            documento: query,
          })
          if (fornecedores) results.push({ type: 'fornecedor', data: fornecedores })
        } catch {
          // ignora
        }
      }

      return results
    },
    enabled,
    staleTime: 60000,
  })
}

export function useTCURecords(document?: string, enabled = false) {
  return useQuery({
    queryKey: ['tcuRecords', document],
    queryFn: () =>
      api.post<unknown[]>(ENDPOINTS.TCU_CONTAS_IRREGULARES, {
        cpfCnpj: document,
      }),
    enabled: enabled && !!document,
    staleTime: 120000,
  })
}

export function useEntityConnections(document: string, enabled = false) {
  return useQuery({
    queryKey: ['entityConnections', document],
    queryFn: () =>
      api.post<unknown>(ENDPOINTS.TSE_RELACOES, {
        cnpj: document,
      }),
    enabled: enabled && document.length >= 3,
    staleTime: 120000,
  })
}
