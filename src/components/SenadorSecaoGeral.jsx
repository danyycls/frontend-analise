import TabelaGen from './TabelaGen';

export default function SecaoGeralSenador({ senador }) {
  if (!senador) return null;
  const ident = senador.IdentificacaoParlamentar || {};
  const dados = senador.DadosBasicosParlamentar || {};
  const telefones = senador.Telefones?.Telefone || ident.Telefones?.Telefone || [];
  const bloco = ident.Bloco || {};
  const servicos = senador.OutrasInformacoes?.Servico || [];

  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Informações Gerais</h3>
      <div className="ad-info-grid">
        <InfoItem label="Código" value={ident.CodigoParlamentar} />
        <InfoItem label="Código Público" value={ident.CodigoPublicoNaLegAtual} />
        <InfoItem label="Nome Completo" value={ident.NomeCompletoParlamentar} />
        <InfoItem label="Nome Parlamentar" value={ident.NomeParlamentar} />
        <InfoItem label="Forma Tratamento" value={ident.FormaTratamento} />
        <InfoItem label="Sexo" value={ident.SexoParlamentar} />
        <InfoItem label="Nascimento" value={dados.DataNascimento} />
        <InfoItem label="Naturalidade" value={dados.Naturalidade ? `${dados.Naturalidade}/${dados.UfNaturalidade}` : null} />
        <InfoItem label="Partido" value={ident.SiglaPartidoParlamentar} />
        <InfoItem label="UF" value={ident.UfParlamentar} />
        <InfoItem label="Email" value={ident.EmailParlamentar} />
        <InfoItem label="Membro Mesa" value={ident.MembroMesa} />
        <InfoItem label="Membro Liderança" value={ident.MembroLideranca} />
        <InfoItemFull label="Endereço" value={dados.EnderecoParlamentar} />
        {ident.UrlPaginaParlamentar && (
          <div className="ad-info-item ad-info-item-full">
            <span className="ad-info-label">Página</span>
            <span className="ad-info-value">
              <a href={ident.UrlPaginaParlamentar} target="_blank" rel="noopener noreferrer" className="ad-link">{ident.UrlPaginaParlamentar}</a>
            </span>
          </div>
        )}
      </div>
      {telefones.length > 0 && (
        <><h3 className="ad-section-title" style={{ marginTop: 20 }}>Telefones</h3>
        <TabelaGen cabecalhos={['Número', 'Ordem', 'Fax']} linhas={telefones.map(t => [t.NumeroTelefone, t.OrdemPublicacao, t.IndicadorFax])} /></>
      )}
      {bloco.CodigoBloco && (
        <><h3 className="ad-section-title" style={{ marginTop: 20 }}>Bloco Parlamentar</h3>
        <div className="ad-info-grid">
          <InfoItem label="Código" value={bloco.CodigoBloco} />
          <InfoItem label="Nome" value={bloco.NomeBloco} />
          <InfoItem label="Apelido" value={bloco.NomeApelido} />
          <InfoItem label="Criação" value={bloco.DataCriacao} />
        </div></>
      )}
      {servicos.length > 0 && (
        <><h3 className="ad-section-title" style={{ marginTop: 20 }}>Serviços Vinculados</h3>
        <div className="ad-card-grid">
          {servicos.map((s, i) => (
            <div key={i} className="ad-card">
              <div className="ad-card-header">{s.NomeServivo || '-'}</div>
              <div className="ad-card-body">
                <div className="ad-card-row"><span className="ad-card-label">Descrição:</span> {s.DescricaoServico || '-'}</div>
                {s.UrlServico && <div className="ad-card-row"><span className="ad-card-label">URL:</span> <a href={s.UrlServico} target="_blank" rel="noopener noreferrer" className="ad-link">{s.UrlServico}</a></div>}
              </div>
            </div>
          ))}
        </div></>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="ad-info-item">
      <span className="ad-info-label">{label}</span>
      <span className="ad-info-value">{String(value)}</span>
    </div>
  );
}

function InfoItemFull({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="ad-info-item ad-info-item-full">
      <span className="ad-info-label">{label}</span>
      <span className="ad-info-value">{String(value)}</span>
    </div>
  );
}
