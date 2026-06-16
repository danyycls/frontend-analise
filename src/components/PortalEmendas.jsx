import { useState, useCallback } from 'react';
import API_BASE_URL from '../config';

export default function PortalEmendas({
  onFechar, onIdClick, resultItem, onPTSearchComplete,
}) {
  const [codigoEmenda, setCodigoEmenda] = useState('');
  const [numeroEmenda, setNumeroEmenda] = useState('');
  const [nomeAutor, setNomeAutor] = useState('');
  const [tipoEmenda, setTipoEmenda] = useState('');
  const [ano, setAno] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultados, setResultados] = useState([]);

  const handleBuscar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('pagina', '1');
      if (codigoEmenda) params.append('codigoEmenda', codigoEmenda);
      if (numeroEmenda) params.append('numeroEmenda', numeroEmenda);
      if (nomeAutor) params.append('nomeAutor', nomeAutor);
      if (tipoEmenda) params.append('tipoEmenda', tipoEmenda);
      if (ano) params.append('ano', ano);
      
      const resp = await fetch(`${API_BASE_URL}/portal-transparencia/emendas?${params}`);
      if (!resp.ok) throw new Error('Erro na busca');
      const json = await resp.json();
      setResultados(json || []);
      onPTSearchComplete?.('emendas', { codigoEmenda, numeroEmenda, nomeAutor, tipoEmenda, ano }, json);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [codigoEmenda, numeroEmenda, nomeAutor, tipoEmenda, ano, onPTSearchComplete]);

  if (resultItem) {
    const dados = resultItem.data || [];
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Emendas</h2>
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
                    <span className="bcard-label">Código</span>
                    <span className="bcard-value">{item.codigoEmenda || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Número</span>
                    <span className="bcard-value">{item.numeroEmenda || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Autor</span>
                    <span className="bcard-value">{item.nomeAutor || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Tipo</span>
                    <span className="bcard-value">{item.tipoEmenda || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Ano</span>
                    <span className="bcard-value">{item.ano || '-'}</span>
                  </div>
                  {item.valor && (
                    <div className="bcard-field">
                      <span className="bcard-label">Valor</span>
                      <span className="bcard-value">{`R$ ${item.valor}`}</span>
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

  return (
    <div className="rp-section">
      <div className="rp-topo">
        <h2>Emendas</h2>
        <span className="rp-desc">Buscar emendas parlamentares</span>
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <input 
            type="text" 
            value={codigoEmenda} 
            onChange={e => setCodigoEmenda(e.target.value)} 
            className="rp-search-input" 
            placeholder="Código da emenda" 
          />
          <input 
            type="text" 
            value={numeroEmenda} 
            onChange={e => setNumeroEmenda(e.target.value)} 
            className="rp-search-input" 
            placeholder="Número da emenda" 
          />
          <input 
            type="text" 
            value={nomeAutor} 
            onChange={e => setNomeAutor(e.target.value)} 
            className="rp-search-input" 
            placeholder="Nome do autor" 
          />
        </div>
        <div className="rp-search-row bfilter-row">
          <select value={tipoEmenda} onChange={e => setTipoEmenda(e.target.value)} className="rp-search-input">
            <option value="">Todos os tipos</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="BANCADA">Bancada</option>
            <option value="COMISSAO">Comissão</option>
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
                    <span className="bcard-label">Código</span>
                    <span className="bcard-value">{item.codigoEmenda || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Número</span>
                    <span className="bcard-value">{item.numeroEmenda || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Autor</span>
                    <span className="bcard-value">{item.nomeAutor || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Tipo</span>
                    <span className="bcard-value">{item.tipoEmenda || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Ano</span>
                    <span className="bcard-value">{item.ano || '-'}</span>
                  </div>
                  {item.valor && (
                    <div className="bcard-field">
                      <span className="bcard-label">Valor</span>
                      <span className="bcard-value">{`R$ ${item.valor}`}</span>
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
