import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API_BASE_URL, { WS_BASE_URL } from '../config';
import DetalheMunicipio from './DetalheMunicipio';
import ErrorBoundary from './ErrorBoundary';
import SecaoGeralDeputado from './DeputadoSecaoGeral';
import SecaoGeralSenador from './SenadorSecaoGeral';
import './ConhecendoEstado.css';
import './AnaliseDeputados.css';

function usePaginacao(dados, itensPorPagina = 10) {
  const [pagina, setPagina] = useState(0);
  const arr = dados || [];
  const totalPaginas = Math.max(1, Math.ceil(arr.length / itensPorPagina));
  const inicio = pagina * itensPorPagina;
  const paginaDados = arr.slice(inicio, inicio + itensPorPagina);
  return { pagina, setPagina, totalPaginas, paginaDados };
}

function Paginacao({ pagina, totalPaginas, onPagina }) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="dm-paginacao">
      <button className="pagina-btn" disabled={pagina === 0} onClick={() => onPagina(pagina - 1)}>◀</button>
      <span className="pagina-info">{pagina + 1} / {totalPaginas}</span>
      <button className="pagina-btn" disabled={pagina >= totalPaginas - 1} onClick={() => onPagina(pagina + 1)}>▶</button>
    </div>
  );
}

const DATA_SOURCES = {
  candidatos: { font: 'TSE - Tribunal Superior Eleitoral', desc: 'Prefeitos, vice-prefeitos e vereadores eleitos na UF (todos os anos disponíveis)', campos: {} },
  deputados: { font: 'Câmara dos Deputados — Dados Abertos', desc: 'Deputados federais eleitos pela UF na legislatura atual', campos: {} },
  senadores: { font: 'Senado Federal — Dados Abertos', desc: 'Senadores eleitos pela UF no período atual', campos: {} },
  despesa_pessoal: { font: 'SICONFI / Tesouro Nacional — RGF (Anexo 01)', desc: 'Demonstrativo da Despesa com Pessoal — limite da LRF', campos: { valor_total: 'Valor total da despesa com pessoal no exercício', percentual_rcl: 'Percentual em relação à Receita Corrente Líquida (RCL)', periodo: 'Período de referência (ano)' } },
  despesa_categoria: { font: 'SICONFI / Tesouro Nacional — RGF (Anexo 01)', desc: 'Despesa com pessoal por categoria (ativos, inativos, pensionistas, terceirizados)', campos: { categoria: 'Categoria funcional do servidor', quantidade: 'Quantidade de vínculos na categoria', despesa_total: 'Valor total da despesa da categoria', percentual_despesa: 'Percentual em relação à despesa total com pessoal' } },
  gastos_por_funcao: { font: 'SICONFI / Tesouro Nacional — RREO (Anexo 02)', desc: 'Despesas empenhadas, liquidadas e pagas por função de governo', campos: { funcao: 'Função de governo (ex: Saúde, Educação, Segurança)', empenhado: 'Valor empenhado (reservado orçamentariamente)', liquidado: 'Valor liquidado (bem/serviço entregue)', pago: 'Valor efetivamente pago' } },
  receitas: { font: 'SICONFI / Tesouro Nacional — RREO (Anexo 03)', desc: 'Receitas arrecadadas por categoria econômica', campos: { conta: 'Classificação da receita orçamentária', coluna: 'Tipo de valor (Previsão Inicial, Previsão Atualizada, Receita Realizada)', valor: 'Valor da receita no exercício', exercicio: 'Ano de referência' } },
  recursos_federais: { font: 'Info Portal da Transparência — Transferências a Entes', desc: 'Recursos federais transferidos a estados e municípios', campos: { tipo_pessoa: 'Tipo de pessoa (Física ou Jurídica) do favorecido', nome_pessoa: 'Nome do favorecido (pessoa física ou jurídica)', nome_ug: 'Unidade Gestora responsável pelo recurso', nome_orgao: 'Órgão concedente do recurso', nome_orgao_superior: 'Órgão superior do órgão concedente', valor: 'Valor do recurso transferido', mes_ano: 'Mês e ano de referência (formato AAAAMM)' } },
  contratos: { font: 'PNCP — Portal Nacional de Contratações Públicas', desc: 'Contratos e compras públicas realizadas', campos: {} },
  servidores: { font: 'SICONFI / Tesouro Nacional — RGF (Anexo 01)', desc: 'Despesa com pessoal por categoria funcional', campos: { categoria: 'Categoria funcional', quantidade: 'Quantidade de servidores na categoria', despesa_total: 'Valor total da despesa da categoria', percentual_despesa: 'Percentual em relação à despesa total com pessoal' } },
};

