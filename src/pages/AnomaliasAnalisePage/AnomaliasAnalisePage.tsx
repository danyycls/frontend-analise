import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app';
import { store } from '@/app/store';
import {
  removeAnalise,
  addAnalise,
  setActiveAnalise,
  updateActiveAnalise,
  addToFila,
  removeFromFila,
} from '@/app/store/slices/anomaliaSlice';
import type { FilaItem, WorkerProgresso } from '@/app/store/slices/anomaliaSlice';
import FormConsulta from '@/features/licitacao/ui/FormConsulta';
import type { ItemBusca, ParametrosBusca } from '@/features/licitacao/ui/FormConsulta';
import { api, apiP2 } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { WS_BASE_URL } from '@/shared/config';
import { extrairDocumentosDosContratos } from '@/shared/lib/extrair-documentos-contratos';
import { normalizarCNPJ } from '@/shared/lib/formatters';
import ConvenioSelector from '@/widgets/ConvenioSelector/ConvenioSelector';
import '../LicitacoesPage/LicitacoesPage.css';

const STAGES = [
  { id: 'buscando_licitacoes', label: 'Buscando licitações' },
  { id: 'analisando_vinculos', label: 'Analisando vínculos' },
  { id: 'concluido',           label: 'Concluído' },
];

const STAGE_ORDER = STAGES.map(s => s.id);

function stageStatus(stageId: string, currentStage: string, concluido: boolean): 'done' | 'active' | 'pending' | 'error' {
  if (concluido) return 'done';
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const stageIdx = STAGE_ORDER.indexOf(stageId);
  if (stageIdx < currentIdx) return 'done';
  if (stageIdx === currentIdx) return 'active';
  return 'pending';
}

function StageIcon({ status }: { status: string }) {
  if (status === 'done') return <span style={{ color: 'var(--success)' }}>&#10003;</span>;
  if (status === 'active') return <span style={{ color: '#e8c547' }}>&#9679;</span>;
  if (status === 'error') return <span style={{ color: 'var(--error)' }}>&#10007;</span>;
  return <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>&#9675;</span>;
}

function StageLabel({ id, label }: { id: string; label: string }) {
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{label}</span>;
}

