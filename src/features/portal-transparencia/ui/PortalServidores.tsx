import { useState, useCallback, useRef, useEffect, type ChangeEvent } from 'react';
import { api } from '@/shared/api/client';
import { useServidoresSearch } from '../api/hooks';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';

interface PortalServidoresProps {
  onFechar: () => void;
  onIdClick?: (key: string, value: string) => void;
  resultItem?: { data: any[] | any } | null;
  onPTSearchComplete?: (method: string, searchParams: Record<string, unknown>, data: unknown) => void;
}

export default function PortalServidores({
  onFechar, onIdClick, resultItem, onPTSearchComplete,
}: PortalServidoresProps) {
  const [tipoBusca, setTipoBusca] = useState('geral');
  const [cpf, setCpf] = useState('');
  const [codigoOrgao, setCodigoOrgao] = useState('');
  const [nomeOrgao, setNomeOrgao] = useState('');
  const [nome, setNome] = useState('');
  const { popupInfo, setPopupInfo } = useEntityInfo();
  const [orgaosSugestoes, setOrgaosSugestoes] = useState<any[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [buscandoOrgaos, setBuscandoOrgaos] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sugestoesRef = useRef<HTMLDivElement>(null);
  const servidoresSearch = useServidoresSearch();

  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (sugestoesRef.current && !sugestoesRef.current.contains(e.target as Node)) {
        setMostrarSugestoes(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const handleNomeOrgaoChange = useCallback((valor: string) => {
    setNomeOrgao(valor);
    setCodigoOrgao('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (valor.length < 2) {
      setOrgaosSugestoes([]);
      setMostrarSugestoes(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setBuscandoOrgaos(true);
      try {
        const json = await api.get<any[]>('/portal-transparencia/orgaos/siape', {
          nomeOrgao: valor.toUpperCase(),
        });
        const validos = Array.isArray(json)
          ? json.filter((org: any) => {
              const n = (org.descricao || '').toUpperCase();
              return n && !n.startsWith('EXC -') && !n.startsWith('IGNORADO') && !n.startsWith('CODIGO INVALIDO');
            }).slice(0, 10)
          : [];
        setOrgaosSugestoes(validos);
        setMostrarSugestoes(validos.length > 0);
      } catch {
        setOrgaosSugestoes([]);
      }
      setBuscandoOrgaos(false);
    }, 300);
  }, []);

  const handleSelecionarOrgao = useCallback((orgao: any) => {
    const codigo = orgao.codigo || '';
    setNomeOrgao(orgao.descricao || '');
    setCodigoOrgao(codigo);
    setOrgaosSugestoes([]);
    setMostrarSugestoes(false);
  }, []);

  const handleBuscar = useCallback(() => {
    servidoresSearch.mutate({ tipoBusca, cpf, codigoOrgao, nome }, {
      onSuccess: (data) => {
        onPTSearchComplete?.('servidores', { tipoBusca, cpf, codigoOrgao, nome, nomeOrgao }, data);
      },
    });
  }, [tipoBusca, cpf, codigoOrgao, nome, nomeOrgao, onPTSearchComplete, servidoresSearch]);

  const renderCards = (dados: any[]) => (
    <div className="bcard-grid">
      {dados.map((item: any, idx: number) => {
        const srv = item.servidor || item;
        return (
          <div key={idx} className="bcard">
            <div className="bcard-body">
              <div className="bcard-field"><span className="bcard-label">Nome</span><span className="bcard-value">{srv.pessoa?.nome || srv.nome || '-'}</span></div>
              <div className="bcard-field"><span className="bcard-label">CPF</span><span className="bcard-value">{srv.pessoa?.cpfFormatado || srv.cpf || '-'}</span></div>
              {srv.funcao?.descricaoFuncaoCargo && <div className="bcard-field"><span className="bcard-label">Cargo/Função</span><span className="bcard-value">{srv.funcao.descricaoFuncaoCargo}</span></div>}
              {(srv.orgaoServidorLotacao?.nome || srv.orgaoServidorExercicio?.nome) && <div className="bcard-field"><span className="bcard-label">Órgão</span><span className="bcard-value">{srv.orgaoServidorLotacao?.nome || srv.orgaoServidorExercicio?.nome}</span></div>}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (resultItem) {
    const dados = Array.isArray(resultItem.data) ? resultItem.data : [resultItem.data].filter(Boolean);
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Servidores</h2>
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
        <h2>Servidores</h2>
        <span className="rp-desc">Buscar servidores públicos</span>
        <InfoBadge chave="portal_servidores" onInfoClick={setPopupInfo} />
        <div className="rp-topo-actions"><button className="btn btn-sm" onClick={onFechar}>Fechar</button></div>
      </div>
      <p className="ad-query-form-desc" style={{ marginBottom: 12 }}>
        Informe CPF, nome ou selecione o órgão para consultar servidores públicos federais. Os resultados exibem cargo, lotação, remuneração e tipo de vínculo.
      </p>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <select value={tipoBusca} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTipoBusca(e.target.value)} className="rp-search-input">
            <option value="geral">Busca Geral</option>
            <option value="por-cpf">Por CPF</option>
            <option value="por-orgao">Por Órgão</option>
          </select>
        </div>
        <div className="rp-search-row bfilter-row">
          {tipoBusca === 'por-cpf' && <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} className="rp-search-input" placeholder="CPF do servidor" />}
          {tipoBusca === 'por-orgao' && (
            <div className="rp-autocomplete" ref={sugestoesRef}>
              <input type="text" value={nomeOrgao} onChange={e => handleNomeOrgaoChange(e.target.value)} className="rp-search-input" placeholder="Nome do órgão" />
              {buscandoOrgaos && <span className="rp-autocomplete-loading">...</span>}
              {mostrarSugestoes && orgaosSugestoes.length > 0 && (
                <ul className="rp-autocomplete-suggestions">
                  {orgaosSugestoes.map((org: any, i) => (
                    <li key={i} className="rp-autocomplete-item" onMouseDown={() => handleSelecionarOrgao(org)}>
                      <span className="rp-autocomplete-nome">{org.descricao}</span>
                      <span className="rp-autocomplete-codigo">{org.codigo || org.cnpj || '-'}</span>
                    </li>
                  ))}
                </ul>
              )}
              {mostrarSugestoes && orgaosSugestoes.length === 0 && !buscandoOrgaos && nomeOrgao.length >= 2 && (
                <div className="rp-autocomplete-suggestions"><div className="rp-autocomplete-empty">Nenhum órgão encontrado</div></div>
              )}
            </div>
          )}
          {tipoBusca === 'por-orgao' && <input type="text" value={codigoOrgao} onChange={e => setCodigoOrgao(e.target.value)} className="rp-search-input" placeholder="Código do órgão" />}
          {tipoBusca === 'geral' && (
            <>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="rp-search-input" placeholder="Nome do servidor" />
              <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} className="rp-search-input" placeholder="CPF (opcional)" />
            </>
          )}
          <button className="btn btn-sm" onClick={handleBuscar} disabled={servidoresSearch.isPending}>{servidoresSearch.isPending ? 'Buscando...' : 'Buscar'}</button>
        </div>
        {servidoresSearch.error && <p className="rp-error">{(servidoresSearch.error as Error).message}</p>}
      </div>
      {servidoresSearch.data && servidoresSearch.data.length > 0 && <div className="rp-result">{renderCards(servidoresSearch.data)}</div>}
      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}
    </div>
  );
}
