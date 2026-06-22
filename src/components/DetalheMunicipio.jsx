import { useState, useEffect, useRef } from 'react';
import { WS_BASE_URL } from '../config';
import { ContratoDetalhes, JanelaPopup } from './Resultados';

function fmtNum(n) {
  if (n === null || n === undefined || n === 0) return '-';
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  if (n === null || n === undefined || n === 0) return '-';
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

function fmtDate(d) {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

function InfoCard({ valor, label, cor }) {
  return (
    <div className="dm-card">
      <span className="dm-card-val" style={cor ? { color: cor } : {}}>{valor}</span>
      <span className="dm-card-lbl">{label}</span>
    </div>
  );
}

function Secao({ titulo, children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="estado-section">
      <h2 onClick={() => setCollapsed(!collapsed)} style={{ cursor: 'pointer' }}>
        {collapsed ? '▸' : '▾'} {titulo}
      </h2>
      {!collapsed && children}
    </div>
  );
}

export default function DetalheMunicipio({ municipio, uf, onFechar }) {
  const [ano, setAno] = useState(new Date().getFullYear() - 1);
  const [dados, setDados] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [contratoPopup, setContratoPopup] = useState(null);
  const dadosRef = useRef({});
  const wsRef = useRef(null);

  useEffect(() => {
    if (!municipio) return;
    setLoading(true);
    setErro(null);
    setDados({});
    dadosRef.current = {};

    const wsUrl = `${WS_BASE_URL}/municipio/${municipio.id}/detalhes/stream?exercicio=${ano}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        switch (msg.type) {
          case 'divida_consolidada':
          case 'disponibilidade_caixa':
          case 'restos_a_pagar':
          case 'gasto_saude':
          case 'gasto_educacao':
          case 'fundeb':
          case 'balanco_patrimonial':
            dadosRef.current = { ...dadosRef.current, [msg.type]: msg.data };
            setDados({ ...dadosRef.current });
            break;

          case 'despesas_por_grupo':
          case 'transferencias':
          case 'contratos':
            dadosRef.current = { ...dadosRef.current, [msg.type]: msg.data?.dados || [] };
            setDados({ ...dadosRef.current });
            break;

          case 'concluido':
            setLoading(false);
            ws.close();
            break;

          case 'erro':
            setErro(msg.data?.erro || 'Erro desconhecido');
            setLoading(false);
            break;
        }
      } catch (_) {}
    };

    ws.onerror = () => {
      if (wsRef.current !== ws) return;
      setErro('Erro na conexão WebSocket');
      setLoading(false);
    };

    ws.onclose = (e) => {
      if (wsRef.current !== ws) return;
      if (!e.wasClean) {
        setErro('Conexão WebSocket fechada inesperadamente');
        setLoading(false);
      }
    };

    return () => {
      wsRef.current = null;
      ws.close();
    };
  }, [municipio?.id, ano]);

  const d = dados;

  return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <div className="estado-detalhe-header-info">
          <div>
            <h3>{municipio.nome}</h3>
            <div className="ad-dep-tags">
              <span className="tag tag-partido">{uf}</span>
              {municipio.populacao > 0 && (
                <span className="tag tag-candidato">Pop: {Number(municipio.populacao).toLocaleString('pt-BR')} hab.</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="anoFiltroMun" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ano:</label>
          <input
            id="anoFiltroMun"
            type="number"
            min="2010"
            max={new Date().getFullYear()}
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            style={{ width: 70, fontSize: '0.8rem', padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button className="btn btn-sm" onClick={() => setAno(ano)} style={{ fontSize: '0.75rem', padding: '2px 10px' }}>
            Buscar
          </button>
          <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
        </div>
      </div>

      {loading && (
        <div className="estado-detalhe-loading">
          <div className="spinner" />
          <span>Carregando dados do município...</span>
        </div>
      )}

      {erro && (
        <div className="estado-erro">{erro}</div>
      )}

      {!loading && (
        <div className="dm-banner">
          SICONFI temporariamente indisponivel. Apenas contratos PNCP serao exibidos.
        </div>
      )}

      <Secao titulo="Dívida Consolidada">
        <p className="dm-empty">SICONFI temporariamente indisponível</p>
      </Secao>

      <Secao titulo="Disponibilidade de Caixa">
        <p className="dm-empty">SICONFI temporariamente indisponível</p>
      </Secao>

      <Secao titulo="Restos a Pagar">
        <p className="dm-empty">SICONFI temporariamente indisponível</p>
      </Secao>

      <Secao titulo="Gasto com Saúde">
        <p className="dm-empty">SICONFI temporariamente indisponível</p>
      </Secao>

      <Secao titulo="Gasto com Educação">
        <p className="dm-empty">SICONFI temporariamente indisponível</p>
      </Secao>

      <Secao titulo="Fundeb">
        <p className="dm-empty">SICONFI temporariamente indisponível</p>
      </Secao>

      <Secao titulo="Balanço Patrimonial">
        <p className="dm-empty">SICONFI temporariamente indisponível</p>
      </Secao>

      <Secao titulo="Despesas por Grupo">
        <p className="dm-empty">SICONFI temporariamente indisponível</p>
      </Secao>

      <Secao titulo="Transferências Recebidas">
        <p className="dm-empty">SICONFI temporariamente indisponível</p>
      </Secao>

      <Secao titulo={`Contratos/Compras (PNCP)${d.contratos?.length ? ` (${d.contratos.length})` : ''}`}>
        {d.contratos?.length > 0 ? (
          <>
            <table className="estado-table">
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Fornecedor</th>
                  <th>Objeto</th>
                  <th>Vigência</th>
                  <th>Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {d.contratos.map((c, i) => (
                  <tr key={c.numeroControlePNCP || i} className="dm-row-click" onClick={() => setContratoPopup(c)}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                      {(c.numeroControlePNCP || '').slice(-12)}
                    </td>
                    <td>{c.tipoContrato?.nome || c.modalidadeNome || '-'}</td>
                    <td>{c.categoriaProcesso?.nome || c.modalidadeNome || '-'}</td>
                    <td>{c.fornecedor?.razaoSocial || c.niFornecedor || '-'}</td>
                    <td className="dm-obj-col">{(c.objetoContrato || '').substring(0, 60)}</td>
                    <td style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                      {fmtDate(c.dataVigenciaInicio)} ~ {fmtDate(c.dataVigenciaFim)}
                    </td>
                    <td>{fmtNum(c.valorGlobal ?? c.valorTotalEstimado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="dm-hint">Clique em um contrato para ver detalhes completos</p>
          </>
        ) : (
          <p className="dm-empty">Dados indisponíveis para esta seção</p>
        )}
      </Secao>

      {contratoPopup && (
        <JanelaPopup titulo={`Contrato ${(contratoPopup.numeroControlePNCP || '').slice(-12)}`} onFechar={() => setContratoPopup(null)}>
          <ContratoDetalhes contrato={contratoPopup} onIdClick={() => {}} />
        </JanelaPopup>
      )}

    </div>
  );
}
