// @ts-nocheck
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from '@/shared/api/client';
import { extrairDocumentosDosContratos } from '@/shared/lib/extrair-documentos-contratos';
import './LigacaoPolitica.css';

function fmtDoc(d) {
  if (!d) return '-';
  const s = d.replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return d;
}

const TIPO_ROTULO = {
  candidato: 'Candidato',
  fornecedor: 'Fornecedor',
  prestador_contas: 'Prestador de Contas',
  tcu_contas_irregulares: 'TCU: Contas Irregulares',
  tcu_inabilitado: 'TCU: Inabilitado',
  tcu_inidoneo: 'TCU: Inidôneo',
  servidor_publico: 'Servidor Público',
};

function TextExpand({ text, maxLen = 80 }) {
  const [expandido, setExpandido] = useState(false);
  if (!text) return null;
  const str = String(text);
  if (str.length <= maxLen) return <>{str}</>;
  return (
    <span
      className="lp-text-expand"
      onClick={(e) => { e.stopPropagation(); setExpandido(!expandido); }}
      title={expandido ? 'Clique para reduzir' : 'Clique para ver texto completo'}
    >
      {expandido ? str : str.slice(0, maxLen) + '...'}
      <span className="lp-text-expand-toggle">{expandido ? ' ▲ menos' : ' ▼ mais'}</span>
    </span>
  );
}

const TIPO_COR = {
  candidato: 'tag-candidato',
  fornecedor: 'tag-fornecedor',
  prestador_contas: 'tag-prestador',
  tcu_contas_irregulares: 'tag-tcu',
  tcu_inabilitado: 'tag-tcu',
  tcu_inidoneo: 'tag-tcu',
  servidor_publico: 'tag-servidor',
};

function fmtVal(v) {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Nao';
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return v.toLocaleString('pt-BR');
    return v.toFixed(2);
  }
  return String(v) || '-';
}

function fLabel(k) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const SKIP_KEYS_VINC = new Set(['id', 'created_at', 'updated_at', 'deleted_at']);

