import { normalizarCNPJ } from './formatters'

export function toggleCnpj(cnpj: string, prev: string[]): string[] {
  const norm = normalizarCNPJ(cnpj)
  const prevNorm = prev.map(normalizarCNPJ)
  return prevNorm.includes(norm)
    ? prev.filter((_, i) => prevNorm[i] !== norm)
    : [...prev, cnpj]
}

export function selectAllCnpj(cnpjs: string[], current: string[]): string[] {
  const set = new Set(current.map(normalizarCNPJ))
  const novos = cnpjs.filter(c => !set.has(normalizarCNPJ(c)))
  return [...current, ...novos]
}

export function normalizarCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}
