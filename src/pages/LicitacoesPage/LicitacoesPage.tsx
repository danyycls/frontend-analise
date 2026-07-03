// @ts-nocheck
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setAbaAtiva, setFormAberto, setLicitacaoForm, type LicitacaoFormState } from '@/app/store/slices/navigationSlice';
import { addConsulta, removeConsulta as removeConsultaAction, setConsultas, setActiveJob } from '@/app/store/slices/consultaSlice';
import { addSubTab, setSubTabAtiva } from '@/app/store/slices/ligacaoPoliticaSlice';
import Formulario from '@/features/licitacao/ui/Formulario';
import FormularioPublicacao from '@/features/licitacao/ui/FormularioPublicacao';
import Progresso from '@/features/licitacao/ui/Progresso';
import Resultados from '@/features/ligacao-politica/ui/Resultados';
import { JanelaPopup, ContratoDetalhes } from '@/features/ligacao-politica/ui/Resultados';
import EntityPopup from '@/features/ligacao-politica/ui/EntityPopup';
import PageNav from '@/shared/ui/PageNav/PageNav';
import ToolCard from '@/shared/ui/ToolCard/ToolCard';
import { LicitacaoDefinicao, LicitacaoImportancia, LicitacaoDispensa } from '@/features/licitacao/ui/LicitacaoInfo';
import ConvenioSelector from '@/widgets/ConvenioSelector/ConvenioSelector';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';
import { api } from '@/shared/api/client';
import { fmtDoc, normalizarCNPJ } from '@/shared/lib/formatters';
import './LicitacoesPage.css';

let uid = 0;

interface FilaItem {
  jobId: string;
  meta: Record<string, unknown>;
}

