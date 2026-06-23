import type { Candidato } from '../model/types';

interface CandidateCardProps {
  c: Candidato;
  onIdClick?: (key: string, value: string) => void;
}

export function CandidateCard({ c, onIdClick }: CandidateCardProps) {
  return (
    <div className="bcard">
      <div className="bcard-topo">
        <span className="bcard-tag tag-candidato">Candidato</span>
        <span className={`bcard-status ${c.eleito ? 'eleito' : 'nao-eleito'}`}>
          {c.eleito ? 'Eleito' : 'Não Eleito'}
        </span>
      </div>
      <div className="bcard-body">
        <div className="bcard-field"><span className="bcard-label">Nome</span><span className="bcard-value">{c.nome_completo}</span></div>
        <div className="bcard-field"><span className="bcard-label">Nome Urna</span><span className="bcard-value">{c.nome_urna}</span></div>
        <div className="bcard-field"><span className="bcard-label">CPF</span><span className="bcard-value">{c.cpf}</span></div>
        <div className="bcard-field"><span className="bcard-label">Nº</span><span className="bcard-value">{c.numero_candidato}</span></div>
        <div className="bcard-field"><span className="bcard-label">Cargo</span><span className="bcard-value">{c.cargo_nome}</span></div>
        <div className="bcard-field"><span className="bcard-label">UF</span><span className="bcard-value">{c.sg_uf}</span></div>
        {c.partido && (
          <div className="bcard-field"><span className="bcard-label">Partido</span><span className="bcard-value">{c.partido.sigla} - {c.partido.nome}</span></div>
        )}
      </div>
    </div>
  );
}
