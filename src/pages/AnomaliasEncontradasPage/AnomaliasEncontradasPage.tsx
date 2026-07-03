import { useState, useCallback, useEffect, useRef } from 'react';
import './AnomaliasEncontradasPage.css';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import ToolCard from '@/shared/ui/ToolCard/ToolCard';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';
import AnomaliaCard from './AnomaliaCard';
import AnomaliaDetailModal from './AnomaliaDetailModal';
import type { AnomaliaDocumento } from './AnomaliaCard';

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const TAGS = [
  'Fornecedor-TSE',
  'Doador-TSE',
  'Doação Candidato-TSE',
  'Doação Partido-TSE',
  'Contas Irregulares-TCU',
  'Inabilitado-TCU',
  'Inidôneo-TCU',
  'Servidor Público-Portal Transparência',
  'Pessoa Exposta-Portal Transparência',
  'Dispensa acima do limite-Regra',
];

const CATEGORIAS = ['TSE', 'TCU', 'Portal Transparência', 'Regra'];

interface ListarResponse {
  total: number;
  pagina: number;
  por_pagina: number;
  anomalias: AnomaliaDocumento[];
}

export default function AnomaliasEncontradasPage() {
  const [documentoFiltro, setDocumentoFiltro] = useState('');
  const [ufFiltro, setUfFiltro] = useState('');
  const [municipioFiltro, setMunicipioFiltro] = useState('');
  const [tagFiltro, setTagFiltro] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<ListarResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnomalia, setSelectedAnomalia] = useState<AnomaliaDocumento | null>(null);
  const { popupInfo, setPopupInfo } = useEntityInfo();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buscar = useCallback(async (p?: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { pagina: p || pagina, por_pagina: 50 };
      if (documentoFiltro.trim()) params.documento = documentoFiltro.trim();
      if (ufFiltro) params.uf = ufFiltro;
      if (municipioFiltro.trim()) params.municipio = municipioFiltro.trim();
      if (tagFiltro) params.tag = tagFiltro;
      if (categoriaFiltro) params.categoria = categoriaFiltro;
      const data = await api.get<ListarResponse>(ENDPOINTS.ANOMALIAS_LISTAR, params);
      setResultado(data);
    } catch {
      setResultado(null);
    }
    setLoading(false);
  }, [documentoFiltro, ufFiltro, municipioFiltro, tagFiltro, categoriaFiltro, pagina]);

  // Auto-fetch on mount
  useEffect(() => {
    buscar(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPagina(1);
      buscar(1);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [documentoFiltro, ufFiltro, municipioFiltro, tagFiltro, categoriaFiltro]); // eslint-disable-line react-hooks/exhaustive-deps

  function limparFiltros() {
    setDocumentoFiltro('');
    setUfFiltro('');
    setMunicipioFiltro('');
    setTagFiltro('');
    setCategoriaFiltro('');
    setPagina(1);
  }

  function irPagina(p: number) {
    setPagina(p);
    buscar(p);
  }

  return (
    <div className="tab-page">
      <div className="licitacoes-page">
        <div className="licitacoes-header">
          <div className="licitacoes-badge">// ANOMALIAS ENCONTRADAS //</div>
          <h1 className="licitacoes-title">
            Anomalias<br />
            <span style={{ color: 'var(--accent)', fontSize: 'inherit' }}>Ligações Políticas Detectadas</span>
          </h1>
          <p className="licitacoes-subtitle">Consulte todas as anomalias encontradas nas análises realizadas.</p>
          <InfoBadge chave="anomalia_geral" onInfoClick={setPopupInfo} />
        </div>

        {/* ─── CARDS EXPLICATIVOS ─── */}
        <div className="anomalia-cards-grid">
          <ToolCard title="Entenda as anormalias">
            <p>
              Um processo automático varre milhares de registros de licitações e cruza esses dados com informações públicas de vínculos políticos, sanções e servidores. Quando encontra coincidências entre um fornecedor ou sócio e essas fontes, ele cria uma “anomalia”, sinalizando um ponto de atenção que merece investigação. A ferramenta apenas destaca essas relações; não faz julgamentos sobre conduta.
            </p>
          </ToolCard>
          <ToolCard title={
            <span>Categoria TSE <InfoBadge chave="anomalia_tse" onInfoClick={setPopupInfo} /></span>
          }>
            <p>
              Verifica se o fornecedor ou seus sócios são doadores de campanha, fornecedores de campanha, receberam doações partidárias ou fizeram doações a candidatos. Dados provenientes do Tribunal Superior Eleitoral.
            </p>
          </ToolCard>
          <ToolCard title={
            <span>Categoria TCU <InfoBadge chave="anomalia_tcu" onInfoClick={setPopupInfo} /></span>
          }>
            <p>
              Verifica se o fornecedor ou seus sócios possuem contas julgadas irregulares, estão inabilitados para cargos públicos ou foram declarados inidôneos. Dados provenientes do Tribunal de Contas da União.
            </p>
          </ToolCard>
          <ToolCard title={
            <span>Categoria Portal Transparência <InfoBadge chave="anomalia_portal" onInfoClick={setPopupInfo} /></span>
          }>
            <p>
              Verifica se o fornecedor ou seus sócios são servidores públicos federais ativos ou pessoas politicamente expostas (PEPs). Dados provenientes do Portal da Transparência do Governo Federal.
            </p>
          </ToolCard>
        </div>
        <ToolCard title="Informação">
          <p>lembre-se que anomalias encontradas não significa necessariamente uma conduta errada. essa ferramenta só faz análises iniciais e as destaca entre os dados, mas cabe ao usuário interpretar os dados encontrados.</p>
        </ToolCard>

        <div className="licitacoes-form-wrapper">
          <form className="card" style={{ maxWidth: 800 }} onSubmit={e => e.preventDefault()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Filtros</h2>
              <button type="button" className="btn btn-sm" onClick={limparFiltros} style={{ fontSize: '0.7rem' }}>
                Limpar filtros
              </button>
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <div className="form-group">
                <label>Documento (CPF/CNPJ)</label>
                <input
                  type="text"
                  placeholder="00000000000000"
                  value={documentoFiltro}
                  onChange={(e) => setDocumentoFiltro(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>UF</label>
                <select value={ufFiltro} onChange={(e) => setUfFiltro(e.target.value)}>
                  <option value="">Todas</option>
                  {UFS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Município</label>
                <input
                  type="text"
                  placeholder="Nome do município"
                  value={municipioFiltro}
                  onChange={(e) => setMunicipioFiltro(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                  <option value="">Todas</option>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tag</label>
                <select value={tagFiltro} onChange={(e) => setTagFiltro(e.target.value)}>
                  <option value="">Todas</option>
                  {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="licitacoes-content" style={{ marginTop: 16 }}>
          {loading && (
            <div className="progresso-card">
              <div className="dm-carregando">
                <div className="spinner-sm" />
                <span>Buscando anomalias...</span>
              </div>
            </div>
          )}

          {resultado && !loading && (
            <>
              <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {resultado.total} anomalia{resultado.total !== 1 ? 's' : ''} encontrada{resultado.total !== 1 ? 's' : ''}
                </span>
                {resultado.total > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Página {resultado.pagina}
                  </span>
                )}
              </div>

              {resultado.anomalias.length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhuma anomalia encontrada com esses filtros
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: 12,
                }}>
                  {resultado.anomalias.map((a, i) => (
                    <AnomaliaCard
                      key={a.id || `${a.documento_rastrear}-${i}`}
                      item={a}
                      onSelect={setSelectedAnomalia}
                    />
                  ))}
                </div>
              )}

              {resultado.total > 50 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
                  <button
                    className="pagina-btn"
                    disabled={resultado.pagina <= 1}
                    onClick={() => irPagina(resultado.pagina - 1)}
                  >
                    ◀
                  </button>
                  <span className="pagina-info">Página {resultado.pagina}</span>
                  <button
                    className="pagina-btn"
                    disabled={resultado.pagina * 50 >= resultado.total}
                    onClick={() => irPagina(resultado.pagina + 1)}
                  >
                    ▶
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedAnomalia && (
        <AnomaliaDetailModal
          item={selectedAnomalia}
          onClose={() => setSelectedAnomalia(null)}
        />
      )}
      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}
    </div>
  );
}
