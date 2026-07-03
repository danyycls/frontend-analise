import { useState, useCallback, type ChangeEvent } from 'react';
import { api } from '@/shared/api/client';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';

interface PortalCartoesProps {
  onFechar: () => void;
  onIdClick?: (key: string, value: string) => void;
  resultItem?: { data: any[] } | null;
  onPTSearchComplete?: (method: string, searchParams: Record<string, unknown>, data: unknown) => void;
}

export default function PortalCartoes({
  onFechar, onIdClick, resultItem, onPTSearchComplete,
}: PortalCartoesProps) {
  const [codigoOrgao, setCodigoOrgao] = useState('');
  const [cpfPortador, setCpfPortador] = useState('');
  const [cnpjFavorecido, setCnpjFavorecido] = useState('');
  const [tipoCartao, setTipoCartao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<any[]>([]);
  const { popupInfo, setPopupInfo } = useEntityInfo();

  const handleBuscar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { pagina: '1' };
      if (codigoOrgao) params.codigoOrgao = codigoOrgao;
      if (cpfPortador) params.cpfPortador = cpfPortador;
      if (cnpjFavorecido) params.cpfCnpjFavorecido = cnpjFavorecido;
      if (tipoCartao) params.tipoCartao = tipoCartao;
      if (dataInicio) params.dataTransacaoInicio = dataInicio;
      if (dataFim) params.dataTransacaoFim = dataFim;
      const json = await api.get<any[]>('/portal-transparencia/cartoes', params);
      setResultados(json || []);
      onPTSearchComplete?.('cartoes', { codigoOrgao, cpfPortador, cnpjFavorecido, tipoCartao, dataInicio, dataFim }, json);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }, [codigoOrgao, cpfPortador, cnpjFavorecido, tipoCartao, dataInicio, dataFim, onPTSearchComplete]);

  const renderCards = (dados: any[]) => (
    <div className="bcard-grid">
      {dados.map((item: any, idx: number) => (
        <div key={idx} className="bcard">
          <div className="bcard-body">
            <div className="bcard-field"><span className="bcard-label">Portador</span><span className="bcard-value">{item.nomePortador || '-'}</span></div>
            <div className="bcard-field"><span className="bcard-label">Favorecido</span><span className="bcard-value">{item.nomeFavorecido || '-'}</span></div>
            <div className="bcard-field"><span className="bcard-label">Valor</span><span className="bcard-value">{item.valorTransacao ? `R$ ${item.valorTransacao}` : '-'}</span></div>
            <div className="bcard-field"><span className="bcard-label">Data</span><span className="bcard-value">{item.dataTransacao || '-'}</span></div>
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
          <h2>Cartões</h2>
          <span className="rp-desc">{dados.length} resultado{dados.length !== 1 ? 's' : ''}</span>
          <div className="rp-topo-actions"><button className="btn btn-sm" onClick={onFechar}>Voltar</button></div>
        </div>
        <div className="rp-result">{renderCards(dados)}{dados.length === 0 && <p className="rp-empty">Nenhum resultado encontrado.</p>}</div>
      </div>
    );
  }

  return (
    <div className="rp-section">
      <div className="rp-topo">
        <h2>Cartões</h2>
        <span className="rp-desc">Buscar transações de cartões de pagamento</span>
        <InfoBadge chave="portal_cartoes" onInfoClick={setPopupInfo} />
        <div className="rp-topo-actions"><button className="btn btn-sm" onClick={onFechar}>Fechar</button></div>
      </div>
      <p className="ad-query-form-desc" style={{ marginBottom: 12 }}>
        Informe o órgão, CPF do portador ou período para consultar gastos com cartões corporativos do governo federal. Os resultados exibem data, valor, estabelecimento e portador.
      </p>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <input type="text" value={codigoOrgao} onChange={e => setCodigoOrgao(e.target.value)} className="rp-search-input" placeholder="Código do órgão" />
          <input type="text" value={cpfPortador} onChange={e => setCpfPortador(e.target.value)} className="rp-search-input" placeholder="CPF do portador" />
          <input type="text" value={cnpjFavorecido} onChange={e => setCnpjFavorecido(e.target.value)} className="rp-search-input" placeholder="CNPJ do favorecido" />
        </div>
        <div className="rp-search-row bfilter-row">
          <select value={tipoCartao} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTipoCartao(e.target.value)} className="rp-search-input">
            <option value="">Todos os tipos</option>
            <option value="Corporate">Corporate</option>
            <option value="Compras">Compras</option>
          </select>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="rp-search-input" />
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="rp-search-input" />
          <button className="btn btn-sm" onClick={handleBuscar} disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
        </div>
        {error && <p className="rp-error">{error}</p>}
      </div>
      {resultados.length > 0 && <div className="rp-result">{renderCards(resultados)}</div>}
      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}
    </div>
  );
}
