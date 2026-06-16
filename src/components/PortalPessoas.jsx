import { useState, useCallback } from 'react';
import API_BASE_URL from '../config';

export default function PortalPessoas({
  onFechar, onIdClick, resultItem, onPTSearchComplete,
}) {
  const [tipo, setTipo] = useState('fisica');
  const [documento, setDocumento] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultados, setResultados] = useState([]);

  const handleBuscar = useCallback(async () => {
    if (!documento) { setError('Digite um CPF ou CNPJ'); return; }
    setLoading(true);
    setError(null);
    try {
      const endpoint = tipo === 'fisica' 
        ? '/portal-transparencia/pessoas/fisica' 
        : '/portal-transparencia/pessoas/juridica';
      
      const params = new URLSearchParams();
      if (tipo === 'fisica' && documento) params.append('cpf', documento);
      if (tipo === 'juridica' && documento) params.append('cnpj', documento);
      if (nome) params.append('nome', nome);
      
      const resp = await fetch(`${API_BASE_URL}${endpoint}?${params}`);
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.erro || `Erro na busca (${resp.status})`);
      }
      const json = await resp.json();
      setResultados(Array.isArray(json) ? json : [json].filter(Boolean));
      onPTSearchComplete?.('pessoas', { tipo, documento, nome }, Array.isArray(json) ? json : [json].filter(Boolean));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [tipo, documento, nome, onPTSearchComplete]);

  if (resultItem) {
    const dados = Array.isArray(resultItem.data) ? resultItem.data : [resultItem.data].filter(Boolean);
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Pessoas</h2>
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
                    <span className="bcard-label">Nome</span>
                    <span className="bcard-value">{item.nome || item.nomeRazaoSocial || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Documento</span>
                    <span className="bcard-value">{item.cpf || item.cnpj || '-'}</span>
                  </div>
                  {item.sexo && (
                    <div className="bcard-field">
                      <span className="bcard-label">Sexo</span>
                      <span className="bcard-value">{item.sexo}</span>
                    </div>
                  )}
                  {item.situacao && (
                    <div className="bcard-field">
                      <span className="bcard-label">Situação</span>
                      <span className="bcard-value">{item.situacao}</span>
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
        <h2>Pessoas</h2>
        <span className="rp-desc">Buscar pessoas físicas ou jurídicas</span>
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="rp-search-input">
            <option value="fisica">Pessoa Física (CPF)</option>
            <option value="juridica">Pessoa Jurídica (CNPJ)</option>
          </select>
          <input 
            type="text" 
            value={documento} 
            onChange={e => setDocumento(e.target.value)} 
            className="rp-search-input" 
            placeholder={tipo === 'fisica' ? 'CPF' : 'CNPJ'}
          />
          <input 
            type="text" 
            value={nome} 
            onChange={e => setNome(e.target.value)} 
            className="rp-search-input" 
            placeholder="Nome" 
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
                    <span className="bcard-label">Nome</span>
                    <span className="bcard-value">{item.nome || item.nomeRazaoSocial || '-'}</span>
                  </div>
                  <div className="bcard-field">
                    <span className="bcard-label">Documento</span>
                    <span className="bcard-value">{item.cpf || item.cnpj || '-'}</span>
                  </div>
                  {item.sexo && (
                    <div className="bcard-field">
                      <span className="bcard-label">Sexo</span>
                      <span className="bcard-value">{item.sexo}</span>
                    </div>
                  )}
                  {item.situacao && (
                    <div className="bcard-field">
                      <span className="bcard-label">Situação</span>
                      <span className="bcard-value">{item.situacao}</span>
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
