import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppDispatch } from '@/app/store/hooks';
import { setTipoBusca } from '@/app/store/slices/navigationSlice';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { API_BASE_URL } from '@/shared/config';
import { PieChart } from '@/features/estado/ui/chart-utils';
import { JanelaPopup, ContratoDetalhes } from '@/features/ligacao-politica/ui/Resultados';
import './Formulario.css';

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const MODALIDADES = [
  { codigo: '', nome: 'Todas as modalidades' },
  { codigo: '1', nome: 'Dispensa de Licitação' },
  { codigo: '2', nome: 'Inexigibilidade' },
  { codigo: '3', nome: 'Pregão' },
  { codigo: '4', nome: 'Concorrência' },
  { codigo: '5', nome: 'Concurso' },
  { codigo: '6', nome: 'Leilão' },
  { codigo: '7', nome: 'Chamamento Público' },
  { codigo: '8', nome: 'Credenciamento' },
];

const TRIMESTRES = [
  { codigo: 1, nome: '1º Trimestre (Jan-Mar)' },
  { codigo: 2, nome: '2º Trimestre (Abr-Jun)' },
  { codigo: 3, nome: '3º Trimestre (Jul-Set)' },
  { codigo: 4, nome: '4º Trimestre (Out-Dez)' },
];

const ITENS_POR_PAGINA = 10;

function pad(n: number) { return String(n).padStart(2, '0'); }
function hoje() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function fmtMoney(v: number) {
  if (!v && v !== 0) return '-';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  if (!d) return '-';
  const m = String(d).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return d;
}
function fmtNum(n: number) {
  if (!n) return '-';
  return n.toLocaleString('pt-BR');
}

function Paginacao({ pagina, totalPaginas, onPagina }: { pagina: number; totalPaginas: number; onPagina: (p: number) => void }) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="estado-paginacao">
      <button className="pagina-btn" disabled={pagina === 0} onClick={() => onPagina(pagina - 1)}>◀</button>
      <span className="pagina-info">{pagina + 1} / {totalPaginas}</span>
      <button className="pagina-btn" disabled={pagina >= totalPaginas - 1} onClick={() => onPagina(pagina + 1)}>▶</button>
    </div>
  );
}

function usePaginacao(dados: any[], itensPorPagina = 10) {
  const [pagina, setPagina] = useState(0);
  const arr = dados || [];
  const totalPaginas = Math.max(1, Math.ceil(arr.length / itensPorPagina));
  const inicio = pagina * itensPorPagina;
  const paginaDados = arr.slice(inicio, inicio + itensPorPagina);
  return { pagina, setPagina, totalPaginas, paginaDados };
}

interface Municipio {
  id: number;
  nome: string;
}

interface FormularioPublicacaoProps {
  onIniciar?: (jobId: string, meta: Record<string, unknown>) => void;
  onResultados?: (dados: any[], meta: Record<string, unknown>) => void;
}

