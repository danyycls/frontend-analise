import { useState, useEffect, useRef } from 'react';
import API_BASE_URL, { WS_BASE_URL } from '../config';

function fmtNum(n) {
  if (!n) return '-';
  return n.toLocaleString('pt-BR');
}

function fmtMoney(v) {
  if (!v && v !== 0) return '-';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMesAno(n) {
  if (!n) return '-';
  const s = String(n);
  if (s.length === 6) return s.substring(4, 6) + '/' + s.substring(0, 4);
  return s;
}

function fmtData(s) {
  if (!s || s.length < 10) return s || '-';
  return s.substring(8, 10) + '/' + s.substring(5, 7) + '/' + s.substring(0, 4);
}

function usePaginacao(dados, itensPorPagina = 10) {
  const [pagina, setPagina] = useState(0);
  const arr = dados || [];
  const totalPaginas = Math.max(1, Math.ceil(arr.length / itensPorPagina));
  const inicio = pagina * itensPorPagina;
  const paginaDados = arr.slice(inicio, inicio + itensPorPagina);
  return { pagina, setPagina, totalPaginas, paginaDados };
}

function Paginacao({ pagina, totalPaginas, onPagina }) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="dm-paginacao">
      <button className="pagina-btn" disabled={pagina === 0} onClick={() => onPagina(pagina - 1)}>◀</button>
      <span className="pagina-info">{pagina + 1} / {totalPaginas}</span>
      <button className="pagina-btn" disabled={pagina >= totalPaginas - 1} onClick={() => onPagina(pagina + 1)}>▶</button>
    </div>
  );
}

function SecaoCarregando({ titulo }) {
  return (
    <div className="estado-section">
      <h2>{titulo} <span className="count">(carregando...)</span></h2>
      <div className="dm-carregando"><div className="spinner-xs" /> Buscando dados...</div>
    </div>
  );
}

function SecaoVazia({ titulo, mensagem }) {
  return (
    <div className="estado-section">
      <h2>{titulo} <span className="count">(vazio)</span></h2>
      <p style={{ textAlign: 'center', padding: 16, color: '#666', fontSize: '0.8rem' }}>
        {mensagem || 'Nenhum dado disponível'}
      </p>
    </div>
  );
}

