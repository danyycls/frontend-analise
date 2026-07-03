import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app';
import { store } from '@/app/store';
import {
  removeAnalise,
  setActiveAnalise,
  updateActiveAnalise,
  addToFila,
  removeFromFila,
} from '@/app/store/slices/anomaliaSlice';
import type { FilaItem } from '@/app/store/slices/anomaliaSlice';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { WS_BASE_URL } from '@/shared/config';
import { extrairDocumentosDosContratos } from '@/shared/lib/extrair-documentos-contratos';
import { normalizarCNPJ } from '@/shared/lib/formatters';
import ConvenioSelector from '@/widgets/ConvenioSelector/ConvenioSelector';
import '../LicitacoesPage/LicitacoesPage.css';

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const TRIMESTRES = [
  { codigo: 1, nome: '1º Trimestre (Jan-Mar)' },
  { codigo: 2, nome: '2º Trimestre (Abr-Jun)' },
  { codigo: 3, nome: '3º Trimestre (Jul-Set)' },
  { codigo: 4, nome: '4º Trimestre (Out-Dez)' },
];

function trimestreParaDatas(ano: string, trimestre: number): { dataInicial: string; dataFinal: string } {
  const a = ano.trim();
  switch (trimestre) {
    case 1: return { dataInicial: `${a}-01-01`, dataFinal: `${a}-03-31` };
    case 2: return { dataInicial: `${a}-04-01`, dataFinal: `${a}-06-30` };
    case 3: return { dataInicial: `${a}-07-01`, dataFinal: `${a}-09-30` };
    case 4: return { dataInicial: `${a}-10-01`, dataFinal: `${a}-12-31` };
    default: return { dataInicial: `${a}-01-01`, dataFinal: `${a}-12-31` };
  }
}

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

interface SubmitParams {
  tipo: string;
  valor: string;
  ano: string;
  uf: string;
  codigoMunicipio: string;
  cnpjsSelecionados: string[];
  trimestres: number[];
  codigoModalidade: string;
}