function VinculoDetalhesView({ detalhes, onIdClick }) {
  const [aberto, setAberto] = useState(false);
  if (!detalhes) return null;
  const sections = [];
  if (detalhes.fornecedor) sections.push({ tipo: 'fornecedor', label: 'Fornecedor', data: detalhes.fornecedor });
  if (detalhes.doador) sections.push({ tipo: 'doador', label: 'Doador', data: { doador: detalhes.doador } });
  const rc = detalhes.receitas_candidato || [];
  const rop = detalhes.receitas_orgao_partidario || [];
  const tcuCI = detalhes.contas_irregulares || [];
  const tcuINAB = detalhes.inabilitados || [];
  const tcuINID = detalhes.inidoneos || [];
  const servPub = detalhes.servidores_publicos || [];
  const hasReceitas = rc.length > 0 || rop.length > 0;
  const hasTCU = tcuCI.length > 0 || tcuINAB.length > 0 || tcuINID.length > 0;
  const hasServPub = servPub.length > 0;

  return (
    <div className="lp-vinc-detalhes">
      <div
        className="lp-vinc-detalhes-toggle"
        onClick={(e) => { e.stopPropagation(); setAberto(!aberto); }}
      >
        <span className="seta-small">{aberto ? '▼' : '▶'}</span>
        <span className="lp-vinc-detalhes-label">Detalhes do Vinculo</span>
        <span className="lp-vinc-detalhes-count">
          {sections.length + (rc.length > 0 ? 1 : 0) + (rop.length > 0 ? 1 : 0) + (hasTCU ? 1 : 0) + (hasServPub ? 1 : 0)} secoes
        </span>
      </div>
      {aberto && (
        <div className="lp-vinc-detalhes-body">
          {detalhes.fornecedor && (
            <div className="lp-vinc-secao">
              <span className="lp-vinc-secao-title">Fornecedor</span>
              <div className="lp-vinc-grid">
                {Object.entries(detalhes.fornecedor.fornecedor || {}).filter(([k]) => !SKIP_KEYS_VINC.has(k) && typeof (detalhes.fornecedor.fornecedor || {})[k] !== 'object').map(([k, v]) => (
                  <div key={k} className="lp-vinc-campo">
                    <span className="lp-vinc-rotulo">{fLabel(k)}</span>
                    <span className="lp-vinc-valor">{fmtVal(v)}</span>
                  </div>
                ))}
              </div>
              {(detalhes.fornecedor.despesas_candidato || []).length > 0 && (
                <div className="lp-vinc-subsec">
                  <span className="lp-vinc-secao-subtitle">Despesas como Candidato ({detalhes.fornecedor.despesas_candidato.length})</span>
                  <div className="lp-vinc-sub-items">
                    {detalhes.fornecedor.despesas_candidato.slice(0, 5).map((dc, i) => (
                      <div key={i} className="lp-vinc-sub-item">
                        <span>{dc.descricao_de_vinculo || dc.despesa?.descricao || '-'}</span>
                        <span className="lp-vinc-valor-mono">{fmtVal(dc.despesa?.valor)}</span>
                      </div>
                    ))}
                    {detalhes.fornecedor.despesas_candidato.length > 5 && (
                      <span className="lp-vinc-mais">+{detalhes.fornecedor.despesas_candidato.length - 5} mais</span>
                    )}
                  </div>
                </div>
              )}
              {(detalhes.fornecedor.despesas_orgao_partidario || []).length > 0 && (
                <div className="lp-vinc-subsec">
                  <span className="lp-vinc-secao-subtitle">Despesas como Partido ({detalhes.fornecedor.despesas_orgao_partidario.length})</span>
                  <div className="lp-vinc-sub-items">
                    {detalhes.fornecedor.despesas_orgao_partidario.slice(0, 5).map((dp, i) => (
                      <div key={i} className="lp-vinc-sub-item">
                        <span>{dp.descricao_de_vinculo || dp.despesa?.descricao || '-'}</span>
                        <span className="lp-vinc-valor-mono">{fmtVal(dp.despesa?.valor)}</span>
                      </div>
                    ))}
                    {detalhes.fornecedor.despesas_orgao_partidario.length > 5 && (
                      <span className="lp-vinc-mais">+{detalhes.fornecedor.despesas_orgao_partidario.length - 5} mais</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {detalhes.doador && (
            <div className="lp-vinc-secao">
              <span className="lp-vinc-secao-title">Doador</span>
              <div className="lp-vinc-grid">
                {Object.entries(detalhes.doador).filter(([k]) => !SKIP_KEYS_VINC.has(k) && typeof detalhes.doador[k] !== 'object').map(([k, v]) => (
                  <div key={k} className="lp-vinc-campo">
                    <span className="lp-vinc-rotulo">{fLabel(k)}</span>
                    <span className="lp-vinc-valor">{fmtVal(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {rc.length > 0 && (
            <div className="lp-vinc-secao">
              <span className="lp-vinc-secao-title">Receitas de Candidato ({rc.length})</span>
              <div className="lp-vinc-sub-items">
                {rc.slice(0, 5).map((r, i) => (
                  <div key={i} className="lp-vinc-sub-item">
                    <span>{r.descricao || '-'}</span>
                    <span className="lp-vinc-valor-mono">{fmtVal(r.valor)}</span>
                    {r.data_receita && <span className="lp-vinc-data">{r.data_receita}</span>}
                  </div>
                ))}
                {rc.length > 5 && <span className="lp-vinc-mais">+{rc.length - 5} mais</span>}
              </div>
            </div>
          )}
          {rop.length > 0 && (
            <div className="lp-vinc-secao">
              <span className="lp-vinc-secao-title">Receitas de Orgao Partidario ({rop.length})</span>
              <div className="lp-vinc-sub-items">
                {rop.slice(0, 5).map((r, i) => (
                  <div key={i} className="lp-vinc-sub-item">
                    <span>{r.descricao || '-'}</span>
                    <span className="lp-vinc-valor-mono">{fmtVal(r.valor)}</span>
                    {r.data_receita && <span className="lp-vinc-data">{r.data_receita}</span>}
                  </div>
                ))}
                {rop.length > 5 && <span className="lp-vinc-mais">+{rop.length - 5} mais</span>}
              </div>
            </div>
          )}
          {hasTCU && (
            <div className="lp-vinc-secao">
              <span className="lp-vinc-secao-title">TCU</span>
              {tcuCI.length > 0 && (
                <div className="lp-vinc-subsec">
                  <span className="lp-vinc-secao-subtitle">Contas Julgadas Irregulares ({tcuCI.length})</span>
                  <div className="lp-vinc-sub-items">
                    {tcuCI.slice(0, 5).map((r, i) => (
                      <div key={i} className="lp-vinc-sub-item">
                        <span>{r.nome || '-'}</span>
                        {r.numeroProcessoFormatado && <span className="lp-vinc-valor-mono">{r.numeroProcessoFormatado}</span>}
                      </div>
                    ))}
                    {tcuCI.length > 5 && <span className="lp-vinc-mais">+{tcuCI.length - 5} mais</span>}
                  </div>
                </div>
              )}
              {tcuINAB.length > 0 && (
                <div className="lp-vinc-subsec">
                  <span className="lp-vinc-secao-subtitle">Inabilitados ({tcuINAB.length})</span>
                  <div className="lp-vinc-sub-items">
                    {tcuINAB.slice(0, 5).map((r, i) => (
                      <div key={i} className="lp-vinc-sub-item">
                        <span>{r.nome || '-'}</span>
                        {r.numeroProcessoFormatado && <span className="lp-vinc-valor-mono">{r.numeroProcessoFormatado}</span>}
                      </div>
                    ))}
                    {tcuINAB.length > 5 && <span className="lp-vinc-mais">+{tcuINAB.length - 5} mais</span>}
                  </div>
                </div>
              )}
              {tcuINID.length > 0 && (
                <div className="lp-vinc-subsec">
                  <span className="lp-vinc-secao-subtitle">Inidôneos ({tcuINID.length})</span>
                  <div className="lp-vinc-sub-items">
                    {tcuINID.slice(0, 5).map((r, i) => (
                      <div key={i} className="lp-vinc-sub-item">
                        <span>{r.nome || '-'}</span>
                        {r.numeroProcessoFormatado && <span className="lp-vinc-valor-mono">{r.numeroProcessoFormatado}</span>}
                      </div>
                    ))}
                    {tcuINID.length > 5 && <span className="lp-vinc-mais">+{tcuINID.length - 5} mais</span>}
                  </div>
                </div>
              )}
            </div>
          )}
          {hasServPub && (
            <div className="lp-vinc-secao">
              <span className="lp-vinc-secao-title">Servidor Público (Portal da Transparência)</span>
              {servPub.map((s, i) => {
                const serv = s.servidor || {};
                const pes = serv.pessoa || {};
                const orgaoLot = serv.orgaoServidorLotacao || {};
                const orgaoExe = serv.orgaoServidorExercicio || {};
                const func = serv.funcao || {};
                return (
                  <div key={i} className="lp-vinc-subsec">
                    <span className="lp-vinc-secao-subtitle">Registro #{i + 1}</span>
                    <div className="lp-vinc-grid">
                      <div className="lp-vinc-campo">
                        <span className="lp-vinc-rotulo">Nome</span>
                        <span className="lp-vinc-valor">{pes.nome || '-'}</span>
                      </div>
                      <div className="lp-vinc-campo">
                        <span className="lp-vinc-rotulo">CPF</span>
                        <span className="lp-vinc-valor">{fmtDoc(pes.cpfFormatado || pes.cpf || pes.numeroInscricaoSocial)}</span>
                      </div>
                      <div className="lp-vinc-campo">
                        <span className="lp-vinc-rotulo">Tipo Servidor</span>
                        <span className="lp-vinc-valor">{serv.tipoServidor || '-'}</span>
                      </div>
                      <div className="lp-vinc-campo">
                        <span className="lp-vinc-rotulo">Situação</span>
                        <span className="lp-vinc-valor">{serv.situacao || '-'}</span>
                      </div>
                      <div className="lp-vinc-campo">
                        <span className="lp-vinc-rotulo">Órgão Lotação</span>
                        <span className="lp-vinc-valor">{orgaoLot.nome || orgaoLot.sigla || '-'}</span>
                      </div>
                      <div className="lp-vinc-campo">
                        <span className="lp-vinc-rotulo">Órgão Exercício</span>
                        <span className="lp-vinc-valor">{orgaoExe.nome || orgaoExe.sigla || '-'}</span>
                      </div>
                      <div className="lp-vinc-campo">
                        <span className="lp-vinc-rotulo">Função / Cargo</span>
                        <span className="lp-vinc-valor">{func.descricaoFuncaoCargo || '-'}</span>
                      </div>
                      <div className="lp-vinc-campo">
                        <span className="lp-vinc-rotulo">Matrícula</span>
                        <span className="lp-vinc-valor">{serv.codigoMatriculaFormatado || '-'}</span>
                      </div>
                    </div>
                    {s.fichasCargoEfetivo && s.fichasCargoEfetivo.length > 0 && (
                      <details className="lp-vinc-subsec" style={{ marginTop: 8 }}>
                        <summary className="lp-vinc-secao-subtitle" style={{ cursor: 'pointer' }}>
                          Cargos Efetivos ({s.fichasCargoEfetivo.length})
                        </summary>
                        {s.fichasCargoEfetivo.map((fc, j) => (
                          <div key={j} className="lp-vinc-grid" style={{ marginTop: 4 }}>
                            <div className="lp-vinc-campo"><span className="lp-vinc-rotulo">Cargo</span><span className="lp-vinc-valor">{fc.cargo || '-'}</span></div>
                            <div className="lp-vinc-campo"><span className="lp-vinc-rotulo">Órgão</span><span className="lp-vinc-valor">{fc.orgaoServidorLotacao || '-'}</span></div>
                            <div className="lp-vinc-campo"><span className="lp-vinc-rotulo">Ingresso</span><span className="lp-vinc-valor">{fc.dataIngressoOrgao || '-'}</span></div>
                          </div>
                        ))}
                      </details>
                    )}
                    {s.fichasFuncao && s.fichasFuncao.length > 0 && (
                      <details className="lp-vinc-subsec" style={{ marginTop: 8 }}>
                        <summary className="lp-vinc-secao-subtitle" style={{ cursor: 'pointer' }}>
                          Funções ({s.fichasFuncao.length})
                        </summary>
                        {s.fichasFuncao.map((ff, j) => (
                          <div key={j} className="lp-vinc-grid" style={{ marginTop: 4 }}>
                            <div className="lp-vinc-campo"><span className="lp-vinc-rotulo">Função</span><span className="lp-vinc-valor">{ff.funcao || '-'}</span></div>
                            <div className="lp-vinc-campo"><span className="lp-vinc-rotulo">Órgão</span><span className="lp-vinc-valor">{ff.orgaoServidorExercicio || '-'}</span></div>
                            <div className="lp-vinc-campo"><span className="lp-vinc-rotulo">Ingresso</span><span className="lp-vinc-valor">{ff.dataIngressoFuncao || '-'}</span></div>
                          </div>
                        ))}
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CardContexto({ item, onNavigateToLicitacao, onIdClick }) {
  const [aberto, setAberto] = useState(true);
  const [sociosAbertos, setSociosAbertos] = useState(false);
  const socios = item.socios || [];
  const documentos = item.documentos || [];
  const temMatch = documentos.some(d => (d.vinculos || []).length > 0);

  const tagSummary = useMemo(() => {
    const counts = { servicos_candidatos: 0, servicos_partidos: 0, doacoes_candidatos: 0, doacoes_partidos: 0, tcu: 0, servidor_publico: 0 };
    (documentos || []).forEach(doc => {
      (doc.vinculos || []).forEach(v => {
        if (v.tipo === 'fornecedor') counts.servicos_candidatos++;
        if (v.tipo === 'receita_candidato') counts.doacoes_candidatos++;
        if (v.tipo === 'receita_orgao_partidario') counts.doacoes_partidos++;
        if (v.tipo === 'despesa_candidato') counts.servicos_candidatos++;
        if (v.tipo === 'despesa_orgao_partidario') counts.servicos_partidos++;
        if (v.tipo?.startsWith('tcu_')) counts.tcu++;
        if (v.tipo === 'servidor_publico') counts.servidor_publico++;
      });
    });
    return counts;
  }, [documentos]);

  const tagLabels = {
    servicos_candidatos: 'serviços prestados a candidatos',
    servicos_partidos: 'serviços prestados a partidos',
    doacoes_candidatos: 'doações feitas a candidatos',
    doacoes_partidos: 'doações feitas a partidos',
    tcu: 'TCU',
    servidor_publico: 'servidor público federal',
  };

  return (
    <div className="lp-card">
      <div className="lp-card-header" onClick={() => setAberto(!aberto)}>
        <div className="lp-card-header-left">
          <span
            className="lp-card-pncp clickable"
            title="Clique para ir para a licitacao"
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigateToLicitacao && item.numero_controle_pncp) {
                onNavigateToLicitacao(item.numero_controle_pncp);
              }
            }}
          >
            {item.numero_controle_pncp || '-'}
          </span>
          <span
            className="lp-card-cnpj clickable"
            onClick={(e) => {
              e.stopPropagation();
              onIdClick?.('cpf_cnpj', item.cpf_cnpj);
            }}
          >{fmtDoc(item.cpf_cnpj)}</span>
          {socios.length > 0 && (
            <span className="lp-card-socios-count">{socios.length} socio{socios.length !== 1 ? 's' : ''}</span>
          )}
          {documentos.length > 0 && (
            <span className="lp-card-docs-count">{documentos.length} documento{documentos.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <span className="seta">{aberto ? '▼' : '▶'}</span>
      </div>

      {aberto && (
        <div className="lp-card-body">
          {temMatch && (
            <div className="lp-card-tags">
              {Object.entries(tagSummary).map(([cat, count]) =>
                count > 0 && (
                  <span key={cat} className="lp-card-tag-badge">
                    {tagLabels[cat]} ({count})
                  </span>
                )
              )}
            </div>
          )}

          {socios.length > 0 && (
            <div className="lp-card-socios">
              <div
                className="lp-card-socios-toggle"
                onClick={(e) => { e.stopPropagation(); setSociosAbertos(!sociosAbertos); }}
              >
                <span className="seta-small">{sociosAbertos ? '▼' : '▶'}</span>
                Socios
              </div>
              {sociosAbertos && (
                <div className="lp-card-socios-list">
                  {socios.map((s, i) => (
                    <div key={i} className="lp-card-socio">
                      <span className="lp-card-socio-nome">{s.nome || '-'}</span>
                      <span
                        className="lp-card-socio-doc clickable"
                        onClick={(e) => {
                          e.stopPropagation();
                          onIdClick?.('cpf_cnpj', s.documento);
                        }}
                      >{fmtDoc(s.documento)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {documentos.length > 0 && (
            <div className="lp-card-docs">
              <span className="lp-card-docs-label">Documentos ({documentos.length})</span>
              {documentos.map((doc, di) => (
                <div key={di} className="lp-card-doc-group">
                  <div className="lp-card-doc-row">
                    <span
                      className="lp-card-doc-num clickable"
                      onClick={(e) => {
                        e.stopPropagation();
                        onIdClick?.('cpf_cnpj', doc.documento_normalizado);
                      }}
                    >{fmtDoc(doc.documento_normalizado)}</span>
                    {doc.nome && <span className="lp-card-doc-nome">{doc.nome}</span>}
                    {doc.parcial && <span className="lp-res-parcial">parcial</span>}
                    <span className="lp-card-doc-origem">{doc.origem || 'principal'}</span>
                    {doc.documento_input && doc.documento_input !== doc.documento_normalizado && (
                      <span className="lp-card-doc-input">{doc.documento_input}</span>
                    )}
                  </div>
                  {doc.vinculos && doc.vinculos.length > 0 && (
                    <div className="lp-card-vinculos">
                      {doc.vinculos.map((v, vi) => (
                        <div key={vi} className="lp-card-vinculo">
                          <div className="lp-card-vinculo-header">
                            <span className={`tag ${TIPO_COR[v.tipo] || ''}`}>
                              {TIPO_ROTULO[v.tipo] || v.tipo}
                            </span>
                            {v.descricao && <span className="lp-card-vinc-desc"><TextExpand text={v.descricao} maxLen={60} /></span>}
                          </div>
                          {v.detalhes && <VinculoDetalhesView detalhes={v.detalhes} onIdClick={onIdClick} />}
                        </div>
                      ))}
                    </div>
                  )}
                  {(!doc.vinculos || doc.vinculos.length === 0) && (
                    <p className="lp-vazio" style={{margin: '2px 0 0 0', padding: '2px 0'}}>Nenhum vinculo encontrado.</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {documentos.length === 0 && (
            <p className="lp-vazio">Nenhum documento processado.</p>
          )}

          <div className="lp-card-actions">
          </div>
        </div>
      )}
    </div>
  );
}

export default function LigacaoPolitica({
  consultas,
  consultaId,
  onFechar,
  cachedItem,
  cachedResult,
  onResultsReady,
  onSave,
  onEdit,
  onApagar,
  onNavigateToLicitacao,
  onLicitacaoClick,
  savedList,
  onLoadSaved,
  onDadosAtualizados,
  onIdClick,
  panelLicitacoes,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [etapa, setEtapa] = useState('idle');
  const [salvo, setSalvo] = useState(false);
  const [mostrarSalvas, setMostrarSalvas] = useState(false);
  const abortRef = useRef(null);
  const perConsultaState = useRef({});
  const currentId = useRef(consultaId || 'all');
  const isFirstMount = useRef(true);
  const saveCurrentState = useCallback(() => {
    const id = currentId.current;
    if (id && id !== 'cached') {
      perConsultaState.current[id] = { data, loading, error, etapa, salvo };
    }
  }, [data, loading, error, etapa, salvo]);

  const restoreState = useCallback((id, fallbackCached) => {
    const saved = perConsultaState.current[id];
    if (saved && !fallbackCached?.data) {
      setData(saved.data);
      setLoading(saved.loading);
      setError(saved.error);
      setEtapa(saved.etapa);
      setSalvo(saved.salvo);
      return true;
    }
    if (fallbackCached?.data) {
      setData(fallbackCached.data);
      setLoading(false);
      setError(null);
      setEtapa('completo');
      setSalvo(false);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (cachedItem) {
      setData(cachedItem.data);
      setEtapa('completo');
      setSalvo(true);
      setLoading(false);
      setError(null);
      currentId.current = 'cached';
      return;
    }

    const id = consultaId || 'all';
    if (currentId.current !== id || isFirstMount.current) {
      if (!isFirstMount.current) saveCurrentState();
      else isFirstMount.current = false;
      currentId.current = id;
      if (!restoreState(id, cachedResult)) {
        setData(null);
        setLoading(false);
        setError(null);
        setEtapa('idle');
        setSalvo(false);
      }
    }
  }, [consultaId, cachedItem, cachedResult, saveCurrentState, restoreState]);

  useEffect(() => {
    saveCurrentState();
  });

  useEffect(() => {
    if (data && onDadosAtualizados) {
      onDadosAtualizados(data);
    }
  }, [data, onDadosAtualizados]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const consultasAlvo = useMemo(
    () => (consultaId ? consultas.filter(c => c.id === consultaId) : consultas),
    [consultas, consultaId]
  );

  const pncpOrgaoMap = useMemo(() => {
    const map = {};
    consultasAlvo.forEach(c => {
      (c.resultados || []).forEach(r => {
        const orgao = r.orgao?.razaoSocial || fmtDoc(r.orgao?.cnpj) || 'Outro';
        (r.contratos || []).forEach(ct => {
          if (ct.numeroControlePNCP) {
            map[ct.numeroControlePNCP] = orgao;
          }
        });
      });
    });
    return map;
  }, [consultasAlvo]);

  const licitacoes = useMemo(() => {
    if (cachedItem) return cachedItem.licitacoes || [];
    const todosContratos = consultasAlvo.flatMap(c =>
      (c.resultados || []).flatMap(r => r.contratos || [])
    );
    const extraidos = extrairDocumentosDosContratos(todosContratos);
    if (extraidos.length > 0) return extraidos;
    if (panelLicitacoes && panelLicitacoes.length > 0) return panelLicitacoes;
    return extraidos;
  }, [consultasAlvo, cachedItem, panelLicitacoes]);

  const buscar = useCallback(async () => {
    if (loading) return;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    if (licitacoes.length === 0) {
      setError('Nenhuma licitacao encontrada nas consultas.');
      setLoading(false);
      setEtapa('idle');
      return;
    }
    setLoading(true);
    setError(null);
    setEtapa('buscando');
    try {
      const json = await api.post<any>(`/busca/contexto`, { licitacoes }, { signal: controller.signal });
      if (controller.signal.aborted) return;

      const idAtual = currentId.current;
      const idReq = consultaId || 'all';
      if (idAtual !== idReq && idAtual !== 'cached') {
        const savedSalvo = !!(onSave && !cachedItem);
        perConsultaState.current[idReq] = { data: json, loading: false, error: null, etapa: 'completo', salvo: savedSalvo };
        onResultsReady?.(consultaId, json, licitacoes);
        if (onSave && !cachedItem) {
          onSave({
            licitacoes,
            data: json,
            timestamp: new Date().toISOString(),
            consultaNome: consultaId
              ? `Consulta #${consultas.find(c => c.id === consultaId)?.id || ''}`
              : 'Geral',
            totalDocs: licitacoes.length,
          });
        }
        return;
      }

      setData(json);
      setEtapa('completo');
      onResultsReady?.(consultaId, json, licitacoes);
      if (onSave && !cachedItem) {
        onSave({
          licitacoes,
          data: json,
          timestamp: new Date().toISOString(),
          consultaNome: consultaId
            ? `Consulta #${consultas.find(c => c.id === consultaId)?.id || ''}`
            : 'Geral',
          totalDocs: licitacoes.length,
        });
        setSalvo(true);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      const idAtual = currentId.current;
      const idReq = consultaId || 'all';
      if (idAtual !== idReq && idAtual !== 'cached') {
        perConsultaState.current[idReq] = { data: null, loading: false, error: err.message, etapa: 'erro', salvo: false };
        return;
      }
      setError(err.message);
      setEtapa('erro');
    }
    if (!controller.signal.aborted) {
      const idAtual = currentId.current;
      const idReq = consultaId || 'all';
      if (idAtual !== idReq && idAtual !== 'cached') {
        abortRef.current = null;
        return;
      }
      setLoading(false);
      abortRef.current = null;
    }
  }, [licitacoes, loading, consultaId]);

  const handleCancelarBusca = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
    setEtapa('idle');
    setError(null);
  };

  const handleSalvar = () => {
    if (onSave && data && !salvo) {
      onSave({
        licitacoes,
        data,
        timestamp: new Date().toISOString(),
        consultaNome: consultaId
          ? `Consulta #${consultas.find(c => c.id === consultaId)?.id || ''}`
          : 'Geral',
        totalDocs: licitacoes.length,
      });
      setSalvo(true);
    }
  };

  const totalProcessados = data?.documentos_processados || 0;

  const resultadosPorOrgao = useMemo(() => {
    if (!data?.resultados) return {};
    const grupos = {};
    let pncpUnicos = new Set();
    data.resultados.forEach(item => {
      const temMatch = (item.documentos || []).some(d => (d.vinculos || []).length > 0);
      if (!temMatch) return;
      const orgao = pncpOrgaoMap[item.numero_controle_pncp] || 'Outro';
      if (!grupos[orgao]) grupos[orgao] = [];
      grupos[orgao].push(item);
      pncpUnicos.add(item.numero_controle_pncp);
    });
    return grupos;
  }, [data, pncpOrgaoMap]);

  const totalVinculos = useMemo(() => {
    if (!data?.resultados) return 0;
    const pncps = new Set();
    data.resultados.forEach(r => {
      const temMatch = (r.documentos || []).some(d => (d.vinculos || []).length > 0);
      if (temMatch) pncps.add(r.numero_controle_pncp);
    });
    return pncps.size;
  }, [data]);

  const itensComMatch = useMemo(() => {
    if (!data?.resultados) return [];
    return data.resultados.filter(item =>
      (item.documentos || []).some(d => (d.vinculos || []).length > 0)
    );
  }, [data]);

  const orgaosList = Object.keys(resultadosPorOrgao).sort();

  return (
    <div className="lp-section">
      <div className="lp-topo">
        <h2>
          {cachedItem ? 'Ligacao Politica (Salva)' : consultaId ? 'Ligacao Politica' : 'Ligacao Politica (Geral)'}
        </h2>
        <span className="lp-info">
          {etapa === 'completo' && `${totalVinculos} vinculo${totalVinculos !== 1 ? 's' : ''} · ${totalProcessados} processado${totalProcessados !== 1 ? 's' : ''}`}
          {etapa !== 'completo' && licitacoes.length > 0 && `${licitacoes.length} licitacao${licitacoes.length !== 1 ? 'oes' : ''}`}
        </span>
        <div className="lp-topo-actions">
          {consultaId ? (
            etapa === 'buscando' || loading ? (
              <button className="btn btn-sm btn-danger" onClick={handleCancelarBusca}>
                Cancelar
              </button>
            ) : (
              <button className="btn btn-sm" onClick={buscar} disabled={licitacoes.length === 0}>
                {etapa === 'idle' || etapa === 'erro' ? 'Buscar' : 'Recarregar'}
              </button>
            )
          ) : null}
          {data && !cachedItem && (
            <button className="btn btn-sm" onClick={handleSalvar} disabled={salvo}>
              {salvo ? 'Salvo!' : 'Salvar'}
            </button>
          )}
          <button className="btn btn-sm" onClick={onFechar}>Voltar</button>
        </div>
      </div>

      {savedList && savedList.length > 0 && (
        <div className="lp-salvas">
          <button
            className="lp-salvas-toggle"
            onClick={() => setMostrarSalvas(!mostrarSalvas)}
          >
            {mostrarSalvas ? '▼' : '▶'} Analises Salvas ({savedList.length})
          </button>
          {mostrarSalvas && (
            <div className="lp-salvas-lista">
              {savedList.map((item) => (
                <div key={item.id} className="lp-salva-item">
                  <div className="lp-salva-info">
                    <span className="lp-salva-nome">{item.consultaNome || 'Geral'}</span>
                    <span className="lp-salva-meta">
                      {item.data?.resultados?.length || 0} resultados
                      {' · '}
                      {new Date(item.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="lp-salva-acoes">
                    <button className="btn btn-sm" onClick={() => onLoadSaved(item.id)}>Abrir</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => onApagar(item.id)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {etapa === 'idle' && !data && (
        <div className="lp-progresso">
          {licitacoes.length > 0 ? (
            <p className="lp-status">
              {licitacoes.length} licitacao{licitacoes.length !== 1 ? 'oes' : ''} extraida{licitacoes.length !== 1 ? 's' : ''}. Clique em <strong>Buscar</strong> para iniciar a analise.
            </p>
          ) : (
            <p className="lp-status">Nenhuma licitacao encontrada. Realize uma consulta primeiro.</p>
          )}
        </div>
      )}

      {etapa === 'buscando' && (
        <div className="lp-progresso">
          <p className="lp-status">Buscando {licitacoes.length} licitacao{licitacoes.length !== 1 ? 'oes' : ''}...</p>
        </div>
      )}

      {error && (
        <div className="lp-erro">
          <p>Erro: {error}</p>
        </div>
      )}

      {data && etapa === 'completo' && (
        <div className="lp-corpo">
          <div className="lp-sumario">
            <div className="lp-sumario-item">
              <span className="lp-sumario-valor">{totalProcessados}</span>
              <span className="lp-sumario-label">documentos analisados</span>
            </div>
            <div className="lp-sumario-item">
              <span className="lp-sumario-valor">{totalVinculos}</span>
              <span className="lp-sumario-label">vinculos encontrados</span>
            </div>
            <div className="lp-sumario-item">
              <span className="lp-sumario-valor">{orgaosList.length}</span>
              <span className="lp-sumario-label">orgaos</span>
            </div>
          </div>

          {orgaosList.length > 0 ? (
            <div className="lp-orgaos-list">
              {orgaosList.map(orgao => (
                <div key={orgao} className="lp-orgao-group">
                  <div className="lp-orgao-header">
                    <span className="lp-orgao-nome">{orgao}</span>
                    <span className="lp-orgao-count">{resultadosPorOrgao[orgao].length} licitacao{resultadosPorOrgao[orgao].length !== 1 ? 'oes' : ''}</span>
                  </div>
                  <div className="lp-orgao-cards">
                    {resultadosPorOrgao[orgao].map((item, idx) => (
                      <CardContexto
                        key={idx}
                        item={item}
                        onNavigateToLicitacao={onLicitacaoClick || onNavigateToLicitacao}
                        onIdClick={onIdClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="lp-vazio">Nenhum vinculo encontrado nas consultas realizadas.</p>
          )}
        </div>
      )}
    </div>
  );
}
