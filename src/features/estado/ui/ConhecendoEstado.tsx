// @ts-nocheck
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL, WS_BASE_URL } from '@/shared/config';
import DetalheMunicipio from './DetalheMunicipio';
import ErrorBoundary from '@/shared/ui/ErrorBoundary/ErrorBoundary';
import DeputadoDetailView from '@/features/analise/ui/DeputadoDetailView';
import SenadorDetailView from '@/features/analise/ui/SenadorDetailView';
import './ConhecendoEstado.css';
import '../../analise/ui/AnaliseDeputados.css';

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

function SearchAutocomplete({ dados, placeholder, campoNome, campoPartido, onFilter }: {
  dados: any[];
  placeholder: string;
  campoNome: string;
  campoPartido: string;
  onFilter: (texto: string) => void;
}) {
  const [texto, setTexto] = useState('');
  const [dropdown, setDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const sugestoes = useMemo(() => {
    if (!texto.trim()) return dados.slice(0, 15);
    const q = texto.toLowerCase();
    return dados.filter(d => {
      const nome = (d[campoNome] || '').toLowerCase();
      const partido = (d[campoPartido] || '').toLowerCase();
      return nome.includes(q) || partido.includes(q);
    }).slice(0, 15);
  }, [texto, dados, campoNome, campoPartido]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTexto(e.target.value);
    onFilter(e.target.value);
  };

  const handleSelect = (item: any) => {
    const val = (item[campoNome] || '') + ' ' + (item[campoPartido] || '');
    setTexto(val.trim());
    setDropdown(false);
    onFilter(val.trim());
  };

  const handleClear = () => {
    setTexto('');
    setDropdown(false);
    onFilter('');
  };

  const handleToggle = () => {
    setDropdown(!dropdown);
  };

  return (
    <div className="search-autocomplete" ref={ref}>
      <div className="search-input-row">
        <input
          className="search-input"
          type="text"
          placeholder={placeholder}
          value={texto}
          onChange={handleChange}
          onFocus={() => setDropdown(true)}
        />
        {texto ? (
          <button type="button" className="search-clear" onClick={handleClear} title="Limpar">×</button>
        ) : (
          <button type="button" className="search-toggle" onClick={handleToggle} title="Ver lista">{dropdown ? '▴' : '▾'}</button>
        )}
      </div>
      {dropdown && (
        <div className="autocomplete-list">
          {sugestoes.map((item, i) => (
            <div key={i} className="autocomplete-item" onClick={() => handleSelect(item)}>
              <span className="autocomplete-nome">{item[campoNome] || '-'}</span>
              {item[campoPartido] && <span className="autocomplete-partido">{item[campoPartido]}</span>}
            </div>
          ))}
          {sugestoes.length === 0 && texto && (
            <div className="autocomplete-empty">Nenhum resultado</div>
          )}
        </div>
      )}
    </div>
  );
}

function TabelaCandidatos({ dados, titulo, semSecao }) {
  const [situacaoAtiva, setSituacaoAtiva] = useState(null);
  const [tipoAtivo, setTipoAtivo] = useState('TODAS');
  const [anoFiltro, setAnoFiltro] = useState(null);
  const [pagina, setPagina] = useState(0);
  const [buscaTexto, setBuscaTexto] = useState('');
  const [showBusca, setShowBusca] = useState(false);

  const situacoes = [...new Set(dados.map(d => d.situacao_totalizacao_descricao))].filter(Boolean).sort();

  const dadosSituacao = situacaoAtiva ? dados.filter(d => d.situacao_totalizacao_descricao === situacaoAtiva) : dados;

  const dadosBuscados = !buscaTexto ? dadosSituacao : dadosSituacao.filter(d => {
    const q = buscaTexto.toLowerCase();
    return (d.nome_urna || '').toLowerCase().includes(q) ||
           (d.nome_completo || '').toLowerCase().includes(q) ||
           (d.partido_sigla || '').toLowerCase().includes(q);
  });

  const anos = [...new Set(dadosBuscados.map(d => d.ano_eleicao))].sort((a, b) => b - a);

  useEffect(() => {
    if (anos.length > 0 && anoFiltro === null) setAnoFiltro(anos[0]);
  }, [anos.join(','), situacaoAtiva]);

  useEffect(() => {
    setPagina(0);
    setAnoFiltro(anos.length > 0 ? anos[0] : null);
    setTipoAtivo('TODAS');
    setBuscaTexto('');
    setShowBusca(false);
  }, [situacaoAtiva]);

  const filtrados = dadosBuscados.filter(d => {
    if (anoFiltro !== null && d.ano_eleicao !== anoFiltro) return false;
    if (tipoAtivo === 'ORDINÁRIA') return d.eleicao_tipo === 'ORDINÁRIA';
    if (tipoAtivo === 'SUPLEMENTAR') return d.eleicao_tipo === 'SUPLEMENTAR';
    return true;
  });

  const totalPaginas = Math.ceil(filtrados.length / ITENS_POR_PAGINA);
  const paginaCorrigida = Math.min(pagina, Math.max(0, totalPaginas - 1));
  const inicio = paginaCorrigida * ITENS_POR_PAGINA;
  const paginaDados = filtrados.slice(inicio, inicio + ITENS_POR_PAGINA);

  const inner = (
    <>
      <h2 style={{ display: titulo ? 'block' : 'none' }}>{titulo} <span className="count">({dados.length} registros)</span></h2>

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
            <button className={`ano-btn ${showBusca ? 'ativo' : ''}`} onClick={() => setShowBusca(!showBusca)} title="Buscar por nome ou partido">
              🔍
            </button>
          </div>

          {showBusca && (
            <SearchAutocomplete
              dados={dadosSituacao}
              placeholder="🔍 Buscar por nome ou partido..."
              campoNome="nome_urna"
              campoPartido="partido_sigla"
              onFilter={(t) => { setBuscaTexto(t); setPagina(0); }}
            />
          )}

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
    </>
  );
  if (semSecao) return inner;
  return <div className="estado-section">{inner}</div>;
}

const CHART_COLORS = [
  '#ff0080', '#00ffff', '#39ff14', '#ff6600', '#b000ff',
  '#ff00ff', '#00ffcc', '#ffff00', '#0066ff', '#ff4400',
];

function aggregateBy(data: any[], key: string) {
  const map = new Map<string, number>();
  data.forEach(d => {
    const k = d[key] || 'Desconhecido';
    map.set(k, (map.get(k) || 0) + Number(d.valor || 0));
  });
  return Array.from(map.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);
}

function aggregateByValueRange(data: any[]) {
  const ranges = [
    { label: 'Até R$ 10 mil', min: 0, max: 10000 },
    { label: 'R$ 10 mil a R$ 100 mil', min: 10000, max: 100000 },
    { label: 'R$ 100 mil a R$ 1 mi', min: 100000, max: 1000000 },
    { label: 'Acima de R$ 1 milhão', min: 1000000, max: Infinity },
  ];
  return ranges.map(r => ({
    nome: r.label,
    valor: data
      .filter(d => Number(d.valor || 0) >= r.min && Number(d.valor || 0) < r.max)
      .reduce((s, d) => s + Number(d.valor || 0), 0),
  })).filter(r => r.valor > 0);
}

function topN(data: { nome: string; valor: number }[], n = 8) {
  if (data.length <= n) return data;
  const top = data.slice(0, n - 1);
  const outrosValor = data.slice(n - 1).reduce((s, d) => s + d.valor, 0);
  return [...top, { nome: `Outros (${data.length - n + 1})`, valor: outrosValor }];
}

function fmtMoneyCompact(v: number) {
  if (v >= 1e9) return 'R$ ' + (v / 1e9).toFixed(1) + ' bi';
  if (v >= 1e6) return 'R$ ' + (v / 1e6).toFixed(1) + ' mi';
  if (v >= 1e3) return 'R$ ' + (v / 1e3).toFixed(0) + ' mil';
  return 'R$ ' + v.toFixed(0);
}

function PieChart({ data, size = 160 }: { data: { nome: string; valor: number }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  if (total === 0 || data.length === 0) {
    return <div className="chart-empty">Sem dados</div>;
  }

  const radius = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  let currentAngle = -90;

  const slices = data.map(d => {
    const pct = (d.valor / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + pct;
    currentAngle += pct;
    return { ...d, startAngle, endAngle, pct };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg className="chart-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, i) => {
          const startRad = (slice.startAngle * Math.PI) / 180;
          const endRad = (slice.endAngle * Math.PI) / 180;
          const x1 = cx + radius * Math.cos(startRad);
          const y1 = cy + radius * Math.sin(startRad);
          const x2 = cx + radius * Math.cos(endRad);
          const y2 = cy + radius * Math.sin(endRad);
          const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          return <path key={i} d={d} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--bg-surface)" strokeWidth="1.5" />;
        })}
      </svg>
      <div className="chart-legend">
        {slices.map((slice, i) => (
          <div className="chart-legend-item" key={i} title={`${slice.nome}: ${fmtMoneyCompact(slice.valor)} (${slice.pct.toFixed(1)}%)`}>
            <span className="chart-legend-color" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="chart-legend-name">{slice.nome}</span>
            <span className="chart-legend-val">{fmtMoneyCompact(slice.valor)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PAGE_SECTIONS = [
  { id: 'estado-inicio', label: 'Início' },
  { id: 'estado-prefeitos', label: 'Prefeitos' },
  { id: 'estado-vice', label: 'Vice-Prefeitos' },
  { id: 'estado-vereadores', label: 'Vereadores' },
  { id: 'estado-deputados', label: 'Deputados' },
  { id: 'estado-senadores', label: 'Senadores' },
  { id: 'estado-financas', label: 'Finanças' },
  { id: 'estado-municipios', label: 'Municípios' },
];

function PageNav() {
  const [active, setActive] = useState('estado-inicio');

  useEffect(() => {
    const ids = PAGE_SECTIONS.map((s) => s.id);
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <nav className="estado-page-nav">
      {PAGE_SECTIONS.map((section) => (
        <button
          key={section.id}
          className={`page-nav-item ${active === section.id ? 'active' : ''}`}
          onClick={() => scrollTo(section.id)}
        >
          <span className="page-nav-dot" />
          <span>{section.label}</span>
        </button>
      ))}
    </nav>
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

  const [finErro, setFinErro] = useState(null);
  const [finCache, setFinCache] = useState({});
  const [anosCarregados, setAnosCarregados] = useState(new Set());
  const [anoAtualCarregando, setAnoAtualCarregando] = useState(null);
  const [anosSelecionados, setAnosSelecionados] = useState([new Date().getFullYear() - 1]);
  const [mesSelecionado, setMesSelecionado] = useState(0);
  const [popupInfo, setPopupInfo] = useState(null);
  const [collapsed, setCollapsed] = useState({ deputados: true });
  const [depBuscaTexto, setDepBuscaTexto] = useState('');
  const [munNomeBusca, setMunNomeBusca] = useState('');
  const [chartPopup, setChartPopup] = useState(null);

  function toggleAno(ano) {
    setAnosSelecionados(prev => {
      if (prev.includes(ano)) return prev.filter(a => a !== ano);
      return [...prev, ano];
    });
  }

  function recarregarTudo() {
    setFinCache({});
    setAnosCarregados(new Set());
    setFinErro(null);
    setAnoAtualCarregando(null);
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
    setFinCache({});
    setAnosCarregados(new Set());
    setAnoAtualCarregando(null);
    setFinErro(null);
  }, [uf]);

  useEffect(() => {
    if (!uf) return;

    const anosFaltantes = anosSelecionados.filter(a => !anosCarregados.has(a));
    if (anosFaltantes.length === 0) return;
    if (anoAtualCarregando !== null) return;

    const anoParaCarregar = anosFaltantes[0];
    setAnoAtualCarregando(anoParaCarregar);
    setFinErro(null);

    const dadosAno = {};

    const ws = new WebSocket(`${WS_BASE_URL}/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ channel: 'estado_financeiro', uf, exercicio: anoParaCarregar }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case 'despesa_pessoal':
            dadosAno.despesa_pessoal = msg.data;
            break;
          case 'despesa_categoria':
            dadosAno.despesa_categoria = msg.data?.dados || [];
            break;
          case 'gastos_por_funcao':
            dadosAno.gastos_por_funcao = msg.data?.dados || [];
            break;
          case 'receitas':
            dadosAno.receitas = msg.data?.dados || [];
            break;
          case 'recursos_federais':
            dadosAno.recursos_federais = msg.data?.dados || [];
            break;
          case 'erro':
            setFinErro(msg.data?.erro || 'Erro desconhecido');
            break;
          case 'concluido':
            setFinCache(prev => ({ ...prev, [anoParaCarregar]: dadosAno }));
            setAnosCarregados(prev => new Set([...prev, anoParaCarregar]));
            setAnoAtualCarregando(null);
            ws.close();
            break;
        }
      } catch (_) {}
    };

    ws.onerror = () => {
      setAnoAtualCarregando(null);
      ws.close();
    };

    return () => { ws.close(); };
  }, [uf, anosSelecionados, anosCarregados, anoAtualCarregando]);

  const finSecoes = useMemo(() => {
    const anos = Object.keys(finCache).map(Number).sort();
    if (anos.length === 0) return {};
    const ultimoAno = anos[anos.length - 1];
    return finCache[ultimoAno] || {};
  }, [finCache]);

  const recursosFedExibicao = useMemo(() => {
    let dados = [];
    anosSelecionados.forEach(ano => {
      if (finCache[ano]?.recursos_federais) {
        dados = dados.concat(finCache[ano].recursos_federais);
      }
    });
    if (mesSelecionado !== 0) {
      dados = dados.filter(d => {
        const s = String(d.mes_ano || '');
        return parseInt(s.substring(4, 6), 10) === mesSelecionado;
      });
    }
    return dados;
  }, [finCache, anosSelecionados, mesSelecionado]);

  const recursosFedPag = usePaginacao(recursosFedExibicao, ITENS_POR_PAGINA);

  const chartData = useMemo(() => {
    if (!recursosFedExibicao.length) return null;
    return {
      tipoPessoa: aggregateBy(recursosFedExibicao, 'tipo_pessoa'),
      porOrgao: topN(aggregateBy(recursosFedExibicao, 'nome_orgao')),
      porOrgaoSuperior: topN(aggregateBy(recursosFedExibicao, 'nome_orgao_superior')),
      porMesAno: topN(aggregateBy(recursosFedExibicao, 'mes_ano'), 12),
    };
  }, [recursosFedExibicao]);

  const anoExibicao = useMemo(() => {
    const anos = Object.keys(finCache).map(Number).sort();
    return anos.length > 0 ? anos[anos.length - 1] : null;
  }, [finCache]);

  const nome = basico?.nome || uf;
  const ufSigla = basico?.uf || uf;
  const populacao = basico?.populacao || 0;
  const municipios = basico?.municipios || [];

  const listaVereadores = candidatos?.vereadores || [];
  const listaPrefeitos = candidatos?.prefeitos || [];
  const listaVice = candidatos?.vice_prefeitos || [];

  const listaDeputados = deputados || [];
  const listaSenadores = senadores || [];

  const depFiltrados = useMemo(() => {
    if (!depBuscaTexto) return listaDeputados;
    const q = depBuscaTexto.toLowerCase();
    return listaDeputados.filter(d =>
      (d.nome || '').toLowerCase().includes(q) ||
      (d.sigla_partido || '').toLowerCase().includes(q)
    );
  }, [listaDeputados, depBuscaTexto]);

  const munFiltrados = useMemo(() => {
    if (!munNomeBusca) return municipios;
    const q = munNomeBusca.toLowerCase();
    return municipios.filter(m => (m.nome || '').toLowerCase().includes(q));
  }, [municipios, munNomeBusca]);

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

  if (depDetalhe) {
    return (
      <div className="estado-page">
        <ErrorBoundary onFechar={() => setDepDetalhe(null)}>
          <DeputadoDetailView deputadoId={depDetalhe.id} onFechar={() => setDepDetalhe(null)} />
        </ErrorBoundary>
      </div>
    );
  }

  if (senDetalhe) {
    return (
      <div className="estado-page">
        <ErrorBoundary onFechar={() => setSenDetalhe(null)}>
          <SenadorDetailView senadorCodigo={senDetalhe.codigo} onFechar={() => setSenDetalhe(null)} />
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

  return (
    <div className="estado-page">
      <PageNav />
      <div className="estado-header" id="estado-inicio">
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

      {/* ── Linha 1: Prefeitos + Vice ── */}
      <div className="politicos-grid">
        <div className="estado-section" id="estado-prefeitos">
          <div className="estado-section-header" onClick={() => toggleCollapse('prefeitos')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Prefeitos Eleitos <span className="count">({listaPrefeitos.length})</span><InfoBadge chave="candidatos" onInfoClick={setPopupInfo} /></h2>
            <span>{collapsed.prefeitos ? '▶' : '▼'}</span>
          </div>
          {!collapsed.prefeitos && (
            candidatos ? (
              listaPrefeitos.length > 0 ? (
                <TabelaCandidatos dados={listaPrefeitos} titulo="" semSecao />
              ) : (
                <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum prefeito encontrado</p>
              )
            ) : (
              <div className="municipios-loading">Carregando prefeitos...</div>
            )
          )}
        </div>

        <div className="estado-section" id="estado-vice">
          <div className="estado-section-header" onClick={() => toggleCollapse('vice')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Vice-Prefeitos Eleitos <span className="count">({listaVice.length})</span><InfoBadge chave="candidatos" onInfoClick={setPopupInfo} /></h2>
            <span>{collapsed.vice ? '▶' : '▼'}</span>
          </div>
          {!collapsed.vice && (
            candidatos ? (
              listaVice.length > 0 ? (
                <TabelaCandidatos dados={listaVice} titulo="" semSecao />
              ) : (
                <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum vice-prefeito encontrado</p>
              )
            ) : (
              <div className="municipios-loading">Carregando vice-prefeitos...</div>
            )
          )}
        </div>
      </div>

      {/* ── Linha 2: Vereadores + Deputados ── */}
      <div className="politicos-grid">
        <div className="estado-section" id="estado-vereadores">
          <div className="estado-section-header" onClick={() => toggleCollapse('vereadores')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Vereadores Eleitos <span className="count">({listaVereadores.length})</span><InfoBadge chave="candidatos" onInfoClick={setPopupInfo} /></h2>
            <span>{collapsed.vereadores ? '▶' : '▼'}</span>
          </div>
          {!collapsed.vereadores && (
            candidatos ? (
              listaVereadores.length > 0 ? (
                <TabelaCandidatos dados={listaVereadores} titulo="" semSecao />
              ) : (
                <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum vereador encontrado</p>
              )
            ) : (
              <div className="municipios-loading">Carregando vereadores...</div>
            )
          )}
        </div>

        <div className="estado-section" id="estado-deputados">
          <div className="estado-section-header" onClick={() => toggleCollapse('deputados')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Deputados Federais <span className="count">({depFiltrados.length}/{listaDeputados.length})</span><InfoBadge chave="deputados" onInfoClick={setPopupInfo} /></h2>
            <span>{collapsed.deputados ? '▶' : '▼'}</span>
          </div>
          {!collapsed.deputados && (
            <>
              {listaDeputados.length > 0 ? (
                <>
                  <SearchAutocomplete
                    dados={listaDeputados}
                    placeholder="🔍 Buscar deputado por nome ou partido..."
                    campoNome="nome"
                    campoPartido="sigla_partido"
                    onFilter={setDepBuscaTexto}
                  />
                  {depFiltrados.length > 0 ? (
                    <div className="ad-grid">
                      {depFiltrados.map(d => (
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
                  ) : (
                    <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum deputado encontrado para os filtros atuais</p>
                  )}
                </>
              ) : deputados !== null ? (
                <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum deputado encontrado</p>
              ) : (
                <div className="municipios-loading">Carregando deputados...</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Senadores Full Width ── */}
      <div className="estado-section" id="estado-senadores" style={{ marginBottom: 24 }}>
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

      <div className="estado-section" id="estado-financas" style={{ padding: '12px', marginBottom: 8, background: 'var(--card-bg)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Anos:</span>
        {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 1 - i).reverse().map(ano => (
          <button
            key={ano}
            className={`ano-btn ${anosSelecionados.includes(ano) ? 'ativo' : ''}`}
            onClick={() => toggleAno(ano)}
          >
            {ano}{anoAtualCarregando === ano ? ' ⟳' : ''}
          </button>
        ))}
        <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: 16 }}>Mês:</span>
        <select value={mesSelecionado} onChange={e => setMesSelecionado(Number(e.target.value))}
          style={{ padding: '6px 8px', fontSize: '0.78rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}>
          <option value={0}>Todos</option>
          {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((nome, i) => (
            <option key={i+1} value={i+1}>{nome}</option>
          ))}
        </select>
        {Object.keys(finCache).length > 0 && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>
            {Object.keys(finCache).length} ano(s) carregado(s)
          </span>
        )}
        <button className="btn btn-sm" onClick={recarregarTudo} style={{ marginLeft: 'auto' }}>Recarregar</button>
      </div>

      {finErro && (
        <div className="estado-erro" style={{ marginBottom: 8 }}>{finErro}</div>
      )}

      {finDespesaPessoal && (
        <div className="estado-section">
          <div className="estado-section-header" onClick={() => toggleCollapse('despesa_pessoal')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Despesa com Pessoal <span className="count">(Executivo)</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoExibicao}</span><InfoBadge chave="despesa_pessoal" onInfoClick={setPopupInfo} /></h2>
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
            <h2 style={{ margin: 0 }}>Despesa com Pessoal por Categoria <span className="count">({finDespesaCategoria.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoExibicao}</span><InfoBadge chave="despesa_categoria" onInfoClick={setPopupInfo} /></h2>
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
            <h2 style={{ margin: 0 }}>Gastos por Função <span className="count">({finGastosFuncao.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoExibicao}</span><InfoBadge chave="gastos_por_funcao" onInfoClick={setPopupInfo} /></h2>
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
            <h2 style={{ margin: 0 }}>Receitas <span className="count">({finReceitas.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoExibicao}</span><InfoBadge chave="receitas" onInfoClick={setPopupInfo} /></h2>
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

      {recursosFedExibicao.length > 0 && (
        <div className="estado-section">
          <div className="estado-section-header" onClick={() => toggleCollapse('recursos_federais')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Recursos Federais Recebidos <span className="count">({recursosFedExibicao.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anosSelecionados.sort().join(', ')}</span><InfoBadge chave="recursos_federais" onInfoClick={setPopupInfo} /></h2>
            <span>{collapsed.recursos_federais ? '▶' : '▼'}</span>
          </div>
          {!collapsed.recursos_federais && (<>
            {chartData && (
              <div className="chart-row">
                <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Tipo Pessoa', data: chartData.tipoPessoa })}>
                  <div className="chart-card-title">Tipo Pessoa</div>
                  <PieChart data={chartData.tipoPessoa} size={240} />
                </div>
                <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Recursos por Órgão', data: chartData.porOrgao })}>
                  <div className="chart-card-title">Por Órgão</div>
                  <PieChart data={chartData.porOrgao} size={240} />
                </div>
                <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Recursos por Órgão Superior', data: chartData.porOrgaoSuperior })}>
                  <div className="chart-card-title">Órgão Superior</div>
                  <PieChart data={chartData.porOrgaoSuperior} size={240} />
                </div>
                <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Recursos por Mês/Ano', data: chartData.porMesAno })}>
                  <div className="chart-card-title">Por Mês/Ano</div>
                  <PieChart data={chartData.porMesAno} size={240} />
                </div>
              </div>
            )}
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

      <div className="estado-section" id="estado-municipios">
        <div className="estado-section-header" onClick={() => toggleCollapse('municipios')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Municípios <span className="count">({munFiltrados.length}/{municipios.length} no total)</span><InfoBadge chave="candidatos" onInfoClick={setPopupInfo} /></h2>
          <span>{collapsed.municipios ? '▶' : '▼'}</span>
        </div>
        {!collapsed.municipios && (
          basico ? (
            <>
              <div className="search-filter-bar">
                <input
                  className="search-input"
                  type="text"
                  placeholder="🔍 Buscar município por nome..."
                  value={munNomeBusca}
                  onChange={(e) => setMunNomeBusca(e.target.value)}
                />
              </div>
              <div className="municipios-loading">
                {municipios.length > 0
                  ? `${munFiltrados.length} de ${municipios.length} municípios • do menor para o maior`
                  : 'Carregando municípios...'}
              </div>
              {munFiltrados.length > 0 ? (
                <div className="estado-cards">
                  {munFiltrados.map(m => (
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
              ) : (
                <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum município encontrado para o filtro</p>
              )}
            </>
          ) : (
            <div className="municipios-loading">Carregando municípios...</div>
          )
        )}
      </div>

      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}

      {chartPopup && (
        <div className="dm-modal-overlay" onClick={() => setChartPopup(null)}>
          <div className="dm-modal chart-popup-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="dm-modal-header">
              <h3>{chartPopup.titulo}</h3>
              <button className="dm-modal-close" onClick={() => setChartPopup(null)}>×</button>
            </div>
            <div className="dm-modal-body" style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <PieChart data={chartPopup.data} size={420} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
