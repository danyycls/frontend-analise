import { useState } from 'react'

export function usePaginacao<T>(dados: T[], itensPorPagina = 10) {
  const [pagina, setPagina] = useState(0)
  const arr = dados || []
  const totalPaginas = Math.max(1, Math.ceil(arr.length / itensPorPagina))
  const inicio = pagina * itensPorPagina
  const paginaDados = arr.slice(inicio, inicio + itensPorPagina)
  return { pagina, setPagina, totalPaginas, paginaDados }
}
