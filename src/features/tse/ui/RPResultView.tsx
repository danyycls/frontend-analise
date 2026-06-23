import type { TseEmpresaResult } from '../model/types';
import { fmtDoc, fmtVal } from '@/shared/lib/formatters';

interface RPResultViewProps {
  data: TseEmpresaResult;
  onIdClick?: (key: string, value: string) => void;
}

export function RPResultView({ data, onIdClick }: RPResultViewProps) {
  return (
    <>
      <div className="rp-sumario">
        <div className="rp-sumario-item">
          <span className="rp-sumario-valor">{data.total_despesas}</span>
          <span className="rp-sumario-label">Despesas</span>
        </div>
        <div className="rp-sumario-item">
          <span className="rp-sumario-valor">{data.total_receitas}</span>
          <span className="rp-sumario-label">Receitas</span>
        </div>
      </div>

      {data.fornecedor && (
        <div className="rp-entity-card clickable" onClick={() => onIdClick?.('cpf_cnpj', data.fornecedor!.cpf_cnpj)}>
          <span className="rp-entity-tag tag-fornecedor">Fornecedor</span>
          <span className="rp-entity-name">{data.fornecedor.nome || data.fornecedor.cpf_cnpj}</span>
          <span className="rp-entity-doc">{fmtDoc(data.fornecedor.cpf_cnpj)}</span>
        </div>
      )}

      {data.doador && (
        <div className="rp-entity-card clickable" onClick={() => onIdClick?.('cpf_cnpj_doador', data.doador!.cpf_cnpj)}>
          <span className="rp-entity-tag tag-doador">Doador</span>
          <span className="rp-entity-name">{data.doador.nome || data.doador.cpf_cnpj}</span>
          <span className="rp-entity-doc">{fmtDoc(data.doador.cpf_cnpj)}</span>
        </div>
      )}

      {data.despesas.length > 0 && (
        <div className="rp-lista">
          <h3 className="rp-lista-title">Despesas ({data.despesas.length})</h3>
          <div className="rp-cards">
            {data.despesas.map((d, i) => (
              <div key={i} className="rp-card rp-card-despesa">
                <div className="rp-card-topo">
                  <span className="rp-card-tag tag-despesa">Despesa</span>
                  <span className="rp-card-tipo">{d.tipo === 'candidato' ? 'Candidato' : 'Partido'}</span>
                  <span className="rp-card-valor">{fmtVal(d.valor)}</span>
                </div>
                <div className="rp-card-body">
                  <div className="rp-card-field">
                    <span className="rp-card-label">SQ</span>
                    <span className="rp-card-value rp-id-link" onClick={() => onIdClick?.('sq_despesa', String(d.sq_despesa))}>{d.sq_despesa}</span>
                  </div>
                  <div className="rp-card-field">
                    <span className="rp-card-label">Data</span>
                    <span className="rp-card-value">{d.data_despesa || '-'}</span>
                  </div>
                  <div className="rp-card-field rp-card-field-full">
                    <span className="rp-card-label">Descrição</span>
                    <span className="rp-card-value">{d.descricao || '-'}</span>
                  </div>
                  <div className="rp-card-field">
                    <span className="rp-card-label">Origem</span>
                    <span className="rp-card-value">{d.origem_despesa_descricao || '-'}</span>
                  </div>
                  {d.candidato && (
                    <div className="rp-card-field">
                      <span className="rp-card-label">Candidato</span>
                      <span className="rp-card-value rp-id-link" onClick={() => onIdClick?.('sq_candidato', String(d.candidato!.sq_candidato))}>{d.candidato.sq_candidato}</span>
                    </div>
                  )}
                  {d.partido && (
                    <div className="rp-card-field">
                      <span className="rp-card-label">Partido</span>
                      <span className="rp-card-value">{d.partido.sigla} - {d.partido.nome}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.receitas.length > 0 && (
        <div className="rp-lista">
          <h3 className="rp-lista-title">Receitas ({data.receitas.length})</h3>
          <div className="rp-cards">
            {data.receitas.map((r, i) => (
              <div key={i} className="rp-card rp-card-receita">
                <div className="rp-card-topo">
                  <span className="rp-card-tag tag-receita">Receita</span>
                  <span className="rp-card-tipo">{r.tipo === 'candidato' ? 'Candidato' : 'Partido'}</span>
                  <span className="rp-card-valor">{fmtVal(r.valor)}</span>
                </div>
                <div className="rp-card-body">
                  <div className="rp-card-field">
                    <span className="rp-card-label">SQ</span>
                    <span className="rp-card-value rp-id-link" onClick={() => onIdClick?.('sq_receita', String(r.sq_receita))}>{r.sq_receita}</span>
                  </div>
                  <div className="rp-card-field">
                    <span className="rp-card-label">Data</span>
                    <span className="rp-card-value">{r.data_receita || '-'}</span>
                  </div>
                  <div className="rp-card-field rp-card-field-full">
                    <span className="rp-card-label">Descrição</span>
                    <span className="rp-card-value">{r.descricao || '-'}</span>
                  </div>
                  <div className="rp-card-field">
                    <span className="rp-card-label">Origem</span>
                    <span className="rp-card-value">{r.origem_receita_descricao || '-'}</span>
                  </div>
                  {r.candidato && (
                    <div className="rp-card-field">
                      <span className="rp-card-label">Candidato</span>
                      <span className="rp-card-value rp-id-link" onClick={() => onIdClick?.('sq_candidato', String(r.candidato!.sq_candidato))}>{r.candidato.sq_candidato}</span>
                    </div>
                  )}
                  {r.partido && (
                    <div className="rp-card-field">
                      <span className="rp-card-label">Partido</span>
                      <span className="rp-card-value">{r.partido.sigla} - {r.partido.nome}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.despesas.length === 0 && data.receitas.length === 0 && (
        <p className="rp-empty">Nenhuma despesa ou receita encontrada para este CNPJ.</p>
      )}
    </>
  );
}