export default function LicitacoesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const formAberto = useAppSelector((s) => s.navigation.formAberto);
  const tipoBusca = useAppSelector((s) => s.navigation.tipoBusca);
  const licitacaoForm = useAppSelector((s) => s.navigation.licitacaoForm);

  const formState = useMemo(() => ({
    tipo: licitacaoForm.tipo,
    uf: licitacaoForm.uf,
    codigoMunicipio: licitacaoForm.codigoMunicipio,
    municipioNome: licitacaoForm.municipioNome,
    ano: licitacaoForm.ano,
    trimestres: licitacaoForm.trimestres,
    modalidade: licitacaoForm.modalidade,
  }), [licitacaoForm]);

  const consultas = useAppSelector((s) => s.consulta.consultas);
  const consultasFiltradas = useMemo(
    () => consultas.filter(c => tipoBusca === 'publicacao' ? c.meta.tipo === 'publicacao' : c.meta.tipo !== 'publicacao'),
    [consultas, tipoBusca]
  );
  const activeJob = useAppSelector((s) => s.consulta.activeJob);
  const { popupInfo, setPopupInfo } = useEntityInfo();
  const [pncpDestacado, setPncpDestacado] = useState(null);
  const [popup, setPopup] = useState(null);
  const [entidadeCache, setEntidadeCache] = useState({});

  // ConvenioSelector state (persisted in Redux so it survives tab navigation)
  const cnpjsSelecionados = useAppSelector((s) => s.navigation.licitacaoForm.cnpjsSelecionados);

  // Sequential trimestre processing (refs to avoid closure issues)
  const filaRef = useRef<FilaItem[]>([]);
  const acumuladoRef = useRef<any[]>([]);
  const [filaCount, setFilaCount] = useState(0);

  const KEY_TO_TIPO = {
    sq_candidato: 'candidato',
    sq_despesa: 'despesa',
    sq_receita: 'receita',
    sq_prestador_contas: 'prestador_contas',
    cpf_cnpj: 'fornecedor',
    cpf: 'candidato',
    cpf_cnpj_doador: 'doador',
  };

  // Start processing next job in queue
  const processarProximo = useCallback(() => {
    const fila = filaRef.current;
    if (fila.length === 0) {
      const acumulado = acumuladoRef.current;
      if (acumulado.length > 0) {
        const nova = {
          id: ++uid,
          timestamp: new Date().toISOString(),
          meta: {
            ...acumulado[0]?.meta,
            trimestresConcluidos: true,
            tipo: 'orgao',
          },
          resultados: acumulado,
        };
        dispatch(addConsulta(nova));
      }
      acumuladoRef.current = [];
      dispatch(setActiveJob(null));
      return;
    }
    const next = fila[0];
    dispatch(setActiveJob({ jobId: next.jobId, meta: { ...next.meta, tipo: 'orgao' } }));
  }, [dispatch]);

  // Called when a job completes
  const handleFinalizar = useCallback((resultados, meta, paginasErro) => {
    const novos = resultados || [];
    const acumulado = [...acumuladoRef.current, ...novos];
    acumuladoRef.current = acumulado;

    // Remove the completed job from queue (always the first)
    const fila = filaRef.current;
    if (fila.length > 0) {
      fila.shift();
      filaRef.current = fila;
      setFilaCount(fila.length);
    }

    // Schedule next
    setTimeout(() => processarProximo(), 0);
  }, [processarProximo]);

  // Called by Formulario to add a new job to the queue
  const handleEnfileirar = useCallback((jobId: string, meta: Record<string, unknown>) => {
    const fila = filaRef.current;
    const isFirst = fila.length === 0;
    fila.push({ jobId, meta: { ...meta, jobId } });
    filaRef.current = fila;
    setFilaCount(fila.length);

    // If nothing is processing, start this one
    if (isFirst) {
      dispatch(setActiveJob({ jobId, meta: { ...meta, tipo: 'orgao' } }));
    }
  }, [dispatch]);

  const handleIniciar = useCallback((jobId, meta) => {
    dispatch(setActiveJob({ jobId, meta: { ...meta, tipo: 'orgao' } }));
  }, [dispatch]);

  const handleApagar = useCallback((id) => {
    dispatch(removeConsultaAction(id));
  }, [dispatch]);

  const handleLigacaoPoliticaConsulta = useCallback((consultaId: number) => {
    dispatch(addSubTab({ kind: 'consulta', id: consultaId }));
    dispatch(setSubTabAtiva(`consulta-${consultaId}`));
    dispatch(setAbaAtiva('ligacao-politica'));
    navigate('/ligacao-politica');
  }, [dispatch, navigate]);

  const handleCancelarJob = useCallback(() => {
    dispatch(setActiveJob(null));
    dispatch(setFormAberto(true));
    filaRef.current = [];
    acumuladoRef.current = [];
    setFilaCount(0);
  }, [dispatch]);

  const handlePublicacaoResultados = useCallback((dados: any[], meta: Record<string, unknown>) => {
    const grouped = new Map<string, any[]>();
    dados.forEach((c) => {
      const key = c.cnpjOrgao || c.orgaoEntidade?.cnpj || c.nomeOrgao || 'desconhecido';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(c);
    });

    const resultados = Array.from(grouped.entries()).map(([key, contratos]) => {
      const primeiro = contratos[0];
      return {
        orgao: {
          cnpj: key,
          razaoSocial: primeiro?.nomeOrgao || primeiro?.orgaoEntidade?.razaoSocial || key,
        },
        contratos,
        resumo: {
          totalContratos: contratos.length,
          totalEmpresas: new Set(contratos.map((c) => c.fornecedor?.cnpj || c.niFornecedor).filter(Boolean)).size,
          valorTotalContratos: contratos.reduce((sum, c) => sum + (c.valorGlobal ?? c.valorTotalEstimado ?? 0), 0),
        },
        periodo: {
          dataInicial: `${meta.ano}-01-01`,
          dataFinal: `${meta.ano}-12-31`,
        },
      };
    });

    const nova = {
      id: ++uid,
      timestamp: new Date().toISOString(),
      meta,
      resultados,
    };
    dispatch(addConsulta(nova));
  }, [dispatch]);

  const handleIdClickFromAnalise = useCallback((key, value) => {
    const tipo = KEY_TO_TIPO[key];
    if (tipo) {
      setPopup({ tipo: 'entidade', chave: value, idKey: key });
    } else {
      setPopup({ tipo: 'generic', data: { [key]: value }, titulo: key });
    }
  }, []);

  const handleFormChange = useCallback((state: Partial<LicitacaoFormState>) => {
    dispatch(setLicitacaoForm(state));
  }, [dispatch]);

  const handleLicitacaoPopup = useCallback((pncp) => {
    for (const c of consultas) {
      for (const r of (c.resultados || [])) {
        for (const ct of (r.contratos || [])) {
          if (ct.numeroControlePNCP === pncp) {
            setPopup({ tipo: 'contrato', data: ct, titulo: `Licitação ${pncp}` });
            return;
          }
        }
      }
    }
    setPopup({ tipo: 'contrato', data: { numeroControlePNCP: pncp }, titulo: `Licitação ${pncp}` });
  }, [consultas]);

  // ConvenioSelector handlers
  const cnpjsSelecionadosNorm = useMemo(
    () => cnpjsSelecionados.map(normalizarCNPJ),
    [cnpjsSelecionados]
  );

  const handleToggleCnpj = useCallback((cnpj: string) => {
    const norm = normalizarCNPJ(cnpj);
    dispatch(setLicitacaoForm({
      cnpjsSelecionados: cnpjsSelecionadosNorm.includes(norm)
        ? cnpjsSelecionados.filter((_, i) => normalizarCNPJ(cnpjsSelecionados[i]) !== norm)
        : [...cnpjsSelecionados, cnpj],
    }));
  }, [dispatch, cnpjsSelecionados, cnpjsSelecionadosNorm]);

  const handleSelectAll = useCallback((cnpjs: string[]) => {
    const set = new Set(cnpjsSelecionadosNorm);
    const novos = cnpjs.filter(c => !set.has(normalizarCNPJ(c)));
    dispatch(setLicitacaoForm({ cnpjsSelecionados: [...cnpjsSelecionados, ...novos] }));
  }, [dispatch, cnpjsSelecionados, cnpjsSelecionadosNorm]);

  const handleDeselectAll = useCallback(() => {
    dispatch(setLicitacaoForm({ cnpjsSelecionados: [] }));
  }, [dispatch]);

  const handleRemoverCnpjExterno = useCallback((cnpj: string) => {
    const norm = normalizarCNPJ(cnpj);
    dispatch(setLicitacaoForm({
      cnpjsSelecionados: cnpjsSelecionados.filter(c => normalizarCNPJ(c) !== norm),
    }));
  }, [dispatch, cnpjsSelecionados]);

  const totalOrgaos = consultasFiltradas.reduce((acc, c) => acc + (c.resultados?.length || 0), 0);

  const licitacaoSections = [
    { id: 'licitacoes-header', label: 'Início' },
    { id: 'licitacoes-cards', label: 'Entenda a Licitação' },
    { id: 'licitacoes-consulta', label: 'Faça sua Consulta' },
    ...(consultasFiltradas.length > 0 ? [{ id: 'licitacoes-resultados', label: 'Resultados' }] : []),
  ];

  useEffect(() => {
    if (pncpDestacado) {
      const timer = setTimeout(() => setPncpDestacado(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [pncpDestacado]);

  return (
    <div className="tab-page">
      <PageNav position="left" sections={licitacaoSections} />
      <div className="licitacoes-page">
        <div className="licitacoes-header" id="licitacoes-header">
          <div className="licitacoes-badge">// CONSULTA DE LICITAÇÕES //</div>
          <h1 className="licitacoes-title">
            Busca de Licitações<br />
            <span style={{ color: 'var(--accent)', fontSize: 'inherit' }}>PNCP</span>
            <InfoBadge chave="pncp_licitacoes" onInfoClick={setPopupInfo} />
          </h1>
          <p className="licitacoes-subtitle">Consulte contratos públicos no Portal Nacional de Contratações Públicas por órgão ou região.</p>
        </div>

        <div className="licitacoes-content-wrapper">
          <div className="licitacoes-cards-top">
            <ToolCard id="licitacao-o-que-e" title="O que é uma Licitação?">
              <LicitacaoDefinicao />
            </ToolCard>
            <ToolCard id="licitacao-importancia" title="Por que isso importa?">
              <LicitacaoImportancia />
            </ToolCard>
            <ToolCard id="licitacao-dispensa" title="Dispensa de Licitação">
              <LicitacaoDispensa />
            </ToolCard>
          </div>

          <div className="licitacoes-form-wrapper" id="licitacoes-consulta">
            {activeJob && filaCount > 0 ? (
              <div style={{ width: '100%' }}>
                {filaCount > 1 && (
                  <div className="progresso-card" style={{ marginBottom: 12, padding: '8px 16px', textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Trimestres restantes: {filaCount - 1}
                    </span>
                  </div>
                )}
                <Progresso
                  jobId={activeJob.jobId}
                  total={activeJob.meta.total}
                  meta={activeJob.meta}
                  onFinalizar={handleFinalizar}
                  onCancelar={handleCancelarJob}
                  streamPath="/orgao/analise/stream"
                />
              </div>
            ) : formAberto ? (
              tipoBusca === 'orgao' ? (
                <div className="licitacoes-layout-duas-colunas">
                  <div className="licitacoes-coluna-principal">
                    <Formulario
                      onIniciar={handleEnfileirar}
                      cnpjsExternos={cnpjsSelecionados}
                      onRemoverCnpjExterno={handleRemoverCnpjExterno}
                    />
                  </div>
                  <div className="licitacoes-coluna-lateral">
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Convênios
                      </span>
                      <InfoBadge chave="convenios" onInfoClick={setPopupInfo} />
                    </div>
                    <ConvenioSelector
                      cnpjsSelecionados={cnpjsSelecionados}
                      onToggleCnpj={handleToggleCnpj}
                      onSelectAll={handleSelectAll}
                      onDeselectAll={handleDeselectAll}
                    />
                  </div>
                </div>
              ) : (
                <div className="licitacoes-form-inner">
                  <FormularioPublicacao
                    onIniciar={handleIniciar}
                    onResultados={handlePublicacaoResultados}
                    formState={formState}
                    onFormChange={handleFormChange}
                  />
                </div>
              )
            ) : null}
          </div>

          {consultasFiltradas.length > 0 && (
            <>
              {(formAberto || (activeJob && filaCount > 0)) && <div className="licitacoes-section-divider" />}
              <div className="licitacoes-content" id="licitacoes-resultados">
                <div className="consultas-bar">
                  {!formAberto && !activeJob && (
                    <button className="btn btn-sm" onClick={() => dispatch(setFormAberto(true))}>
                      + Nova Consulta
                    </button>
                  )}
                  {consultasFiltradas.length > 0 && (
                    <span className="consultas-count">
                      {consultasFiltradas.length} consulta{consultasFiltradas.length > 1 ? 's' : ''}
                      {totalOrgaos > 0 && ` · ${totalOrgaos} orgaos`}
                    </span>
                  )}
                </div>

                {consultasFiltradas.map((consulta) => (
                  <ConsultaCard
                    key={consulta.id}
                    consulta={consulta}
                    pncpDestacado={pncpDestacado}
                    onIdClick={handleIdClickFromAnalise}
                    onClose={() => handleApagar(consulta.id)}
                    onLigacaoPolitica={() => handleLigacaoPoliticaConsulta(consulta.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}

      {popup && popup.tipo === 'contrato' && (
        <JanelaPopup titulo={popup.titulo} onFechar={() => setPopup(null)}>
          <ContratoDetalhes contrato={popup.data} onIdClick={handleIdClickFromAnalise} />
        </JanelaPopup>
      )}
      {popup && popup.tipo === 'entidade' && (
        <JanelaPopup titulo={`Entidade: ${fmtDoc(popup.chave)}`} onFechar={() => setPopup(null)}>
          <EntityPopup tipo={KEY_TO_TIPO[popup.idKey]} chave={popup.chave} cache={entidadeCache} onCache={handleAtualizarEntidadeCache} />
        </JanelaPopup>
      )}
    </div>
  );
}

function ConsultaCard({ consulta, pncpDestacado, onIdClick, onClose, onLigacaoPolitica }) {
  const [minimizado, setMinimizado] = useState(false);
  const [maximizado, setMaximizado] = useState(false);

  const isPublicacao = consulta.meta.tipo === 'publicacao';
  const totalContratos = consulta.resultados.reduce((sum, r) => sum + (r.contratos?.length || 0), 0);
  const totalOrgaos = consulta.resultados.length;

  const titulo = isPublicacao
    ? `UF: ${consulta.meta.uf}${consulta.meta.municipioNome ? ' \u00b7 ' + consulta.meta.municipioNome : ''}`
    : `${consulta.meta.cnpjs?.length || 0} CNPJs`;

  const subtitulo = isPublicacao
    ? `${consulta.meta.ano} \u00b7 ${consulta.meta.trimestres?.length || 0} trimestre(s)`
    : `${consulta.meta.dataInicial || '?'} a ${consulta.meta.dataFinal || '?'}`;

  const resumo = `${totalOrgaos} \u00f3rg\u00e3o(s) \u00b7 ${totalContratos} contrato(s)`;

  if (maximizado) {
    return createPortal(
      <div className="consulta-card consulta-card-maximizada">
        <div className="consulta-header">
          <div className="consulta-header-left">
            <span className="consulta-tag">{isPublicacao ? 'ESTADO' : 'CNPJ'}</span>
            <span className="consulta-data">{titulo}</span>
            <span className="consulta-meta">{subtitulo}</span>
          </div>
          <div className="consulta-header-right">
            <span className="consulta-sumario">{resumo}</span>
            <button className="btn btn-sm btn-outline-accent" onClick={(e) => { e.stopPropagation(); onLigacaoPolitica?.(); }} title="Análise de Ligação Política">
              Lig. Política
            </button>
            <button className="btn btn-sm" onClick={() => setMaximizado(false)} title="Restaurar">{'\ud83d\udd97'}</button>
            <button className="btn-apagar" onClick={onClose} title="Fechar">{'\u2715'}</button>
          </div>
        </div>
        <div className="consulta-body" style={{ overflow: 'auto', flex: 1 }}>
          <Resultados
            resultados={consulta.resultados}
            consultaMeta={consulta.meta}
            pncpDestacado={pncpDestacado}
            onIdClick={onIdClick}
          />
        </div>
      </div>,
      document.body
    );
  }

  if (minimizado) {
    return (
      <div className="consulta-card consulta-card-minimizada" onClick={() => setMinimizado(false)}>
        <div className="consulta-header">
          <div className="consulta-header-left">
            <span className="consulta-tag">{isPublicacao ? 'ESTADO' : 'CNPJ'}</span>
            <span className="consulta-data">{titulo}</span>
            <span className="consulta-meta">{subtitulo}</span>
          </div>
          <div className="consulta-header-right">
            <span className="consulta-sumario">{resumo}</span>
            <button className="btn btn-sm btn-outline-accent" onClick={(e) => { e.stopPropagation(); onLigacaoPolitica?.(); }} title="Análise de Ligação Política">
              Lig. Política
            </button>
            <button
              className="consulta-restore-btn"
              onClick={(e) => { e.stopPropagation(); setMinimizado(false); }}
              title="Restaurar"
            >{'\ud83d\udd97'}</button>
            <button
              className="btn-apagar"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              title="Fechar"
            >{'\u2715'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="consulta-card">
      <div className="consulta-header">
        <div className="consulta-header-left">
          <span className="consulta-tag">{isPublicacao ? 'ESTADO' : 'CNPJ'}</span>
          <span className="consulta-data">{titulo}</span>
          <span className="consulta-meta">{subtitulo}</span>
        </div>
        <div className="consulta-header-right">
          <span className="consulta-sumario">{resumo}</span>
          <button className="btn btn-sm btn-outline-accent" onClick={(e) => { e.stopPropagation(); onLigacaoPolitica?.(); }} title="Análise de Ligação Política">
            Lig. Política
          </button>
          <button className="consulta-restore-btn" onClick={() => setMinimizado(true)} title="Minimizar">{'\ud83d\udd55'}</button>
          <button className="consulta-restore-btn" onClick={() => setMaximizado(true)} title="Maximizar">{'\ud83d\udd56'}</button>
          <button className="btn-apagar" onClick={onClose} title="Fechar">{'\u2715'}</button>
        </div>
      </div>
      <div className="consulta-body">
        <Resultados
          resultados={consulta.resultados}
          consultaMeta={consulta.meta}
          pncpDestacado={pncpDestacado}
          onIdClick={onIdClick}
        />
      </div>
    </div>
  );
}
