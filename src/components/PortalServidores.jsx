import { useState, useCallback, useRef, useEffect } from 'react';
import API_BASE_URL from '../config';

export default function PortalServidores({
  onFechar, onIdClick, resultItem, onPTSearchComplete,
}) {
  const [tipoBusca, setTipoBusca] = useState('geral');
  const [cpf, setCpf] = useState('');
  const [codigoOrgao, setCodigoOrgao] = useState('');
  const [nomeOrgao, setNomeOrgao] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [orgaosSugestoes, setOrgaosSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [buscandoOrgaos, setBuscandoOrgaos] = useState(false);
  const debounceRef = useRef(null);
  const sugestoesRef = useRef(null);

  useEffect(() => {
    const handleClickFora = (e) => {
      if (sugestoesRef.current && !sugestoesRef.current.contains(e.target)) {
        setMostrarSugestoes(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const handleNomeOrgaoChange = useCallback((valor) => {
    setNomeOrgao(valor);
    setCodigoOrgao('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (valor.length < 2) {
      setOrgaosSugestoes([]);
      setMostrarSugestoes(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setBuscandoOrgaos(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/portal-transparencia/orgaos/siape?nomeOrgao=${encodeURIComponent(valor.toUpperCase())}`);
        if (resp.ok) {
          const json = await resp.json();
          const validos = Array.isArray(json)
            ? json.filter(org => {
                const nome = (org.descricao || '').toUpperCase();
                return nome && !nome.startsWith('EXC -') && !nome.startsWith('IGNORADO') && !nome.startsWith('CODIGO INVALIDO');
              }).slice(0, 10)
            : [];
          setOrgaosSugestoes(validos);
          setMostrarSugestoes(validos.length > 0);
        }
      } catch {
        setOrgaosSugestoes([]);
      }
      setBuscandoOrgaos(false);
    }, 300);
  }, []);

  const handleSelecionarOrgao = useCallback((orgao) => {
    const codigo = orgao.codigo || '';
    setNomeOrgao(orgao.descricao || '');
    setCodigoOrgao(codigo);
    setOrgaosSugestoes([]);
    setMostrarSugestoes(false);
  }, []);

  const handleBuscar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/portal-transparencia/servidores';
      const params = new URLSearchParams();
      
      if (tipoBusca === 'por-cpf' && cpf) {
        params.append('cpf', cpf);
      } else if (tipoBusca === 'por-orgao' && codigoOrgao) {
        params.append('orgaoServidorLotacao', codigoOrgao);
      } else if (tipoBusca === 'geral') {
        if (nome) params.append('nome', nome);
        if (cpf) params.append('cpf', cpf);
      }
      
      const resp = await fetch(`${API_BASE_URL}${endpoint}?${params}`);
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.erro || `Erro na busca (${resp.status})`);
      }
      const json = await resp.json();
      setResultados(Array.isArray(json) ? json : [json].filter(Boolean));
      onPTSearchComplete?.('servidores', { tipoBusca, cpf, codigoOrgao, nome, nomeOrgao }, Array.isArray(json) ? json : [json].filter(Boolean));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [tipoBusca, cpf, codigoOrgao, nome, nomeOrgao, onPTSearchComplete]);

  if (resultItem) {
    const dados = Array.isArray(resultItem.data) ? resultItem.data : [resultItem.data].filter(Boolean);
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Servidores</h2>
          <span className="rp-desc">{dados.length} resultado{dados.length !== 1 ? 's' : ''}</span>
          <div className="rp-topo-actions">
            <button className="btn btn-sm" onClick={onFechar}>Voltar</button>
          </div>
        </div>
        <div className="rp-result">
          <div className="bcard-grid">
            {dados.map((item, idx) => {
              const srv = item.servidor || item;
              return (
                <div key={idx} className="bcard">
                  <div className="bcard-body">
                    <div className="bcard-field">
                      <span className="bcard-label">Nome</span>
                      <span className="bcard-value">{srv.pessoa?.nome || srv.nome || '-'}</span>
                    </div>
                    <div className="bcard-field">
                      <span className="bcard-label">CPF</span>
                      <span className="bcard-value">{srv.pessoa?.cpfFormatado || srv.cpf || '-'}</span>
                    </div>
                    {srv.funcao?.descricaoFuncaoCargo && (
                      <div className="bcard-field">
                        <span className="bcard-label">Cargo/Função</span>
                        <span className="bcard-value">{srv.funcao.descricaoFuncaoCargo}</span>
                      </div>
                    )}
                    {(srv.orgaoServidorLotacao?.nome || srv.orgaoServidorExercicio?.nome) && (
                      <div className="bcard-field">
                        <span className="bcard-label">Órgão</span>
                        <span className="bcard-value">{srv.orgaoServidorLotacao?.nome || srv.orgaoServidorExercicio?.nome}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {dados.length === 0 && <p className="rp-empty">Nenhum resultado encontrado.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rp-section">
      <div className="rp-topo">
        <h2>Servidores</h2>
        <span className="rp-desc">Buscar servidores públicos</span>
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <select value={tipoBusca} onChange={e => setTipoBusca(e.target.value)} className="rp-search-input">
            <option value="geral">Busca Geral</option>
            <option value="por-cpf">Por CPF</option>
            <option value="por-orgao">Por Órgão</option>
          </select>
        </div>
        <div className="rp-search-row bfilter-row">
          {tipoBusca === 'por-cpf' && (
            <input 
              type="text" 
              value={cpf} 
              onChange={e => setCpf(e.target.value)} 
              className="rp-search-input" 
              placeholder="CPF do servidor" 
            />
          )}
          {tipoBusca === 'por-orgao' && (
            <div className="rp-autocomplete" ref={sugestoesRef}>
              <input 
                type="text"
                value={nomeOrgao}
                onChange={e => handleNomeOrgaoChange(e.target.value)}
                className="rp-search-input"
                placeholder="Nome do órgão"
              />
              {buscandoOrgaos && <span className="rp-autocomplete-loading">...</span>}
              {mostrarSugestoes && orgaosSugestoes.length > 0 && (
                <ul className="rp-autocomplete-suggestions">
                  {orgaosSugestoes.map((org, i) => (
                    <li
                      key={i}
                      className="rp-autocomplete-item"
                      onMouseDown={() => handleSelecionarOrgao(org)}
                    >
                      <span className="rp-autocomplete-nome">{org.descricao}</span>
                      <span className="rp-autocomplete-codigo">{org.codigo || org.cnpj || '-'}</span>
                    </li>
                  ))}
                </ul>
              )}
              {mostrarSugestoes && orgaosSugestoes.length === 0 && !buscandoOrgaos && nomeOrgao.length >= 2 && (
                <div className="rp-autocomplete-suggestions">
                  <div className="rp-autocomplete-empty">Nenhum órgão encontrado</div>
                </div>
              )}
            </div>
          )}
          {tipoBusca === 'por-orgao' && (
            <input 
              type="text" 
              value={codigoOrgao} 
              onChange={e => setCodigoOrgao(e.target.value)} 
              className="rp-search-input" 
              placeholder="Código do órgão" 
            />
          )}
          {tipoBusca === 'geral' && (
            <>
              <input 
                type="text" 
                value={nome} 
                onChange={e => setNome(e.target.value)} 
                className="rp-search-input" 
                placeholder="Nome do servidor" 
              />
              <input 
                type="text" 
                value={cpf} 
                onChange={e => setCpf(e.target.value)} 
                className="rp-search-input" 
                placeholder="CPF (opcional)" 
              />
            </>
          )}
          <button className="btn btn-sm" onClick={handleBuscar} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && <p className="rp-error">{error}</p>}
      </div>
      
      {resultados.length > 0 ? (
        <div className="rp-result">
          <div className="bcard-grid">
            {resultados.map((item, idx) => {
              const srv = item.servidor || item;
              return (
                <div key={idx} className="bcard">
                  <div className="bcard-body">
                    <div className="bcard-field">
                      <span className="bcard-label">Nome</span>
                      <span className="bcard-value">{srv.pessoa?.nome || srv.nome || '-'}</span>
                    </div>
                    <div className="bcard-field">
                      <span className="bcard-label">CPF</span>
                      <span className="bcard-value">{srv.pessoa?.cpfFormatado || srv.cpf || '-'}</span>
                    </div>
                    {srv.funcao?.descricaoFuncaoCargo && (
                      <div className="bcard-field">
                        <span className="bcard-label">Cargo/Função</span>
                        <span className="bcard-value">{srv.funcao.descricaoFuncaoCargo}</span>
                      </div>
                    )}
                    {(srv.orgaoServidorLotacao?.nome || srv.orgaoServidorExercicio?.nome) && (
                      <div className="bcard-field">
                        <span className="bcard-label">Órgão</span>
                        <span className="bcard-value">{srv.orgaoServidorLotacao?.nome || srv.orgaoServidorExercicio?.nome}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !loading && resultados.length === 0 && codigoOrgao && (
          <div className="rp-result">
            <p className="rp-empty">Nenhum resultado encontrado.</p>
          </div>
        )
      )}
      
    </div>
  );
}
