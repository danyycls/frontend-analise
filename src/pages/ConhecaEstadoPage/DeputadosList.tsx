// @ts-nocheck
import React, { useState } from 'react';

// Card de deputado estilizado com neon
function DeputyCard({ deputy }) {
  return (
    <div className="deputado-card neon-card">
      <div className="deputado-name">{deputy.nome || '-'}</div>
      <div className="deputado-party">{deputy.sigla_partido || '-'}</div>
    </div>
  );
}

export default function DeputadosList({ deputados, pageSize = 20 }) {
  // controla se a lista está expandida ou colapsada
  const [expanded, setExpanded] = useState(false);
  // controla a página atual da paginação
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(deputados.length / pageSize));

  const start = page * pageSize;
  const pageData = deputados.slice(start, start + pageSize);

  // animação de fade ao mudar de página
  const fadeStyle = {
    transition: 'opacity 0.3s ease',
    opacity: 1,
  };

  return (
    <section className="neon-section">
      <div className="deputados-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="neon-title">Deputados</h2>
        <button className="neon-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? '▲' : '▼'} {expanded ? 'Recolher' : 'Expandir'}
        </button>
      </div>
      {expanded && (
        <>
          <div className="deputados-grid" style={fadeStyle}>
            {pageData.map((d, i) => (
              <DeputyCard key={i} deputy={d} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="deputados-paginacao">
              <button className="pagina-btn neon-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
                ◀
              </button>
              <span className="pagina-info">
                {page + 1} / {totalPages}
              </span>
              <button className="pagina-btn neon-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                ▶
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
