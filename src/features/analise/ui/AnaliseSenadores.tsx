// @ts-nocheck
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/shared/api/client';
import SecaoGeralSenador from '@/entities/senador/ui/SenadorSecaoGeral';
import TabelaGen from '@/shared/ui/TabelaGen/TabelaGen';
import './AnaliseDeputados.css';

/* ─── Helpers ──────────────────────────── */

function dateParaAPI(d) {
  if (!d) return '';
  return d.replace(/-/g, '');
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

function Card({ header, children }) {
  return (
    <div className="ad-card" style={{ marginBottom: 12 }}>
      {header && <div className="ad-card-header">{header}</div>}
      <div className="ad-card-body">{children}</div>
    </div>
  );
}

function QueryForm({ campos, onBuscar, loading }) {
  const [params, setParams] = useState({});
  return (
    <div className="ad-query-form">
      <div className="ad-query-form-grid">
        {campos.map(campo => (
          <div key={campo.name} className="ad-query-form-group">
            <label className="ad-query-form-label">{campo.label}</label>
            <input
              className="ad-query-form-input"
              type={campo.type || 'text'}
              placeholder={campo.placeholder}
              value={params[campo.name] || ''}
              onChange={e => setParams(prev => ({ ...prev, [campo.name]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <button className="btn btn-accent" onClick={() => onBuscar(params)} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </div>
  );
}

function SubTabBar({ tabs, ativa, onSelect, onFechar }) {
  return (
    <div className="lp-sub-tabs" style={{ marginBottom: 12 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          className={`lp-sub-tab ${ativa === t.id ? 'ativo' : ''}`}
          onClick={() => onSelect(t.id)}
        >
          {t.label || t.id}
          {t.badge != null && <span className="ad-secao-badge">{t.badge}</span>}
          {t.loading && <span className="ad-secao-badge ad-secao-badge-loading">...</span>}
          {onFechar && t.fechavel && (
            <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); onFechar(t.id); }}>×</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Orçamento com filtro client-side ─── */

function SecaoOrcamento() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resp = await api.get<any>('/senado/orcamento');
      const json = await resp.json();
      setDados(json.dados || []);
    } catch (err) {
      setErro(err.message);
    }
    setLoading(false);
  }, []);

  const filtrados = useMemo(() => {
    if (!dados) return [];
    if (!filtro) return dados;
    const t = filtro.toLowerCase();
    return dados.filter(d =>
      (d.NomeAutorOrcamento || '').toLowerCase().includes(t) ||
      (d.AnoExecucao || '').includes(t) ||
      (d.DescricaoTipoPlOrcamento || '').toLowerCase().includes(t) ||
      (d.QuantidadeEmendas || '').includes(t) ||
      (d.IndicadorAtivo || '').toLowerCase().includes(t) ||
      (d.SiglaTipoPlOrcamento || '').toLowerCase().includes(t)
    );
  }, [dados, filtro]);

  return (
    <div>
      <h3 className="ad-section-title">Orçamento — Lotes de Emendas</h3>
      {!dados && !loading && !erro && (
        <button className="btn btn-accent" onClick={carregar}>Carregar Orçamento</button>
      )}
      {loading && <div className="ad-loading">Carregando...</div>}
      {erro && <p className="ad-error">Erro: {erro}</p>}
      {dados && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <input
              className="ad-query-form-input"
              style={{ flex: 1, maxWidth: 400 }}
              placeholder="Filtrar por autor, ano, tipo, emendas..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtrados.length} de {dados.length} registros</span>
          </div>
          <TabelaGen
            cabecalhos={['Autor', 'Código Autor', 'Email', 'Emendas', 'Ano Execução', 'Ativo', 'Data Operação', 'Tipo', 'Nº Matéria', 'Ano Matéria']}
            linhas={filtrados.map(d => [
              d.NomeAutorOrcamento,
              d.CodigoAutorOrcamento,
              d.EmailAutorOrcamento,
              d.QuantidadeEmendas,
              d.AnoExecucao,
              d.IndicadorAtivo,
              d.DataOperacao,
              d.DescricaoTipoPlOrcamento,
              `${d.SiglaTipoPlOrcamento || ''} ${d.NumeroMateria || ''}/${d.AnoMateria || ''}`,
            ])}
          />
        </>
      )}
    </div>
  );
}

/* ─── SectionCargos ───────────────────── */

function SectionCargos({ dados }) {
  if (!dados || dados.length === 0) return <p className="ad-empty">Nenhum cargo encontrado.</p>;
  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Cargos ({dados.length})</h3>
      <div className="ad-card-grid">
        {dados.map((c, i) => {
          const com = c.IdentificacaoComissao || {};
          return (
            <div key={i} className="ad-card">
              <div className="ad-card-header"><span className="ad-card-tag">{com.SiglaComissao || '-'}</span> {c.DescricaoCargo || '-'}</div>
              <div className="ad-card-body">
                <div className="ad-card-row"><span className="ad-card-label">Código Cargo:</span> {c.CodigoCargo || '-'}</div>
                <div className="ad-card-row"><span className="ad-card-label">Comissão:</span> {com.NomeComissao || '-'}</div>
                <div className="ad-card-row"><span className="ad-card-label">Código Comissão:</span> {com.CodigoComissao || '-'}</div>
                <div className="ad-card-row"><span className="ad-card-label">Casa:</span> {com.SiglaCasaComissao || '-'}</div>
                <div className="ad-card-row"><span className="ad-card-label">Período:</span> {c.DataInicio || '-'} ~ {c.DataFim || 'atual'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── SectionComissoes ────────────────── */

function SectionComissoes({ dados }) {
  if (!dados || dados.length === 0) return <p className="ad-empty">Nenhuma comissão encontrada.</p>;
  const ativas = dados.filter(c => !c.DataFim);
  const passadas = dados.filter(c => c.DataFim);
  const ComissaoCard = ({ c }) => {
    const com = c.IdentificacaoComissao || {};
    return (
      <div className="ad-card">
        <div className="ad-card-header"><span className="ad-card-tag">{com.SiglaComissao || '-'}</span> {com.NomeComissao || '-'}</div>
        <div className="ad-card-body">
          <div className="ad-card-row"><span className="ad-card-label">Código:</span> {com.CodigoComissao || '-'}</div>
          <div className="ad-card-row"><span className="ad-card-label">Casa:</span> {com.SiglaCasaComissao || '-'}</div>
          <div className="ad-card-row"><span className="ad-card-label">Participação:</span> {c.DescricaoParticipacao || '-'}</div>
          <div className="ad-card-row"><span className="ad-card-label">Início:</span> {c.DataInicio || '-'}</div>
          {c.DataFim && <div className="ad-card-row"><span className="ad-card-label">Fim:</span> {c.DataFim}</div>}
        </div>
      </div>
    );
  };
  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Comissões Atuais ({ativas.length})</h3>
      {ativas.length > 0 ? <div className="ad-card-grid">{ativas.map((c, i) => <ComissaoCard key={i} c={c} />)}</div> : <p className="ad-empty">Nenhuma comissão atual.</p>}
      {passadas.length > 0 && (
        <><h3 className="ad-section-title" style={{ marginTop: 16 }}>Comissões Passadas ({passadas.length})</h3><div className="ad-card-grid">{passadas.map((c, i) => <ComissaoCard key={i} c={c} />)}</div></>
      )}
    </div>
  );
}

/* ─── SectionMandatos ─────────────────── */

function SectionMandatos({ dados }) {
  if (!dados || dados.length === 0) return <p className="ad-empty">Nenhum mandato encontrado.</p>;
  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Mandatos ({dados.length})</h3>
      {dados.map((m, i) => {
        const suplentes = m.Suplentes?.Suplente || [];
        const exercicios = m.Exercicios?.Exercicio || [];
        const partidos = m.Partidos?.Partido || [];
        return (
          <Card key={i} header={`Mandato ${m.UfParlamentar || '-'} — ${m.DescricaoParticipacao || '-'}`}>
            <div className="ad-card-row"><span className="ad-card-label">Código Mandato:</span> {m.CodigoMandato || '-'}</div>
            <div className="ad-card-row"><span className="ad-card-label">UF:</span> {m.UfParlamentar || '-'}</div>
            <div className="ad-card-row"><span className="ad-card-label">1ª Legislatura:</span> {m.PrimeiraLegislaturaDoMandato ? `${m.PrimeiraLegislaturaDoMandato.NumeroLegislatura || '-'} (${m.PrimeiraLegislaturaDoMandato.DataInicio || '-'} ~ ${m.PrimeiraLegislaturaDoMandato.DataFim || '-'})` : '-'}</div>
            {m.SegundaLegislaturaDoMandato?.NumeroLegislatura && <div className="ad-card-row"><span className="ad-card-label">2ª Legislatura:</span> {m.SegundaLegislaturaDoMandato.NumeroLegislatura} ({m.SegundaLegislaturaDoMandato.DataInicio} ~ {m.SegundaLegislaturaDoMandato.DataFim})</div>}
            {suplentes.length > 0 && <div style={{ marginTop: 8 }}><span className="ad-card-label">Suplentes:</span><div className="ad-table-wrap" style={{ marginTop: 4 }}>
              <TabelaGen cabecalhos={['Suplente', 'Código', 'Nome']} linhas={suplentes.map(s => [s.DescricaoParticipacao, s.CodigoParlamentar, s.NomeParlamentar])} />
            </div></div>}
            {exercicios.length > 0 && <div style={{ marginTop: 8 }}><span className="ad-card-label">Exercícios:</span><div className="ad-table-wrap" style={{ marginTop: 4 }}>
              <TabelaGen cabecalhos={['Código Exercício', 'Data Início']} linhas={exercicios.map(e => [e.CodigoExercicio, e.DataInicio])} />
            </div></div>}
            {partidos.length > 0 && <div style={{ marginTop: 8 }}><span className="ad-card-label">Partidos no Mandato:</span><div className="ad-table-wrap" style={{ marginTop: 4 }}>
              <TabelaGen cabecalhos={['Código', 'Sigla', 'Nome', 'Filiação', 'Desfiliação']} linhas={partidos.map(p => [p.CodigoPartido, p.Sigla ? <span className="ad-card-tag">{p.Sigla}</span> : '-', p.Nome, p.DataFiliacao, p.DataDesfiliacao])} />
            </div></div>}
          </Card>
        );
      })}
    </div>
  );
}

/* ─── SectionEmendas ──────────────────── */

function SectionEmendas({ codigoSenador, nomeSenador }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resp = await api.get<any>('/senado/processo/emendas', { codigoParlamentarAutor: codigoSenador });
      const json = await resp.json();
      setDados(json.dados || []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }, [codigoSenador]);

  const filtrados = dados ? dados.filter(d => {
    const t = filtro.toLowerCase();
    return (d.identificacao || d.Identificacao || '').toLowerCase().includes(t) ||
           (d.autoria || d.Autoria || '').toLowerCase().includes(t) ||
           (d.descricaoDocumentoEmenda || '').toLowerCase().includes(t) ||
           (d.siglaColegiado || '').toLowerCase().includes(t) ||
           (d.nomeColegiado || '').toLowerCase().includes(t) ||
           (d.tipo || d.Tipo || '').toLowerCase().includes(t);
  }) : [];

  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Emendas Propostas por {nomeSenador}</h3>
      {!dados && !loading && !erro && (
        <button className="btn btn-accent" onClick={carregar}>Carregar Emendas</button>
      )}
      {loading && <div className="ad-loading">Buscando emendas...</div>}
      {erro && <p className="ad-error">Erro: {erro}</p>}
      {dados && (
        <>
          <div className="ad-query-form-grid" style={{ marginBottom: 12 }}>
            <input
              className="ad-query-form-input"
              style={{ flex: 1, maxWidth: 400 }}
              placeholder="Filtrar por identificação, autoria, comissão, tipo..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtrados.length} de {dados.length} registros</span>
          </div>
          <TabelaGen
            cabecalhos={['ID', 'Identificação', 'Autoria', 'Comissão', 'Tipo', 'Data', 'Descrição', 'Documento']}
            maxWidthCol={{ 1: 250, 2: 200, 6: 300 }}
            linhas={filtrados.map(d => [
              d.id || d.Id,
              d.identificacao || d.Identificacao,
              d.autoria || d.Autoria,
              d.siglaColegiado || '-',
              d.tipo || d.Tipo || '-',
              d.dataApresentacao || d.DataApresentacao || '-',
              d.descricaoDocumentoEmenda || '-',
              d.urlDocumentoEmenda || d.UrlDocumentoEmenda ? <a href={d.urlDocumentoEmenda || d.UrlDocumentoEmenda} target="_blank" rel="noopener noreferrer" className="ad-link">Abrir</a> : '-'
            ])}
          />
        </>
      )}
    </div>
  );
}

/* ─── GridSenadores ───────────────────── */

function GridSenadores({ senadores, detalheLoading, onDetalhes }) {
  return (
    <div className="ad-grid">
      {senadores.map(sen => {
        const id = sen.IdentificacaoParlamentar?.CodigoParlamentar;
        const ident = sen.IdentificacaoParlamentar || {};
        return (
          <div key={id} className="ad-card-dep">
            <img className="ad-foto" src={ident.UrlFotoParlamentar} alt={ident.NomeParlamentar} onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="ad-card-dep-info">
              <strong className="ad-card-dep-nome">{ident.NomeParlamentar}</strong>
              <span className="ad-card-dep-partido">
                <span className="tag tag-candidato">{ident.SiglaPartidoParlamentar}</span>
                <span className="ad-card-dep-uf">{ident.UfParlamentar}</span>
              </span>
              {sen.Mandato?.DescricaoParticipacao && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sen.Mandato.DescricaoParticipacao}</span>}
            </div>
            <button className="btn btn-sm btn-outline-accent" onClick={() => onDetalhes(sen)} disabled={detalheLoading === id}>
              {detalheLoading === id ? '...' : 'Detalhes'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Processos e Emendas ─────────────── */

function SecaoProcessos() {
  const [resultados, setResultados] = useState({});
  const [tabAtiva, setTabAtiva] = useState('geral');
  const [loading, setLoading] = useState({});
  const [subTabs, setSubTabs] = useState({});
  const [subTabAtiva, setSubTabAtiva] = useState({});

  const camposProcesso = [
    { name: 'sigla', label: 'Sigla', placeholder: 'Ex: PL' },
    { name: 'numero', label: 'Número', placeholder: 'Ex: 1234' },
    { name: 'ano', label: 'Ano', type: 'number', placeholder: 'Ex: 2024' },
    { name: 'tramitando', label: 'Tramitando', placeholder: 'S ou N' },
    { name: 'autor', label: 'Autor', placeholder: 'Nome do autor' },
    { name: 'codigoParlamentarAutor', label: 'Código Parlamentar', type: 'number', placeholder: 'Ex: 5672' },
    { name: 'termo', label: 'Termo Livre', placeholder: 'Palavra-chave' },
    { name: 'siglaSituacao', label: 'Situação', placeholder: 'Sigla da situação' },
    { name: 'codAssuntoGeral', label: 'Cód. Assunto Geral', type: 'number', placeholder: 'Ex: 81' },
    { name: 'codAssuntoEspecifico', label: 'Cód. Assunto Espec.', type: 'number', placeholder: 'Ex: 101' },
    { name: 'dataInicioApresentacao', label: 'Data Início Apres.', type: 'date' },
    { name: 'dataFimApresentacao', label: 'Data Fim Apres.', type: 'date' },
    { name: 'siglaTipoDocumento', label: 'Tipo Documento', placeholder: 'Sigla do tipo' },
    { name: 'codigoColegiadoTramitando', label: 'Colegiado', type: 'number', placeholder: 'Código do colegiado' },
  ];

  const camposEmenda = [
    { name: 'idEmenda', label: 'ID Emenda', type: 'number', placeholder: 'Ex: 123' },
    { name: 'idProcesso', label: 'ID Processo', type: 'number', placeholder: 'Ex: 456' },
    { name: 'dataInicio', label: 'Data Início', type: 'date' },
    { name: 'dataFim', label: 'Data Fim', type: 'date' },
    { name: 'codigoParlamentarAutor', label: 'Autor (código)', type: 'number', placeholder: 'Ex: 5672' },
    { name: 'codigoColegiado', label: 'Colegiado', type: 'number', placeholder: 'Código' },
  ];

  const camposVotacao = [
    { name: 'dataInicio', label: 'Data Início', type: 'date' },
    { name: 'dataFim', label: 'Data Fim', type: 'date' },
    { name: 'codigoSessao', label: 'Código Sessão', type: 'number', placeholder: 'Ex: 461394' },
    { name: 'idProcesso', label: 'ID Processo', type: 'number', placeholder: 'Ex: 8787136' },
    { name: 'codigoMateria', label: 'Código Matéria', type: 'number', placeholder: 'Ex: 167958' },
    { name: 'sigla', label: 'Sigla Proposição', placeholder: 'Ex: PL' },
    { name: 'numero', label: 'Número', placeholder: 'Ex: 1234' },
    { name: 'ano', label: 'Ano', type: 'number', placeholder: 'Ex: 2024' },
    { name: 'codigoParlamentar', label: 'Código Parlamentar', type: 'number', placeholder: 'Ex: 5672' },
    { name: 'nomeParlamentar', label: 'Nome Parlamentar', placeholder: 'Nome do votante' },
    { name: 'siglaVotoParlamentar', label: 'Voto', placeholder: 'S, N, ABST...' },
  ];

  const buscar = useCallback(async (tipo, params, label) => {
    const parentTab = `filtro-${tipo}`;
    const subTabId = `${tipo}-${Date.now()}`;
    const filtroStr = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(' ');
    const subTabLabel = `${label}${filtroStr ? ` (${filtroStr})` : ''}`;
    
    setResultados(prev => ({ ...prev, [subTabId]: { label: subTabLabel, dados: null, loading: true, tipo } }));
    setSubTabs(prev => ({
      ...prev,
      [parentTab]: [...(prev[parentTab] || []), { id: subTabId, label: subTabLabel, fechavel: true }]
    }));
    setSubTabAtiva(prev => ({ ...prev, [parentTab]: subTabId }));
    setLoading(prev => ({ ...prev, [subTabId]: true }));
    
    try {
      let url;
      if (tipo === 'processos') url = '/senado/processos';
      else if (tipo === 'emendas') url = '/senado/processo/emendas';
      else if (tipo === 'votacoes') url = '/senado/votacoes';
      else return;
      const paramsObj = Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as Record<string, string>;
      const json = await api.get<any>(url, paramsObj);
      setResultados(prev => ({ ...prev, [subTabId]: { ...prev[subTabId], dados: json.dados || [], loading: false } }));
    } catch (err: any) {
      setResultados(prev => ({ ...prev, [subTabId]: { ...prev[subTabId], dados: [], loading: false, erro: err.message } }));
    }
    setLoading(prev => ({ ...prev, [subTabId]: false }));
  }, []);

  const fecharSubTab = useCallback((parentTab, subTabId) => {
    setResultados(prev => { const n = { ...prev }; delete n[subTabId]; return n; });
    setSubTabs(prev => ({
      ...prev,
      [parentTab]: (prev[parentTab] || []).filter(t => t.id !== subTabId)
    }));
    setSubTabAtiva(prev => {
      const n = { ...prev };
      if (n[parentTab] === subTabId) {
        const remaining = (prev[parentTab] || []).filter(t => t.id !== subTabId);
        n[parentTab] = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      }
      return n;
    });
  }, []);

  const renderResultado = (id) => {
    const r = resultados[id];
    if (!r) return null;
    if (r.loading) return <div className="ad-loading">Buscando...</div>;
    if (r.erro) return <p className="ad-error">Erro: {r.erro}</p>;
    if (!r.dados || r.dados.length === 0) return <p className="ad-empty">Nenhum resultado encontrado.</p>;
    if (r.tipo === 'processos')
      return <TabelaGen cabecalhos={['ID', 'Identificação', 'Ementa', 'Data Apresentação', 'Situação']} maxWidthCol={{ 2: 300 }} linhas={r.dados.map(d => [d.id ?? d.Id, d.identificacao || d.Identificacao, d.ementa || d.Ementa, d.dataApresentacao || d.DataApresentacao, d.situacao || d.Situacao])} />;
    if (r.tipo === 'emendas')
      return <TabelaGen cabecalhos={['ID', 'Identificação', 'Autoria', 'Comissão', 'Tipo', 'Data', 'Descrição', 'Documento']} maxWidthCol={{ 1: 250, 2: 200, 6: 300 }} linhas={r.dados.map(d => [d.id || d.Id, d.identificacao || d.Identificacao, d.autoria || d.Autoria, d.siglaColegiado || '-', d.tipo || d.Tipo || '-', d.dataApresentacao || d.DataApresentacao || '-', d.descricaoDocumentoEmenda || '-', d.urlDocumentoEmenda || d.UrlDocumentoEmenda ? <a href={d.urlDocumentoEmenda || d.UrlDocumentoEmenda} target="_blank" rel="noopener noreferrer" className="ad-link">Abrir</a> : '-'])} />;
    if (r.tipo === 'votacoes')
      return <TabelaGen cabecalhos={['Data Sessão', 'Identificação', 'Descrição', 'Ementa']} maxWidthCol={{ 2: 250, 3: 250 }} linhas={r.dados.map(d => [d.dataSessao || d.DataSessao, d.identificacao || d.Identificacao, d.descricaoVotacao || d.DescricaoVotacao, d.ementa || d.Ementa])} />;
    return null;
  };

  const fixedTabs = [
    { id: 'geral', label: 'Geral' },
    { id: 'filtro-processos', label: 'Buscar Processos' },
    { id: 'filtro-emendas', label: 'Buscar Emendas' },
    { id: 'filtro-votacoes', label: 'Buscar Votações' },
  ];

  return (
    <div>
      <SubTabBar tabs={fixedTabs} ativa={tabAtiva} onSelect={setTabAtiva} />
      <div style={{ display: tabAtiva === 'geral' ? '' : 'none' }}>
        <h3 className="ad-section-title">Processos e Emendas</h3>
        <p className="ad-query-form-desc">Selecione uma opção para consultar dados legislativos do Senado. Os resultados abrem em novas sub-abas.</p>
        <div className="ad-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <button className="ad-card" style={{ cursor: 'pointer', padding: 20, textAlign: 'center' }} onClick={() => setTabAtiva('filtro-processos')}>
            <strong>Processos</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Buscar processos legislativos</span>
          </button>
          <button className="ad-card" style={{ cursor: 'pointer', padding: 20, textAlign: 'center' }} onClick={() => setTabAtiva('filtro-emendas')}>
            <strong>Emendas</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Buscar emendas</span>
          </button>
          <button className="ad-card" style={{ cursor: 'pointer', padding: 20, textAlign: 'center' }} onClick={() => setTabAtiva('filtro-votacoes')}>
            <strong>Votações</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Votações nominais</span>
          </button>
        </div>
      </div>
      <div style={{ display: tabAtiva === 'filtro-processos' ? '' : 'none' }}>
        <h3 className="ad-section-title">Buscar Processos</h3>
        <p className="ad-query-form-desc">Preencha os filtros e clique em Buscar.</p>
        <QueryForm campos={camposProcesso} loading={Object.values(loading).some(Boolean)} onBuscar={(p) => buscar('processos', p, 'Processos')} />
        {subTabs['filtro-processos'] && subTabs['filtro-processos'].length > 0 && (
          <>
            <SubTabBar 
              tabs={subTabs['filtro-processos']} 
              ativa={subTabAtiva['filtro-processos']} 
              onSelect={(id) => setSubTabAtiva(prev => ({ ...prev, 'filtro-processos': id }))} 
              onFechar={(id) => fecharSubTab('filtro-processos', id)} 
            />
            {subTabs['filtro-processos'].map(t => (
              <div key={t.id} style={{ display: subTabAtiva['filtro-processos'] === t.id ? '' : 'none' }}>
                {renderResultado(t.id)}
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{ display: tabAtiva === 'filtro-emendas' ? '' : 'none' }}>
        <h3 className="ad-section-title">Buscar Emendas</h3>
        <QueryForm campos={camposEmenda} loading={Object.values(loading).some(Boolean)} onBuscar={(p) => buscar('emendas', p, 'Emendas')} />
        {subTabs['filtro-emendas'] && subTabs['filtro-emendas'].length > 0 && (
          <>
            <SubTabBar 
              tabs={subTabs['filtro-emendas']} 
              ativa={subTabAtiva['filtro-emendas']} 
              onSelect={(id) => setSubTabAtiva(prev => ({ ...prev, 'filtro-emendas': id }))} 
              onFechar={(id) => fecharSubTab('filtro-emendas', id)} 
            />
            {subTabs['filtro-emendas'].map(t => (
              <div key={t.id} style={{ display: subTabAtiva['filtro-emendas'] === t.id ? '' : 'none' }}>
                {renderResultado(t.id)}
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{ display: tabAtiva === 'filtro-votacoes' ? '' : 'none' }}>
        <h3 className="ad-section-title">Buscar Votações</h3>
        <QueryForm campos={camposVotacao} loading={Object.values(loading).some(Boolean)} onBuscar={(p) => buscar('votacoes', p, 'Votações')} />
        {subTabs['filtro-votacoes'] && subTabs['filtro-votacoes'].length > 0 && (
          <>
            <SubTabBar 
              tabs={subTabs['filtro-votacoes']} 
              ativa={subTabAtiva['filtro-votacoes']} 
              onSelect={(id) => setSubTabAtiva(prev => ({ ...prev, 'filtro-votacoes': id }))} 
              onFechar={(id) => fecharSubTab('filtro-votacoes', id)} 
            />
            {subTabs['filtro-votacoes'].map(t => (
              <div key={t.id} style={{ display: subTabAtiva['filtro-votacoes'] === t.id ? '' : 'none' }}>
                {renderResultado(t.id)}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Agenda Senado ───────────────────── */

function SecaoAgenda() {
  const [resultados, setResultados] = useState({});
  const [tabAtiva, setTabAtiva] = useState('geral');
  const [loading, setLoading] = useState({});
  const [subTabs, setSubTabs] = useState({});
  const [subTabAtiva, setSubTabAtiva] = useState({});

  const buscarAgendaDia = useCallback(async (params) => {
    const dataRaw = params.data;
    if (!dataRaw) return;
    const data = dateParaAPI(dataRaw);
    const parentTab = 'filtro-dia';
    const subTabId = `agenda-dia-${Date.now()}`;
    const label = `Agenda Dia ${data}`;

    setResultados(prev => ({ ...prev, [subTabId]: { label, dados: null, loading: true } }));
    setSubTabs(prev => ({
      ...prev,
      [parentTab]: [...(prev[parentTab] || []), { id: subTabId, label, fechavel: true }]
    }));
    setSubTabAtiva(prev => ({ ...prev, [parentTab]: subTabId }));
    setLoading(prev => ({ ...prev, [subTabId]: true }));

    try {
      const resp = await api.get<any>(`/senado/agenda/dia/${data}`);
      const json = await resp.json();
      setResultados(prev => ({ ...prev, [subTabId]: { ...prev[subTabId], dados: json.dados || [], loading: false } }));
    } catch (err) {
      setResultados(prev => ({ ...prev, [subTabId]: { ...prev[subTabId], dados: [], loading: false, erro: err.message } }));
    }
    setLoading(prev => ({ ...prev, [subTabId]: false }));
  }, []);

  const buscarAgendaMes = useCallback(async (params) => {
    const dataRaw = params.data;
    if (!dataRaw) return;
    const data = dateParaAPI(dataRaw);
    const parentTab = 'filtro-mes';
    const subTabId = `agenda-mes-${Date.now()}`;
    const label = `Agenda Mês ${data}`;

    setResultados(prev => ({ ...prev, [subTabId]: { label, dados: null, loading: true } }));
    setSubTabs(prev => ({
      ...prev,
      [parentTab]: [...(prev[parentTab] || []), { id: subTabId, label, fechavel: true }]
    }));
    setSubTabAtiva(prev => ({ ...prev, [parentTab]: subTabId }));
    setLoading(prev => ({ ...prev, [subTabId]: true }));

    try {
      const resp = await api.get<any>(`/senado/agenda/mes/${data}`);
      const json = await resp.json();
      setResultados(prev => ({ ...prev, [subTabId]: { ...prev[subTabId], dados: json.dados || [], loading: false } }));
    } catch (err) {
      setResultados(prev => ({ ...prev, [subTabId]: { ...prev[subTabId], dados: [], loading: false, erro: err.message } }));
    }
    setLoading(prev => ({ ...prev, [subTabId]: false }));
  }, []);

  const buscarEncontro = useCallback(async (params) => {
    if (!params.codigo) return;
    const parentTab = 'filtro-encontro';
    const subTabId = `encontro-${Date.now()}`;
    const label = `Encontro ${params.codigo}`;

    setResultados(prev => ({ ...prev, [subTabId]: { label, dados: null, loading: true } }));
    setSubTabs(prev => ({
      ...prev,
      [parentTab]: [...(prev[parentTab] || []), { id: subTabId, label, fechavel: true }]
    }));
    setSubTabAtiva(prev => ({ ...prev, [parentTab]: subTabId }));
    setLoading(prev => ({ ...prev, [subTabId]: true }));

    try {
      const resp = await api.get<any>(`/senado/encontro/${params.codigo}`);
      const json = await resp.json();
      setResultados(prev => ({ ...prev, [subTabId]: { ...prev[subTabId], dados: json, loading: false } }));
    } catch (err) {
      setResultados(prev => ({ ...prev, [subTabId]: { ...prev[subTabId], dados: null, loading: false, erro: err.message } }));
    }
    setLoading(prev => ({ ...prev, [subTabId]: false }));
  }, []);

  const fecharSubTab = useCallback((parentTab, subTabId) => {
    setResultados(prev => { const n = { ...prev }; delete n[subTabId]; return n; });
    setSubTabs(prev => ({
      ...prev,
      [parentTab]: (prev[parentTab] || []).filter(t => t.id !== subTabId)
    }));
    setSubTabAtiva(prev => {
      const n = { ...prev };
      if (n[parentTab] === subTabId) {
        const remaining = (prev[parentTab] || []).filter(t => t.id !== subTabId);
        n[parentTab] = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      }
      return n;
    });
  }, []);

  const renderResultado = (id) => {
    const r = resultados[id];
    if (!r) return null;
    if (r.loading) return <div className="ad-loading">Buscando...</div>;
    if (r.erro) return <p className="ad-error">Erro: {r.erro}</p>;
    if (Array.isArray(r.dados) && r.dados.length > 0)
      return <TabelaGen cabecalhos={['Código', 'Descrição', 'Situação', 'Data', 'Hora', 'Casa']} linhas={r.dados.map(d => [d.Codigo, d.Descricao, d.Situacao, d.Data, d.HoraInicio, d.SiglaCasa])} />;
    if (r.dados?.Encontro) {
      const e = r.dados.Encontro;
      return (<div className="ad-info-grid"><InfoItem label="Código" value={e.Codigo} /><InfoItem label="Descrição" value={e.Descricao} /><InfoItem label="Situação" value={e.Situacao} /></div>);
    }
    return <p className="ad-empty">Nenhum resultado encontrado.</p>;
  };

  const fixedTabs = [
    { id: 'geral', label: 'Geral' },
    { id: 'filtro-dia', label: 'Agenda Dia' },
    { id: 'filtro-mes', label: 'Agenda Mês' },
    { id: 'filtro-encontro', label: 'Buscar Encontro' },
  ];

  return (
    <div>
      <SubTabBar tabs={fixedTabs} ativa={tabAtiva} onSelect={setTabAtiva} />
      <div style={{ display: tabAtiva === 'geral' ? '' : 'none' }}>
        <h3 className="ad-section-title">Agenda do Senado</h3>
        <p className="ad-query-form-desc">Consulte a agenda do plenário, reuniões de comissão e encontros legislativos.</p>
        <div className="ad-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <button className="ad-card" style={{ cursor: 'pointer', padding: 20, textAlign: 'center' }} onClick={() => setTabAtiva('filtro-dia')}>
            <strong>Agenda do Dia</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consulta por data</span>
          </button>
          <button className="ad-card" style={{ cursor: 'pointer', padding: 20, textAlign: 'center' }} onClick={() => setTabAtiva('filtro-mes')}>
            <strong>Agenda do Mês</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consulta por mês</span>
          </button>
          <button className="ad-card" style={{ cursor: 'pointer', padding: 20, textAlign: 'center' }} onClick={() => setTabAtiva('filtro-encontro')}>
            <strong>Encontro</strong><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Detalhes de encontro legislativo</span>
          </button>
        </div>
      </div>
      <div style={{ display: tabAtiva === 'filtro-dia' ? '' : 'none' }}>
        <h3 className="ad-section-title">Agenda do Dia</h3>
        <p className="ad-query-form-desc">Selecione a data no calendário.</p>
        <QueryForm campos={[{ name: 'data', label: 'Data', type: 'date' }]} loading={Object.values(loading).some(Boolean)} onBuscar={buscarAgendaDia} />
        {subTabs['filtro-dia'] && subTabs['filtro-dia'].length > 0 && (
          <>
            <SubTabBar
              tabs={subTabs['filtro-dia']}
              ativa={subTabAtiva['filtro-dia']}
              onSelect={(id) => setSubTabAtiva(prev => ({ ...prev, 'filtro-dia': id }))}
              onFechar={(id) => fecharSubTab('filtro-dia', id)}
            />
            {subTabs['filtro-dia'].map(t => (
              <div key={t.id} style={{ display: subTabAtiva['filtro-dia'] === t.id ? '' : 'none' }}>
                {renderResultado(t.id)}
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{ display: tabAtiva === 'filtro-mes' ? '' : 'none' }}>
        <h3 className="ad-section-title">Agenda do Mês</h3>
        <p className="ad-query-form-desc">Selecione a data no calendário (o mês será extraído).</p>
        <QueryForm campos={[{ name: 'data', label: 'Data', type: 'date' }]} loading={Object.values(loading).some(Boolean)} onBuscar={buscarAgendaMes} />
        {subTabs['filtro-mes'] && subTabs['filtro-mes'].length > 0 && (
          <>
            <SubTabBar
              tabs={subTabs['filtro-mes']}
              ativa={subTabAtiva['filtro-mes']}
              onSelect={(id) => setSubTabAtiva(prev => ({ ...prev, 'filtro-mes': id }))}
              onFechar={(id) => fecharSubTab('filtro-mes', id)}
            />
            {subTabs['filtro-mes'].map(t => (
              <div key={t.id} style={{ display: subTabAtiva['filtro-mes'] === t.id ? '' : 'none' }}>
                {renderResultado(t.id)}
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{ display: tabAtiva === 'filtro-encontro' ? '' : 'none' }}>
        <h3 className="ad-section-title">Buscar Encontro</h3>
        <QueryForm campos={[{ name: 'codigo', label: 'Código do Encontro', placeholder: 'Ex: 5998' }]} loading={Object.values(loading).some(Boolean)} onBuscar={buscarEncontro} />
        {subTabs['filtro-encontro'] && subTabs['filtro-encontro'].length > 0 && (
          <>
            <SubTabBar
              tabs={subTabs['filtro-encontro']}
              ativa={subTabAtiva['filtro-encontro']}
              onSelect={(id) => setSubTabAtiva(prev => ({ ...prev, 'filtro-encontro': id }))}
              onFechar={(id) => fecharSubTab('filtro-encontro', id)}
            />
            {subTabs['filtro-encontro'].map(t => (
              <div key={t.id} style={{ display: subTabAtiva['filtro-encontro'] === t.id ? '' : 'none' }}>
                {renderResultado(t.id)}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Comissões ──────────────────────── */

function SecaoComissoes() {
  const [comissoes, setComissoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');

  const [comTabs, setComTabs] = useState([]);
  const [comTabAtiva, setComTabAtiva] = useState(null);
  const [comDadosCache, setComDadosCache] = useState({});
  const [comDetalheLoading, setComDetalheLoading] = useState(null);
  const [comSecao, setComSecao] = useState({});
  const [votacoesCache, setVotacoesCache] = useState({});

  const comTabsRef = useRef(comTabs);
  comTabsRef.current = comTabs;
  const comDadosCacheRef = useRef(comDadosCache);
  comDadosCacheRef.current = comDadosCache;

  const carregarComissoes = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resp = await api.get<any>('/senado/comissoes');
      const json = await resp.json();
      setComissoes(json.dados || []);
    } catch (err) {
      setErro(err.message);
    }
    setLoading(false);
  }, []);

  const comissoesFiltradas = useMemo(() => {
    if (!filtroTexto) return comissoes;
    const t = filtroTexto.toLowerCase();
    return comissoes.filter(c =>
      (c.Sigla || '').toLowerCase().includes(t) ||
      (c.Nome || '').toLowerCase().includes(t) ||
      (c.Codigo || '').includes(t)
    );
  }, [comissoes, filtroTexto]);

  const abrirDetalheComissao = useCallback(async (com) => {
    const id = com.Codigo;
    if (!comTabsRef.current.some(t => t.id === id)) {
      setComTabs(prev => [...prev, { id, sigla: com.Sigla, nome: com.Nome }]);
    }
    setComTabAtiva(id);

    if (!comDadosCacheRef.current[id]) {
      setComDetalheLoading(id);
      try {
        const resp = await api.get<any>(`/senado/comissoes/${id}`);
        const json = await resp.json();
        setComDadosCache(prev => ({ ...prev, [id]: json.dados }));
        setComSecao(prev => ({ ...prev, [id]: 'info' }));
      } catch (err) {
        console.error('Erro ao buscar detalhes da comissao:', err);
      }
      setComDetalheLoading(null);
    }
  }, []);

  const fecharComTab = useCallback((id) => {
    setComTabs(prev => prev.filter(t => t.id !== id));
    setComTabAtiva(prev => {
      if (prev !== id) return prev;
      const rest = comTabsRef.current.filter(t => t.id !== id);
      return rest.length > 0 ? rest[rest.length - 1].id : null;
    });
  }, []);

  const alterarComSecao = useCallback((comId, secao) => {
    setComSecao(prev => ({ ...prev, [comId]: secao }));
    if (secao === 'votacoes' && !votacoesCache[comId]) {
      setVotacoesCache(prev => ({ ...prev, [comId]: { loading: true } }));
      const tabInfo = comTabsRef.current.find(t => t.id === comId);
      fetch(`${API_BASE_URL}/senado/votacoes/comissao/${tabInfo?.sigla || comId}`)
        .then(r => r.json())
        .then(json => setVotacoesCache(prev => ({ ...prev, [comId]: { dados: json.dados || [], loading: false } })))
        .catch(err => setVotacoesCache(prev => ({ ...prev, [comId]: { dados: [], loading: false, erro: err.message } })));
    }
  }, [votacoesCache]);

  const renderComSecao = (comId, secao) => {
    const dados = comDadosCache[comId];
    if (!dados) return null;
    if (secao === 'info') {
      return (
        <div className="ad-section">
          <h3 className="ad-section-title">Informações da Comissão</h3>
          <div className="ad-info-grid">
            <InfoItem label="Código" value={dados.codigo} />
            <InfoItem label="Sigla" value={dados.sigla} />
            <InfoItem label="Nome" value={dados.nome} />
            <InfoItem label="Total Membros" value={dados.membros?.length} />
          </div>
        </div>
      );
    }
    if (secao === 'membros') {
      const membros = dados.membros || [];
      return <SectionComissoesMembros membros={membros} />;
    }
    if (secao === 'votacoes') {
      const vc = votacoesCache[comId];
      if (!vc || vc.loading) return <div className="ad-loading">Carregando votações...</div>;
      if (vc.erro) return <p className="ad-error">Erro: {vc.erro}</p>;
      const votos = vc.dados || [];
      if (votos.length === 0) return <p className="ad-empty">Nenhuma votação encontrada.</p>;
      return (
        <TabelaGen
          cabecalhos={['Data', 'Sigla', 'Comissão', 'Matéria', 'Descrição']}
          maxWidthCol={{ 4: 300 }}
          linhas={votos.map(v => [
            v.DataHoraInicioReuniao || '-',
            v.SiglaColegiado || '-',
            v.NomeColegiado || '-',
            v.IdentificacaoMateria || '-',
            v.DescricaoVotacao || '-',
          ])}
        />
      );
    }
    return null;
  };

  const siglasUnicas = useMemo(() => {
    const s = new Set(comissoes.map(c => c.Sigla).filter(Boolean));
    return [...s].sort();
  }, [comissoes]);

  const [filtroSigla, setFiltroSigla] = useState('');

  const comissoesFiltradas2 = useMemo(() => {
    let lista = comissoes;
    if (filtroSigla) {
      lista = lista.filter(c => c.Sigla === filtroSigla);
    }
    if (filtroTexto) {
      const t = filtroTexto.toLowerCase();
      lista = lista.filter(c =>
        (c.Sigla || '').toLowerCase().includes(t) ||
        (c.Nome || '').toLowerCase().includes(t) ||
        (c.Codigo || '').includes(t)
      );
    }
    return lista;
  }, [comissoes, filtroSigla, filtroTexto]);

  return (
    <div>
      {/* Inner sub-tab bar: Lista + commission names */}
      {comTabs.length > 0 && (
        <div className="lp-sub-tabs" style={{ marginBottom: 12 }}>
          <button
            className={`lp-sub-tab ${comTabAtiva === null ? 'ativo' : ''}`}
            onClick={() => setComTabAtiva(null)}
          >
            Lista
          </button>
          {comTabs.map(t => (
            <button
              key={t.id}
              className={`lp-sub-tab ${comTabAtiva === t.id ? 'ativo' : ''}`}
              onClick={() => setComTabAtiva(t.id)}
            >
              <span className="ad-subtab-nome">{t.sigla} - {t.nome}</span>
              <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); fecharComTab(t.id); }}>×</span>
            </button>
          ))}
        </div>
      )}

      {/* Lista content */}
      {comTabAtiva === null && (
        <div>
          <h3 className="ad-section-title">Comissões do Senado</h3>
          <p className="ad-query-form-desc">
            {comissoes.length > 0 ? `${comissoes.length} comissões encontradas.` : 'Clique no botão abaixo para carregar.'}
          </p>
          {!loading && comissoes.length === 0 && !erro && (
            <button className="btn btn-accent" onClick={carregarComissoes}>Carregar Comissões</button>
          )}
          {loading && <div className="ad-loading">Carregando comissões...</div>}
          {erro && <p className="ad-error">Erro: {erro}</p>}
          {comissoes.length > 0 && (
            <>
              <div className="ad-query-form-grid" style={{ marginBottom: 12 }}>
                <input
                  className="ad-query-form-input"
                  style={{ flex: 1, maxWidth: 300 }}
                  placeholder="Filtrar por nome, sigla ou código..."
                  value={filtroTexto}
                  onChange={e => setFiltroTexto(e.target.value)}
                />
                <select
                  className="ad-query-form-input"
                  style={{ flex: 1, maxWidth: 200 }}
                  value={filtroSigla}
                  onChange={e => setFiltroSigla(e.target.value)}
                >
                  <option value="">Todas as siglas</option>
                  {siglasUnicas.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{comissoesFiltradas2.length} de {comissoes.length} registros</span>
              </div>
              <div className="ad-card-grid">
                {comissoesFiltradas2.map(com => (
                  <div key={com.Codigo} className="ad-card">
                    <div className="ad-card-header">
                      <span className="ad-card-tag">{com.Sigla || '-'}</span>
                      <span style={{ flex: 1 }}>{com.Nome || '-'}</span>
                    </div>
                    <div className="ad-card-body">
                      <div className="ad-card-row"><span className="ad-card-label">Código:</span> {com.Codigo || '-'}</div>
                    </div>
                    <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
                      <button className="btn btn-sm btn-outline-accent" onClick={() => abrirDetalheComissao(com)}>
                        Detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Commission detail sub-tabs */}
      {comTabs.map(t => {
        if (comTabAtiva !== t.id) return null;
        const dados = comDadosCache[t.id];
        const carregando = comDetalheLoading === t.id;

        return (
          <div key={t.id}>
            {dados && (
              <div className="ad-dep-header">
                <div className="ad-dep-header-info">
                  <h3 className="ad-dep-nome">{t.sigla} — {t.nome}</h3>
                  <div className="ad-dep-tags">
                    <span className="tag tag-accent">Código: {t.id}</span>
                  </div>
                </div>
              </div>
            )}

            {carregando ? (
              <div className="ad-loading">Carregando dados da comissão...</div>
            ) : dados ? (
              <>
                <div className="ad-secao-btns">
                  <button className={`ad-secao-btn ${(comSecao[t.id] || 'info') === 'info' ? 'ativo' : ''}`} onClick={() => alterarComSecao(t.id, 'info')}>Informações</button>
                  <button className={`ad-secao-btn ${(comSecao[t.id] || 'info') === 'membros' ? 'ativo' : ''}`} onClick={() => alterarComSecao(t.id, 'membros')}>
                    Senadores Associados{dados.membros?.length > 0 && <span className="ad-secao-badge">{dados.membros.length}</span>}
                  </button>
                  <button className={`ad-secao-btn ${(comSecao[t.id] || 'info') === 'votacoes' ? 'ativo' : ''}`} onClick={() => alterarComSecao(t.id, 'votacoes')}>
                    Votações
                  </button>
                </div>
                {renderComSecao(t.id, comSecao[t.id] || 'info')}
              </>
            ) : (
              <p className="ad-empty">Nenhum dado disponível.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── SectionComissoesMembros ─────────── */

function SectionComissoesMembros({ membros }) {
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroPartido, setFiltroPartido] = useState('');

  const partidosUnicos = useMemo(() => {
    const s = new Set(membros.map(m => m.SiglaPartidoParlamentar).filter(Boolean));
    return [...s].sort();
  }, [membros]);

  const filtrados = useMemo(() => {
    return membros.filter(m => {
      const nomeMatch = !filtroNome || (m.NomeParlamentar || '').toLowerCase().includes(filtroNome.toLowerCase());
      const partidoMatch = !filtroPartido || (m.SiglaPartidoParlamentar || '') === filtroPartido;
      return nomeMatch && partidoMatch;
    });
  }, [membros, filtroNome, filtroPartido]);

  if (!membros || membros.length === 0) return <p className="ad-empty">Nenhum senador associado.</p>;

  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Senadores Associados ({membros.length})</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="ad-query-form-input"
          style={{ flex: 1, maxWidth: 280 }}
          placeholder="Filtrar por nome..."
          value={filtroNome}
          onChange={e => setFiltroNome(e.target.value)}
        />
        <select
          className="ad-query-form-input"
          style={{ flex: 1, maxWidth: 160 }}
          value={filtroPartido}
          onChange={e => setFiltroPartido(e.target.value)}
        >
          <option value="">Todos os partidos</option>
          {partidosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtrados.length} de {membros.length} registros</span>
      </div>
      <TabelaGen
        cabecalhos={['Nome', 'Partido', 'UF', 'Participação', 'Início', 'Fim']}
        linhas={filtrados.map(m => [
          m.NomeParlamentar || '-',
          m.SiglaPartidoParlamentar ? <span className="ad-card-tag">{m.SiglaPartidoParlamentar}</span> : '-',
          m.UfParlamentar || '-',
          m.DescricaoParticipacao || '-',
          m.DataInicio || '-',
          m.DataFim || 'atual',
        ])}
      />
    </div>
  );
}

/* ─── Componente Principal ────────────── */

export default function AnaliseSenadores() {
  const [senadores, setSenadores] = useState([]);
  const [listaLoading, setListaLoading] = useState(false);
  const [listaErro, setListaErro] = useState(null);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroPartido, setFiltroPartido] = useState('');
  const [filtroUf, setFiltroUf] = useState('');

  const [senatorTabs, setSenatorTabs] = useState([]);
  const [senatorTabAtiva, setSenatorTabAtiva] = useState(null);
  const [dadosCache, setDadosCache] = useState({});
  const [detalheLoading, setDetalheLoading] = useState(null);
  const [senatorSecao, setSenatorSecao] = useState({});
  const [emendasCache, setEmendasCache] = useState({});

  const [mainTabAtiva, setMainTabAtiva] = useState('lista');

  const senatorTabsRef = useRef(senatorTabs);
  senatorTabsRef.current = senatorTabs;
  const dadosCacheRef = useRef(dadosCache);
  dadosCacheRef.current = dadosCache;

  const senadoresFiltrados = useMemo(() => {
    return senadores.filter(sen => {
      const ident = sen.IdentificacaoParlamentar || {};
      const nomeMatch = !filtroNome || (ident.NomeParlamentar || '').toLowerCase().includes(filtroNome.toLowerCase());
      const partidoMatch = !filtroPartido || (ident.SiglaPartidoParlamentar || '').toLowerCase().includes(filtroPartido.toLowerCase());
      const ufMatch = !filtroUf || (ident.UfParlamentar || '').toLowerCase() === filtroUf.toLowerCase();
      return nomeMatch && partidoMatch && ufMatch;
    });
  }, [senadores, filtroNome, filtroPartido, filtroUf]);

  const nomesUnicos = useMemo(() => {
    const s = new Set(senadores.map(sen => sen.IdentificacaoParlamentar?.NomeParlamentar).filter(Boolean));
    return [...s].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [senadores]);

  const partidosUnicos = useMemo(() => {
    const s = new Set(senadores.map(sen => sen.IdentificacaoParlamentar?.SiglaPartidoParlamentar).filter(Boolean));
    return [...s].sort();
  }, [senadores]);

  const ufsUnicos = useMemo(() => {
    const s = new Set(senadores.map(sen => sen.IdentificacaoParlamentar?.UfParlamentar).filter(Boolean));
    return [...s].sort();
  }, [senadores]);

  const carregarLista = useCallback(async () => {
    setListaLoading(true);
    setListaErro(null);
    try {
      const resp = await api.get<any>('/senado/senadores');
      const json = await resp.json();
      setSenadores(json.dados || []);
    } catch (err) {
      setListaErro(err.message);
    }
    setListaLoading(false);
  }, []);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  const abrirDetalhe = useCallback(async (sen) => {
    const id = sen.IdentificacaoParlamentar?.CodigoParlamentar;
    if (!id) return;
    const ident = sen.IdentificacaoParlamentar || {};
    if (!senatorTabsRef.current.some(t => t.id === id)) {
      setSenatorTabs(prev => [...prev, { id, nome: ident.NomeParlamentar, urlFoto: ident.UrlFotoParlamentar, siglaPartido: ident.SiglaPartidoParlamentar, uf: ident.UfParlamentar }]);
    }
    setMainTabAtiva('lista');
    setSenatorTabAtiva(id);

    if (!dadosCacheRef.current[id]) {
      setDetalheLoading(id);
      try {
        const resp = await api.get<any>(`/senado/senadores/${id}/completo`);
        const json = await resp.json();
        setDadosCache(prev => ({ ...prev, [id]: json }));
        setSenatorSecao(prev => ({ ...prev, [id]: 'geral' }));
      } catch (err) {
        console.error('Erro ao buscar detalhes do senador:', err);
      }
      setDetalheLoading(null);
    }
  }, []);

  const fecharSenatorTab = useCallback((id) => {
    setSenatorTabs(prev => prev.filter(t => t.id !== id));
    setSenatorTabAtiva(prev => {
      if (prev !== id) return prev;
      const rest = senatorTabsRef.current.filter(t => t.id !== id);
      return rest.length > 0 ? rest[rest.length - 1].id : null;
    });
  }, []);

  const alterarSenatorSecao = useCallback((depId, secao) => {
    setSenatorSecao(prev => ({ ...prev, [depId]: secao }));
    if (secao === 'emendas' && !emendasCache[depId]) {
      setEmendasCache(prev => ({ ...prev, [depId]: { loading: true } }));
      const tabInfo = senatorTabsRef.current.find(t => t.id === depId);
      api.get<any>('/senado/processo/emendas', { codigoParlamentarAutor: depId })
        .then(r => r.json())
        .then(json => setEmendasCache(prev => ({ ...prev, [depId]: { dados: json.dados || [], loading: false } })))
        .catch(err => setEmendasCache(prev => ({ ...prev, [depId]: { dados: [], loading: false, erro: err.message } })));
    }
  }, [emendasCache]);

  const renderSenatorSecao = (senId, secao) => {
    const dados = dadosCache[senId];
    if (!dados) return null;
    if (secao === 'geral') return <SecaoGeralSenador senador={dados.senador} />;
    if (secao === 'cargos') return <SectionCargos dados={dados.cargos} />;
    if (secao === 'comissoes') return <SectionComissoes dados={dados.comissoes} />;
    if (secao === 'mandatos') return <SectionMandatos dados={dados.mandatos} />;
    if (secao === 'emendas') {
      const ec = emendasCache[senId];
      if (!ec || ec.loading) return <div className="ad-loading">Carregando emendas...</div>;
      if (ec.erro) return <p className="ad-error">Erro: {ec.erro}</p>;
      const tabInfo = senatorTabsRef.current.find(t => t.id === senId);
      return (
        <div className="ad-section">
          <h3 className="ad-section-title">Emendas Propostas por {tabInfo?.nome || senId}</h3>
          <TabelaGen
            cabecalhos={['ID', 'Identificação', 'Autoria', 'Comissão', 'Tipo', 'Data', 'Descrição', 'Documento']}
            maxWidthCol={{ 1: 250, 2: 200, 6: 300 }}
            linhas={(ec.dados || []).map(d => [d.id || d.Id, d.identificacao || d.Identificacao, d.autoria || d.Autoria, d.siglaColegiado || '-', d.tipo || d.Tipo || '-', d.dataApresentacao || d.DataApresentacao || '-', d.descricaoDocumentoEmenda || '-', d.urlDocumentoEmenda || d.UrlDocumentoEmenda ? <a href={d.urlDocumentoEmenda || d.UrlDocumentoEmenda} target="_blank" rel="noopener noreferrer" className="ad-link">Abrir</a> : '-'])}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Análise de Senadores</h2>
        <p className="tab-desc">Consulte informações detalhadas dos senadores, processos legislativos e agenda do Senado.</p>
      </div>

      {/* Top-level tab bar: only the 3 main tabs */}
      <div className="lp-sub-tabs">
        <button className={`lp-sub-tab ${mainTabAtiva === 'lista' ? 'ativo' : ''}`} onClick={() => setMainTabAtiva('lista')}>Lista</button>
        <button className={`lp-sub-tab ${mainTabAtiva === 'processos' ? 'ativo' : ''}`} onClick={() => setMainTabAtiva('processos')}>Processos e Emendas</button>
        <button className={`lp-sub-tab ${mainTabAtiva === 'agenda' ? 'ativo' : ''}`} onClick={() => setMainTabAtiva('agenda')}>Agenda Senado</button>
        <button className={`lp-sub-tab ${mainTabAtiva === 'comissoes' ? 'ativo' : ''}`} onClick={() => setMainTabAtiva('comissoes')}>Comissões</button>
      </div>

      {/* ─── LISTA (with senator sub-tabs inside) ─── */}
      <div style={{ display: mainTabAtiva === 'lista' ? '' : 'none' }}>
        {/* Inner sub-tab bar for Lista + senator names */}
        {senatorTabs.length > 0 && (
          <div className="lp-sub-tabs" style={{ marginBottom: 12 }}>
            <button
              className={`lp-sub-tab ${senatorTabAtiva === null ? 'ativo' : ''}`}
              onClick={() => setSenatorTabAtiva(null)}
            >
              Lista
            </button>
            {senatorTabs.map(t => (
              <button
                key={t.id}
                className={`lp-sub-tab ${senatorTabAtiva === t.id ? 'ativo' : ''}`}
                onClick={() => setSenatorTabAtiva(t.id)}
              >
                <span className="ad-subtab-nome">{t.nome}</span>
                <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); fecharSenatorTab(t.id); }}>×</span>
              </button>
            ))}
          </div>
        )}

        {/* Lista content (senator grid) */}
        {senatorTabAtiva === null && (
          <div>
            <h3 className="ad-section-title">Senadores em Exercício</h3>
            <p className="ad-query-form-desc">
              {senadores.length > 0 ? `${senadores.length} senadores encontrados. Clique em "Detalhes" para ver informações completas.` : 'Carregando lista de senadores...'}
            </p>
            {listaLoading && <div className="ad-loading">Carregando senadores...</div>}
            {listaErro && <p className="ad-error">Erro: {listaErro}</p>}
            {senadores.length > 0 && (
              <>
                <div>
                  <div className="ad-query-form-grid" style={{ marginBottom: 8 }}>
                    <input
                      className="ad-query-form-input"
                      style={{ flex: 1, maxWidth: 300 }}
                      placeholder="Filtrar por nome..."
                      value={filtroNome}
                      onChange={e => setFiltroNome(e.target.value)}
                    />
                    <input
                      className="ad-query-form-input"
                      style={{ flex: 1, maxWidth: 120 }}
                      placeholder="Filtrar por partido..."
                      value={filtroPartido}
                      onChange={e => setFiltroPartido(e.target.value)}
                    />
                    <input
                      className="ad-query-form-input"
                      style={{ flex: 1, maxWidth: 80 }}
                      placeholder="UF"
                      value={filtroUf}
                      onChange={e => setFiltroUf(e.target.value)}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>{senadoresFiltrados.length} de {senadores.length} registros</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      className="ad-query-form-input"
                      style={{ maxWidth: 300 }}
                      value={filtroNome}
                      onChange={e => setFiltroNome(e.target.value)}
                    >
                      <option value="">Todos os nomes (texto livre)</option>
                      {nomesUnicos.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select
                      className="ad-query-form-input"
                      style={{ maxWidth: 120 }}
                      value={filtroPartido}
                      onChange={e => setFiltroPartido(e.target.value)}
                    >
                      <option value="">Todos os partidos (texto livre)</option>
                      {partidosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select
                      className="ad-query-form-input"
                      style={{ maxWidth: 80 }}
                      value={filtroUf}
                      onChange={e => setFiltroUf(e.target.value)}
                    >
                      <option value="">Todas as UFs</option>
                      {ufsUnicos.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <GridSenadores senadores={senadoresFiltrados} detalheLoading={detalheLoading} onDetalhes={abrirDetalhe} />
              </>
            )}
          </div>
        )}

        {/* Senator detail sub-tabs */}
        {senatorTabs.map(t => {
          if (senatorTabAtiva !== t.id) return null;
          const dados = dadosCache[t.id];
          const carregando = detalheLoading === t.id;

          return (
            <div key={t.id}>
              {dados && dados.senador && (
                <div className="ad-dep-header">
                  <img className="ad-dep-foto" src={t.urlFoto} alt={t.nome} onError={(e) => { e.target.style.display = 'none'; }} />
                  <div className="ad-dep-header-info">
                    <h3 className="ad-dep-nome">{t.nome}</h3>
                    <div className="ad-dep-tags">
                      <span className="tag tag-candidato">{t.siglaPartido}</span>
                      <span className="tag tag-accent">{t.uf}</span>
                    </div>
                  </div>
                </div>
              )}

              {carregando ? (
                <div className="ad-loading">Carregando dados completos...</div>
              ) : dados ? (
                <>
                  <div className="ad-secao-btns">
                    <button className={`ad-secao-btn ${(senatorSecao[t.id] || 'geral') === 'geral' ? 'ativo' : ''}`} onClick={() => alterarSenatorSecao(t.id, 'geral')}>Informações Gerais</button>
                    <button className={`ad-secao-btn ${(senatorSecao[t.id] || 'geral') === 'cargos' ? 'ativo' : ''}`} onClick={() => alterarSenatorSecao(t.id, 'cargos')}>
                      Cargos{Array.isArray(dados.cargos) && dados.cargos.length > 0 && <span className="ad-secao-badge">{dados.cargos.length}</span>}
                    </button>
                    <button className={`ad-secao-btn ${(senatorSecao[t.id] || 'geral') === 'comissoes' ? 'ativo' : ''}`} onClick={() => alterarSenatorSecao(t.id, 'comissoes')}>
                      Comissões{Array.isArray(dados.comissoes) && dados.comissoes.length > 0 && <span className="ad-secao-badge">{dados.comissoes.filter(c => !c.DataFim).length}</span>}
                    </button>
                    <button className={`ad-secao-btn ${(senatorSecao[t.id] || 'geral') === 'mandatos' ? 'ativo' : ''}`} onClick={() => alterarSenatorSecao(t.id, 'mandatos')}>
                      Mandatos{Array.isArray(dados.mandatos) && dados.mandatos.length > 0 && <span className="ad-secao-badge">{dados.mandatos.length}</span>}
                    </button>
                    <button className={`ad-secao-btn ${(senatorSecao[t.id] || 'geral') === 'emendas' ? 'ativo' : ''}`} onClick={() => alterarSenatorSecao(t.id, 'emendas')}>
                      Emendas
                    </button>
                  </div>
                  {renderSenatorSecao(t.id, senatorSecao[t.id] || 'geral')}
                </>
              ) : (
                <p className="ad-empty">Nenhum dado disponível.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── PROCESSOS E EMENDAS ─── */}
      <div style={{ display: mainTabAtiva === 'processos' ? '' : 'none' }}>
        <SecaoProcessos />
      </div>

      {/* ─── AGENDA SENADO ─── */}
      <div style={{ display: mainTabAtiva === 'agenda' ? '' : 'none' }}>
        <SecaoAgenda />
      </div>

      {/* ─── COMISSÕES ─── */}
      <div style={{ display: mainTabAtiva === 'comissoes' ? '' : 'none' }}>
        <SecaoComissoes />
      </div>
    </div>
  );
}
