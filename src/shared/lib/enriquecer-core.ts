import { extrairCnpjsDosContratos } from './extrair-cnpjs-contratos'
import type { MutableRefObject } from 'react'

type FetchOrgaoFn = (cnpj: string) => Promise<any[]>

export async function enriquecerCore(
  contratos: any[],
  fetchOrgao: FetchOrgaoFn,
  cancelRef: MutableRefObject<boolean>,
): Promise<any[]> {
  const cnpjs = extrairCnpjsDosContratos(contratos)
  if (cnpjs.length === 0) return contratos

  const enriquecidos: any[] = []
  for (let i = 0; i < cnpjs.length; i++) {
    if (cancelRef.current) break
    const c = await fetchOrgao(cnpjs[i])
    enriquecidos.push(...c)
  }

  if (cancelRef.current) return contratos
  return enriquecidos.length > 0 ? enriquecidos : contratos
}
