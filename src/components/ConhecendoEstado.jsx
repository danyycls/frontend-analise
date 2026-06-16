import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API_BASE_URL, { WS_BASE_URL } from '../config';
import DetalheMunicipio from './DetalheMunicipio';
import './ConhecendoEstado.css';
import './AnaliseDeputados.css';

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

  useEffect(() => {
    if (!deputado) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/camara/deputados/${deputado.id}/completo`)
      .then(r => r.json())
      .then(data => { setDados(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [deputado]);

  if (loading) return <div className="estado-detalhe-loading"><div className="spinner" /> Carregando detalhes...</div>;

  const dep = dados?.deputado || dados;
  if (!dep) return null;

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
      <div className="ad-info-grid">
        <div className="ad-info-item">
          <span className="ad-info-label">Nome Civil</span>
          <span className="ad-info-value">{dep.nomeCivil || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">CPF</span>
          <span className="ad-info-value">{fmtDoc(dep.cpf)}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Partido</span>
          <span className="ad-info-value">{u.siglaPartido || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">UF</span>
          <span className="ad-info-value">{u.siglaUf || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Data Nascimento</span>
          <span className="ad-info-value">{dep.dataNascimento || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Sexo</span>
          <span className="ad-info-value">{dep.sexo || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Escolaridade</span>
          <span className="ad-info-value">{dep.escolaridade || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Email</span>
          <span className="ad-info-value">{u.email || '-'}</span>
        </div>
      </div>
    </div>
  );
}

function DetalheSenador({ senador, onFechar }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!senador) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/senado/senadores/${senador.codigo}/completo`)
      .then(r => r.json())
      .then(data => { setDados(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [senador]);

  if (loading) return <div className="estado-detalhe-loading"><div className="spinner" /> Carregando detalhes...</div>;

  const sen = dados?.senador || dados;
  if (!sen) return null;

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
      <div className="ad-info-grid">
        <div className="ad-info-item">
          <span className="ad-info-label">Nome Completo</span>
          <span className="ad-info-value">{ident.NomeCompletoParlamentar || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Partido</span>
          <span className="ad-info-value">{ident.SiglaPartidoParlamentar || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">UF</span>
          <span className="ad-info-value">{ident.UfParlamentar || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Data Nascimento</span>
          <span className="ad-info-value">{basico.DataNascimento || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Naturalidade</span>
          <span className="ad-info-value">{basico.Naturalidade || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Email</span>
          <span className="ad-info-value">{ident.EmailParlamentar || '-'}</span>
        </div>
      </div>
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

  const [finSecoes, setFinSecoes] = useState({});
  const finRef = useRef({});
  const finConcluidoRef = useRef(false);

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
    finRef.current = {};
    finConcluidoRef.current = false;

    const wsUrl = `${WS_BASE_URL}/estado/${uf}/financeiro/stream`;
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
  }, [uf]);

  if (depDetalhe) {
    return (
      <div className="estado-page">
        <DetalheDeputado deputado={depDetalhe} onFechar={() => setDepDetalhe(null)} />
      </div>
    );
  }

  if (senDetalhe) {
    return (
      <div className="estado-page">
        <DetalheSenador senador={senDetalhe} onFechar={() => setSenDetalhe(null)} />
      </div>
    );
  }

  if (municipioDetalhe) {
    return (
      <div className="estado-page">
        <DetalheMunicipio
          municipio={municipioDetalhe}
          uf={uf}
          onFechar={() => setMunicipioDetalhe(null)}
        />
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
        <>
          {listaVereadores.length > 0 && <TabelaCandidatos dados={listaVereadores} titulo="Vereadores Eleitos" />}
          {listaPrefeitos.length > 0 && <TabelaCandidatos dados={listaPrefeitos} titulo="Prefeitos Eleitos" />}
          {listaVice.length > 0 && <TabelaCandidatos dados={listaVice} titulo="Vice-Prefeitos Eleitos" />}

          {listaVereadores.length === 0 && listaPrefeitos.length === 0 && listaVice.length === 0 && (
            <div className="estado-section">
              <h2>Candidatos Eleitos <span className="count">(0)</span></h2>
              <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum candidato encontrado para esta UF</p>
            </div>
          )}
        </>
      ) : (
        <div className="estado-section">
          <h2>Candidatos Eleitos <span className="count">(...)</span></h2>
          <div className="municipios-loading">Carregando vereadores, prefeitos e vice-prefeitos...</div>
        </div>
      )}

      <div className="estado-section">
        <h2>Deputados Federais <span className="count">({listaDeputados.length})</span></h2>
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
      </div>

      <div className="estado-section">
        <h2>Senadores <span className="count">({listaSenadores.length})</span></h2>
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
      </div>

      {finDespesaPessoal && (
        <div className="estado-section">
          <h2>Despesa com Pessoal <span className="count">(Executivo)</span></h2>
          <div className="dm-cards">
            <FinCard label="Total Despesa Pessoal" value={fmtMoney(finDespesaPessoal.valor_total)} />
            <FinCard label="% da RCL" value={fmtNum(finDespesaPessoal.percentual_rcl) + '%'} />
            <FinCard label="Exercício" value={finDespesaPessoal.periodo} />
          </div>
        </div>
      )}

      {finDespesaCategoria && finDespesaCategoria.length > 0 && (
        <div className="estado-section">
          <h2>Despesa com Pessoal por Categoria <span className="count">({finDespesaCategoria.length})</span></h2>
          <table className="estado-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Despesa Total</th>
              </tr>
            </thead>
            <tbody>
              {finDespesaCategoria.map((c, i) => (
                <tr key={i}>
                  <td>{c.categoria || '-'}</td>
                  <td>{fmtMoney(c.despesa_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {finGastosFuncao && finGastosFuncao.length > 0 && (
        <div className="estado-section">
          <h2>Gastos por Função <span className="count">({finGastosFuncao.length})</span></h2>
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
        </div>
      )}

      {finReceitas && finReceitas.length > 0 && (
        <div className="estado-section">
          <h2>Receitas <span className="count">({finReceitas.length})</span></h2>
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
        </div>
      )}

      {finRecursosFed && finRecursosFed.length > 0 && (
        <div className="estado-section">
          <h2>Recursos Federais Recebidos <span className="count">({finRecursosFed.length})</span></h2>
          <table className="estado-table">
            <thead>
              <tr>
                <th>Favorecido</th>
                <th>Órgão Superior</th>
                <th>Mês/Ano</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {finRecursosFed.map((rf, i) => (
                <tr key={i}>
                  <td>{rf.nome_pessoa || '-'}</td>
                  <td>{rf.nome_orgao_superior || '-'}</td>
                  <td>{fmtMesAno(rf.mes_ano)}</td>
                  <td>{fmtMoney(rf.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="estado-section">
        <h2>Municípios <span className="count">({municipios.length} no total)</span></h2>
        {basico ? (
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
        )}
      </div>
    </div>
  );
}
