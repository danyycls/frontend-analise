import { api } from '@/shared/api/client'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { listenWebSocket } from './web-socket'
import type { MutableRefObject } from 'react'

export async function startUFMunicipioAnalise(
  tipo: string,
  uf: string,
  codigoMunicipio: string,
  dataInicial: string,
  dataFinal: string,
  cancelRef: MutableRefObject<boolean>,
): Promise<any[]> {
  const resp = await api.post<{ jobId: string }>(ENDPOINTS.UF_MUNICIPIO_ANALISE_START, {
    tipo,
    uf,
    codigo_municipio_ibge: tipo === 'municipio' ? codigoMunicipio : '',
    data_inicial: dataInicial,
    data_final: dataFinal,
  })
  return (await listenWebSocket(resp.jobId, 'uf_municipio_analise', cancelRef)) || []
}

export async function startOrgaoAnalise(
  cnpj: string,
  dataInicial: string,
  dataFinal: string,
  cancelRef: MutableRefObject<boolean>,
): Promise<any[]> {
  const resp = await api.post<{ jobId: string }>(ENDPOINTS.ORGAO_ANALISE_START, {
    cnpjs: [cnpj],
    dataInicial,
    dataFinal,
  })
  return (await listenWebSocket(resp.jobId, 'orgao_analise', cancelRef)) || []
}
