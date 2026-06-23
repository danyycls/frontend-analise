interface CardGridOrgaosDeputadoProps {
  dados: Array<Record<string, any>>;
}

export default function CardGridOrgaosDeputado({ dados }: CardGridOrgaosDeputadoProps) {
  if (!dados || dados.length === 0) return <p className="ad-empty">Nenhum órgão encontrado.</p>;
  return (
    <div className="ad-card-grid">
      {dados.map((o, i) => (
        <div key={i} className="ad-card">
          <div className="ad-card-header">
            {o.siglaOrgao ? <span className="ad-card-tag ad-card-tag-orgao">{o.siglaOrgao}</span> : null}
            {o.nomeOrgao || '-'}
          </div>
          <div className="ad-card-body">
            <div className="ad-card-row">
              <span className="ad-card-label">Título:</span> {o.titulo || '-'}
            </div>
            <div className="ad-card-row">
              <span className="ad-card-label">Período:</span> {o.dataInicio || '-'} {o.dataFim ? `~ ${o.dataFim}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
