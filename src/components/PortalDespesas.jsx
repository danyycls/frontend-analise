import { useState, useCallback } from 'react';
import API_BASE_URL from '../config';

export default function PortalDespesas({
  onFechar, onIdClick, resultItem, onPTSearchComplete,
}) {
  const [tipoBusca, setTipoBusca] = useState('recursos-recebidos');
  const [ano, setAno] = useState('');
  const [codigoOrgao, setCodigoOrgao] = useState('');
  const [nomeFavorecido, setNomeFavorecido] = useState('');
  const [uf, setUf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultados, setResultados] = useState([]);

  const handleBuscar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/portal-transparencia/despesas/recursos-recebidos';
      const params = new URLSearchParams();
      params.append('pagina', '1');
      
      if (tipoBusca === 'recursos-recebidos') {
        if (ano) {
          params.append('mesAnoInicio', `${ano}-01`);
          params.append('mesAnoFim', `${ano}-12`);
        }
        if (nomeFavorecido) params.append('nomeFavorecido', nomeFavorecido);
        if (uf) params.append('uf', uf);
      } else if (tipoBusca === 'por-orgao') {
        endpoint = '/portal-transparencia/despesas/por-orgao';
        if (ano) params.append('ano', ano);
        if (codigoOrgao) params.append('orgao', codigoOrgao);
      }
      
      const resp = await fetch(`${API_BASE_URL}${endpoint}?${params}`);
      if (!resp.ok) throw new Error('Erro na busca');
      const json = await resp.json();
      setResultados(Array.isArray(json) ? json : [json].filter(Boolean));
      onPTSearchComplete?.('despesas', { tipoBusca, ano, codigoOrgao, nomeFavorecido, uf }, Array.isArray(json) ? json : [json].filter(Boolean));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [tipoBusca, ano, codigoOrgao, nomeFavorecido, uf, onPTSearchComplete]);

  if (resultItem) {
    const dados = Array.isArray(resultItem.data) ? resultItem.data : [resultItem.data].filter(Boolean);
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Despesas</h2>
          <span className="rp-desc">{dados.length} resultado{dados.length !== 1 ? 's' : ''}</span>
          <div className="rp-topo-actions">
            <button className="btn btn-sm" onClick={onFechar}>Voltar</button>
          </div>
        </div>
        <div className="rp-result">
          <div className="bcard-grid">
            {dados.map((item, idx) => (
              <div key={idx} className="bcard">
                <div className="bcard-body">
                  <div className="bcard-field">
                    <span className="bcard-label">Favorecido</span>
                    <span className="bcard-value">{item.nomeFavorecido || item.favorecido || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Valor</span>
                    <span className="bcard-value">{item.valor ? `R$ ${item.valor}` : '-'}</span>
                  </div>
                  {item.ano && (
                    <div className="bcard-field">
                      <span className="bcard-label">Ano</span>
                      <span className="bcard-value">{item.ano}</span>
                    </div>
                  )}
                  {item.orgao && (
                    <div className="bcard-field">
                      <span className="bcard-label">Órgão</span>
                      <span className="bcard-value">{item.orgao}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {dados.length === 0 && <p className="rp-empty">Nenhum resultado encontrado.</p>}
        </div>
      </div>
    );
  }

  const UFS_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  return (
    <div className="rp-section">
      <div className="rp-topo">
        <h2>Despesas</h2>
        <span className="rp-desc">Buscar despesas governamentais</span>
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <select value={tipoBusca} onChange={e => setTipoBusca(e.target.value)} className="rp-search-input">
            <option value="recursos-recebidos">Recursos Recebidos</option>
            <option value="por-orgao">Por Órgão</option>
          </select>
          <input 
            type="number" 
            value={ano} 
            onChange={e => setAno(e.target.value)} 
            className="rp-search-input" 
            placeholder="Ano" 
            min="2000"
            max="2030"
          />
        </div>
        <div className="rp-search-row bfilter-row">
          {tipoBusca === 'recursos-recebidos' && (
            <>
              <input 
                type="text" 
                value={nomeFavorecido} 
                onChange={e => setNomeFavorecido(e.target.value)} 
                className="rp-search-input" 
                placeholder="Nome do favorecido" 
              />
              <select value={uf} onChange={e => setUf(e.target.value)} className="rp-search-input">
                <option value="">Todas as UF</option>
                {UFS_LIST.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </>
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
          <button className="btn btn-sm" onClick={handleBuscar} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && <p className="rp-error">{error}</p>}
      </div>
      
      {resultados.length > 0 && (
        <div className="rp-result">
          <div className="bcard-grid">
            {resultados.map((item, idx) => (
              <div key={idx} className="bcard">
                <div className="bcard-body">
                  <div className="bcard-field">
                    <span className="bcard-label">Favorecido</span>
                    <span className="bcard-value">{item.nomeFavorecido || item.favorecido || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Valor</span>
                    <span className="bcard-value">{item.valor ? `R$ ${item.valor}` : '-'}</span>
                  </div>
                  {item.ano && (
                    <div className="bcard-field">
                      <span className="bcard-label">Ano</span>
                      <span className="bcard-value">{item.ano}</span>
                    </div>
                  )}
                  {item.orgao && (
                    <div className="bcard-field">
                      <span className="bcard-label">Órgão</span>
                      <span className="bcard-value">{item.orgao}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
