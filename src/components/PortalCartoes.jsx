import { useState, useCallback } from 'react';
import API_BASE_URL from '../config';

export default function PortalCartoes({
  onFechar, onIdClick, resultItem, onPTSearchComplete,
}) {
  const [codigoOrgao, setCodigoOrgao] = useState('');
  const [cpfPortador, setCpfPortador] = useState('');
  const [cnpjFavorecido, setCnpjFavorecido] = useState('');
  const [tipoCartao, setTipoCartao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultados, setResultados] = useState([]);

  const handleBuscar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('pagina', '1');
      if (codigoOrgao) params.append('codigoOrgao', codigoOrgao);
      if (cpfPortador) params.append('cpfPortador', cpfPortador);
      if (cnpjFavorecido) params.append('cpfCnpjFavorecido', cnpjFavorecido);
      if (tipoCartao) params.append('tipoCartao', tipoCartao);
      if (dataInicio) params.append('dataTransacaoInicio', dataInicio);
      if (dataFim) params.append('dataTransacaoFim', dataFim);
      
      const resp = await fetch(`${API_BASE_URL}/portal-transparencia/cartoes?${params}`);
      if (!resp.ok) throw new Error('Erro na busca');
      const json = await resp.json();
      setResultados(json || []);
      onPTSearchComplete?.('cartoes', { codigoOrgao, cpfPortador, cnpjFavorecido, tipoCartao, dataInicio, dataFim }, json);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [codigoOrgao, cpfPortador, cnpjFavorecido, tipoCartao, dataInicio, dataFim, onPTSearchComplete]);

  if (resultItem) {
    const dados = resultItem.data || [];
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Cartões</h2>
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
                    <span className="bcard-label">Portador</span>
                    <span className="bcard-value">{item.nomePortador || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Favorecido</span>
                    <span className="bcard-value">{item.nomeFavorecido || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Valor</span>
                    <span className="bcard-value">{item.valorTransacao ? `R$ ${item.valorTransacao}` : '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Data</span>
                    <span className="bcard-value">{item.dataTransacao || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {dados.length === 0 && <p className="rp-empty">Nenhum resultado encontrado.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rp-section">
      <div className="rp-topo">
        <h2>Cartões</h2>
        <span className="rp-desc">Buscar transações de cartões de pagamento</span>
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <input 
            type="text" 
            value={codigoOrgao} 
            onChange={e => setCodigoOrgao(e.target.value)} 
            className="rp-search-input" 
            placeholder="Código do órgão" 
          />
          <input 
            type="text" 
            value={cpfPortador} 
            onChange={e => setCpfPortador(e.target.value)} 
            className="rp-search-input" 
            placeholder="CPF do portador" 
          />
          <input 
            type="text" 
            value={cnpjFavorecido} 
            onChange={e => setCnpjFavorecido(e.target.value)} 
            className="rp-search-input" 
            placeholder="CNPJ do favorecido" 
          />
        </div>
        <div className="rp-search-row bfilter-row">
          <select value={tipoCartao} onChange={e => setTipoCartao(e.target.value)} className="rp-search-input">
            <option value="">Todos os tipos</option>
            <option value="Corporate">Corporate</option>
            <option value="Compras">Compras</option>
          </select>
          <input 
            type="date" 
            value={dataInicio} 
            onChange={e => setDataInicio(e.target.value)} 
            className="rp-search-input" 
          />
          <input 
            type="date" 
            value={dataFim} 
            onChange={e => setDataFim(e.target.value)} 
            className="rp-search-input" 
          />
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
                    <span className="bcard-label">Portador</span>
                    <span className="bcard-value">{item.nomePortador || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Favorecido</span>
                    <span className="bcard-value">{item.nomeFavorecido || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Valor</span>
                    <span className="bcard-value">{item.valorTransacao ? `R$ ${item.valorTransacao}` : '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Data</span>
                    <span className="bcard-value">{item.dataTransacao || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