export default function AnomaliasAnalisePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const analises = useAppSelector(state => state.anomalia.analises);
  const active = useAppSelector(state => state.anomalia.active);
  const fila = useAppSelector(state => state.anomalia.fila);

  const [codigoModalidade, setCodigoModalidade] = useState('');
  const [erro, setErro] = useState('');

  const [anoInput, setAnoInput] = useState(String(new Date().getFullYear()));
  const [trimestresSelecionados, setTrimestresSelecionados] = useState(new Set<number>());

  const [selectedUfs, setSelectedUfs] = useState<string[]>([]);
  const [ufFilter, setUfFilter] = useState('SP');
  const [municipios, setMunicipios] = useState<{ id: number; nome: string }[]>([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [selectedMunicipios, setSelectedMunicipios] = useState<{ uf: string; codigo: string; nome: string }[]>([]);

  const [cnpjsSelecionados, setCnpjsSelecionados] = useState<string[]>([]);
  const [cnpjInput, setCnpjInput] = useState('');
  const [view, setView] = useState<'form' | 'progress'>('form');

  const cnpjsSelecionadosNorm = useMemo(
    () => cnpjsSelecionados.map(normalizarCNPJ),
    [cnpjsSelecionados]
  );

  const cancelRef = useRef(false);
  const processandoRef = useRef(false);
  const prevProcessingRef = useRef(false);

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

  async function carregarMunicipios(ufSigla: string) {
    setCarregandoMunicipios(true);
    setMunicipios([]);
    try {
      const data = await api.get<{ id: number; nome: string }[]>(`${ENDPOINTS.IBGE_MUNICIPIOS}/${ufSigla}`);
      setMunicipios(data);
    } catch (err) {
      console.error('Erro ao carregar municipios:', err);
    }
    setCarregandoMunicipios(false);
  }

  useEffect(() => {
    if (ufFilter) {
      carregarMunicipios(ufFilter);
    }
  }, [ufFilter]);

  async function buscarContratosUF(uf: string, ano: string, trimestres: number[], modalidade?: string): Promise<any[]> {
    const todos: any[] = [];
    dispatch(updateActiveAnalise({ fetchProgresso: { concluidos: 0, total: trimestres.length } }));
    for (let i = 0; i < trimestres.length; i++) {
      if (cancelRef.current) break;
      const t = trimestres[i];
      dispatch(updateActiveAnalise({ mensagem: `Buscando licitações — ${uf} ${ano} T${t}...` }));
      const params: Record<string, string | number> = { ano, trimestre: t };
      if (modalidade) params.codigoModalidadeContratacao = modalidade;
      const data = await api.get<any[]>(`/estado/${uf}/licitacoes`, params);
      todos.push(...(data || []));
      dispatch(updateActiveAnalise({ fetchProgresso: { concluidos: i + 1, total: trimestres.length } }));
    }
    return todos;
  }

  async function buscarContratosMunicipio(uf: string, codigo: string, ano: string, trimestres: number[], modalidade?: string): Promise<any[]> {
    const todos: any[] = [];
    dispatch(updateActiveAnalise({ fetchProgresso: { concluidos: 0, total: trimestres.length } }));
    for (let i = 0; i < trimestres.length; i++) {
      if (cancelRef.current) break;
      const t = trimestres[i];
      dispatch(updateActiveAnalise({ mensagem: `Buscando licitações — município ${codigo} ${ano} T${t}...` }));
      const params: Record<string, string | number> = { ano, trimestre: t };
      if (modalidade) params.codigoModalidadeContratacao = modalidade;
      const data = await api.get<any[]>(`/estado/${uf}/licitacoes/municipio/${codigo}`, params);
      todos.push(...(data || []));
      dispatch(updateActiveAnalise({ fetchProgresso: { concluidos: i + 1, total: trimestres.length } }));
    }
    return todos;
  }

  async function buscarContratosOrgao(cnpj: string, ano: string, trimestres: number[]): Promise<any[]> {
    dispatch(updateActiveAnalise({ mensagem: `Iniciando análise do órgão ${cnpj}...` }));
    const sels = trimestres.length > 0 ? trimestres : [1, 2, 3, 4];
    const datasPeriodo = sels.map(t => trimestreParaDatas(ano, t));
    const dataInicial = datasPeriodo[0].dataInicial;
    const dataFinal = datasPeriodo[datasPeriodo.length - 1].dataFinal;

    const resp = await api.post<{ jobId: string }>(ENDPOINTS.ORGAO_ANALISE_START, {
      cnpjs: [cnpj],
      dataInicial: dataInicial.replace(/-/g, ''),
      dataFinal: dataFinal.replace(/-/g, ''),
    });

    dispatch(updateActiveAnalise({ mensagem: 'Aguardando resultados da análise...' }));
    const results = await new Promise<any[] | null>((resolve) => {
      const ws = new WebSocket(`${WS_BASE_URL}/ws`);
      let resolved = false;

      ws.onopen = () => {
        ws.send(JSON.stringify({ channel: 'orgao_analise', job_id: resp.jobId }));
      };

      ws.onmessage = (e) => {
        try {
          const ev = JSON.parse(e.data);
          if (ev.type === 'results' && ev.Results) {
            resolved = true;
            ws.close();
            resolve(ev.Results);
          }
          if (ev.type === 'error') {
            resolved = true;
            ws.close();
            resolve(null);
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      };

      cancelRef.current = false;
      const checkCancel = setInterval(() => {
        if (cancelRef.current && !resolved) {
          resolved = true;
          ws.close();
          clearInterval(checkCancel);
          resolve(null);
        }
      }, 200);
    });
    const contratos = (results || []).flatMap((r: any) => r.contratos || []);
    return contratos;
  }

  async function startAnalysis(params: SubmitParams) {
    setErro('');
    cancelRef.current = false;

    const sels = params.trimestres.length > 0 ? params.trimestres : [1, 2, 3, 4];

    let valorFinal = params.valor;
    if (params.tipo === 'municipio') {
      valorFinal = params.codigoMunicipio;
    } else if (params.tipo === 'orgao') {
      const cnpjs = params.cnpjsSelecionados.length > 0
        ? [...new Set([...params.cnpjsSelecionados, params.valor].map(normalizarCNPJ))]
        : [params.valor].map(normalizarCNPJ);
      valorFinal = params.valor;
    }

    dispatch(setActiveAnalise({
      job_id: '',
      tipo: params.tipo,
      valor: valorFinal,
      ano: params.ano,
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
      if (params.tipo === 'orgao') {
        const cnpjs = params.cnpjsSelecionados.length > 0
          ? [...new Set([...params.cnpjsSelecionados, params.valor].map(normalizarCNPJ))]
          : [params.valor].map(normalizarCNPJ);
        const todosContratos: any[] = [];
        dispatch(updateActiveAnalise({ fetchProgresso: { concluidos: 0, total: cnpjs.length } }));
        for (let i = 0; i < cnpjs.length; i++) {
          if (cancelRef.current) break;
          const c = await buscarContratosOrgao(cnpjs[i], params.ano, sels);
          todosContratos.push(...c);
          dispatch(updateActiveAnalise({ fetchProgresso: { concluidos: i + 1, total: cnpjs.length } }));
        }
        contratos = todosContratos;
      } else if (params.tipo === 'municipio') {
        contratos = await buscarContratosMunicipio(params.uf, valorFinal, params.ano, sels, params.codigoModalidade);
      } else {
        contratos = await buscarContratosUF(valorFinal, params.ano, sels, params.codigoModalidade);
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

      const { job_id } = await api.post<{ job_id: string }>(ENDPOINTS.ANOMALIA_INICIAR, { licitacoes });

      dispatch(updateActiveAnalise({ job_id }));
    } catch (err: any) {
      setErro(`Erro: ${err.message || 'Erro desconhecido'}`);
      dispatch(updateActiveAnalise({ processando: false }));
      processandoRef.current = false;
      proximaFila();
    }
  }

  function proximaFila() {
    const state = store.getState().anomalia;
    if (state.fila.length === 0) return;

    const item = state.fila[0];
    dispatch(removeFromFila(item.id));

    startAnalysis({
      tipo: item.tipo,
      valor: item.valor,
      ano: item.ano,
      uf: item.uf,
      codigoMunicipio: item.codigoMunicipio,
      cnpjsSelecionados: item.cnpjsSelecionados,
      trimestres: item.trimestres,
      codigoModalidade: item.codigoModalidade,
    });
  }

  function toggleUf(uf: string) {
    setSelectedUfs(prev =>
      prev.includes(uf) ? prev.filter(u => u !== uf) : [...prev, uf]
    );
  }

  function toggleMunicipio(m: { id: number; nome: string }) {
    setSelectedMunicipios(prev => {
      const exists = prev.find(sm => sm.codigo === String(m.id));
      return exists
        ? prev.filter(sm => sm.codigo !== String(m.id))
        : [...prev, { uf: ufFilter, codigo: String(m.id), nome: m.nome }];
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (!anoInput.trim().match(/^\d{4}$/)) {
      setErro('Ano inválido. Use 4 dígitos.');
      return;
    }

    const sels = trimestresSelecionados.size > 0
      ? [...trimestresSelecionados]
      : [1, 2, 3, 4];

    const items: FilaItem[] = [];
    const now = Date.now();

    for (const uf of selectedUfs) {
      items.push({
        id: now + items.length,
        tipo: 'uf',
        valor: uf,
        ano: anoInput,
        uf,
        codigoMunicipio: '',
        cnpjsSelecionados: [],
        trimestres: sels,
        codigoModalidade,
      });
    }

    for (const mun of selectedMunicipios) {
      items.push({
        id: now + items.length,
        tipo: 'municipio',
        valor: mun.codigo,
        ano: anoInput,
        uf: mun.uf,
        codigoMunicipio: mun.codigo,
        cnpjsSelecionados: [],
        trimestres: sels,
        codigoModalidade,
      });
    }

    const uniqCnpjs = [...new Set(cnpjsSelecionados.map(normalizarCNPJ))];
    for (const cnpj of uniqCnpjs) {
      items.push({
        id: now + items.length,
        tipo: 'orgao',
        valor: cnpj,
        ano: anoInput,
        uf: '',
        codigoMunicipio: '',
        cnpjsSelecionados: [cnpj],
        trimestres: sels,
        codigoModalidade,
      });
    }

    if (items.length === 0) {
      setErro('Selecione ao menos uma UF, município ou CNPJ.');
      return;
    }

    for (const item of items) {
      dispatch(addToFila(item));
    }

    setSelectedUfs([]);
    setSelectedMunicipios([]);
    setCnpjsSelecionados([]);
    setCnpjInput('');

    if (!processandoRef.current && items.length > 0) {
      proximaFila();
    }
  }

  async function handleCancelar() {
    cancelRef.current = true;
    if (active?.job_id) {
      try {
        await api.post(`${ENDPOINTS.ANOMALIA_PARAR}/${active.job_id}`);
      } catch {}
    }
    dispatch(updateActiveAnalise({ processando: false, concluido: true, etapa_atual: 'concluido' }));
    processandoRef.current = false;
    setView('form');
    proximaFila();
  }

  const handleToggleCnpj = useCallback((cnpj: string) => {
    const norm = normalizarCNPJ(cnpj);
    setCnpjsSelecionados(prev => {
      const prevNorm = prev.map(normalizarCNPJ);
      return prevNorm.includes(norm)
        ? prev.filter((_, i) => prevNorm[i] !== norm)
        : [...prev, cnpj];
    });
  }, []);

  const handleSelectAll = useCallback((cnpjs: string[]) => {
    setCnpjsSelecionados(prev => {
      const set = new Set(prev.map(normalizarCNPJ));
      const novos = cnpjs.filter(c => !set.has(normalizarCNPJ(c)));
      return [...prev, ...novos];
    });
  }, []);

  const handleDeselectAll = useCallback(() => {
    setCnpjsSelecionados([]);
    setCnpjInput('');
  }, []);

  const handleCnpjInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCnpjInput(raw);
    const norm = normalizarCNPJ(raw);
    if (norm.length === 14) {
      setCnpjsSelecionados(prev => {
        const prevNorm = prev.map(normalizarCNPJ);
        if (prevNorm.includes(norm)) return prev;
        return [...prev, raw];
      });
    }
  }, []);

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

  function toggleTrimestre(t: number) {
    setTrimestresSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
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
                  <form className="card" onSubmit={handleSubmit}>
                    <h2 style={{ marginBottom: 16 }}>Parâmetros da Consulta</h2>

                    <div className="form-group">
                      <label>▣ UFs</label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {UFS.map(uf => (
                          <button key={uf} type="button"
                            className={`ano-btn${selectedUfs.includes(uf) ? ' ativo' : ''}`}
                            onClick={() => toggleUf(uf)}>
                            {uf}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>▣ Municípios</label>
                      <select value={ufFilter} onChange={(e) => setUfFilter(e.target.value)}
                        style={{ marginBottom: 8 }}>
                        {UFS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {carregandoMunicipios ? (
                        <p className="form-status">Carregando municípios...</p>
                      ) : municipios.length === 0 ? (
                        <p className="form-status vazio">Nenhum município encontrado para {ufFilter}.</p>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 180, overflowY: 'auto' }}>
                          {municipios.map(m => (
                            <button key={m.id} type="button"
                              className={`ano-btn${selectedMunicipios.some(sm => sm.codigo === String(m.id)) ? ' ativo' : ''}`}
                              onClick={() => toggleMunicipio(m)}>
                              {m.nome}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>▣ Órgãos (CNPJ)</label>
                      {cnpjsSelecionados.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                          {cnpjsSelecionados.map(cnpj => (
                            <span key={cnpj} className="ano-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 12, fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                              {cnpj}
                              <button type="button" onClick={() => {
                                const norm = normalizarCNPJ(cnpj);
                                setCnpjsSelecionados(prev => {
                                  const prevNorm = prev.map(normalizarCNPJ);
                                  return prev.filter((_, i) => prevNorm[i] !== norm);
                                });
                              }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 0, lineHeight: 1 }}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <input type="text" placeholder="Digite um CNPJ..." value={cnpjInput} onChange={handleCnpjInputChange} />
                    </div>

                    <div className="form-group required">
                      <label>Ano</label>
                      <input type="text" placeholder="2024" value={anoInput} onChange={e => setAnoInput(e.target.value)} maxLength={4} />
                    </div>

                    <div className="form-group">
                      <label>Trimestre(s)</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {TRIMESTRES.map(t => (
                          <button key={t.codigo} type="button"
                            className={`ano-btn${trimestresSelecionados.has(t.codigo) ? ' ativo' : ''}`}
                            onClick={() => toggleTrimestre(t.codigo)}>
                            {t.nome}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group optional">
                      <label>Modalidade (opcional)</label>
                      <select value={codigoModalidade} onChange={(e) => setCodigoModalidade(e.target.value)}>
                        <option value="">Todas as modalidades</option>
                        <option value="1">Dispensa de Licitação</option>
                        <option value="2">Inexigibilidade</option>
                        <option value="3">Pregão</option>
                        <option value="4">Concorrência</option>
                        <option value="5">Concurso</option>
                        <option value="6">Leilão</option>
                        <option value="7">Chamamento Público</option>
                        <option value="8">Credenciamento</option>
                      </select>
                    </div>

                    {erro && <div className="form-erro">{erro}</div>}

                    <button type="submit" className="btn btn-accent">
                      Adicionar {selectedUfs.length + selectedMunicipios.length + cnpjsSelecionados.length} itens → Fila
                    </button>
                  </form>

                  {fila.length > 0 && (
                    <div className="card" style={{ marginTop: 16, padding: 16 }}>
                      <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>
                        Fila de Análises ({fila.length})
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
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
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
