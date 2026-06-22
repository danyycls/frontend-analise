export default function SecaoGeralDeputado({ deputado }) {
  if (!deputado) return null;
  const u = deputado.ultimoStatus || {};
  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Informações Gerais</h3>
      <div className="ad-info-grid">
        <div className="ad-info-item">
          <span className="ad-info-label">Nome Civil</span>
          <span className="ad-info-value">{deputado.nomeCivil || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">CPF</span>
          <span className="ad-info-value">{fmtDoc(deputado.cpf)}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Data de Nascimento</span>
          <span className="ad-info-value">{deputado.dataNascimento || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Sexo</span>
          <span className="ad-info-value">{deputado.sexo || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">UF de Nascimento</span>
          <span className="ad-info-value">{deputado.ufNascimento || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Município</span>
          <span className="ad-info-value">{deputado.municipioNascimento || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Escolaridade</span>
          <span className="ad-info-value">{deputado.escolaridade || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Partido</span>
          <span className="ad-info-value">{u.siglaPartido || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">UF</span>
          <span className="ad-info-value">{u.siglaUf || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Situação</span>
          <span className="ad-info-value">{u.situacao || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Condição Eleitoral</span>
          <span className="ad-info-value">{u.condicaoEleitoral || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Email</span>
          <span className="ad-info-value">{u.email || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Gabinete</span>
          <span className="ad-info-value">
            {u.gabinete ? `${u.gabinete.nome || ''} ${u.gabinete.predio || ''} ${u.gabinete.sala || ''}`.trim() || '-' : '-'}
          </span>
        </div>
        {deputado.urlWebsite && (
          <div className="ad-info-item ad-info-item-full">
            <span className="ad-info-label">Website</span>
            <span className="ad-info-value">
              <a href={deputado.urlWebsite} target="_blank" rel="noopener noreferrer" className="ad-link">{deputado.urlWebsite}</a>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtDoc(d) {
  if (!d) return '';
  const s = String(d).replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return String(d);
}