export default function AnomaliasAnalisePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const analises = useAppSelector(state => state.anomalia.analises);
  const active = useAppSelector(state => state.anomalia.active);
  const fila = useAppSelector(state => state.anomalia.fila);

  const [cnpjsSelecionados, setCnpjsSelecionados] = useState<string[]>([]);
  const [erro, setErro] = useState('');
  const [view, setView] = useState<'form' | 'progress'>('form');
  const [filaPausada, setFilaPausada] = useState(false);

  const cancelRef = useRef(false);
  const processandoRef = useRef(false);
  const prevProcessingRef = useRef(false);
  const filaPausadaRef = useRef(false);

  useEffect(() => {
    filaPausadaRef.current = filaPausada;
  }, [filaPausada]);

  useEffect(() => {
    if (active) {
      processandoRef.current = !!active.processando;
    }
  }, [active?.processando]);

  useEffect(() => {
    if (active && !active.processando && active.concluido && prevProcessingRef.current) {
      prevProcessingRef.current = false;
      proximaFila()
    }
    if (active?.processando) {
      prevProcessingRef.current = true
    }
  }, [active?.processando, active?.concluido]);

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

  async function buscarContratosUFMunicipio(tipo: string, uf: string, codigoMunicipio: string, ano: string, trimestres: number[]): Promise<any[]> {
    const todos: any[] = [];
    dispatch(updateActiveAnalise({ fetchProgresso: { concluidos: 0, total: trimestres.length } }));
    for (let i = 0; i < trimestres.length; i++) {
      if (cancelRef.current) break;
      const t = trimestres[i];
      const label = tipo === 'uf' ? uf : codigoMunicipio;
      dispatch(updateActiveAnalise({ mensagem: `Buscando contratos — ${label} ${ano} T${t}...` }));

      let dataInicial: string, dataFinal: string;
      switch (t) {
        case 1: dataInicial = `${ano}0101`; dataFinal = `${ano}0331`; break;
        case 2: dataInicial = `${ano}0401`; dataFinal = `${ano}0630`; break;
        case 3: dataInicial = `${ano}0701`; dataFinal = `${ano}0930`; break;
        default: dataInicial = `${ano}1001`; dataFinal = `${ano}1231`; break;
      }

      const resp = await api.post<{ jobId: string }>(ENDPOINTS.UF_MUNICIPIO_ANALISE_START, {
        tipo,
        uf,
        codigo_municipio_ibge: tipo === 'municipio' ? codigoMunicipio : '',
        data_inicial: dataInicial,
        data_final: dataFinal,
      });

      dispatch(updateActiveAnalise({ mensagem: `Aguardando resultados — ${label} ${ano} T${t}...` }));
      const results = await listenWebSocket(resp.jobId, 'uf_municipio_analise');
      const contratos = (results || []).flatMap((r: any) => r.contratos || []);
      todos.push(...contratos);
      dispatch(updateActiveAnalise({ fetchProgresso: { concluidos: i + 1, total: trimestres.length } }));
    }
    return todos;
  }

  async function buscarContratosOrgao(cnpj: string, ano: string, trimestres: number[]): Promise<any[]> {
    dispatch(updateActiveAnalise({ mensagem: `Iniciando análise do órgão ${cnpj}...` }));
    const sels = trimestres.length > 0 ? trimestres : [1, 2, 3, 4];
    const datasPeriodo = sels.map(t => {
      let di: string, df: string;
      switch (t) {
        case 1: di = `${ano}0101`; df = `${ano}0331`; break;
        case 2: di = `${ano}0401`; df = `${ano}0630`; break;
        case 3: di = `${ano}0701`; df = `${ano}0930`; break;
        default: di = `${ano}1001`; df = `${ano}1231`; break;
      }
      return { dataInicial: di, dataFinal: df };
    });
    const dataInicial = datasPeriodo[0].dataInicial;
    const dataFinal = datasPeriodo[datasPeriodo.length - 1].dataFinal;

    const resp = await api.post<{ jobId: string }>(ENDPOINTS.ORGAO_ANALISE_START, {
      cnpjs: [cnpj],
      dataInicial,
      dataFinal,
    });

    dispatch(updateActiveAnalise({ mensagem: 'Aguardando resultados da análise...' }));
    const results = await listenWebSocket(resp.jobId, 'orgao_analise');
    const contratos = (results || []).flatMap((r: any) => r.contratos || []);
    return contratos;
  }

  async function handleFormSubmit(itens: ItemBusca[], params: ParametrosBusca) {
    const now = Date.now();
    const filaItems: FilaItem[] = itens.map((item, i) => ({
      id: now + i,
      tipo: item.tipo,
      valor: item.valor,
      ano: params.ano,
      uf: item.uf || '',
      codigoMunicipio: item.tipo === 'municipio' ? item.valor : '',
      cnpjsSelecionados: item.tipo === 'orgao' ? [item.valor] : [],
      trimestres: params.trimestres,
      codigoModalidade: params.modalidade,
    }));

    for (const fi of filaItems) {
      dispatch(addToFila(fi));
    }

    if (!processandoRef.current && !filaPausada) {
      proximaFila();
    }
  }

  async function processarItem(item: FilaItem) {
    setErro('');
    cancelRef.current = false;

    const sels = item.trimestres.length > 0 ? item.trimestres : [1, 2, 3, 4];

    dispatch(setActiveAnalise({
      job_id: '',
      tipo: item.tipo,
      valor: item.valor,
      ano: item.ano,
      processando: true,
      concluido: false,
      etapa_atual: '',
      progresso: null,
      totalAnomalias: 0,
      mensagem: '',
      fetchProgresso: { concluidos: 0, total: 0 },
    }));
    setView('form');

    try {
      dispatch(updateActiveAnalise({ etapa_atual: 'buscando_licitacoes' }));

      let contratos: any[];
      if (item.tipo === 'orgao') {
        const todosContratos: any[] = [];
        dispatch(updateActiveAnalise({ fetchProgresso: { concluidos: 0, total: 1 } }));
        if (!cancelRef.current) {
          const c = await buscarContratosOrgao(item.valor, item.ano, sels);
          todosContratos.push(...c);
        }
        contratos = todosContratos;
      } else if (item.tipo === 'municipio') {
        contratos = await buscarContratosUFMunicipio('municipio', item.uf, item.valor, item.ano, sels);
      } else {
        contratos = await buscarContratosUFMunicipio('uf', item.valor, '', item.ano, sels);
      }

      if (cancelRef.current) return;
      if (contratos.length === 0) {
        setErro('Nenhuma licitação encontrada para os parâmetros informados.');
        dispatch(updateActiveAnalise({ processando: false }));
        processandoRef.current = false;
        proximaFila();
        return;
      }

      const licitacoes = extrairDocumentosDosContratos(contratos);

      if (licitacoes.length === 0) {
        setErro('Nenhum documento válido encontrado nas licitações.');
        dispatch(updateActiveAnalise({ processando: false }));
        processandoRef.current = false;
        proximaFila();
        return;
      }

      dispatch(updateActiveAnalise({ etapa_atual: 'analisando_vinculos', mensagem: `Analisando ${licitacoes.length} documentos...` }));

      const { job_id } = await apiP2.post<{ job_id: string }>(ENDPOINTS.ANOMALIA_INICIAR, { licitacoes });

      dispatch(updateActiveAnalise({ job_id }));

      // Polling fallback — caso o WebSocket não receba o evento de conclusão
      // eslint-disable-next-line no-constant-condition
      while (true) {
        await new Promise(r => setTimeout(r, 3000));
        const s = store.getState().anomalia;
        if (!s.active?.processando || s.active?.concluido) break;
        try {
          const prog = await apiP2.get<WorkerProgresso>(`${ENDPOINTS.ANOMALIA_PROGRESSO}/${job_id}`);
          if (prog.type === 'done' || prog.type === 'cancelled') {
            dispatch(updateActiveAnalise({
              processando: false,
              concluido: true,
              etapa_atual: 'concluido',
              totalAnomalias: prog.anomalias_encontradas ?? 0,
              mensagem: prog.type === 'done' ? 'Análise concluída' : 'Análise cancelada',
              progresso: prog,
            }));
            const activeState = store.getState().anomalia.active;
            dispatch(addAnalise({
              id: Date.now(),
              timestamp: new Date().toISOString(),
              tipo: activeState?.tipo || '',
              valor: activeState?.valor || '',
              ano: activeState?.ano || '',
              totalAnomalias: prog.anomalias_encontradas ?? 0,
            }));
            break;
          }
          if (prog.type === 'error') {
            dispatch(updateActiveAnalise({
              processando: false,
              mensagem: prog.message || 'Erro na análise',
            }));
            break;
          }
        } catch {
          // continua tentando
        }
      }
    } catch (err: any) {
      setErro(`Erro: ${err.message || 'Erro desconhecido'}`);
      dispatch(updateActiveAnalise({ processando: false }));
      processandoRef.current = false;
      proximaFila();
    }
  }

  function proximaFila() {
    const state = store.getState().anomalia;
    if (state.fila.length === 0 || filaPausadaRef.current) return;

    const item = state.fila[0];
    dispatch(removeFromFila(item.id));
    processarItem(item);
  }

  async function handleCancelar() {
    cancelRef.current = true;
    if (active?.job_id) {
      try {
        await apiP2.post(`${ENDPOINTS.ANOMALIA_PARAR}/${active.job_id}`);
      } catch {}
    }
    dispatch(updateActiveAnalise({ processando: false }));
    processandoRef.current = false;
    proximaFila();
  }

  function handleToggleCnpj(cnpj: string) {
    const norm = normalizarCNPJ(cnpj);
    setCnpjsSelecionados(prev => {
      const prevNorm = prev.map(normalizarCNPJ);
      return prevNorm.includes(norm)
        ? prev.filter((_, i) => prevNorm[i] !== norm)
        : [...prev, cnpj];
    });
  }

  function renderProgress() {
    const a = active!;
    const etapa = a.etapa_atual || 'buscando_licitacoes';
    const jobTotal = a.progresso?.total || 0;
    const jobProcessed = a.progresso?.processed || 0;

    return (
      <div className="card" style={{
        maxWidth: 560,
        background: 'transparent',
        border: '1px solid var(--border)',
        boxShadow: 'none',
        borderRadius: '8px'
      }}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {a.concluido ? 'Resultado da Análise' : 'Progresso da Análise'}
            </h2>
            {a.processando && (
              <button className="btn btn-sm btn-outline-danger" onClick={handleCancelar}>
                Cancelar
              </button>
            )}
          </div>

          {a.mensagem && a.processando && (
            <div style={{
              padding: '10px 12px',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '4px',
              marginBottom: 16,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }}></span>
              <span>{a.mensagem}</span>
            </div>
          )}

          {etapa === 'buscando_licitacoes' && a.fetchProgresso.total > 0 && (
            <div style={{
              marginBottom: 16,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}>
              {a.fetchProgresso.concluidos}/{a.fetchProgresso.total} etapas concluídas
            </div>
          )}

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}></div>

          <div style={{ marginBottom: 20 }}>
            {STAGES.map((stage) => {
              const status = a.concluido ? 'done' : stageStatus(stage.id, etapa, false);
              const isActive = status === 'active';

              return (
                <div key={stage.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 0', opacity: status === 'pending' ? 0.4 : 1,
                }}>
                  <div style={{ width: 18, textAlign: 'center', fontSize: '0.9rem' }}>
                    <StageIcon status={status} />
                  </div>
                  <StageLabel id={stage.id} label={stage.label} />
                  {stage.id === 'analisando_vinculos' && isActive && jobTotal > 0 && (
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent)' }}>
                      {jobProcessed}/{jobTotal}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease', width: `${a.concluido ? 100 : 2}%` }} />
          </div>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}></div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 8, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>
                {a.totalAnomalias}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Anomalias encontradas
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 8, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {a.progresso ? `${jobProcessed}/${jobTotal}` : '0/0'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Anomalias verificadas
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--error)' }}>
                {a.progresso?.errors || 0}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Erros
              </span>
            </div>
          </div>
        </div>

        {a.concluido && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--success)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              Análise concluída
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>
              {a.totalAnomalias} anomalia(s) encontradas
            </p>
            {a.totalAnomalias > 0 && (
              <button className="btn btn-sm" style={{ marginTop: 8, borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => navigate('/anomalias-encontradas')}>
                Visualizar na tela de Anomalias Encontradas →
              </button>
            )}
            <button className="btn btn-sm" style={{ marginTop: a.totalAnomalias > 0 ? 8 : 12 }} onClick={() => {
              dispatch(setActiveAnalise(null));
            }}>
              Nova Análise
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tab-page">
      <div className="licitacoes-page">
        <div className="licitacoes-header">
          <div className="licitacoes-badge">// ANÁLISE DE ANOMALIAS //</div>
          <h1 className="licitacoes-title">
            Anomalias<br />
            <span style={{ color: 'var(--accent)', fontSize: 'inherit' }}>Análise de Ligações Políticas</span>
          </h1>
          <p className="licitacoes-subtitle">Busque licitações e encontre vínculos políticos automaticamente.</p>
        </div>

        {view === 'progress' && active ? (
          <>
            <div style={{ maxWidth: 960, marginBottom: 16 }}>
              <button className="btn btn-sm" onClick={() => setView('form')} style={{ borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}>
                ← Voltar ao formulário
              </button>
              {active.processando && (
                <button className="btn btn-sm btn-outline-danger" onClick={handleCancelar} style={{ marginLeft: 8 }}>
                  Cancelar análise
                </button>
              )}
            </div>
            {renderProgress()}
          </>
        ) : (
          <>
            {active?.processando && (
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
                  Análise em andamento — {active.tipo === 'uf' ? 'UF' : active.tipo === 'municipio' ? 'Município' : 'Órgão'} {active.valor} ({active.ano})
                </span>
                <button className="btn btn-sm" onClick={() => setView('progress')} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  Ver Progresso
                </button>
              </div>
            )}

            <div className="licitacoes-form-wrapper">
              <div className="licitacoes-layout-duas-colunas" style={{ maxWidth: 960 }}>
                <div className="licitacoes-coluna-principal">
                  <FormConsulta
                    onSubmit={handleFormSubmit}
                    cnpjsSelecionados={cnpjsSelecionados}
                    onCnpjsChange={setCnpjsSelecionados}
                    submitLabel="Adicionar à Fila"
                    error={erro}
                  />

                  {fila.length > 0 && (
                    <div className="card" style={{ marginTop: 16, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', margin: 0 }}>
                          Fila de Análises ({fila.length})
                        </h3>
                        <button
                          className={`btn btn-sm ${filaPausada ? '' : 'btn-outline-danger'}`}
                          onClick={() => {
                            setFilaPausada(p => {
                              const novaPausa = !p;
                              filaPausadaRef.current = novaPausa;
                              if (!novaPausa) {
                                const s = store.getState().anomalia;
                                if (!s.active || !s.active.processando) {
                                  setTimeout(() => proximaFila(), 100);
                                }
                              }
                              return novaPausa;
                            });
                          }}
                          style={{ padding: '3px 10px', fontSize: '0.65rem' }}>
                          {filaPausada ? '▶ Retomar' : '⏸ Pausar'}
                        </button>
                      </div>
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
                                {item.trimestres.length > 0 ? `T${item.trimestres.join(',T')}` : 'Todos'}
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
                </div>

                <div className="licitacoes-coluna-lateral">
                  <ConvenioSelector
                    cnpjsSelecionados={cnpjsSelecionados}
                    onToggleCnpj={handleToggleCnpj}
                    onSelectAll={(cnpjs) => {
                      const set = new Set(cnpjsSelecionados.map(normalizarCNPJ));
                      const novos = cnpjs.filter(c => !set.has(normalizarCNPJ(c)));
                      setCnpjsSelecionados(prev => [...prev, ...novos]);
                    }}
                    onDeselectAll={() => setCnpjsSelecionados([])}
                  />
                </div>
              </div>
            </div>

            {analises.length > 0 && (
              <div style={{ width: '100%', maxWidth: 960, marginTop: 32 }}>
                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Histórico de Análises
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analises.map((a) => (
                    <div key={a.id} className="card" style={{
                      padding: 12,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: '0.8rem',
                    }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {a.tipo === 'uf' ? 'Estado' : a.tipo === 'municipio' ? 'Município' : 'Órgão'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{a.valor}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.ano}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                          color: a.totalAnomalias > 0 ? 'var(--accent)' : 'var(--text-muted)',
                        }}>
                          {a.totalAnomalias} anomalia(s)
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {new Date(a.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm" onClick={() => navigate('/anomalias-encontradas')}>
                          Ver
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => dispatch(removeAnalise(a.id))}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
