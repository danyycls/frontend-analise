import { useState, useCallback, type ChangeEvent } from 'react';
import { api } from '@/shared/api/client';

const UFS_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface PortalDespesasProps {
  onFechar: () => void;
  onIdClick?: (key: string, value: string) => void;
  resultItem?: { data: any[] | any } | null;
  onPTSearchComplete?: (method: string, searchParams: Record<string, unknown>, data: unknown) => void;
}

export default function PortalDespesas({
  onFechar, onIdClick, resultItem, onPTSearchComplete,
}: PortalDespesasProps) {
  const [tipoBusca, setTipoBusca] = useState('recursos-recebidos');
  const [ano, setAno] = useState('');
  const [codigoOrgao, setCodigoOrgao] = useState('');
  const [nomeFavorecido, setNomeFavorecido] = useState('');
  const [uf, setUf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<any[]>([]);

  const handleBuscar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/portal-transparencia/despesas/recursos-recebidos';
      const params: Record<string, string> = { pagina: '1' };
      if (tipoBusca === 'recursos-recebidos') {
        if (ano) { params.mesAnoInicio = `${ano}-01`; params.mesAnoFim = `${ano}-12`; }
        if (nomeFavorecido) params.nomeFavorecido = nomeFavorecido;
        if (uf) params.uf = uf;
      } else if (tipoBusca === 'por-orgao') {
        endpoint = '/portal-transparencia/despesas/por-orgao';
        if (ano) params.ano = ano;
        if (codigoOrgao) params.orgao = codigoOrgao;
      }
      const json = await api.get<any>(endpoint, params);
      const data = Array.isArray(json) ? json : [json].filter(Boolean);
      setResultados(data);
      onPTSearchComplete?.('despesas', { tipoBusca, ano, codigoOrgao, nomeFavorecido, uf }, data);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }, [tipoBusca, ano, codigoOrgao, nomeFavorecido, uf, onPTSearchComplete]);

  const renderCards = (dados: any[]) => (
    <div className="bcard-grid">
      {dados.map((item: any, idx: number) => (
        <div key={idx} className="bcard">
          <div className="bcard-body">
            <div className="bcard-field"><span className="bcard-label">Favorecido</span><span className="bcard-value">{item.nomeFavorecido || item.favorecido || '-'}</span></div>
            <div className="bcard-field"><span className="bcard-label">Valor</span><span className="bcard-value">{item.valor ? `R$ ${item.valor}` : '-'}</span></div>
            {item.ano && <div className="bcard-field"><span className="bcard-label">Ano</span><span className="bcard-value">{item.ano}</span></div>}
            {item.orgao && <div className="bcard-field"><span className="bcard-label">Órgão</span><span className="bcard-value">{item.orgao}</span></div>}
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
          <h2>Despesas</h2>
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
        <h2>Despesas</h2>
        <span className="rp-desc">Buscar despesas governamentais</span>
        <div className="rp-topo-actions"><button className="btn btn-sm" onClick={onFechar}>Fechar</button></div>
      </div>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <select value={tipoBusca} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTipoBusca(e.target.value)} className="rp-search-input">
            <option value="recursos-recebidos">Recursos Recebidos</option>
            <option value="por-orgao">Por Órgão</option>
          </select>
          <input type="number" value={ano} onChange={e => setAno(e.target.value)} className="rp-search-input" placeholder="Ano" min="2000" max="2030" />
        </div>
        <div className="rp-search-row bfilter-row">
          {tipoBusca === 'recursos-recebidos' && (
            <>
              <input type="text" value={nomeFavorecido} onChange={e => setNomeFavorecido(e.target.value)} className="rp-search-input" placeholder="Nome do favorecido" />
              <select value={uf} onChange={(e: ChangeEvent<HTMLSelectElement>) => setUf(e.target.value)} className="rp-search-input">
                <option value="">Todas as UF</option>
                {UFS_LIST.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </>
          )}
          {tipoBusca === 'por-orgao' && <input type="text" value={codigoOrgao} onChange={e => setCodigoOrgao(e.target.value)} className="rp-search-input" placeholder="Código do órgão" />}
          <button className="btn btn-sm" onClick={handleBuscar} disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
        </div>
        {error && <p className="rp-error">{error}</p>}
      </div>
      {resultados.length > 0 && <div className="rp-result">{renderCards(resultados)}</div>}
    </div>
  );
}
