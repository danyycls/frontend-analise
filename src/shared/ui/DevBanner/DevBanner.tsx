import { Link } from 'react-router-dom';

export default function DevBanner() {
  return (
    <div className="dev-banner">
      <div className="dev-banner-content">
        <strong>⚠️ Ambiente de Desenvolvimento</strong>
        <p>
          Olá! Esta plataforma é um projeto de estudo em desenvolvimento, e esta é uma versão de
          visualização. Os dados do TSE não estão disponíveis neste ambiente no momento devido aos
          custos de infraestrutura.
        </p>
        <p>
          👨‍💻 <strong>Desenvolvedor(a)?</strong> Os repositórios do projeto estão na página{' '}
          <Link to="/wiki">Entenda a Ferramenta</Link> — você pode clonar, popular um banco local e
          explorar os dados com análises completas.
        </p>
        <p>
          🔍 <strong>Curioso(a)?</strong> Veja na página de{' '}
          <Link to="/anomalias-encontradas">Anomalias Encontradas</Link> que tipo de descobertas esta
          ferramenta pode revelar.
        </p>
        <p>
          💬 <strong>Tem sugestões?</strong> Sua opinião é muito bem-vinda! Compartilhe seu feedback
          na página de <Link to="/feedback">Feedback</Link>.
        </p>
      </div>
    </div>
  );
}