function InfoBadge({ chave, onInfoClick }) {
  const info = DATA_SOURCES[chave];
  if (!info) return null;
  return (
    <span className="info-badge" onClick={() => onInfoClick?.(chave)} title="Clique para ver descrição dos campos" style={{ cursor: 'pointer', fontSize: '0.65rem', color: 'var(--accent)', marginLeft: 8, textDecoration: 'underline dotted' }}>
      ⓘ {info.font}
    </span>
  );
}

function PopupInfo({ chave, onFechar }) {
  const info = DATA_SOURCES[chave];
  if (!info) return null;
  const campos = Object.entries(info.campos || {});
  return (
    <div className="dm-modal-overlay" onClick={onFechar}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="dm-modal-header">
          <h3>Fonte: {info.font}</h3>
          <button className="dm-modal-close" onClick={onFechar}>×</button>
        </div>
        <div className="dm-modal-body">
          <p style={{ marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{info.desc}</p>
          {campos.length > 0 && (
            <table className="dm-detalhe-table">
              <thead>
                <tr><th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>Campo</th><th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>Descrição</th></tr>
              </thead>
              <tbody>
                {campos.map(([campo, desc]) => (
                  <tr key={campo}>
                    <td className="dm-detalhe-label" style={{ whiteSpace: 'nowrap' }}>{campo}</td>
                    <td className="dm-detalhe-valor">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {campos.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Detalhamento dos campos não disponível para esta seção.</p>}
        </div>
      </div>
    </div>
  );
}

function fmtNum(n) {
  if (!n) return '-';
  return n.toLocaleString('pt-BR');
}

function fmtDoc(d) {
  if (!d) return '';
  const s = String(d).replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return String(d);
}

function fmtMoney(v) {
  if (!v && v !== 0) return '-';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMesAno(n) {
  if (!n) return '-';
  const s = String(n);
  if (s.length === 6) return s.substring(4, 6) + '/' + s.substring(0, 4);
  return s;
}

function FinCard({ label, value }) {
  return (
    <div className="dm-card">
      <span className="dm-card-val">{value}</span>
      <span className="dm-card-lbl">{label}</span>
    </div>
  );
}

function ContadoresBar({ vereadores, deputados, senadores, municipios, pequenos }) {
  return (
    <div className="estado-counters">
      <div className="estado-counter-item">
        <span className="estado-counter-val">{vereadores}</span>
        <span className="estado-counter-lbl">VEREADORES</span>
      </div>
      <div className="estado-counter-item">
        <span className="estado-counter-val">{deputados}</span>
        <span className="estado-counter-lbl">DEPUTADOS</span>
      </div>
      <div className="estado-counter-item">
        <span className="estado-counter-val">{senadores}</span>
        <span className="estado-counter-lbl">SENADORES</span>
      </div>
      <div className="estado-counter-item">
        <span className="estado-counter-val">{municipios}</span>
        <span className="estado-counter-lbl">MUNICÍPIOS</span>
      </div>
      <div className="estado-counter-item">
        <span className="estado-counter-val">{pequenos}</span>
        <span className="estado-counter-lbl">MUNICÍPIOS &lt;10K HAB</span>
      </div>
    </div>
  );
}

const ITENS_POR_PAGINA = 10;

function TabelaCandidatos({ dados, titulo }) {
  const [situacaoAtiva, setSituacaoAtiva] = useState(null);
  const [tipoAtivo, setTipoAtivo] = useState('TODAS');
  const [anoFiltro, setAnoFiltro] = useState(null);
  const [pagina, setPagina] = useState(0);

  const situacoes = [...new Set(dados.map(d => d.situacao_totalizacao_descricao))].filter(Boolean).sort();

  const dadosSituacao = situacaoAtiva ? dados.filter(d => d.situacao_totalizacao_descricao === situacaoAtiva) : dados;

  const anos = [...new Set(dadosSituacao.map(d => d.ano_eleicao))].sort((a, b) => b - a);

  useEffect(() => {
    if (anos.length > 0 && anoFiltro === null) setAnoFiltro(anos[0]);
  }, [anos.join(','), situacaoAtiva]);

  useEffect(() => {
    setPagina(0);
    setAnoFiltro(anos.length > 0 ? anos[0] : null);
    setTipoAtivo('TODAS');
  }, [situacaoAtiva]);

  const filtrados = dadosSituacao.filter(d => {
    if (anoFiltro !== null && d.ano_eleicao !== anoFiltro) return false;
    if (tipoAtivo === 'ORDINÁRIA') return d.eleicao_tipo === 'ORDINÁRIA';
    if (tipoAtivo === 'SUPLEMENTAR') return d.eleicao_tipo === 'SUPLEMENTAR';
    return true;
  });

  const totalPaginas = Math.ceil(filtrados.length / ITENS_POR_PAGINA);
  const paginaCorrigida = Math.min(pagina, Math.max(0, totalPaginas - 1));
  const inicio = paginaCorrigida * ITENS_POR_PAGINA;
  const paginaDados = filtrados.slice(inicio, inicio + ITENS_POR_PAGINA);

  return (
    <div className="estado-section">
      <h2>{titulo} <span className="count">({dados.length} registros)</span></h2>

      <div className="cand-situacao-btns">
        {situacoes.map(s => (
          <button
            key={s}
            className={`ano-btn ${situacaoAtiva === s ? 'ativo' : ''}`}
            onClick={() => setSituacaoAtiva(situacaoAtiva === s ? null : s)}
          >
            {s}
          </button>
        ))}
      </div>

      {situacaoAtiva && dadosSituacao.length > 0 && (
        <>
          <div className="ano-filtro-btns">
            {anos.map(a => (
              <button key={a} className={`ano-btn ${anoFiltro === a ? 'ativo' : ''}`} onClick={() => { setAnoFiltro(a); setPagina(0); }}>
                {a}
              </button>
            ))}
          </div>

          <div className="ano-filtro-btns" style={{ marginBottom: 12 }}>
            {['TODAS', 'ORDINÁRIA', 'SUPLEMENTAR'].map(t => (
              <button key={t} className={`ano-btn ${tipoAtivo === t ? 'ativo' : ''}`} onClick={() => { setTipoAtivo(t); setPagina(0); }}>
                {t === 'TODAS' ? 'Todas' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <table className="estado-table">
            <thead>
              <tr>
                <th>Nome Urna</th>
                <th>Nome Completo</th>
                <th>Partido</th>
                <th>Eleição</th>
                <th>Tipo</th>
                <th>Data</th>
                <th>Ano</th>
              </tr>
            </thead>
            <tbody>
              {paginaDados.map((d, i) => (
                <tr key={i}>
                  <td>{d.nome_urna || '-'}</td>
                  <td>{d.nome_completo || '-'}</td>
                  <td><span className="partido-tag">{d.partido_sigla || '-'}</span></td>
                  <td className="dm-obj-col">{d.eleicao_descricao || '-'}</td>
                  <td><span className={`cand-tipo-tag ${d.eleicao_tipo === 'SUPLEMENTAR' ? 'cand-tipo-sup' : ''}`}>{d.eleicao_tipo || '-'}</span></td>
                  <td>{d.eleicao_data || '-'}</td>
                  <td>{d.ano_eleicao || '-'}</td>
                </tr>
              ))}
              {paginaDados.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum registro</td></tr>
              )}
            </tbody>
          </table>

          {totalPaginas > 1 && (
            <div className="estado-paginacao">
              <button className="pagina-btn" disabled={paginaCorrigida === 0} onClick={() => setPagina(paginaCorrigida - 1)}>◀</button>
              <span className="pagina-info">{paginaCorrigida + 1} / {totalPaginas}</span>
              <button className="pagina-btn" disabled={paginaCorrigida >= totalPaginas - 1} onClick={() => setPagina(paginaCorrigida + 1)}>▶</button>
            </div>
          )}
        </>
      )}

      {situacaoAtiva && dadosSituacao.length === 0 && (
        <p style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)' }}>Nenhum candidato nesta situação</p>
      )}
    </div>
  );
}

function DetalheDeputado({ deputado, onFechar }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const concluidoRef = useRef(false);

  useEffect(() => {
    if (!deputado) return;
    console.log('[DetalheDeputado] iniciando fetch para deputado:', deputado.id, deputado);
    concluidoRef.current = false;
    setLoading(true);
    setErro(null);
    const url = `${API_BASE_URL}/deputados/${deputado.id}/completo`;
    console.log('[DetalheDeputado] URL:', url);
    fetch(url)
      .then(r => {
        console.log('[DetalheDeputado] resposta status:', r.status);
        if (!r.ok) throw new Error(`Erro ${r.status}`);
        return r.json();
      })
      .then(data => {
        console.log('[DetalheDeputado] dados recebidos:', data);
        concluidoRef.current = true;
        setDados(data);
        setLoading(false);
      })
      .catch(e => {
        console.error('[DetalheDeputado] erro:', e.message);
        concluidoRef.current = true;
        setErro(e.message);
        setLoading(false);
      });

    const timeout = setTimeout(() => {
      if (!concluidoRef.current) {
        console.warn('[DetalheDeputado] timeout de 30s excedido');
        setLoading(false);
        setErro('Tempo limite excedido ao carregar dados do deputado');
      }
    }, 30000);
    return () => clearTimeout(timeout);
  }, [deputado]);

  if (loading) return <div className="estado-detalhe-loading"><div className="spinner" /> Carregando detalhes...</div>;
  if (erro) return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header"><h3>Erro</h3><button className="voltar-btn" onClick={onFechar}>× Voltar</button></div>
      <p style={{ textAlign: 'center', padding: 40, color: '#ff6b6b' }}>Erro ao carregar detalhes: {erro}</p>
    </div>
  );

  const dep = dados?.deputado || dados;
  if (!dep) return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header"><h3>Deputado não encontrado</h3><button className="voltar-btn" onClick={onFechar}>× Voltar</button></div>
      <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Dados do deputado não disponíveis</p>
    </div>
  );

  const u = dep.ultimoStatus || {};

  return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <div className="estado-detalhe-header-info">
          {u.urlFoto && <img className="ad-dep-foto" src={u.urlFoto} alt={dep.nomeCivil || u.nome} onError={(e) => { e.target.style.display = 'none'; }} />}
          <div>
            <h3>{dep.nomeCivil || u.nome || '-'}</h3>
            <div className="ad-dep-tags">
              <span className="tag tag-candidato">{u.siglaPartido || '-'}</span>
              <span className="tag tag-partido">{u.siglaUf || '-'}</span>
            </div>
          </div>
        </div>
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>
      <SecaoGeralDeputado deputado={dep} />
    </div>
  );
}

function DetalheSenador({ senador, onFechar }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const concluidoRef = useRef(false);

  useEffect(() => {
    if (!senador) return;
    console.log('[DetalheSenador] iniciando fetch para senador:', senador.codigo, senador);
    concluidoRef.current = false;
    setLoading(true);
    setErro(null);
    const url = `${API_BASE_URL}/senado/senadores/${senador.codigo}/completo`;
    console.log('[DetalheSenador] URL:', url);
    fetch(url)
      .then(r => {
        console.log('[DetalheSenador] resposta status:', r.status);
        if (!r.ok) throw new Error(`Erro ${r.status}`);
        return r.json();
      })
      .then(data => {
        console.log('[DetalheSenador] dados recebidos:', data);
        concluidoRef.current = true;
        setDados(data);
        setLoading(false);
      })
      .catch(e => {
        console.error('[DetalheSenador] erro:', e.message);
        concluidoRef.current = true;
        setErro(e.message);
        setLoading(false);
      });

    const timeout = setTimeout(() => {
      if (!concluidoRef.current) {
        console.warn('[DetalheSenador] timeout de 30s excedido');
        setLoading(false);
        setErro('Tempo limite excedido ao carregar dados do senador');
      }
    }, 30000);
    return () => clearTimeout(timeout);
  }, [senador]);

  if (loading) return <div className="estado-detalhe-loading"><div className="spinner" /> Carregando detalhes...</div>;
  if (erro) return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header"><h3>Erro</h3><button className="voltar-btn" onClick={onFechar}>× Voltar</button></div>
      <p style={{ textAlign: 'center', padding: 40, color: '#ff6b6b' }}>Erro ao carregar detalhes: {erro}</p>
    </div>
  );

  const sen = dados?.senador || dados;
  if (!sen) return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header"><h3>Senador não encontrado</h3><button className="voltar-btn" onClick={onFechar}>× Voltar</button></div>
      <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Dados do senador não disponíveis</p>
    </div>
  );

  const ident = sen.IdentificacaoParlamentar || {};
  const basico = sen.DadosBasicosParlamentar || {};

  return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <div className="estado-detalhe-header-info">
          {ident.UrlFotoParlamentar && <img className="ad-dep-foto" src={ident.UrlFotoParlamentar} alt={ident.NomeParlamentar} onError={(e) => { e.target.style.display = 'none'; }} />}
          <div>
            <h3>{ident.NomeParlamentar || ident.NomeCompletoParlamentar || '-'}</h3>
            <div className="ad-dep-tags">
              <span className="tag tag-candidato">{ident.SiglaPartidoParlamentar || '-'}</span>
              <span className="tag tag-partido">{ident.UfParlamentar || '-'}</span>
            </div>
          </div>
        </div>
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>
      <SecaoGeralSenador senador={sen} />
    </div>
  );
}

export default function ConhecendoEstado() {
  const { uf } = useParams();

  const [basico, setBasico] = useState(null);
  const [candidatos, setCandidatos] = useState(null);
  const [deputados, setDeputados] = useState(null);
  const [senadores, setSenadores] = useState(null);

  const [erro, setErro] = useState(null);
  const [depDetalhe, setDepDetalhe] = useState(null);
  const [senDetalhe, setSenDetalhe] = useState(null);
  const [municipioDetalhe, setMunicipioDetalhe] = useState(null);

  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear() - 1);
  const [buscarKey, setBuscarKey] = useState(0);
  const [finSecoes, setFinSecoes] = useState({});
  const [finErro, setFinErro] = useState(null);
  const finRef = useRef({});
  const finConcluidoRef = useRef(false);
  const [popupInfo, setPopupInfo] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  function handleBuscar() {
    setFinSecoes({});
    setFinErro(null);
    finRef.current = {};
    finConcluidoRef.current = false;
    setBuscarKey(k => k + 1);
  }

  function toggleCollapse(secao) {
    setCollapsed(prev => ({ ...prev, [secao]: !prev[secao] }));
  }

  useEffect(() => {
    if (!uf) return;
    setErro(null);

    const fetchJson = (url) => fetch(url).then(r => {
      if (!r.ok) throw new Error(`Erro ${r.status}`);
      return r.json();
    });

    fetchJson(`${API_BASE_URL}/estado/${uf}/basico`)
      .then(setBasico)
      .catch(() => {});

    fetchJson(`${API_BASE_URL}/estado/${uf}/candidatos`)
      .then(setCandidatos)
      .catch(() => {});

    fetchJson(`${API_BASE_URL}/estado/${uf}/deputados`)
      .then(data => setDeputados(data.dados || []))
      .catch(() => {});

    fetchJson(`${API_BASE_URL}/estado/${uf}/senadores`)
      .then(data => setSenadores(data.dados || []))
      .catch(() => {});
  }, [uf]);

  useEffect(() => {
    if (!uf) return;
    setFinSecoes({});
    setFinErro(null);
    finRef.current = {};
    finConcluidoRef.current = false;

    const wsUrl = `${WS_BASE_URL}/estado/${uf}/financeiro/stream?exercicio=${anoFiltro}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case 'despesa_pessoal':
            finRef.current = { ...finRef.current, despesa_pessoal: msg.data };
            setFinSecoes({ ...finRef.current });
            break;
          case 'despesa_categoria':
            finRef.current = { ...finRef.current, despesa_categoria: msg.data?.dados || [] };
            setFinSecoes({ ...finRef.current });
            break;
          case 'gastos_por_funcao':
            finRef.current = { ...finRef.current, gastos_por_funcao: msg.data?.dados || [] };
            setFinSecoes({ ...finRef.current });
            break;
          case 'receitas':
            finRef.current = { ...finRef.current, receitas: msg.data?.dados || [] };
            setFinSecoes({ ...finRef.current });
            break;
          case 'recursos_federais':
            finRef.current = { ...finRef.current, recursos_federais: msg.data?.dados || [] };
            setFinSecoes({ ...finRef.current });
            break;
          case 'erro':
            setFinErro(msg.data?.erro || 'Erro desconhecido');
            break;
          case 'concluido':
            finConcluidoRef.current = true;
            ws.close();
            break;
        }
      } catch (_) {}
    };

    ws.onerror = () => {
      ws.close();
    };

    return () => { ws.close(); };
  }, [uf, buscarKey]);

  const recursosFedPag = usePaginacao(finSecoes?.recursos_federais, ITENS_POR_PAGINA);

  if (depDetalhe) {
    return (
      <div className="estado-page">
        <ErrorBoundary onFechar={() => setDepDetalhe(null)}>
          <DetalheDeputado deputado={depDetalhe} onFechar={() => setDepDetalhe(null)} />
        </ErrorBoundary>
      </div>
    );
  }

  if (senDetalhe) {
    return (
      <div className="estado-page">
        <ErrorBoundary onFechar={() => setSenDetalhe(null)}>
          <DetalheSenador senador={senDetalhe} onFechar={() => setSenDetalhe(null)} />
        </ErrorBoundary>
      </div>
    );
  }

  if (municipioDetalhe) {
    return (
      <div className="estado-page">
        <ErrorBoundary onFechar={() => setMunicipioDetalhe(null)}>
          <DetalheMunicipio
            municipio={municipioDetalhe}
            uf={uf}
            onFechar={() => setMunicipioDetalhe(null)}
          />
        </ErrorBoundary>
      </div>
    );
  }

  const nome = basico?.nome || uf;
  const ufSigla = basico?.uf || uf;
  const populacao = basico?.populacao || 0;
  const municipios = basico?.municipios || [];

  const listaVereadores = candidatos?.vereadores || [];
  const listaPrefeitos = candidatos?.prefeitos || [];
  const listaVice = candidatos?.vice_prefeitos || [];

  const listaDeputados = deputados || [];
  const listaSenadores = senadores || [];

  const {
    despesa_pessoal: finDespesaPessoal,
    despesa_categoria: finDespesaCategoria,
    gastos_por_funcao: finGastosFuncao,
    receitas: finReceitas,
    recursos_federais: finRecursosFed,
  } = finSecoes;

  if (!basico && !candidatos && !deputados && !senadores) {
    return (
      <div className="estado-page">
        <div className="estado-loading">
          <div className="spinner" />
          Carregando dados do estado...
        </div>
      </div>
    );
  }

  return (
    <div className="estado-page">
      <div className="estado-header">
        <h1>Conhecendo {nome}</h1>
        <span className="uf-badge">{ufSigla}</span>
        {populacao > 0 && <span className="pop-badge">Pop: {fmtNum(populacao)} hab.</span>}
        <button className="voltar-btn" onClick={() => window.close()}>× Fechar</button>
      </div>

      <ContadoresBar
        vereadores={listaVereadores.length}
        deputados={listaDeputados.length}
        senadores={listaSenadores.length}
        municipios={municipios.length}
        pequenos={municipios.filter(m => m.populacao > 0 && m.populacao < 10000).length}
      />

      {candidatos ? (
        <div className="estado-section">
          <div className="estado-section-header" onClick={() => toggleCollapse('candidatos')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Candidatos Eleitos <span className="count">({listaVereadores.length + listaPrefeitos.length + listaVice.length})</span><InfoBadge chave="candidatos" onInfoClick={setPopupInfo} /></h2>
            <span>{collapsed.candidatos ? '▶' : '▼'}</span>
          </div>
          {!collapsed.candidatos && (
            <>
              {listaVereadores.length > 0 && <TabelaCandidatos dados={listaVereadores} titulo="Vereadores Eleitos" />}
              {listaPrefeitos.length > 0 && <TabelaCandidatos dados={listaPrefeitos} titulo="Prefeitos Eleitos" />}
              {listaVice.length > 0 && <TabelaCandidatos dados={listaVice} titulo="Vice-Prefeitos Eleitos" />}
              {listaVereadores.length === 0 && listaPrefeitos.length === 0 && listaVice.length === 0 && (
                <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum candidato encontrado para esta UF</p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="estado-section">
          <h2>Candidatos Eleitos <span className="count">(...)</span></h2>
          <div className="municipios-loading">Carregando vereadores, prefeitos e vice-prefeitos...</div>
        </div>
      )}

      <div className="estado-section">
        <div className="estado-section-header" onClick={() => toggleCollapse('deputados')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Deputados Federais <span className="count">({listaDeputados.length})</span><InfoBadge chave="deputados" onInfoClick={setPopupInfo} /></h2>
          <span>{collapsed.deputados ? '▶' : '▼'}</span>
        </div>
        {!collapsed.deputados && (
          <>
            {listaDeputados.length > 0 ? (
              <div className="ad-grid">
                {listaDeputados.map(d => (
                  <div key={d.id} className="ad-card-dep">
                    <img className="ad-foto" src={d.url_foto} alt={d.nome} onError={(e) => { e.target.style.display = 'none'; }} />
                    <div className="ad-card-dep-info">
                      <strong className="ad-card-dep-nome">{d.nome}</strong>
                      <span className="ad-card-dep-partido">
                        <span className="tag tag-candidato">{d.sigla_partido}</span>
                        <span className="ad-card-dep-uf">{d.sigla_uf}</span>
                      </span>
                      <span className="ad-card-dep-extra" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {d.email ? `📧 ${d.email}` : ''}{d.email && d.nome_eleitoral ? ' · ' : ''}{d.nome_eleitoral ? `🗳 ${d.nome_eleitoral}` : ''}
                      </span>
                    </div>
                    <button className="btn btn-sm btn-outline-accent" onClick={() => setDepDetalhe(d)}>Detalhes</button>
                  </div>
                ))}
              </div>
            ) : deputados !== null ? (
              <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum deputado encontrado</p>
            ) : (
              <div className="municipios-loading">Carregando deputados...</div>
            )}
          </>
        )}
      </div>

      <div className="estado-section">
        <div className="estado-section-header" onClick={() => toggleCollapse('senadores')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Senadores <span className="count">({listaSenadores.length})</span><InfoBadge chave="senadores" onInfoClick={setPopupInfo} /></h2>
          <span>{collapsed.senadores ? '▶' : '▼'}</span>
        </div>
        {!collapsed.senadores && (
          <>
            {listaSenadores.length > 0 ? (
              <div className="ad-grid">
                {listaSenadores.map(s => (
                  <div key={s.codigo} className="ad-card-dep">
                    <img className="ad-foto" src={s.url_foto} alt={s.nome_parlamentar} onError={(e) => { e.target.style.display = 'none'; }} />
                    <div className="ad-card-dep-info">
                      <strong className="ad-card-dep-nome">{s.nome_parlamentar}</strong>
                      <span className="ad-card-dep-partido">
                        <span className="tag tag-candidato">{s.partido}</span>
                        <span className="ad-card-dep-uf">{s.uf}</span>
                      </span>
                      {s.nome_completo && (
                        <span className="ad-card-dep-extra" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          {s.nome_completo}
                        </span>
                      )}
                    </div>
                    <button className="btn btn-sm btn-outline-accent" onClick={() => setSenDetalhe(s)}>Detalhes</button>
                  </div>
                ))}
              </div>
            ) : senadores !== null ? (
              <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum senador encontrado</p>
            ) : (
              <div className="municipios-loading">Carregando senadores...</div>
            )}
          </>
        )}
      </div>

      <div className="estado-section" style={{ padding: '8px 12px', marginBottom: 8, background: 'var(--card-bg)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ano exercício:</span>
        <input type="number" min="2010" max={new Date().getFullYear()} value={anoFiltro} onChange={(e) => setAnoFiltro(Number(e.target.value))} style={{ width: 80, padding: '4px 8px', fontSize: '0.85rem' }} />
        <button className="btn btn-sm" onClick={handleBuscar}>Buscar Dados Financeiros</button>
      </div>

      {finErro && (
        <div className="estado-erro" style={{ marginBottom: 8 }}>{finErro}</div>
      )}

      {finDespesaPessoal && (
        <div className="estado-section">
          <div className="estado-section-header" onClick={() => toggleCollapse('despesa_pessoal')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Despesa com Pessoal <span className="count">(Executivo)</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoFiltro}</span><InfoBadge chave="despesa_pessoal" onInfoClick={setPopupInfo} /></h2>
            <span>{collapsed.despesa_pessoal ? '▶' : '▼'}</span>
          </div>
          {!collapsed.despesa_pessoal && (
            <div className="dm-cards">
              <FinCard label="Total Despesa Pessoal" value={fmtMoney(finDespesaPessoal.valor_total)} />
              <FinCard label="% da RCL" value={fmtNum(finDespesaPessoal.percentual_rcl) + '%'} />
              <FinCard label="Exercício" value={finDespesaPessoal.periodo} />
            </div>
          )}
        </div>
      )}

      {finDespesaCategoria && finDespesaCategoria.length > 0 && (
        <div className="estado-section">
          <div className="estado-section-header" onClick={() => toggleCollapse('despesa_categoria')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Despesa com Pessoal por Categoria <span className="count">({finDespesaCategoria.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoFiltro}</span><InfoBadge chave="despesa_categoria" onInfoClick={setPopupInfo} /></h2>
            <span>{collapsed.despesa_categoria ? '▶' : '▼'}</span>
          </div>
          {!collapsed.despesa_categoria && (
            <table className="estado-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Qtd</th>
                  <th>Despesa Total</th>
                  <th>% Despesa</th>
                </tr>
              </thead>
              <tbody>
                {finDespesaCategoria.map((c, i) => (
                  <tr key={i}>
                    <td>{c.categoria || '-'}</td>
                    <td>{c.quantidade != null ? c.quantidade : '-'}</td>
                    <td>{fmtMoney(c.despesa_total)}</td>
                    <td>{c.percentual_despesa != null ? c.percentual_despesa.toFixed(2) + '%' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {finGastosFuncao && finGastosFuncao.length > 0 && (
        <div className="estado-section">
          <div className="estado-section-header" onClick={() => toggleCollapse('gastos_por_funcao')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Gastos por Função <span className="count">({finGastosFuncao.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoFiltro}</span><InfoBadge chave="gastos_por_funcao" onInfoClick={setPopupInfo} /></h2>
            <span>{collapsed.gastos_por_funcao ? '▶' : '▼'}</span>
          </div>
          {!collapsed.gastos_por_funcao && (
            <table className="estado-table">
              <thead>
                <tr>
                  <th>Função</th>
                  <th>Empenhado</th>
                  <th>Liquidado</th>
                  <th>Pago</th>
                </tr>
              </thead>
              <tbody>
                {finGastosFuncao.map((g, i) => (
                  <tr key={i}>
                    <td>{g.funcao}</td>
                    <td>{fmtMoney(g.empenhado)}</td>
                    <td>{fmtMoney(g.liquidado)}</td>
                    <td>{fmtMoney(g.pago)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {finReceitas && finReceitas.length > 0 && (
        <div className="estado-section">
          <div className="estado-section-header" onClick={() => toggleCollapse('receitas')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Receitas <span className="count">({finReceitas.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoFiltro}</span><InfoBadge chave="receitas" onInfoClick={setPopupInfo} /></h2>
            <span>{collapsed.receitas ? '▶' : '▼'}</span>
          </div>
          {!collapsed.receitas && (
            <table className="estado-table">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>Coluna</th>
                  <th>Exercício</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {finReceitas.map((r, i) => (
                  <tr key={i}>
                    <td>{r.conta || '-'}</td>
                    <td className="dm-obj-col">{r.coluna || '-'}</td>
                    <td>{r.exercicio || '-'}</td>
                    <td>{fmtMoney(r.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {finRecursosFed && finRecursosFed.length > 0 && (
        <div className="estado-section">
          <div className="estado-section-header" onClick={() => toggleCollapse('recursos_federais')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Recursos Federais Recebidos <span className="count">({finRecursosFed.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoFiltro}</span><InfoBadge chave="recursos_federais" onInfoClick={setPopupInfo} /></h2>
            <span>{collapsed.recursos_federais ? '▶' : '▼'}</span>
          </div>
          {!collapsed.recursos_federais && (<>
            <table className="estado-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Favorecido</th>
                  <th>UG</th>
                  <th>Órgão</th>
                  <th>Órgão Superior</th>
                  <th>Mês/Ano</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {recursosFedPag.paginaDados.map((rf, i) => (
                  <tr key={i}>
                    <td>{rf.tipo_pessoa || '-'}</td>
                    <td>{rf.nome_pessoa || '-'}</td>
                    <td>{rf.nome_ug || '-'}</td>
                    <td>{rf.nome_orgao || '-'}</td>
                    <td>{rf.nome_orgao_superior || '-'}</td>
                    <td>{fmtMesAno(rf.mes_ano)}</td>
                    <td>{fmtMoney(rf.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Paginacao pagina={recursosFedPag.pagina} totalPaginas={recursosFedPag.totalPaginas} onPagina={recursosFedPag.setPagina} />
          </>)}
        </div>
      )}

      <div className="estado-section">
        <div className="estado-section-header" onClick={() => toggleCollapse('municipios')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Municípios <span className="count">({municipios.length} no total)</span><InfoBadge chave="candidatos" onInfoClick={setPopupInfo} /></h2>
          <span>{collapsed.municipios ? '▶' : '▼'}</span>
        </div>
        {!collapsed.municipios && (
          basico ? (
            <>
              <div className="municipios-loading">
                {municipios.length > 0
                  ? `${municipios.length} municípios • do menor para o maior`
                  : 'Carregando municípios...'}
              </div>
              <div className="estado-cards">
                {municipios.map(m => (
                  <div key={m.id} className="estado-card">
                    <div className="municipio-nome">{m.nome}</div>
                    <div className="municipio-pop">
                      {m.populacao ? `Pop: ${fmtNum(m.populacao)} hab.` : ''}
                    </div>
                    <button
                      className="btn btn-sm btn-outline-accent"
                      onClick={() => setMunicipioDetalhe(m)}
                    >
                      Detalhes
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="municipios-loading">Carregando municípios...</div>
          )
        )}
      </div>

      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}
    </div>
  );
}
