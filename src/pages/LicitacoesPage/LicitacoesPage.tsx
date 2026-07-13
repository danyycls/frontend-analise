import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setAbaAtiva, setFormAberto } from '@/app/store/slices/navigationSlice';
import {
  addConsulta, removeConsulta as removeConsultaAction,
  addToFila, removeFromFila,
  setProgresso, resetProgresso,
} from '@/app/store/slices/consultaSlice';
import type { FilaItem } from '@/app/store/slices/consultaSlice';
import { addSubTab, setSubTabAtiva } from '@/app/store/slices/ligacaoPoliticaSlice';
import FormConsulta from '@/features/licitacao/ui/FormConsulta';
import type { ItemBusca, ParametrosBusca } from '@/features/licitacao/ui/FormConsulta';
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
import { ENDPOINTS } from '@/shared/api/endpoints';
import { fmtDoc, normalizarCNPJ } from '@/shared/lib/formatters';
import { store } from '@/app/store';
import { WS_BASE_URL } from '@/shared/config';
import './LicitacoesPage.css';

export default function LicitacoesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const formAberto = useAppSelector((s) => s.navigation.formAberto);
  const consultas = useAppSelector((s) => s.consulta.consultas);
  const progresso = useAppSelector((s) => s.consulta.progresso);
  const fila = useAppSelector((s) => s.consulta.fila);
  const { popupInfo, setPopupInfo } = useEntityInfo();
  const [pncpDestacado, setPncpDestacado] = useState(null);
  const [popup, setPopup] = useState(null);
  const [entidadeCache, setEntidadeCache] = useState({});
  const [cnpjsSelecionados, setCnpjsSelecionados] = useState<string[]>([]);
  const [view, setView] = useState<'form' | 'progress'>('form');

  const cancelRef = useRef(false);
  const processandoRef = useRef(false);

  const KEY_TO_TIPO: Record<string, string> = {
    sq_candidato: 'candidato',
    sq_despesa: 'despesa',
    sq_receita: 'receita',
    sq_prestador_contas: 'prestador_contas',
    cpf_cnpj: 'fornecedor',
    cpf: 'candidato',
    cpf_cnpj_doador: 'doador',
  };

  function trimestreParaDatas(ano: string, trimestre: number): { dataInicial: string; dataFinal: string } {
    switch (trimestre) {
      case 1: return { dataInicial: `${ano}0101`, dataFinal: `${ano}0331` };
      case 2: return { dataInicial: `${ano}0401`, dataFinal: `${ano}0630` };
      case 3: return { dataInicial: `${ano}0701`, dataFinal: `${ano}0930` };
      default: return { dataInicial: `${ano}1001`, dataFinal: `${ano}1231` };
    }
  }

  function listenWebSocket(jobId: string, channel: string): Promise<any[] | null> {
    return new Promise<any[] | null>((resolve) => {
      const ws = new WebSocket(`${WS_BASE_URL}/ws`);
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.close();
          resolve(null);
        }
      }, 120000);

      const finalizar = (val: any[] | null) => {
        clearTimeout(timeout);
        clearInterval(checkCancel);
        if (!resolved) {
          resolved = true;
          ws.close();
          resolve(val);
        }
      };

      ws.onopen = () => {
        ws.send(JSON.stringify({ channel, job_id: jobId }));
      };

      ws.onmessage = (e) => {
        try {
          const ev = JSON.parse(e.data);
          if (ev.type === 'results') {
            finalizar(ev.results || []);
          }
          if (ev.type === 'error') {
            finalizar(null);
          }
          if (ev.type === 'done' && !resolved) {
            finalizar(null);
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        finalizar(null);
      };

      cancelRef.current = false;
      const checkCancel = setInterval(() => {
        if (cancelRef.current && !resolved) {
          finalizar(null);
        }
      }, 200);
    });
  }

  async function buscarContratosUFMunicipio(tipo: string, uf: string, codigoMunicipio: string, ano: string, trimestres: number[]): Promise<{ resultados: any[]; totalContratos: number }> {
    const todosResultados: any[] = [];
    let totalContratos = 0;
    dispatch(setProgresso({ fetchProgresso: { concluidos: 0, total: trimestres.length } }));
    for (let i = 0; i < trimestres.length; i++) {
      if (cancelRef.current) break;
      const t = trimestres[i];
      const label = tipo === 'uf' ? uf : codigoMunicipio;
      dispatch(setProgresso({ stage: 'buscando' }));

      const { dataInicial, dataFinal } = trimestreParaDatas(ano, t);

      const resp = await api.post<{ jobId: string }>(ENDPOINTS.UF_MUNICIPIO_ANALISE_START, {
        tipo,
        uf,
        codigo_municipio_ibge: tipo === 'municipio' ? codigoMunicipio : '',
        data_inicial: dataInicial,
        data_final: dataFinal,
      });

      const results: any[] = (await listenWebSocket(resp.jobId, 'uf_municipio_analise')) || [];
      for (const r of results) {
        totalContratos += (r.contratos || []).length;
      }
      todosResultados.push(...results);
      dispatch(setProgresso({ fetchProgresso: { concluidos: i + 1, total: trimestres.length } }));
    }
    return { resultados: todosResultados, totalContratos };
  }

  async function buscarContratosOrgao(cnpj: string, ano: string, trimestres: number[]): Promise<{ resultados: any[]; totalContratos: number }> {
    const todosResultados: any[] = [];
    let totalContratos = 0;
    dispatch(setProgresso({ fetchProgresso: { concluidos: 0, total: trimestres.length } }));
    for (let i = 0; i < trimestres.length; i++) {
      if (cancelRef.current) break;
      const t = trimestres[i];
      dispatch(setProgresso({ stage: 'buscando' }));

      const { dataInicial, dataFinal } = trimestreParaDatas(ano, t);

      const resp = await api.post<{ jobId: string }>(ENDPOINTS.ORGAO_ANALISE_START, {
        cnpjs: [cnpj],
        dataInicial,
        dataFinal,
      });

      const results: any[] = (await listenWebSocket(resp.jobId, 'orgao_analise')) || [];
      for (const r of results) {
        totalContratos += (r.contratos || []).length;
      }
      todosResultados.push(...results);
      dispatch(setProgresso({ fetchProgresso: { concluidos: i + 1, total: trimestres.length } }));
    }
    return { resultados: todosResultados, totalContratos };
  }

  async function handleFormSubmit(itens: ItemBusca[], params: ParametrosBusca) {
    const sels = params.trimestres.length > 0 ? params.trimestres : [1, 2, 3, 4];
    const now = Date.now();
    let idx = 0;

    for (const item of itens) {
      const { dataInicial, dataFinal } = trimestreParaDatas(params.ano, sels[0]);
      const fi: FilaItem = {
        id: now + idx++,
        tipo: item.tipo,
        valor: item.valor,
        uf: item.uf,
        nome: item.nome,
        ano: params.ano,
        trimestres: sels,
        dataInicial,
        dataFinal,
      };
      dispatch(addToFila(fi));
    }

    if (!processandoRef.current) {
      proximaFila();
    }
  }

  async function processarItem(item: FilaItem) {
    cancelRef.current = false;

    dispatch(setProgresso({
      stage: 'buscando',
      concluido: false,
      cancelado: false,
      processed: 0,
      success: 0,
      errors: 0,
      log: [],
      results: null,
      ultimoEvento: null,
      fetchProgresso: null,
    }));

    try {
      let resultados: any[];
      let totalContratos: number;
      if (item.tipo === 'orgao') {
        const res = await buscarContratosOrgao(item.valor, item.ano, item.trimestres);
        resultados = res.resultados;
        totalContratos = res.totalContratos;
      } else if (item.tipo === 'municipio') {
        const res = await buscarContratosUFMunicipio('municipio', item.uf || '', item.valor, item.ano, item.trimestres);
        resultados = res.resultados;
        totalContratos = res.totalContratos;
      } else {
        const res = await buscarContratosUFMunicipio('uf', item.valor, '', item.ano, item.trimestres);
        resultados = res.resultados;
        totalContratos = res.totalContratos;
      }

      if (cancelRef.current) {
        processandoRef.current = false;
        proximaFila();
        return;
      }

      dispatch(setProgresso({ stage: 'concluido', concluido: true }));

      const consultaId = Date.now();
      dispatch(addConsulta({
        id: consultaId,
        timestamp: new Date().toISOString(),
        meta: {
          tipo: item.tipo,
          valor: item.valor,
          uf: item.uf,
          nome: item.nome,
          ano: item.ano,
          trimestres: item.trimestres,
          total: totalContratos,
        },
        resultados,
      }));

      processandoRef.current = false;
      proximaFila();
    } catch (err: any) {
      dispatch(setProgresso({ stage: 'cancelado', cancelado: true }));
      processandoRef.current = false;
      proximaFila();
    }
  }

  function proximaFila() {
    const state = store.getState().consulta;
    if (state.fila.length === 0) {
      notifyComplete();
      return;
    }

    const item = state.fila[0];
    dispatch(removeFromFila(item.id));
    processandoRef.current = true;
    processarItem(item);
  }

  function notifyComplete() {
    const success = consultas.length > 0 ? consultas[0].meta?.total || 0 : 0;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Consultas PNCP concluídas', {
          body: `${consultas.length} consulta(s) processadas`,
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification('Consultas PNCP concluídas', {
              body: `${consultas.length} consulta(s) processadas`,
            });
          }
        });
      }
    }
  }

  async function handleCancelar() {
    cancelRef.current = true;
    dispatch(setProgresso({ stage: 'cancelado', cancelado: true }));
    processandoRef.current = false;
    proximaFila();
  }

  const handleApagar = useCallback((id) => {
    dispatch(removeConsultaAction(id));
  }, [dispatch]);

  const handleLigacaoPoliticaConsulta = useCallback((consultaId: number) => {
    dispatch(addSubTab({ kind: 'consulta', id: consultaId }));
    dispatch(setSubTabAtiva(`consulta-${consultaId}`));
    dispatch(setAbaAtiva('ligacao-politica'));
    navigate('/ligacao-politica');
  }, [dispatch, navigate]);

  const handleIdClickFromAnalise = useCallback((key, value) => {
    const tipo = KEY_TO_TIPO[key];
    if (tipo) {
      setPopup({ tipo: 'entidade', chave: value, idKey: key });
    } else {
      setPopup({ tipo: 'generic', data: { [key]: value }, titulo: key });
    }
  }, []);

  const handleAtualizarEntidadeCache = useCallback((chave, data) => {
    setEntidadeCache(prev => ({ ...prev, [chave]: data }));
  }, []);

  const handleLicitacaoPopup = useCallback((pncp) => {
    for (const c of consultas) {
      for (const r of (c.resultados || []) as any[]) {
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

  const totalOrgaos = consultas.reduce((acc, c) => acc + (c.resultados?.length || 0), 0);

  const licitacaoSections = [
    { id: 'licitacoes-header', label: 'Início' },
    { id: 'licitacoes-cards', label: 'Entenda a Licitação' },
    { id: 'licitacoes-consulta', label: 'Faça sua Consulta' },
    ...(consultas.length > 0 ? [{ id: 'licitacoes-resultados', label: 'Resultados' }] : []),
  ];

  useEffect(() => {
    if (pncpDestacado) {
      const timer = setTimeout(() => setPncpDestacado(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [pncpDestacado]);

  const showProgress = progresso.stage !== 'idle' && !progresso.concluido && !progresso.cancelado;

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
            {view === 'progress' && (progresso.stage === 'buscando' || progresso.stage === 'processando') ? (
              <>
                <div style={{ maxWidth: 960, marginBottom: 16 }}>
                  <button className="btn btn-sm" onClick={() => setView('form')} style={{ borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}>
                    ← Voltar ao formulário
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={handleCancelar} style={{ marginLeft: 8 }}>
                    Cancelar
                  </button>
                </div>
                <div style={{ width: '100%' }}>
                  <Progresso
                    onCancelar={handleCancelar}
                    onNovaAnalise={() => { dispatch(setProgresso({ stage: 'idle' })); setView('form'); }}
                  />
                </div>
              </>
            ) : (
              <>
                {(progresso.stage === 'buscando' || progresso.stage === 'processando') && (
                  <div style={{
                    maxWidth: 960, marginBottom: 16,
                    padding: '10px 16px',
                    background: 'rgba(232, 197, 71, 0.1)',
                    border: '1px solid rgba(232, 197, 71, 0.3)',
                    borderRadius: 6,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                  }}>
                    <span>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#e8c547', marginRight: 8, animation: 'pulse 1.5s infinite' }}></span>
                      Consulta em andamento
                    </span>
                    <button className="btn btn-sm" onClick={() => setView('progress')} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                      Ver Progresso
                    </button>
                  </div>
                )}

                <div className="licitacoes-layout-duas-colunas">
                  <div className="licitacoes-coluna-principal">
                    {formAberto && (
                      <FormConsulta
                        onSubmit={handleFormSubmit}
                        cnpjsSelecionados={cnpjsSelecionados}
                        onCnpjsChange={setCnpjsSelecionados}
                        submitLabel="Adicionar à Fila"
                      />
                    )}

                    {fila.length > 0 && (
                      <div className="card" style={{ marginTop: 16, padding: 16 }}>
                        <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>
                          Fila de Consultas ({fila.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {fila.map((item) => (
                            <div key={item.id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 6,
                              fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                            }}>
                              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  {item.tipo === 'uf' ? 'UF' : item.tipo === 'municipio' ? 'Município' : 'Órgão'}
                                </span>
                                <span>{item.valor}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{item.ano}</span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  {(item.trimestres?.length ?? 0) > 0 ? `T${(item.trimestres ?? []).join(',T')}` : 'Todos'}
                                </span>
                              </div>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => dispatch(removeFromFila(item.id))}
                                style={{ padding: '2px 8px', fontSize: '0.65rem' }}>
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!formAberto && fila.length === 0 && (
                      <button className="btn btn-sm" onClick={() => dispatch(setFormAberto(true))}>
                        + Nova Consulta
                      </button>
                    )}
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
                      onToggleCnpj={(cnpj: string) => {
                        const norm = normalizarCNPJ(cnpj);
                        setCnpjsSelecionados(prev => {
                          const prevNorm = prev.map(normalizarCNPJ);
                          return prevNorm.includes(norm)
                            ? prev.filter((_, i) => prevNorm[i] !== norm)
                            : [...prev, cnpj];
                        });
                      }}
                      onSelectAll={(cnpjs: string[]) => {
                        setCnpjsSelecionados(prev => {
                          const set = new Set(prev.map(normalizarCNPJ));
                          const novos = cnpjs.filter(c => !set.has(normalizarCNPJ(c)));
                          return [...prev, ...novos];
                        });
                      }}
                      onDeselectAll={() => setCnpjsSelecionados([])}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {(progresso.concluido || progresso.cancelado || view === 'progress') && (
            <div style={{ width: '100%', maxWidth: 960, marginTop: 16 }}>
              <Progresso
                onCancelar={handleCancelar}
                onNovaAnalise={() => { dispatch(resetProgresso()); setView('form'); dispatch(setFormAberto(true)); }}
              />
            </div>
          )}

          {consultas.length > 0 && (
            <>
              <div className="licitacoes-section-divider" />
              <div className="licitacoes-content" id="licitacoes-resultados">
                <div className="consultas-bar">
                  {consultas.length > 0 && (
                    <span className="consultas-count">
                      {consultas.length} consulta{consultas.length > 1 ? 's' : ''}
                      {totalOrgaos > 0 && ` · ${totalOrgaos} orgaos`}
                    </span>
                  )}
                </div>

                {consultas.map((consulta) => (
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
          <EntityPopup tipo={KEY_TO_TIPO[popup.idKey]} chave={popup.chave} cachedData={entidadeCache[popup.chave]} onLoaded={(data) => handleAtualizarEntidadeCache(popup.chave, data)} />
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
    : `${consulta.meta.valor || consulta.meta.cnpjs?.join(', ') || ''}`;

  const subtitulo = isPublicacao
    ? `${consulta.meta.ano} \u00b7 ${consulta.meta.trimestres?.length || 0} trimestre(s)`
    : `${consulta.meta.ano || ''}`;

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
            onAnaliseDetalhada={undefined}
            pncpComMatch={undefined}
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
          onAnaliseDetalhada={undefined}
          pncpComMatch={undefined}
        />
      </div>
    </div>
  );
}
