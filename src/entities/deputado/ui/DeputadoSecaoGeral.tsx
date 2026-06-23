import { fmtDoc } from '@/shared/lib/formatters';

interface SecaoGeralDeputadoProps {
  deputado: Record<string, any>;
}

export default function SecaoGeralDeputado({ deputado }: SecaoGeralDeputadoProps) {
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
          <span className="ad-info-label">UF Nascimento</span>
          <span className="ad-info-value">{deputado.ufNascimento || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Município Nascimento</span>
          <span className="ad-info-value">{deputado.municipioNascimento || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Escolaridade</span>
          <span className="ad-info-value">{deputado.escolaridade || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Email</span>
          <span className="ad-info-value">{u.email || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Gabinete</span>
          <span className="ad-info-value">{deputado.gabinete?.nome || '-'}</span>
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
      </div>
    </div>
  );
}
