import { fmtDoc } from '@/shared/lib/formatters';
import TabelaGen from '@/shared/ui/TabelaGen/TabelaGen';

function InfoItem({ label, value }: { label: string; value: any }) {
  if (value == null || value === '') return null;
  return (
    <div className="ad-info-item">
      <span className="ad-info-label">{label}</span>
      <span className="ad-info-value">{String(value)}</span>
    </div>
  );
}

function InfoItemFull({ label, value }: { label: string; value: any }) {
  if (value == null || value === '') return null;
  return (
    <div className="ad-info-item ad-info-item-full">
      <span className="ad-info-label">{label}</span>
      <span className="ad-info-value">{String(value)}</span>
    </div>
  );
}

interface SecaoGeralSenadorProps {
  senador: Record<string, any>;
}

export default function SecaoGeralSenador({ senador }: SecaoGeralSenadorProps) {
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
        <InfoItem label="Nome Completo" value={dados.NomeCompletoParlamentar} />
        <InfoItem label="Nome Parlamentar" value={dados.NomeParlamentar} />
        <InfoItem label="CPF" value={fmtDoc(dados.CpfParlamentar)} />
        <InfoItem label="Data Nascimento" value={dados.DataNascimento} />
        <InfoItem label="UF" value={ident.UfParlamentar} />
        <InfoItem label="Partido" value={ident.SiglaPartidoParlamentar} />
        <InfoItem label="Bloco" value={bloco.NomeBloco || bloco.SiglaBloco} />
        <InfoItem label="Email" value={ident.EmailParlamentar} />
        <InfoItem label="Forma Tratamento" value={ident.FormaTratamento} />
      </div>

      {telefones.length > 0 && (
        <div className="ad-section">
          <h4 className="ad-section-subtitle">Telefones</h4>
          {telefones.map((t: any, i: number) => (
            <InfoItem key={i} label={t.NumeroTelefone} value={t.NomeTipoTelefone} />
          ))}
        </div>
      )}

      {servicos.length > 0 && (
        <div className="ad-section">
          <h4 className="ad-section-subtitle">Serviços</h4>
          <TabelaGen
            cabecalhos={['Serviço', 'Nome', 'Descrição']}
            linhas={servicos.map((s: any) => [
              s.NomeServico || '-',
              s.NomeServico || '-',
              s.DescricaoServico || '-',
            ])}
          />
        </div>
      )}
    </div>
  );
}
