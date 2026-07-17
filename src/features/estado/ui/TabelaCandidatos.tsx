import { useState, useEffect } from 'react';
import { SearchAutocomplete } from './SearchAutocomplete';

const ITENS_POR_PAGINA = 10;

interface TabelaCandidatosProps {
  dados: any[];
  titulo?: string;
  semSecao?: boolean;
}

export function TabelaCandidatos({ dados, titulo, semSecao }: TabelaCandidatosProps) {
  const [situacaoAtiva, setSituacaoAtiva] = useState<string | null>(null);
  const [tipoAtivo, setTipoAtivo] = useState('TODAS');
  const [anoFiltro, setAnoFiltro] = useState<number | null>(null);
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
                {t === 'TODAS' ? 'TodAS' : t.charAt(0) + t.slice(1).toLowerCase()}
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
