import { api } from '@/shared/api/client';
import { useSearchMutation } from '@/shared/lib/hooks/useSearchMutation';

export function useOrgaosSearch() {
  return useSearchMutation<{ tipo: string; codigo: string; nome: string }, any[]>({
    mutationKey: ['portal', 'orgaos'],
    mutationFn: async ({ tipo, codigo, nome }) => {
      const endpoint =
        tipo === 'siape'
          ? '/portal-transparencia/orgaos/siape'
          : '/portal-transparencia/orgaos/siafi';
      const params: Record<string, string> = {};
      if (codigo) params.codigoOrgao = codigo;
      if (nome) params.nomeOrgao = nome;
      return api.get<any[]>(endpoint, params);
    },
    searchLabel: 'Portal - Órgãos',
    searchRoute: '/portal',
    searchId: 'portal-orgaos',
  });
}

export function usePessoasSearch() {
  return useSearchMutation<{ tipo: string; documento: string; nome: string }, any>({
    mutationKey: ['portal', 'pessoas'],
    mutationFn: async ({ tipo, documento, nome }) => {
      const endpoint =
        tipo === 'fisica'
          ? '/portal-transparencia/pessoas/fisica'
          : '/portal-transparencia/pessoas/juridica';
      const params: Record<string, string> = {};
      if (documento) params.documento = documento;
      if (nome) params.nome = nome;
      return api.get<any>(endpoint, params);
    },
    searchLabel: 'Portal - Pessoas',
    searchRoute: '/portal',
    searchId: 'portal-pessoas',
  });
}

export function useCartoesSearch() {
  return useSearchMutation<
    {
      codigoOrgao: string;
      cpfPortador: string;
      cnpjFavorecido: string;
      tipoCartao: string;
      dataInicio: string;
      dataFim: string;
    },
    any[]
  >({
    mutationKey: ['portal', 'cartoes'],
    mutationFn: async (params) => {
      const queryParams: Record<string, string> = { pagina: '1' };
      if (params.codigoOrgao) queryParams.codigoOrgao = params.codigoOrgao;
      if (params.cpfPortador) queryParams.cpfPortador = params.cpfPortador;
      if (params.cnpjFavorecido) queryParams.cpfCnpjFavorecido = params.cnpjFavorecido;
      if (params.tipoCartao) queryParams.tipoCartao = params.tipoCartao;
      if (params.dataInicio) queryParams.dataTransacaoInicio = params.dataInicio;
      if (params.dataFim) queryParams.dataTransacaoFim = params.dataFim;
      return api.get<any[]>('/portal-transparencia/cartoes', queryParams);
    },
    searchLabel: 'Portal - Cartões',
    searchRoute: '/portal',
    searchId: 'portal-cartoes',
  });
}

export function useServidoresSearch() {
  return useSearchMutation<
    { tipoBusca: string; cpf: string; codigoOrgao: string; nome: string },
    any[]
  >({
    mutationKey: ['portal', 'servidores'],
    mutationFn: async ({ tipoBusca, cpf, codigoOrgao, nome }) => {
      const params: Record<string, string> = {};
      if (tipoBusca === 'por-cpf' && cpf) {
        params.cpf = cpf;
      } else if (tipoBusca === 'por-orgao' && codigoOrgao) {
        params.orgaoServidorLotacao = codigoOrgao;
      } else if (tipoBusca === 'geral') {
        if (nome) params.nome = nome;
        if (cpf) params.cpf = cpf;
      }
      const json = await api.get<any>('/portal-transparencia/servidores', params);
      return Array.isArray(json) ? json : [json].filter(Boolean);
    },
    searchLabel: 'Portal - Servidores',
    searchRoute: '/portal',
    searchId: 'portal-servidores',
  });
}

export function useDespesasSearch() {
  return useSearchMutation<
    {
      tipoBusca: string;
      ano: string;
      codigoOrgao: string;
      nomeFavorecido: string;
      uf: string;
    },
    any[]
  >({
    mutationKey: ['portal', 'despesas'],
    mutationFn: async ({ tipoBusca, ano, codigoOrgao, nomeFavorecido, uf }) => {
      let endpoint = '/portal-transparencia/despesas/recursos-recebidos';
      const params: Record<string, string> = { pagina: '1' };
      if (tipoBusca === 'recursos-recebidos') {
        if (ano) {
          params.mesAnoInicio = `${ano}-01`;
          params.mesAnoFim = `${ano}-12`;
        }
        if (nomeFavorecido) params.nomeFavorecido = nomeFavorecido;
        if (uf) params.uf = uf;
      } else if (tipoBusca === 'por-orgao') {
        endpoint = '/portal-transparencia/despesas/por-orgao';
        if (ano) params.ano = ano;
        if (codigoOrgao) params.orgao = codigoOrgao;
      }
      const json = await api.get<any>(endpoint, params);
      return Array.isArray(json) ? json : [json].filter(Boolean);
    },
    searchLabel: 'Portal - Despesas',
    searchRoute: '/portal',
    searchId: 'portal-despesas',
  });
}

export function useEmendasSearch() {
  return useSearchMutation<
    { codigoEmenda: string; numeroEmenda: string; nomeAutor: string; tipoEmenda: string; ano: string },
    any[]
  >({
    mutationKey: ['portal', 'emendas'],
    mutationFn: async ({ codigoEmenda, numeroEmenda, nomeAutor, tipoEmenda, ano }) => {
      const params: Record<string, string> = { pagina: '1' };
      if (codigoEmenda) params.codigoEmenda = codigoEmenda;
      if (numeroEmenda) params.numeroEmenda = numeroEmenda;
      if (nomeAutor) params.nomeAutor = nomeAutor;
      if (tipoEmenda) params.tipoEmenda = tipoEmenda;
      if (ano) params.ano = ano;
      return api.get<any[]>('/portal-transparencia/emendas', params);
    },
    searchLabel: 'Portal - Emendas',
    searchRoute: '/portal',
    searchId: 'portal-emendas',
  });
}