function ModalContrato({ contrato, onFechar }) {
  if (!contrato) return null;

  const campos = [
    ['Órgão', contrato.orgao],
    ['Objeto', contrato.objeto],
    ['Fornecedor', contrato.nome_razao_social],
    ['CNPJ Fornecedor', contrato.ni_fornecedor],
    ['Valor', fmtMoney(contrato.valor)],
    ['Valor Global', contrato.valor_global ? fmtMoney(contrato.valor_global) : null],
    ['Valor Parcela', contrato.valor_parcela ? fmtMoney(contrato.valor_parcela) : null],
    ['Valor Total Estimado', contrato.valor_total_estimado ? fmtMoney(contrato.valor_total_estimado) : null],
    ['Valor Total Homologado', contrato.valor_total_homologado ? fmtMoney(contrato.valor_total_homologado) : null],
    ['Modalidade', contrato.modalidade_nome],
    ['Tipo Contrato', contrato.tipo_contrato_nome],
    ['Nº Contrato', contrato.numero_contrato],
    ['Nº Controle PNCP', contrato.numero_controle_pncp],
    ['Nº Licitação', contrato.numero_licitacao],
    ['Código Contrato', contrato.codigo_contrato],
    ['Origem Licitação', contrato.origem_licitacao],
    ['Ano Contrato', contrato.ano_contrato],
    ['Produto', contrato.produto],
    ['Subtipo', contrato.subtipo_contrato],
    ['Vigência Início', fmtData(contrato.data_vigencia_inicio)],
    ['Vigência Fim', fmtData(contrato.data_vigencia_fim)],
    ['Data Assinatura', fmtData(contrato.data_assinatura)],
    ['Data Publicação', fmtData(contrato.data_publicacao)],
    ['Amparo Legal', contrato.amp_legal_descricao],
  ];

  const camposPreenchidos = campos.filter(([, v]) => v);

  return (
    <div className="dm-modal-overlay" onClick={onFechar}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-header">
          <h3>Detalhes do Contrato</h3>
          <button className="dm-modal-close" onClick={onFechar}>×</button>
        </div>
        <div className="dm-modal-body">
          <table className="dm-detalhe-table">
            <tbody>
              {camposPreenchidos.map(([label, valor], i) => (
                <tr key={i}>
                  <td className="dm-detalhe-label">{label}</td>
                  <td className={label === 'Objeto' ? 'dm-detalhe-valor-full' : 'dm-detalhe-valor'}>
                    {valor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DetalheMunicipio({ municipio, uf, onFechar }) {
  const [secoes, setSecoes] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const secoesRef = useRef({});
  const concluidoRef = useRef(false);
  const [header, setHeader] = useState(null);
  const [modalContrato, setModalContrato] = useState(null);

  useEffect(() => {
    if (!municipio) return;

    setLoading(true);
    setErro(null);
    setSecoes({});
    secoesRef.current = {};
    concluidoRef.current = false;
    setHeader(null);

    const codigoIBGE = municipio.id;
    const nome = encodeURIComponent(municipio.nome);
    const wsUrl = `${WS_BASE_URL}/municipio/${codigoIBGE}/detalhes/stream?uf=${uf}&nome=${nome}`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case 'despesa_pessoal':
            secoesRef.current = { ...secoesRef.current, despesa_pessoal: msg.data };
            setSecoes({ ...secoesRef.current });
            break;
          case 'gastos_por_funcao':
            secoesRef.current = { ...secoesRef.current, gastos_por_funcao: msg.data?.dados || [] };
            setSecoes({ ...secoesRef.current });
            break;
          case 'receitas':
            secoesRef.current = { ...secoesRef.current, receitas: msg.data?.dados || [] };
            setSecoes({ ...secoesRef.current });
            break;
          case 'recursos_federais':
            secoesRef.current = { ...secoesRef.current, recursos_federais: msg.data?.dados || [] };
            setSecoes({ ...secoesRef.current });
            break;
          case 'contratos':
            secoesRef.current = { ...secoesRef.current, contratos: msg.data?.dados || [] };
            setSecoes({ ...secoesRef.current });
            break;
          case 'servidores':
            secoesRef.current = { ...secoesRef.current, servidores: msg.data?.dados || [] };
            setSecoes({ ...secoesRef.current });
            break;
          case 'concluido':
            concluidoRef.current = true;
            setHeader(msg.data);
            setLoading(false);
            ws.close();
            break;
        }
      } catch (_) {}
    };

    ws.onerror = () => {
      ws.close();
      if (!concluidoRef.current) {
        setErro('Conexão perdida com o servidor');
        setLoading(false);
      }
    };

    return () => { ws.close(); };
  }, [municipio, uf]);

  if (erro) {
    return (
      <div className="estado-detalhe">
        <div className="estado-detalhe-header">
          <h3>{municipio?.nome}</h3>
          <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
        </div>
        <p style={{ textAlign: 'center', padding: 40, color: '#ff6b6b' }}>
          Erro ao carregar dados: {erro}
        </p>
      </div>
    );
  }

  const {
    despesa_pessoal: despesaPessoal,
    gastos_por_funcao: gastosPorFuncao,
    receitas,
    recursos_federais: recursosFederais,
    contratos,
    servidores,
  } = secoes;

  const gastosPag = usePaginacao(gastosPorFuncao);
  const receitasPag = usePaginacao(receitas);
  const recursosFedPag = usePaginacao(recursosFederais);
  const contratosPag = usePaginacao(contratos);
  const servidoresPag = usePaginacao(servidores);

  return (
    <div className="estado-detalhe">
      {modalContrato && (
        <ModalContrato contrato={modalContrato} onFechar={() => setModalContrato(null)} />
      )}

      <div className="estado-detalhe-header">
        <div className="estado-detalhe-header-info">
          <div>
            <h3>{header?.nome || municipio.nome}</h3>
            <div className="ad-dep-tags">
              <span className="tag tag-partido">{header?.uf || uf}</span>
              {municipio.populacao > 0 && (
                <span className="tag tag-candidato">Pop: {fmtNum(municipio.populacao)} hab.</span>
              )}
              {header?.exercicio > 0 && (
                <span className="tag tag-candidato">Exercício {header.exercicio}</span>
              )}
            </div>
          </div>
        </div>
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>

      {despesaPessoal === undefined && <SecaoCarregando titulo="Despesa com Pessoal" />}
      {despesaPessoal !== undefined && !despesaPessoal && (
        <SecaoVazia titulo="Despesa com Pessoal" mensagem="Dados de despesa com pessoal não encontrados via SICONFI RGF" />
      )}
      {despesaPessoal && (
        <div className="estado-section">
          <h2>Despesa com Pessoal <span className="count">(Executivo)</span></h2>
          <div className="dm-cards">
            <div className="dm-card">
              <span className="dm-card-val">{fmtMoney(despesaPessoal.valor_total)}</span>
              <span className="dm-card-lbl">Total Despesa Pessoal</span>
            </div>
            <div className="dm-card">
              <span className="dm-card-val">{fmtNum(despesaPessoal.percentual_rcl)}%</span>
              <span className="dm-card-lbl">% da RCL</span>
            </div>
            <div className="dm-card">
              <span className="dm-card-val">{despesaPessoal.periodo}</span>
              <span className="dm-card-lbl">Exercício</span>
            </div>
          </div>
        </div>
      )}

      {gastosPorFuncao === undefined && <SecaoCarregando titulo="Gastos por Função" />}
      {gastosPorFuncao !== undefined && gastosPorFuncao.length === 0 && (
        <SecaoVazia titulo="Gastos por Função" mensagem="Dados de gastos por função não encontrados via SICONFI RREO" />
      )}
      {gastosPorFuncao && gastosPorFuncao.length > 0 && (
        <div className="estado-section">
          <h2>Gastos por Função <span className="count">({gastosPorFuncao.length})</span></h2>
          <table className="estado-table">
            <thead>
              <tr>
                <th>Função</th>
                <th>Empenhado</th>
                <th>Liquidado</th>
                <th>Pago</th>
              </tr>
            </thead>
            <tbody>
              {gastosPag.paginaDados.map((g, i) => (
                <tr key={i}>
                  <td>{g.funcao}</td>
                  <td>{fmtMoney(g.empenhado)}</td>
                  <td>{fmtMoney(g.liquidado)}</td>
                  <td>{fmtMoney(g.pago)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginacao pagina={gastosPag.pagina} totalPaginas={gastosPag.totalPaginas} onPagina={gastosPag.setPagina} />
        </div>
      )}

      {receitas === undefined && <SecaoCarregando titulo="Receitas" />}
      {receitas !== undefined && receitas.length === 0 && (
        <SecaoVazia titulo="Receitas" mensagem="Dados de receitas não encontrados via SICONFI RREO" />
      )}
      {receitas && receitas.length > 0 && (
        <div className="estado-section">
          <h2>Receitas <span className="count">({receitas.length})</span></h2>
          <table className="estado-table">
            <thead>
              <tr>
                <th>Conta</th>
                <th>Coluna</th>
                <th>Exercício</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {receitasPag.paginaDados.map((r, i) => (
                <tr key={i}>
                  <td>{r.conta || '-'}</td>
                  <td className="dm-obj-col">{r.coluna || '-'}</td>
                  <td>{r.exercicio || '-'}</td>
                  <td>{fmtMoney(r.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginacao pagina={receitasPag.pagina} totalPaginas={receitasPag.totalPaginas} onPagina={receitasPag.setPagina} />
        </div>
      )}

      {recursosFederais === undefined && <SecaoCarregando titulo="Recursos Federais Recebidos" />}
      {recursosFederais !== undefined && recursosFederais.length === 0 && (
        <SecaoVazia titulo="Recursos Federais Recebidos" mensagem="Nenhum recurso federal recebido encontrado no período" />
      )}
      {recursosFederais && recursosFederais.length > 0 && (
        <div className="estado-section">
          <h2>Recursos Federais Recebidos <span className="count">({recursosFederais.length})</span></h2>
          <table className="estado-table">
            <thead>
              <tr>
                <th>Favorecido</th>
                <th>Órgão Superior</th>
                <th>Mês/Ano</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {recursosFedPag.paginaDados.map((rf, i) => (
                <tr key={i}>
                  <td>{rf.nome_pessoa || '-'}</td>
                  <td>{rf.nome_orgao_superior || '-'}</td>
                  <td>{fmtMesAno(rf.mes_ano)}</td>
                  <td>{fmtMoney(rf.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginacao pagina={recursosFedPag.pagina} totalPaginas={recursosFedPag.totalPaginas} onPagina={recursosFedPag.setPagina} />
        </div>
      )}

      {contratos === undefined && <SecaoCarregando titulo="Contratos/Compras (PNCP)" />}
      {contratos !== undefined && contratos.length === 0 && (
        <SecaoVazia titulo="Contratos/Compras (PNCP)" mensagem="Nenhum contrato encontrado no PNCP para este município no período" />
      )}
      {contratos && contratos.length > 0 && (
        <div className="estado-section">
          <h2>Contratos/Compras (PNCP) <span className="count">({contratos.length})</span></h2>
          <table className="estado-table">
            <thead>
              <tr>
                <th>Órgão</th>
                <th>Objeto</th>
                <th>Fornecedor</th>
                <th>Vigência</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {contratosPag.paginaDados.map((c, i) => (
                <tr key={i} className="dm-row-click" onClick={() => setModalContrato(c)} title="Clique para ver detalhes completos">
                  <td>{c.orgao || '-'}</td>
                  <td className="dm-obj-col">{c.objeto || '-'}</td>
                  <td>{c.nome_razao_social || '-'}</td>
                  <td>{fmtData(c.data_vigencia_inicio)}{c.data_vigencia_fim ? ' - ' + fmtData(c.data_vigencia_fim) : ''}</td>
                  <td>{fmtMoney(c.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dm-hint">Clique em uma linha para ver todos os detalhes do contrato</p>
          <Paginacao pagina={contratosPag.pagina} totalPaginas={contratosPag.totalPaginas} onPagina={contratosPag.setPagina} />
        </div>
      )}

      {servidores === undefined && <SecaoCarregando titulo="Despesa com Pessoal por Categoria" />}
      {servidores !== undefined && servidores.length === 0 && (
        <SecaoVazia titulo="Despesa com Pessoal por Categoria" mensagem="Detalhamento por categoria não disponível via SICONFI RGF. Dados de servidores públicos municipais individuais não estão disponíveis nas APIs federais." />
      )}
      {servidores && servidores.length > 0 && (
        <div className="estado-section">
          <h2>Despesa com Pessoal por Categoria <span className="count">({servidores.length})</span></h2>
          <table className="estado-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Despesa Total</th>
              </tr>
            </thead>
            <tbody>
              {servidoresPag.paginaDados.map((s, i) => (
                <tr key={i}>
                  <td>{s.categoria || '-'}</td>
                  <td>{fmtMoney(s.despesa_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dm-hint">Dados agregados do SICONFI RGF (Demonstrativo da Despesa com Pessoal)</p>
          <Paginacao pagina={servidoresPag.pagina} totalPaginas={servidoresPag.totalPaginas} onPagina={servidoresPag.setPagina} />
        </div>
      )}
    </div>
  );
}