export default function FormularioPublicacao({ onIniciar, onResultados }: FormularioPublicacaoProps) {
  const dispatch = useAppDispatch();
  const [tipo, setTipo] = useState<string>('uf');
  const [uf, setUf] = useState('DF');
  const [codigoMunicipio, setCodigoMunicipio] = useState('');
  const [municipioNome, setMunicipioNome] = useState('');
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [codigoModalidade, setCodigoModalidade] = useState('');

  const [anoInput, setAnoInput] = useState(String(new Date().getFullYear()));
  const [trimestresSelecionados, setTrimestresSelecionados] = useState(new Set<number>());

  const [cache, setCache] = useState<Record<string, any[]>>({});
  const [chavesSelecionadas, setChavesSelecionadas] = useState(new Set<string>());
  const [emAndamento, setEmAndamento] = useState(false);
  const [progresso, setProgresso] = useState({ buscados: 0, total: 0 });
  const [erro, setErro] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const [popup, setPopup] = useState<any>(null);

  useEffect(() => {
    if (tipo === 'municipio' && uf) {
      carregarMunicipios(uf);
    }
  }, [tipo, uf]);

  async function carregarMunicipios(ufSigla: string) {
    setCarregandoMunicipios(true);
    setMunicipios([]);
    setCodigoMunicipio('');
    setMunicipioNome('');
    try {
      const data = await api.get<Municipio[]>(`${ENDPOINTS.IBGE_MUNICIPIOS}/${ufSigla}`);
      setMunicipios(data);
    } catch (err) {
      console.error('Erro ao carregar municipios:', err);
    }
    setCarregandoMunicipios(false);
  }

  function handleMunicipioChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const idx = e.target.value;
    if (idx === '') {
      setCodigoMunicipio('');
      setMunicipioNome('');
      return;
    }
    const mun = municipios[parseInt(idx)];
    if (mun) {
      setCodigoMunicipio(String(mun.id));
      setMunicipioNome(mun.nome);
    }
  }

  function toggleTrimestre(t: number) {
    setTrimestresSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function toggleChave(chave: string) {
    setChavesSelecionadas(prev => {
      const next = new Set(prev);
      if (next.has(chave)) next.delete(chave);
      else next.add(chave);
      return next;
    });
  }

  function removerChave(chave: string) {
    setCache(prev => {
      const next = { ...prev };
      delete next[chave];
      return next;
    });
    setChavesSelecionadas(prev => {
      const next = new Set(prev);
      next.delete(chave);
      return next;
    });
  }

  async function processarFilaSequencial(fila: string[], sels: number[]) {
    const collected: Record<string, any[]> = { ...cache };
    let anyFetched = false;

    for (const chave of fila) {
      if (cancelRef.current) break;

      const [a, s] = chave.split('-');
      const endp = tipo === 'municipio' && codigoMunicipio
        ? `${API_BASE_URL}/estado/${uf}/licitacoes/municipio/${codigoMunicipio}?ano=${a}&trimestre=${s}`
        : `${API_BASE_URL}/estado/${uf}/licitacoes?ano=${a}&trimestre=${s}`;

      try {
        const res = await fetch(endp);
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const data = await res.json();

        if (cancelRef.current) break;

        const arr = Array.isArray(data) ? data : [];
        collected[chave] = arr;
        anyFetched = true;
        setCache(prev => ({ ...prev, [chave]: arr }));
        setChavesSelecionadas(prev => new Set([...prev, chave]));
        setProgresso(prev => ({ ...prev, buscados: prev.buscados + 1 }));
      } catch (err: any) {
        if (cancelRef.current) break;
        setErro(err.message || `Erro no trimestre ${a}-T${s}`);
        setProgresso(prev => ({ ...prev, buscados: prev.buscados + 1 }));
        break;
      }
    }

    setEmAndamento(false);

    if (!cancelRef.current && anyFetched && onResultados) {
      const todos: any[] = [];
      const sorted = [...sels].sort();
      sorted.forEach(s => {
        const k = `${anoInput.trim()}-${s}`;
        if (collected[k]) todos.push(...collected[k]);
      });
      if (todos.length > 0) {
        onResultados(todos, {
          tipo: 'publicacao',
          uf,
          tipoBusca: tipo,
          codigoMunicipio,
          municipioNome,
          ano: anoInput.trim(),
          trimestres: sorted,
          codigoModalidade,
        });
      }
    }
  }

  function buscar() {
    const ano = anoInput.trim();
    if (!ano.match(/^\d{4}$/)) return;

    let sels = [...trimestresSelecionados];
    if (sels.length === 0) {
      sels = [1, 2, 3, 4];
      setTrimestresSelecionados(new Set(sels));
    }

    const fila = sels.map(s => `${ano}-${s}`).filter(k => !cache[k]);

    if (fila.length === 0) {
      const todos: any[] = [];
      sels.forEach(s => {
        const k = `${ano}-${s}`;
        if (cache[k]) todos.push(...cache[k]);
      });
      if (todos.length > 0 && onResultados) {
        onResultados(todos, {
          tipo: 'publicacao',
          uf,
          tipoBusca: tipo,
          codigoMunicipio,
          municipioNome,
          ano,
          trimestres: sels,
          codigoModalidade,
        });
      }
      return;
    }

    setEmAndamento(true);
    setProgresso({ buscados: 0, total: fila.length });
    setErro(null);
    cancelRef.current = false;
    processarFilaSequencial(fila, sels);
  }

  function cancelar() {
    cancelRef.current = true;
    setEmAndamento(false);
  }

  const exibicao = useMemo(() => {
    let dados: any[] = [];
    chavesSelecionadas.forEach(chave => {
      if (cache[chave]) {
        dados = dados.concat(cache[chave]);
      }
    });
    return dados;
  }, [cache, chavesSelecionadas]);

  const pag = usePaginacao(exibicao, ITENS_POR_PAGINA);

  const chartCategoria = useMemo(() => {
    if (!exibicao.length) return null;
    const data = exibicao.map(c => ({
      nome: c.categoriaProcesso?.nome || c.modalidadeNome || 'Sem categoria',
      valor: c.valorGlobal ?? c.valorTotalEstimado ?? 0,
    }));
    const grouped = new Map<string, number>();
    data.forEach(d => {
      grouped.set(d.nome, (grouped.get(d.nome) || 0) + d.valor);
    });
    return Array.from(grouped.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [exibicao]);

  const chartFaixa = useMemo(() => {
    if (!exibicao.length) return null;
    const faixas: Record<string, number> = {
      'Até R$ 5 mil': 0,
      'R$ 5 mil - R$ 20 mil': 0,
      'R$ 20 mil - R$ 50 mil': 0,
      'R$ 50 mil - R$ 100 mil': 0,
      'Acima de R$ 100 mil': 0,
    };
    exibicao.forEach(c => {
      const v = c.valorGlobal ?? c.valorTotalEstimado ?? 0;
      if (v < 5000) faixas['Até R$ 5 mil'] += v;
      else if (v < 20000) faixas['R$ 5 mil - R$ 20 mil'] += v;
      else if (v < 50000) faixas['R$ 20 mil - R$ 50 mil'] += v;
      else if (v < 100000) faixas['R$ 50 mil - R$ 100 mil'] += v;
      else faixas['Acima de R$ 100 mil'] += v;
    });
    return Object.entries(faixas)
      .filter(([_, v]) => v > 0)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [exibicao]);

  return (
    <div style={{ width: '100%' }}>
      <form className="card" onSubmit={(e) => { e.preventDefault(); buscar(); }}>
        <div className="tipo-busca-bar">
          <button
            type="button"
            className="tipo-busca-btn"
            onClick={() => dispatch(setTipoBusca('orgao'))}
          >
            Por CNPJ do Órgão
          </button>
          <button
            type="button"
            className="tipo-busca-btn ativo"
          >
            Por Estado/Município
          </button>
        </div>
        <h2>Busca por Estado/Município</h2>

        <div className="form-row">
          <div className="form-group required">
            <label>Tipo de Busca</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="uf">Por Estado (UF)</option>
              <option value="municipio">Por Município</option>
            </select>
          </div>
          <div className="form-group required">
            <label>UF</label>
            <select value={uf} onChange={(e) => setUf(e.target.value)}>
              {UFS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {tipo === 'municipio' && (
          <div className="form-group required">
            <label>Município</label>
            {carregandoMunicipios ? (
              <p className="form-status">Carregando municípios...</p>
            ) : municipios.length === 0 ? (
              <p className="form-status vazio">Nenhum município encontrado para {uf}.</p>
            ) : (
              <select value={municipios.findIndex(m => String(m.id) === codigoMunicipio)} onChange={handleMunicipioChange}>
                <option value="">Selecione um município</option>
                {municipios.map((m, i) => (
                  <option key={m.id} value={i}>{m.nome}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="form-group optional">
          <label htmlFor="modalidade">Modalidade</label>
          <select id="modalidade" value={codigoModalidade} onChange={(e) => setCodigoModalidade(e.target.value)}>
            {MODALIDADES.map((m) => (
              <option key={m.codigo} value={m.codigo}>{m.nome}</option>
            ))}
          </select>
        </div>

        <div className="form-group required">
          <label htmlFor="anoInput">Ano</label>
          <input
            id="anoInput"
            type="text"
            placeholder="2024"
            value={anoInput}
            onChange={e => setAnoInput(e.target.value)}
            maxLength={4}
            disabled={emAndamento}
          />
        </div>

        <div className="form-group">
          <label>Trimestre(s)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TRIMESTRES.map(t => (
              <button
                key={t.codigo}
                type="button"
                className={`ano-btn${trimestresSelecionados.has(t.codigo) ? ' ativo' : ''}`}
                onClick={() => toggleTrimestre(t.codigo)}
                disabled={emAndamento}
              >
                {t.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-accent"
            disabled={emAndamento || !anoInput.trim().match(/^\d{4}$/)}
          >
            {emAndamento ? 'Buscando...' : 'Buscar Licitações'}
          </button>
          {emAndamento && (
            <button type="button" className="btn btn-sm" onClick={cancelar} style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', color: 'var(--error)' }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

        {emAndamento && (
          <div className="progresso-card" style={{ marginTop: 16 }}>
            <div className="dm-carregando">
              <div className="spinner-sm" />
              <span>Progresso: {progresso.buscados} de {progresso.total} trimestre(s) buscado(s)</span>
            </div>
          </div>
        )}

      {erro && !emAndamento && (
        <div className="form-erro" style={{ marginTop: 12 }}>{erro}</div>
      )}

      {Object.keys(cache).length > 0 && (
        <div className="card resultados-card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Chaves buscadas:</span>
            {Object.keys(cache).sort().map(chave => (
              <span key={chave} className="ano-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 12, fontSize: '0.78rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                  <input type="checkbox" checked={chavesSelecionadas.has(chave)} onChange={() => toggleChave(chave)} style={{ margin: 0 }} />
                  {chave}
                </label>
                {!emAndamento && (
                  <button
                    onClick={() => removerChave(chave)}
                    title="Remover"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 0, lineHeight: 1 }}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          {exibicao.length > 0 && (
            <>
              <div className="chart-row">
                {chartCategoria && (
                  <div className="chart-card-sm">
                    <div className="chart-card-title">Valor por Categoria</div>
                    <PieChart data={chartCategoria} size={240} />
                  </div>
                )}
                {chartFaixa && (
                  <div className="chart-card-sm">
                    <div className="chart-card-title">Valor por Faixa (R$) - Total por Faixa</div>
                    <PieChart data={chartFaixa} size={240} />
                  </div>
                )}
              </div>

              <table className="estado-table">
                <thead>
                  <tr>
                    <th>Contrato</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Fornecedor</th>
                    <th>Objeto</th>
                    <th>Vigência</th>
                    <th>Data Publ.</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {pag.paginaDados.map((c, i) => (
                    <tr
                      key={c.numeroControlePNCP || i}
                      className="dm-row-click"
                      onClick={() => setPopup(c)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                        {(c.numeroControlePNCP || '').slice(-12)}
                      </td>
                      <td>{c.tipoContrato?.nome || c.modalidadeNome || '-'}</td>
                      <td>{c.categoriaProcesso?.nome || c.modalidadeNome || '-'}</td>
                      <td>{c.fornecedor?.razaoSocial || c.nomeRazaoSocialFornecedor || '-'}</td>
                      <td className="dm-obj-col">{(c.objetoContrato || '').substring(0, 60)}{(c.objetoContrato || '').length > 60 ? '…' : ''}</td>
                      <td style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{fmtDate(c.dataVigenciaInicio)} ~ {fmtDate(c.dataVigenciaFim)}</td>
                      <td style={{ fontSize: '0.7rem' }}>{fmtDate(c.dataPublicacaoPncp)}</td>
                      <td>{fmtMoney(c.valorGlobal ?? c.valorTotalEstimado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Paginacao pagina={pag.pagina} totalPaginas={pag.totalPaginas} onPagina={pag.setPagina} />
              <p className="dm-hint">Clique em um contrato para ver detalhes completos</p>
            </>
          )}

          {exibicao.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum dado encontrado para as chaves selecionadas
            </div>
          )}
        </div>
      )}

      {Object.keys(cache).length === 0 && !emAndamento && (
        <p style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          Insira um ano, selecione os trimestres e clique em Buscar Licitações
        </p>
      )}

      {popup && (
        <JanelaPopup titulo={`Licitação ${(popup.numeroControlePNCP || '').slice(-12)}`} onFechar={() => setPopup(null)}>
          <ContratoDetalhes contrato={popup} onIdClick={() => {}} />
        </JanelaPopup>
      )}
    </div>
  );
}
