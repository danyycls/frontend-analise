// ═══════════════════════════════════════════════════
// Componente Resultados
// Exibe os resultados de uma consulta: lista de
// orgaos com seus contratos, filtros e detalhes
// Os detalhes do contrato abrem em uma janela popup
// que pode ser arrastada, minimizada e maximizada
// ═══════════════════════════════════════════════════

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Resultados.css';

// ═══════════════════════════════════════════════════
// Subcomponente: JanelaPopup (popup arrastavel)
// Exibe o conteudo em uma janela flutuante com
// suporte a arrastar, minimizar, maximizar e fechar
// ═══════════════════════════════════════════════════
export function JanelaPopup({ titulo, onFechar, children }) {
  // Posicao atual da janela na tela
  const [pos, setPos] = useState(() => ({
    x: Math.min(window.innerWidth - 520, 400),
    y: 80,
  }));
  // Controle de arraste: armazena o deslocamento do clique em relacao a posicao
  const [arrastando, setArrastando] = useState(null);
  const [maximizado, setMaximizado] = useState(false);
  const [minimizado, setMinimizado] = useState(false);

  // Listeners globais para arrastar a janela
  useEffect(() => {
    if (!arrastando) return;
    const handleMouseMove = (e) => {
      setPos({
        x: e.clientX - arrastando.offsetX,
        y: e.clientY - arrastando.offsetY,
      });
    };
    const handleMouseUp = () => setArrastando(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [arrastando]);

  // Inicia o arraste ao clicar no titulo
  const iniciarArraste = useCallback((e) => {
    setArrastando({ offsetX: e.clientX - pos.x, offsetY: e.clientY - pos.y });
  }, [pos]);

  // Estado: maximizado (ocupa toda a tela)
  if (maximizado) {
    return (
      <div className="janela-popup janela-maximizada">
        <div className="janela-titulo" onMouseDown={iniciarArraste}>
          <span className="janela-titulo-texto">{titulo}</span>
          <div className="janela-acoes">
            <button onClick={() => setMaximizado(false)} title="Restaurar">🗗</button>
            <button onClick={onFechar} title="Fechar">✕</button>
          </div>
        </div>
        <div className="janela-corpo">{children}</div>
      </div>
    );
  }

  // Estado: minimizado (apenas o titulo)
  if (minimizado) {
    return (
      <div className="janela-popup janela-minimizada" style={{ left: pos.x, top: pos.y }}>
        <div className="janela-titulo" onMouseDown={iniciarArraste}>
          <span className="janela-titulo-texto">{titulo}</span>
          <div className="janela-acoes">
            <button onClick={() => setMinimizado(false)} title="Restaurar">🗗</button>
            <button onClick={onFechar} title="Fechar">✕</button>
          </div>
        </div>
      </div>
    );
  }

  // Estado normal: janela flutuante com corpo visivel
  return (
    <div className="janela-popup" style={{ left: pos.x, top: pos.y }}>
      <div className="janela-titulo" onMouseDown={iniciarArraste}>
        <span className="janela-titulo-texto">{titulo}</span>
        <div className="janela-acoes">
          <button onClick={() => setMinimizado(true)} title="Minimizar">🗕</button>
          <button onClick={() => setMaximizado(true)} title="Maximizar">🗖</button>
          <button onClick={onFechar} title="Fechar">✕</button>
        </div>
      </div>
      <div className="janela-corpo">{children}</div>
    </div>
  );
}

// Formata CNPJ para o padrão XX.XXX.XXX/XXXX-XX
function fmtCNPJ(c) {
  if (!c || c.length !== 14) return c || '-';
  return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12)}`;
}

// Formata valor numérico para moeda brasileira (BRL)
function fmtValor(v) {
  if (v == null || isNaN(v)) return '-';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Converte data ISO (AAAA-MM-DD) para o formato brasileiro (DD/MM/AAAA)
function fmtData(d) {
  if (!d) return '-';
  const m = d.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return d;
}

// Converte booleano para "Sim" / "Não"
function fmtBool(v) {
  if (v === true) return 'Sim';
  if (v === false) return 'Não';
  return '-';
}

// Retorna o valor numérico ou 0 se for nulo/NaN
function valorNumerico(v) {
  if (v == null || isNaN(v)) return 0;
  return Number(v);
}

// ═══════════════════════════════════════════════════
// Subcomponente: Campo de exibição de par nome/valor
// ═══════════════════════════════════════════════════
function Campo({ label, valor }) {
  // Não renderiza se o valor for nulo/vazio
  if (valor == null || valor === '' || valor === undefined) return null;
  return (
    <div className="campo">
      <span className="campo-label">{label}</span>
      <span className="campo-valor">{typeof valor === 'string' || typeof valor === 'number' ? String(valor) : valor}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Subcomponente: Seção com título e grid de campos
// ═══════════════════════════════════════════════════
function Secao({ titulo, children }) {
  return (
    <div className="secao">
      <h4 className="secao-titulo">{titulo}</h4>
      <div className="secao-grid">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Subcomponente: Detalhes completos de um contrato
// Renderiza seções de identificação, datas, valores,
// objeto, fornecedor, órgão, unidade e informações
// ═══════════════════════════════════════════════════
export function ContratoDetalhes({ contrato, onIdClick }) {
  const c = contrato;
  return (
    <div className="detalhes-contrato">
      <Secao titulo="Identificação">
        <Campo label="Nº Controle PNCP" valor={c.numeroControlePNCP} />
        <Campo label="Ano" valor={c.anoContrato || c.anoCompra} />
        <Campo label="Sequencial" valor={c.sequencialContrato || c.sequencialCompra} />
        <Campo label="Nº Empenho" valor={c.numeroContratoEmpenho} />
        <Campo label="Nº Compra" valor={c.numeroCompra} />
        <Campo label="Processo" valor={c.processo} />
        <Campo label="Nº Parcelas" valor={c.numeroParcelas} />
        <Campo label="Nº Retificação" valor={c.numeroRetificacao} />
        <Campo label="Tipo" valor={c.tipoContrato?.nome || c.modalidadeNome} />
        <Campo label="Categoria" valor={c.categoriaProcesso?.nome} />
        <Campo label="Tipo Pessoa" valor={c.tipoPessoa} />
        <Campo label="Receita" valor={fmtBool(c.receita)} />
        <Campo label="Nº Controle Compra" valor={c.numeroControlePncpCompra} />
        <Campo label="Nº Controle Ata" valor={c.numeroControlePncpAta} />
      </Secao>

      <Secao titulo="Datas">
        <Campo label="Assinatura / Inclusão" valor={fmtData(c.dataAssinatura || c.dataInclusao)} />
        <Campo label="Abertura Proposta" valor={fmtData(c.dataAberturaProposta)} />
        <Campo label="Encerramento Proposta" valor={fmtData(c.dataEncerramentoProposta)} />
        <Campo label="Vigência Início" valor={fmtData(c.dataVigenciaInicio)} />
        <Campo label="Vigência Fim" valor={fmtData(c.dataVigenciaFim)} />
        <Campo label="Publicação PNCP" valor={fmtData(c.dataPublicacaoPncp)} />
        <Campo label="Atualização" valor={c.dataAtualizacao} />
        <Campo label="Atualização Global" valor={c.dataAtualizacaoGlobal} />
      </Secao>

      <Secao titulo="Valores">
        <Campo label="Valor Global" valor={fmtValor(c.valorGlobal)} />
        <Campo label="Valor Acumulado" valor={fmtValor(c.valorAcumulado)} />
        <Campo label="Valor Inicial" valor={fmtValor(c.valorInicial)} />
        <Campo label="Valor Parcela" valor={fmtValor(c.valorParcela)} />
        <Campo label="Valor Total Estimado" valor={fmtValor(c.valorTotalEstimado)} />
        <Campo label="Valor Total Homologado" valor={fmtValor(c.valorTotalHomologado)} />
      </Secao>

      <Secao titulo="Objeto">
        <div className="campo-full">{c.objetoContrato || c.objetoCompra || '-'}</div>
      </Secao>

      {c.amparoLegal && (
        <Secao titulo="Amparo Legal / Modalidade">
          <Campo label="Modalidade" valor={c.modalidadeNome} />
          <Campo label="Modo Disputa" valor={c.modoDisputaNome} />
          <Campo label="Amparo Legal" valor={c.amparoLegal?.nome} />
          <div className="campo-full">{c.amparoLegal?.descricao || '-'}</div>
        </Secao>
      )}

      <Secao titulo="Fornecedor">
        <Campo label="CNPJ" valor={c.fornecedor?.cnpj ? <span className="ad-id-link" onClick={() => onIdClick?.('cpf_cnpj', c.fornecedor.cnpj)}>{fmtCNPJ(c.fornecedor.cnpj)}</span> : '-'} />
        <Campo label="Razão Social" valor={c.fornecedor?.razaoSocial} />
        <Campo label="Nome Fantasia" valor={c.fornecedor?.nomeFantasia} />
        <Campo label="Nome RFB" valor={c.nomeRazaoSocialFornecedor} />
        <Campo label="NI Fornecedor" valor={c.niFornecedor ? <span className="ad-id-link" onClick={() => onIdClick?.('cpf_cnpj', c.niFornecedor)}>{fmtCNPJ(c.niFornecedor)}</span> : '-'} />
        <Campo label="Situação Cadastral" valor={c.fornecedor?.situacaoCadastral} />
        <Campo label="Capital Social" valor={c.fornecedor?.capitalSocial} />
        <Campo label="Código País" valor={c.codigoPaisFornecedor} />
        <Campo label="Sub-Contratado NI" valor={c.niFornecedorSubContratado} />
        <Campo label="Sub-Contratado Nome" valor={c.nomeFornecedorSubContratado} />
        <Campo label="Tipo Pessoa Sub" valor={c.tipoPessoaSubContratada} />
        {/* Lista de sócios do fornecedor, se houver */}
        {c.fornecedor?.socios?.length > 0 && (
          <div className="socios-wrapper">
            <details className="socios">
              <summary>{c.fornecedor.socios.length} sócio(s)</summary>
              {c.fornecedor.socios.map((s, i) => (
                <div key={i} className="socio-card">
                  <Campo label="Nome" valor={s.nome_socio} />
                  <Campo label="CPF/CNPJ" valor={s.cnpj_cpf_socio ? <span className="ad-id-link" onClick={() => onIdClick?.('cpf_cnpj', s.cnpj_cpf_socio)}>{s.cnpj_cpf_socio}</span> : '-'} />
                  <Campo label="Qualificação" valor={s.qualificacao_socio} />
                  <Campo label="Identificador" valor={s.identificador_socio} />
                  <Campo label="Faixa Etária" valor={s.faixa_etaria} />
                  <Campo label="Data Entrada" valor={fmtData(s.data_entrada_sociedade)} />
                  <Campo label="Representante" valor={s.nome_representante} />
                  <Campo label="Qualificação Rep." valor={s.qualificacao_representante?.descricao} />
                  <Campo label="Representante Legal" valor={s.representante_legal} />
                </div>
              ))}
            </details>
          </div>
        )}
      </Secao>

      <Secao titulo="Órgão Entidade">
        <Campo label="CNPJ" valor={c.orgaoEntidade?.cnpj ? <span className="ad-id-link" onClick={() => onIdClick?.('cpf_cnpj', c.orgaoEntidade.cnpj)}>{fmtCNPJ(c.orgaoEntidade.cnpj)}</span> : '-'} />
        <Campo label="Razão Social" valor={c.orgaoEntidade?.razaoSocial} />
        {/* Mapeia sigla da esfera para nome legível */}
        <Campo label="Esfera" valor={c.orgaoEntidade?.esferaId === 'M' ? 'Municipal' : c.orgaoEntidade?.esferaId === 'E' ? 'Estadual' : c.orgaoEntidade?.esferaId === 'F' ? 'Federal' : c.orgaoEntidade?.esferaId} />
        {/* Mapeia sigla do poder para nome legível */}
        <Campo label="Poder" valor={c.orgaoEntidade?.poderId === 'N' ? 'Executivo' : c.orgaoEntidade?.poderId === 'L' ? 'Legislativo' : c.orgaoEntidade?.poderId === 'J' ? 'Judiciário' : c.orgaoEntidade?.poderId} />
      </Secao>

      <Secao titulo="Unidade Órgão">
        <Campo label="Código IBGE" valor={c.unidadeOrgao?.codigoIbge} />
        <Campo label="Nome Unidade" valor={c.unidadeOrgao?.nomeUnidade} />
        <Campo label="Código Unidade" valor={c.unidadeOrgao?.codigoUnidade} />
        <Campo label="Município" valor={c.unidadeOrgao?.municipioNome} />
        <Campo label="UF" valor={c.unidadeOrgao?.ufSigla} />
        <Campo label="UF Nome" valor={c.unidadeOrgao?.ufNome} />
      </Secao>

      <Secao titulo="Informações Adicionais">
        <Campo label="Usuário" valor={c.usuarioNome} />
        <Campo label="Informação Complementar" valor={c.informacaoComplementar} />
        <Campo label="Emenda Parlamentar" valor={String(c.emendaParlamentar ?? '')} />
        <Campo label="Fruto Adesão" valor={String(c.frutoAdesao ?? '')} />
        <Campo label="Identificador CIPI" valor={String(c.identificadorCipi ?? '')} />
        <Campo label="URL CIPI" valor={String(c.urlCipi ?? '')} />
        <Campo label="Órgão Sub-Rogado" valor={String(c.orgaoSubRogado ?? '')} />
        <Campo label="Unidade Sub-Rogada" valor={String(c.unidadeSubRogada ?? '')} />
        <Campo label="Tem Remanejamento" valor={String(c.temRemanejamento ?? '')} />
      </Secao>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Subcomponente: Card de um orgao com seus contratos
// Inclui resumo, categorias, filtros e tabela.
// Os detalhes do contrato abrem em uma unica janela
// popup com abas (guias) para navegar entre eles.
// Aceita pncpDestacado para realcar uma licitacao
// ao navegar da guia de Ligacao Politica.
// ═══════════════════════════════════════════════════
function OrgaoCard({ resultado, pncpDestacado, onAnaliseDetalhada, pncpComMatch, onIdClick }) {
  // Verifica se este orgao possui o PNCP destacado
  const temPncpDestacado = pncpDestacado && (resultado.contratos || []).some(c => c.numeroControlePNCP === pncpDestacado);
  const [aberto, setAberto] = useState(temPncpDestacado || true);
  // Lista de indices de contratos com popup aberta (permite multiplos)
  const [contratosAbertos, setContratosAbertos] = useState([]);
  // Aba ativa dentro da janela agrupada
  const [abaAtiva, setAbaAtiva] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [ordem, setOrdem] = useState('data');
  const [apenasComMatch, setApenasComMatch] = useState(false);

  const orgao = resultado.orgao || {};
  const resumo = resultado.resumo || {};
  const contratos = resultado.contratos || [];

  // Abre automaticamente o contrato destacado ao navegar da guia LP
  useEffect(() => {
    if (pncpDestacado) {
      const idx = contratos.findIndex(c => c.numeroControlePNCP === pncpDestacado);
      if (idx !== -1 && !contratosAbertos.includes(idx)) {
        setContratosAbertos(prev => [...prev, idx]);
        setAbaAtiva(idx);
      }
    }
  }, [pncpDestacado]); // eslint-disable-line react-hooks/exhaustive-deps

  // Alterna a abertura/fechamento de um contrato na popup
  const toggleContrato = (idx) => {
    setContratosAbertos(prev => {
      if (prev.includes(idx)) {
        const next = prev.filter(i => i !== idx);
        // Se fechar a aba ativa, muda para a ultima disponivel
        if (abaAtiva === idx && next.length > 0) {
          setAbaAtiva(next[next.length - 1]);
        } else if (next.length === 0) {
          setAbaAtiva(null);
        }
        return next;
      }
      // Se for o primeiro contrato aberto, define como aba ativa
      if (prev.length === 0) setAbaAtiva(idx);
      return [...prev, idx];
    });
  };

  // Agrupa contratos por categoria, somando os valores globais
  const categorias = useMemo(() => {
    const cats = {};
    contratos.forEach((c) => {
      const nome = c.categoriaProcesso?.nome || c.modalidadeNome || 'Sem categoria';
      cats[nome] = (cats[nome] || 0) + valorNumerico(c.valorGlobal ?? c.valorTotalEstimado);
    });
    return cats;
  }, [contratos]);

  // Filtra contratos por categoria e aplica ordenacao
  const contratosFiltrados = useMemo(() => {
    let lista = [...contratos];

    // Filtro por categoria
    if (filtroCategoria !== 'todas') {
      lista = lista.filter((c) => (c.categoriaProcesso?.nome || 'Sem categoria') === filtroCategoria);
    }

    // Filtro: apenas licitacoes com ligacao politica
    if (apenasComMatch && pncpComMatch) {
      lista = lista.filter((c) => pncpComMatch.has(c.numeroControlePNCP));
    }

    // Ordenacao: licitacoes com match aparecem primeiro,
    // depois aplica o criterio escolhido pelo usuario
    lista.sort((a, b) => {
      const aMatch = pncpComMatch?.has(a.numeroControlePNCP) || false;
      const bMatch = pncpComMatch?.has(b.numeroControlePNCP) || false;
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      switch (ordem) {
        case 'data':
          return (b.dataAssinatura || b.dataInclusao || '').localeCompare(a.dataAssinatura || a.dataInclusao || '');
        case 'vigencia':
          return (b.dataVigenciaInicio || b.dataAberturaProposta || '').localeCompare(a.dataVigenciaInicio || a.dataAberturaProposta || '');
        case 'valor':
          return valorNumerico(b.valorGlobal ?? b.valorTotalEstimado) - valorNumerico(a.valorGlobal ?? a.valorTotalEstimado);
        case 'categoria':
          return (a.categoriaProcesso?.nome || a.modalidadeNome || '').localeCompare(b.categoriaProcesso?.nome || b.modalidadeNome || '');
        default:
          return 0;
      }
    });

    return lista;
  }, [contratos, filtroCategoria, ordem, apenasComMatch, pncpComMatch]);

  const categoriasList = Object.keys(categorias).sort();

  return (
    <div className="orgao-card">
      {/* Cabecalho clicavel com nome do orgao e sumario */}
      <div className="orgao-header" onClick={() => setAberto(!aberto)}>
        <div>
          <div className="orgao-nome">{orgao.razaoSocial || 'CNPJ ' + fmtCNPJ(orgao.cnpj)}</div>
          <div className="orgao-cnpj">{fmtCNPJ(orgao.cnpj)}</div>
        </div>
        <div className="orgao-sumario">
          {resumo.totalContratos || 0} contratos &middot; {fmtValor(resumo.valorTotalContratos)}
        </div>
        <span className="seta">{aberto ? '▼' : '▶'}</span>
      </div>

      {/* Conteudo detalhado quando expandido */}
      {aberto && (
        <div className="orgao-body">
          {/* Grid de resumo: total contratos, empresas, valor total */}
          <div className="resumo-grid">
            <div className="resumo-item">
              <div className="resumo-valor">{resumo.totalContratos || 0}</div>
              <div className="resumo-label">Contratos</div>
            </div>
            <div className="resumo-item">
              <div className="resumo-valor">{resumo.totalEmpresas || 0}</div>
              <div className="resumo-label">Empresas</div>
            </div>
            <div className="resumo-item">
              <div className="resumo-valor">{fmtValor(resumo.valorTotalContratos)}</div>
              <div className="resumo-label">Valor Total</div>
            </div>
          </div>

          {/* Breakdown por categoria */}
          {categoriasList.length > 0 && (
            <div className="cat-breakdown">
              <h4 className="cat-breakdown-titulo">Por Categoria</h4>
              <div className="cat-breakdown-grid">
                {categoriasList.map((cat) => (
                  <div key={cat} className="cat-item">
                    <div className="cat-nome">{cat}</div>
                    <div className="cat-valor">{fmtValor(categorias[cat])}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabela de contratos */}
          {contratos.length > 0 && (
            <>
              {/* Barra de filtros: categoria e ordenacao */}
              <div className="filtros-bar">
                <div className="filtro-group">
                  <label className="filtro-label">Filtrar</label>
                  <select
                    className="filtro-select"
                    value={filtroCategoria}
                    onChange={(e) => { setFiltroCategoria(e.target.value); setContratosAbertos([]); setAbaAtiva(null); }}
                  >
                    <option value="todas">Todas as categorias</option>
                    {categoriasList.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="filtro-group">
                  <label className="filtro-label">Ordenar</label>
                  <select
                    className="filtro-select"
                    value={ordem}
                    onChange={(e) => { setOrdem(e.target.value); setContratosAbertos([]); setAbaAtiva(null); }}
                  >
                    <option value="data">Data (mais recente)</option>
                    <option value="vigencia">Vigencia</option>
                    <option value="valor">Valor (maior)</option>
                    <option value="categoria">Categoria</option>
                  </select>
                </div>
                <div className="filtro-group">
                  <label className="filtro-label checkbox-label">
                    <input
                      type="checkbox"
                      checked={apenasComMatch}
                      onChange={(e) => { setApenasComMatch(e.target.checked); setContratosAbertos([]); setAbaAtiva(null); }}
                    />
                    So c/ lig. politica
                  </label>
                </div>
                <div className="filtro-info">
                  {contratosFiltrados.length} de {contratos.length} contratos
                </div>
              </div>

              {/* Tabela de contratos */}
              <div className="tabela-wrapper">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Contrato</th>
                      <th>Tipo</th>
                      <th>Categoria</th>
                      <th>Fornecedor</th>
                      <th>Objeto</th>
                      <th>Vigência</th>
                      <th>Data Publ.</th>
                      <th>Valor Global</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contratosFiltrados.map((c, i) => {
                      const idxOriginal = contratos.indexOf(c);
                      const estaDestacado = pncpDestacado && c.numeroControlePNCP === pncpDestacado;
                      const estaAberto = contratosAbertos.includes(idxOriginal);
                      const temMatch = pncpComMatch?.has(c.numeroControlePNCP) || false;
                      const rowClass = estaDestacado ? 'pncp-destacado' : temMatch ? 'tem-match' : '';
                      return (
                        <tr key={idxOriginal} className={rowClass}>
                          <td>
                            <span
                              className="expand-btn"
                              onClick={() => toggleContrato(idxOriginal)}
                            >
                              {estaAberto ? '−' : '+'}
                            </span>
                          </td>
                          <td
                            className={`cell-contrato clickable ${estaAberto ? 'pncp-aberto' : ''}`}
                            onClick={() => toggleContrato(idxOriginal)}
                          >
                            {temMatch && <span className="match-indicator" title="Possui ligacao politica">⚡</span>}
                            {(c.numeroControlePNCP || '').slice(-12)}
                          </td>
                          <td>{c.tipoContrato?.nome || c.modalidadeNome || '-'}</td>
                          <td><span className="cell-categoria">{c.categoriaProcesso?.nome || c.modalidadeNome || '-'}</span></td>
                          <td><span className="fn-nome">{c.fornecedor?.razaoSocial || c.niFornecedor || (c.valorTotalEstimado != null ? 'Compra Direta' : '-')}</span></td>
                          <td className="cell-objeto" title={c.objetoContrato || c.objetoCompra || ''}>
                            {(c.objetoContrato || c.objetoCompra || '-').substring(0, 60)}{(c.objetoContrato || c.objetoCompra || '').length > 60 ? '…' : ''}
                          </td>
                          <td className="cell-vigencia">
                            {fmtData(c.dataVigenciaInicio || c.dataAberturaProposta)} ~ {fmtData(c.dataVigenciaFim || c.dataEncerramentoProposta)}
                          </td>
                          <td>{fmtData(c.dataPublicacaoPncp)}</td>
                          <td className="cell-valor">{fmtValor(c.valorGlobal ?? c.valorTotalEstimado)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Mensagem quando nao ha contratos */}
          {contratos.length === 0 && (
            <p className="sem-contratos">Nenhum contrato encontrado.</p>
          )}

          {/* Janela unica com abas para todos os contratos abertos */}
          {contratosAbertos.length > 0 && createPortal(
            <JanelaPopup
              titulo={`Contratos (${contratosAbertos.length})`}
              onFechar={() => { setContratosAbertos([]); setAbaAtiva(null); }}
            >
              {/* Abas dos contratos abertos */}
              <div className="popup-abas">
                {contratosAbertos.map(idx => (
                  <button
                    key={idx}
                    className={`popup-aba ${abaAtiva === idx ? 'ativo' : ''}`}
                    onClick={() => setAbaAtiva(idx)}
                  >
                    {(contratos[idx].numeroControlePNCP || '').slice(-12)}
                  </button>
                ))}
              </div>
              {/* Conteudo da aba ativa */}
              {abaAtiva !== null && contratos[abaAtiva] && (
                <ContratoDetalhes contrato={contratos[abaAtiva]} onIdClick={onIdClick} />
              )}
            </JanelaPopup>,
            document.body
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Componente principal Resultados
// Renderiza a lista de cartoes de orgaos
// Aceita pncpDestacado para destaque vindo da guia LP
// ═══════════════════════════════════════════════════
export default function Resultados({ resultados, consultaMeta, pncpDestacado, onAnaliseDetalhada, pncpComMatch, onIdClick }) {
  if (!resultados || resultados.length === 0) {
    return (
      <p className="sem-contratos">Nenhum resultado disponivel.</p>
    );
  }

  return resultados.map((r, i) => (
    <OrgaoCard key={i} resultado={r} consultaMeta={consultaMeta} pncpDestacado={pncpDestacado} onAnaliseDetalhada={onAnaliseDetalhada} pncpComMatch={pncpComMatch} onIdClick={onIdClick} />
  ));
}
