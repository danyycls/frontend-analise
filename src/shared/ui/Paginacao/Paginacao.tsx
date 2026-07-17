interface PaginacaoProps {
  pagina: number
  totalPaginas: number
  onPagina: (p: number) => void
}

export default function Paginacao({ pagina, totalPaginas, onPagina }: PaginacaoProps) {
  if (totalPaginas <= 1) return null
  return (
    <div className="dm-paginacao">
      <button className="pagina-btn" disabled={pagina === 0} onClick={() => onPagina(pagina - 1)}>◀</button>
      <span className="pagina-info">{pagina + 1} / {totalPaginas}</span>
      <button className="pagina-btn" disabled={pagina >= totalPaginas - 1} onClick={() => onPagina(pagina + 1)}>▶</button>
    </div>
  )
}
