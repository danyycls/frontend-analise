import { useState, useCallback, type ChangeEvent } from 'react';
import { api } from '@/shared/api/client';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';

interface PortalPessoasProps {
  onFechar: () => void;
  onIdClick?: (key: string, value: string) => void;
  resultItem?: { data: any[] | any } | null;
  onPTSearchComplete?: (method: string, searchParams: Record<string, unknown>, data: unknown) => void;
}

export default function PortalPessoas({
  onFechar, onIdClick, resultItem, onPTSearchComplete,
}: PortalPessoasProps) {
  const [tipo, setTipo] = useState('fisica');
  const [documento, setDocumento] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<any[]>([]);
  const { popupInfo, setPopupInfo } = useEntityInfo();

  const handleBuscar = useCallback(async () => {
    if (!documento) { setError('Digite um CPF ou CNPJ'); return; }
    setLoading(true);
    setError(null);
    try {
      const endpoint = tipo === 'fisica'
        ? '/portal-transparencia/pessoas/fisica'
        : '/portal-transparencia/pessoas/juridica';
      const params: Record<string, string> = {};
      if (tipo === 'fisica' && documento) params.cpf = documento;
      if (tipo === 'juridica' && documento) params.cnpj = documento;
      if (nome) params.nome = nome;
      const json = await api.get<any>(endpoint, params);
      const data = Array.isArray(json) ? json : [json].filter(Boolean);
      setResultados(data);
      onPTSearchComplete?.('pessoas', { tipo, documento, nome }, data);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }, [tipo, documento, nome, onPTSearchComplete]);

  const renderCards = (dados: any[]) => (
    <div className="bcard-grid">
      {dados.map((item: any, idx: number) => (
        <div key={idx} className="bcard">
          <div className="bcard-body">
            <div className="bcard-field"><span className="bcard-label">Nome</span><span className="bcard-value">{item.nome || item.nomeRazaoSocial || '-'}</span></div>
            <div className="bcard-field"><span className="bcard-label">Documento</span><span className="bcard-value">{item.cpf || item.cnpj || '-'}</span></div>
            {item.sexo && <div className="bcard-field"><span className="bcard-label">Sexo</span><span className="bcard-value">{item.sexo}</span></div>}
            {item.situacao && <div className="bcard-field"><span className="bcard-label">Situação</span><span className="bcard-value">{item.situacao}</span></div>}
          </div>
        </div>
      ))}
    </div>
  );

  if (resultItem) {
    const dados = Array.isArray(resultItem.data) ? resultItem.data : [resultItem.data].filter(Boolean);
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Pessoas</h2>
          <span className="rp-desc">{dados.length} resultado{dados.length !== 1 ? 's' : ''}</span>
          <div className="rp-topo-actions"><button className="btn btn-sm" onClick={onFechar}>Voltar</button></div>
        </div>
        <div className="rp-result">
          {renderCards(dados)}
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
        <InfoBadge chave="portal_pessoas" onInfoClick={setPopupInfo} />
        <div className="rp-topo-actions"><button className="btn btn-sm" onClick={onFechar}>Fechar</button></div>
      </div>
      <p className="ad-query-form-desc" style={{ marginBottom: 12 }}>
        Informe o CPF, CNPJ ou nome para consultar vínculos com a administração pública federal. Os resultados exibem documento, nome e tipo de vínculo.
      </p>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <select value={tipo} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTipo(e.target.value)} className="rp-search-input">
            <option value="fisica">Pessoa Física (CPF)</option>
            <option value="juridica">Pessoa Jurídica (CNPJ)</option>
          </select>
          <input type="text" value={documento} onChange={e => setDocumento(e.target.value)} className="rp-search-input" placeholder={tipo === 'fisica' ? 'CPF' : 'CNPJ'} />
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="rp-search-input" placeholder="Nome" />
          <button className="btn btn-sm" onClick={handleBuscar} disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
        </div>
        {error && <p className="rp-error">{error}</p>}
      </div>
      {resultados.length > 0 && <div className="rp-result">{renderCards(resultados)}</div>}
      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}
    </div>
  );
}
