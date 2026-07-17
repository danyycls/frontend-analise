// @ts-nocheck
// ═══════════════════════════════════════════════════
// Componente Resultados
// Exibe os resultados de uma consulta: lista de
// orgaos com seus contratos, filtros e detalhes
// Os detalhes do contrato abrem em uma janela popup
// que pode ser arrastada, minimizada e maximizada
// ═══════════════════════════════════════════════════

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PieChart, CHART_SIZE_MD } from '@/features/estado/ui/chart-utils';
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
        <Campo label="Ano" valor={c.anoContrato} />
        <Campo label="Nº Contrato" valor={c.numeroContrato} />
        <Campo label="Código Contrato" valor={c.codigoContrato} />
        <Campo label="Código Tipo Contrato" valor={c.codigoTipoContrato} />
        <Campo label="Nº Licitação" valor={c.numeroLicitacao} />
        <Campo label="Tipo" valor={c.tipoContrato?.nome || c.modalidadeNome} />
        <Campo label="Tipo ID" valor={c.tipoContrato?.id} />
        <Campo label="Categoria" valor={c.categoriaProcesso?.nome} />
        <Campo label="Categoria ID" valor={c.categoriaProcesso?.id} />
        <Campo label="Modalidade" valor={c.modalidadeNome} />
        <Campo label="Origem" valor={c.origemLicitacao} />
        <Campo label="Produto" valor={c.produto} />
        <Campo label="Subtipo" valor={c.subtipoContrato} />
        <Campo label="CNPJ Órgão Sub" valor={c.cnpjOrgaoSub} />
        <Campo label="Nº CNPJ" valor={c.numeroCNPJ} />
        <Campo label="Nº CPF" valor={c.numeroCPF} />
        <Campo label="SRP" valor={c.srp} />
      </Secao>

      <Secao titulo="Datas">
        <Campo label="Assinatura" valor={fmtData(c.dataAssinatura)} />
        <Campo label="Vigência Início" valor={fmtData(c.dataVigenciaInicio)} />
        <Campo label="Vigência Fim" valor={fmtData(c.dataVigenciaFim)} />
        <Campo label="Publicação" valor={fmtData(c.dataPublicacaoPncp)} />
        <Campo label="Prazo Início" valor={fmtData(c.prazoInicioVigencia)} />
        <Campo label="Prazo Fim" valor={fmtData(c.prazoTerminoVigencia)} />
      </Secao>

      <Secao titulo="Valores">
        <Campo label="Valor Global" valor={fmtValor(c.valorGlobal)} />
        <Campo label="Valor Inicial" valor={fmtValor(c.valorInicial)} />
        <Campo label="Valor Parcela" valor={fmtValor(c.valorParcela)} />
        <Campo label="Valor Total Estimado" valor={fmtValor(c.valorTotalEstimado)} />
        <Campo label="Valor Total Homologado" valor={fmtValor(c.valorTotalHomologado)} />
      </Secao>

      {(c.fonteOrcamentaria || c.codigoFonteOrcamentaria) && (
        <Secao titulo="Fonte Orçamentária">
          <Campo label="Código Fonte" valor={c.codigoFonteOrcamentaria} />
          <Campo label="Código" valor={c.fonteOrcamentaria?.codigo} />
          <Campo label="Nome" valor={c.fonteOrcamentaria?.nome} />
          <Campo label="Descrição" valor={c.fonteOrcamentaria?.descricao} />
          <Campo label="Data Inclusão" valor={c.fonteOrcamentaria?.dataInclusao} />
        </Secao>
      )}

      <Secao titulo="Objeto">
        <div className="campo-full">{c.objetoContrato || '-'}</div>
      </Secao>

      {c.amparoLegal && (
        <Secao titulo="Amparo Legal">
          <Campo label="Código" valor={c.amparoLegal?.codigo} />
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
        {c.fornecedor?.qsa?.length > 0 && (
          <div className="socios-wrapper">
            <details className="socios">
              <summary>{c.fornecedor.qsa.length} sócio(s)</summary>
              {c.fornecedor.qsa.map((s) => (
                <div key={s.cnpj_cpf_socio || s.nome_socio || s.qualificacao_socio} className="socio-card">
                  <Campo label="Nome" valor={s.nome_socio} />
                  <Campo label="CPF/CNPJ" valor={s.cnpj_cpf_socio ? <span className="ad-id-link" onClick={() => onIdClick?.('cpf_cnpj', s.cnpj_cpf_socio)}>{s.cnpj_cpf_socio}</span> : '-'} />
                  <Campo label="Qualificação" valor={s.qualificacao_socio} />
                  <Campo label="Identificador" valor={s.identificador_socio} />
                  <Campo label="Faixa Etária" valor={s.faixa_etaria} />
                  <Campo label="Código País" valor={s.codigo_pais} />
                  <Campo label="País" valor={s.pais?.descricao || s.pais?.codigo} />
                  <Campo label="Data Entrada" valor={fmtData(s.data_entrada_sociedade)} />
                  <Campo label="Representante" valor={s.nome_representante} />
                  <Campo label="Qualificação Rep." valor={s.qualificacao_representante?.descricao} />
                  <Campo label="Código Qualif. Rep." valor={s.qualificacao_representante?.codigo} />
                  <Campo label="Representante Legal" valor={s.representante_legal} />
                </div>
              ))}
            </details>
          </div>
        )}
      </Secao>

      <Secao titulo="Órgão Entidade">
        <Campo label="CNPJ" valor={c.orgaoEntidade?.cnpj ? <span className="ad-id-link" onClick={() => onIdClick?.('cpf_cnpj', c.orgaoEntidade.cnpj)}>{fmtCNPJ(c.orgaoEntidade.cnpj)}</span> : '-'} />
        <Campo label="CNPJ Órgão" valor={c.cnpjOrgao ? <span className="ad-id-link" onClick={() => onIdClick?.('cpf_cnpj', c.cnpjOrgao)}>{fmtCNPJ(c.cnpjOrgao)}</span> : '-'} />
        <Campo label="Razão Social" valor={c.orgaoEntidade?.razaoSocial} />
        <Campo label="Nome Órgão" valor={c.nomeOrgao} />
        <Campo label="Código Órgão" valor={c.codigoOrgao} />
        <Campo label="Código UG" valor={c.codigoUg} />
        <Campo label="Esfera" valor={c.orgaoEntidade?.esferaId === 'M' ? 'Municipal' : c.orgaoEntidade?.esferaId === 'E' ? 'Estadual' : c.orgaoEntidade?.esferaId === 'F' ? 'Federal' : c.orgaoEntidade?.esferaId} />
        <Campo label="Poder" valor={c.orgaoEntidade?.poderId === 'N' ? 'Executivo' : c.orgaoEntidade?.poderId === 'L' ? 'Legislativo' : c.orgaoEntidade?.poderId === 'J' ? 'Judiciário' : c.orgaoEntidade?.poderId} />
      </Secao>

      {c.orgaoSub && (
        <Secao titulo="Órgão Substituto">
          <Campo label="CNPJ" valor={c.orgaoSub?.cnpj} />
          <Campo label="Razão Social" valor={c.orgaoSub?.razaoSocial} />
          <Campo label="Esfera" valor={c.orgaoSub?.esferaId === 'M' ? 'Municipal' : c.orgaoSub?.esferaId === 'E' ? 'Estadual' : c.orgaoSub?.esferaId === 'F' ? 'Federal' : c.orgaoSub?.esferaId} />
          <Campo label="Poder" valor={c.orgaoSub?.poderId === 'N' ? 'Executivo' : c.orgaoSub?.poderId === 'L' ? 'Legislativo' : c.orgaoSub?.poderId === 'J' ? 'Judiciário' : c.orgaoSub?.poderId} />
          <Campo label="Nome" valor={c.nomeOrgaoSub} />
        </Secao>
      )}

      <Secao titulo="Unidade Órgão">
        <Campo label="Código IBGE" valor={c.unidadeOrgao?.codigoIbge} />
        <Campo label="Nome Unidade" valor={c.unidadeOrgao?.nomeUnidade} />
        <Campo label="Código Unidade" valor={c.unidadeOrgao?.codigoUnidade} />
        <Campo label="Município" valor={c.unidadeOrgao?.municipioNome} />
        <Campo label="UF" valor={c.unidadeOrgao?.ufSigla} />
        <Campo label="UF Nome" valor={c.unidadeOrgao?.ufNome} />
      </Secao>

      {c.orgaoVinculado && (
        <Secao titulo="Órgão Vinculado">
          <Campo label="Código IBGE" valor={c.orgaoVinculado?.codigoIbge} />
          <Campo label="Nome Unidade" valor={c.orgaoVinculado?.nomeUnidade} />
          <Campo label="Código Unidade" valor={c.orgaoVinculado?.codigoUnidade} />
          <Campo label="Município" valor={c.orgaoVinculado?.municipioNome} />
          <Campo label="UF" valor={c.orgaoVinculado?.ufSigla} />
          <Campo label="UF Nome" valor={c.orgaoVinculado?.ufNome} />
        </Secao>
      )}

      {c.unidadeSub && (
        <Secao titulo="Unidade Sub">
          <Campo label="Código IBGE" valor={c.unidadeSub?.codigoIbge} />
          <Campo label="Nome Unidade" valor={c.unidadeSub?.nomeUnidade} />
          <Campo label="Código Unidade" valor={c.unidadeSub?.codigoUnidade} />
          <Campo label="Município" valor={c.unidadeSub?.municipioNome} />
          <Campo label="UF" valor={c.unidadeSub?.ufSigla} />
          <Campo label="UF Nome" valor={c.unidadeSub?.ufNome} />
        </Secao>
      )}
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
  const periodo = resultado.periodo || {};
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

  const chartCategorias = useMemo(() => {
    return Object.entries(categorias)
      .map(([nome, valor]) => ({ nome, valor: Number(valor) }))
      .sort((a, b) => b.valor - a.valor);
  }, [categorias]);

  const chartFaixaValor = useMemo(() => {
    if (!contratos.length) return null;
    const faixas = {
      'Até R$ 5 mil': 0,
      'R$ 5 mil - R$ 20 mil': 0,
      'R$ 20 mil - R$ 50 mil': 0,
      'R$ 50 mil - R$ 100 mil': 0,
      'Acima de R$ 100 mil': 0,
    };
    contratos.forEach(c => {
      const v = valorNumerico(c.valorGlobal ?? c.valorTotalEstimado);
      if (v < 5000) faixas['Até R$ 5 mil'] += v;
      else if (v < 20000) faixas['R$ 5 mil - R$ 20 mil'] += v;
      else if (v < 50000) faixas['R$ 20 mil - R$ 50 mil'] += v;
      else if (v < 100000) faixas['R$ 50 mil - R$ 100 mil'] += v;
      else faixas['Acima de R$ 100 mil'] += v;
    });
    return Object.entries(faixas)
      .filter(([_, v]) => v > 0)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
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
          return (b.dataAssinatura || '').localeCompare(a.dataAssinatura || '');
        case 'vigencia':
          return (b.dataInicioVigencia || '').localeCompare(a.dataInicioVigencia || '');
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
          {(periodo.dataInicial || periodo.dataFinal) && (
            <span className="orgao-periodo"> &middot; {periodo.dataInicial || '?'} a {periodo.dataFinal || '?'}</span>
          )}
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

          {/* Charts: Valor por Categoria + Faixa de Valores */}
          {(chartCategorias.length > 0 || chartFaixaValor) && (
            <div className="resumo-chart-row">
              {chartCategorias.length > 0 && (
                <div className="chart-card-sm">
                  <div className="chart-card-title">Valor por Categoria</div>
                  <PieChart data={chartCategorias} size={CHART_SIZE_MD} />
                </div>
              )}
              {chartFaixaValor && (
                <div className="chart-card-sm">
                  <div className="chart-card-title">Valor por Faixa (R$)</div>
                  <PieChart data={chartFaixaValor} size={CHART_SIZE_MD} />
                </div>
              )}
            </div>
          )}

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
                        <tr key={c.numeroControlePNCP || idxOriginal} className={rowClass}>
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
                          <td className="cell-objeto" title={c.objetoContrato || ''}>
                            {(c.objetoContrato || '-').substring(0, 60)}{(c.objetoContrato || '').length > 60 ? '…' : ''}
                          </td>
                          <td className="cell-vigencia">
                            {fmtData(c.dataVigenciaInicio)} ~ {fmtData(c.dataVigenciaFim)}
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

  return resultados.map((r) => (
    <OrgaoCard key={r.orgao || r.orgaoCnpj || r.consultaId} resultado={r} consultaMeta={consultaMeta} pncpDestacado={pncpDestacado} onAnaliseDetalhada={onAnaliseDetalhada} pncpComMatch={pncpComMatch} onIdClick={onIdClick} />
  ));
}
