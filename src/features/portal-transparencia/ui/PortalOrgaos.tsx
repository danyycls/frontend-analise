import { useState, useCallback, type ChangeEvent } from 'react';
import { useOrgaosSearch } from '../api/hooks';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';

interface PortalOrgaosProps {
  onFechar: () => void;
  onIdClick?: (key: string, value: string) => void;
  resultItem?: { data: any[] } | null;
  onPTSearchComplete?: (method: string, searchParams: Record<string, unknown>, data: unknown) => void;
}

export default function PortalOrgaos({
  onFechar, onIdClick, resultItem, onPTSearchComplete,
}: PortalOrgaosProps) {
  const [tipo, setTipo] = useState('siape');
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const { popupInfo, setPopupInfo } = useEntityInfo();
  const orgaosSearch = useOrgaosSearch();

  const handleBuscar = useCallback(() => {
    orgaosSearch.mutate({ tipo, codigo, nome }, {
      onSuccess: (data) => {
        onPTSearchComplete?.('orgaos', { tipo, codigo, nome }, data);
      },
    });
  }, [tipo, codigo, nome, onPTSearchComplete, orgaosSearch]);

  const renderCards = (dados: any[]) => (
    <div className="bcard-grid">
      {dados.map((item: any, idx: number) => (
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
  );

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
          {renderCards(dados)}
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
        <InfoBadge chave="portal_orgaos" onInfoClick={setPopupInfo} />
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <p className="ad-query-form-desc" style={{ marginBottom: 12 }}>
        Informe o código ou nome do órgão público federal para consultar seus dados cadastrais no SIAPE/SIAFI. Os resultados exibem código, nome, sigla e CNPJ do órgão.
      </p>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <select value={tipo} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTipo(e.target.value)} className="rp-search-input">
            <option value="siape">SIAPE</option>
            <option value="siafi">SIAFI</option>
          </select>
          <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} className="rp-search-input" placeholder="Código do órgão" />
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="rp-search-input" placeholder="Nome do órgão" />
          <button className="btn btn-sm" onClick={handleBuscar} disabled={orgaosSearch.isPending}>
            {orgaosSearch.isPending ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {orgaosSearch.error && <p className="rp-error">{(orgaosSearch.error as Error).message}</p>}
      </div>
      {orgaosSearch.data && orgaosSearch.data.length > 0 && <div className="rp-result">{renderCards(orgaosSearch.data)}</div>}
      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}
    </div>
  );
}
