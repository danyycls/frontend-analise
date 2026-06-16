import { useState, useCallback } from 'react';
import API_BASE_URL from '../config';

export default function PortalOrgaos({
  onFechar, onIdClick, resultItem, onPTSearchComplete,
}) {
  const [tipo, setTipo] = useState('siape');
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultados, setResultados] = useState([]);

  const handleBuscar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = tipo === 'siape' 
        ? '/portal-transparencia/orgaos/siape' 
        : '/portal-transparencia/orgaos/siafi';
      
      const params = new URLSearchParams();
      if (codigo) params.append('codigoOrgao', codigo);
      if (nome) params.append('nomeOrgao', nome);
      
      const resp = await fetch(`${API_BASE_URL}${endpoint}?${params}`);
      if (!resp.ok) throw new Error('Erro na busca');
      const json = await resp.json();
      setResultados(json || []);
      onPTSearchComplete?.('orgaos', { tipo, codigo, nome }, json);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [tipo, codigo, nome, onPTSearchComplete]);

  if (resultItem) {
    const dados = resultItem.data || [];
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Órgãos</h2>
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
                    <span className="bcard-value">{item.codigo || item.codOrgao || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Nome</span>
                    <span className="bcard-value">{item.descricao || item.nome || item.nomeOrgao || '-'}</span>
                  </div>
                  {item.sigla && (
                    <div className="bcard-field">
                      <span className="bcard-label">Sigla</span>
                      <span className="bcard-value">{item.sigla}</span>
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
        <h2>Órgãos</h2>
        <span className="rp-desc">Buscar órgãos públicos (SIAPE/SIAFI)</span>
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="rp-search-input">
            <option value="siape">SIAPE</option>
            <option value="siafi">SIAFI</option>
          </select>
          <input 
            type="text" 
            value={codigo} 
            onChange={e => setCodigo(e.target.value)} 
            className="rp-search-input" 
            placeholder="Código do órgão" 
          />
          <input 
            type="text" 
            value={nome} 
            onChange={e => setNome(e.target.value)} 
            className="rp-search-input" 
            placeholder="Nome do órgão" 
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
                    <span className="bcard-value">{item.codigo || item.codOrgao || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Nome</span>
                    <span className="bcard-value">{item.descricao || item.nome || item.nomeOrgao || '-'}</span>
                  </div>
                  {item.sigla && (
                    <div className="bcard-field">
                      <span className="bcard-label">Sigla</span>
                      <span className="bcard-value">{item.sigla}</span>
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
