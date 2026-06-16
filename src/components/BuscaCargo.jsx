import { useState, useCallback, useRef, useEffect } from 'react';
import API_BASE_URL from '../config';
import './BuscaCargo.css';

function CandidateCard({ c, onIdClick }) {
  return (
    <div className="bcard">
      <div className="bcard-topo">
        <span className="bcard-tag tag-candidato">Candidato</span>
        <span className={`bcard-status ${c.eleito ? 'eleito' : 'nao-eleito'}`}>
          {c.eleito ? 'Eleito' : 'Não Eleito'}
        </span>
      </div>
      <div className="bcard-body">
        <div className="bcard-field"><span className="bcard-label">Nome</span><span className="bcard-value">{c.nome_completo}</span></div>
        <div className="bcard-field"><span className="bcard-label">Nome Urna</span><span className="bcard-value">{c.nome_urna}</span></div>
        <div className="bcard-field"><span className="bcard-label">CPF</span><span className="bcard-value">{c.cpf}</span></div>
        <div className="bcard-field"><span className="bcard-label">Nº</span><span className="bcard-value">{c.numero_candidato}</span></div>
        <div className="bcard-field"><span className="bcard-label">Cargo</span><span className="bcard-value">{c.cargo_nome}</span></div>
        <div className="bcard-field"><span className="bcard-label">UF</span><span className="bcard-value">{c.sg_uf}</span></div>
        {c.partido && (
          <div className="bcard-field"><span className="bcard-label">Partido</span><span className="bcard-value">{c.partido.sigla} - {c.partido.nome}</span></div>
        )}
      </div>
    </div>
  );
}

export default function BuscaCargo({
  onFechar, onIdClick, resultItem, onRPSearchComplete,
}) {
  const [cargos, setCargos] = useState([]);
  const [cargoNome, setCargoNome] = useState('');
  const [eleito, setEleito] = useState('');
  const [uf, setUf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCargos = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/busca/cargos`);
      if (!resp.ok) throw new Error('Erro ao carregar cargos');
      const json = await resp.json();
      setCargos(json.opcoes || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { fetchCargos(); }, [fetchCargos]);

  const handleBuscar = useCallback(async () => {
    if (!cargoNome) { setError('Selecione um cargo'); return; }
    setLoading(true);
    setError(null);
    try {
      const body = { cargo_nome: cargoNome };
      if (eleito) body.eleito = eleito;
      if (uf) body.sg_uf = uf;
      const resp = await fetch(`${API_BASE_URL}/busca/candidatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).erro || 'Erro na busca');
      const json = await resp.json();
      onRPSearchComplete?.('cargo', { filtro: { cargoNome, eleito, uf } }, json);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [cargoNome, eleito, uf, onRPSearchComplete]);

  if (resultItem) {
    const candidatos = resultItem.data?.candidatos || [];
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Políticos por Cargo</h2>
          <span className="rp-desc">{candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''}</span>
          <div className="rp-topo-actions">
            <button className="btn btn-sm" onClick={onFechar}>Voltar</button>
          </div>
        </div>
        <div className="rp-result">
          <div className="bcard-grid">
            {candidatos.map(c => <CandidateCard key={c.sq_candidato} c={c} onIdClick={onIdClick} />)}
          </div>
          {candidatos.length === 0 && <p className="rp-empty">Nenhum candidato encontrado.</p>}
        </div>
      </div>
    );
  }

  const UFS_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  return (
    <div className="rp-section">
      <div className="rp-topo">
        <h2>Políticos por Cargo</h2>
        <span className="rp-desc">Buscar candidatos pelo cargo político</span>
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <span className="rp-field-label required">Cargo</span>
          <select value={cargoNome} onChange={e => setCargoNome(e.target.value)} className="rp-search-input">
            <option value="">Selecione um cargo</option>
            {cargos.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
          </select>
          <span className="rp-field-label optional">Situação</span>
          <select value={eleito} onChange={e => setEleito(e.target.value)} className="rp-search-input">
            <option value="">Todos</option>
            <option value="ELEITO">Eleitos</option>
            <option value="NAO_ELEITO">Não Eleitos</option>
          </select>
          <span className="rp-field-label optional">UF</span>
          <select value={uf} onChange={e => setUf(e.target.value)} className="rp-search-input">
            <option value="">Todas as UF</option>
            {UFS_LIST.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button className="btn btn-sm" onClick={handleBuscar} disabled={loading || !cargoNome}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && <p className="rp-error">{error}</p>}
      </div>
    </div>
  );
}
