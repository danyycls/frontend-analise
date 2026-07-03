import { useState } from 'react';

export type DataSourceInfo = { font: string; desc: string; campos: Record<string, string> };

export const DATA_SOURCES: Record<string, DataSourceInfo> = {
  /* ─── PNCP ─── */
  pncp_licitacoes: {
    font: 'PNCP — Portal Nacional de Contratações Públicas',
    desc: 'Licitações e contratos públicos consultados por órgão (CNPJ) ou por Estado/Município, incluindo tipo, categoria, fornecedor, vigência e valores.',
    campos: {
      numeroControlePNCP: 'Identificador único do contrato no PNCP',
      orgao: 'Órgão contratante (CNPJ e razão social)',
      fornecedor: 'Fornecedor com CNPJ, razão social e QSA',
      tipoContrato: 'Tipo de contrato (ex: Fornecimento, Serviço)',
      categoriaProcesso: 'Categoria do processo licitatório',
      modalidadeNome: 'Modalidade da licitação (ex: Pregão, Concorrência)',
      objetoContrato: 'Descrição do objeto contratado',
      valorGlobal: 'Valor global do contrato',
      dataVigencia: 'Período de vigência do contrato',
      dataPublicacaoPncp: 'Data de publicação no PNCP',
    },
  },
  pncp_contratos: {
    font: 'PNCP — Portal Nacional de Contratações Públicas',
    desc: 'Contratos e compras públicas realizadas por órgãos públicos em todo o Brasil.',
    campos: {},
  },

  /* ─── Portal da Transparência ─── */
  portal_orgaos: {
    font: 'Portal da Transparência — Órgãos Públicos (SIAPE/SIAFI)',
    desc: 'Órgãos públicos federais cadastrados nos sistemas SIAPE (pessoal) e SIAFI (financeiro). Consulta por código ou nome do órgão.',
    campos: {
      codigo: 'Código do órgão no sistema',
      nome: 'Nome oficial do órgão',
      sigla: 'Sigla do órgão',
      cnpj: 'CNPJ do órgão',
    },
  },
  portal_pessoas: {
    font: 'Portal da Transparência — Pessoas Físicas e Jurídicas',
    desc: 'Pessoas físicas ou jurídicas com vínculos na administração pública federal. Consulta por CPF, CNPJ ou nome.',
    campos: {
      documento: 'CPF ou CNPJ da pessoa',
      nome: 'Nome da pessoa física ou razão social',
      tipo: 'Tipo (Física ou Jurídica)',
      vinculo: 'Tipo de vínculo com a administração pública',
    },
  },
  portal_cartoes: {
    font: 'Portal da Transparência — Cartões Corporativos',
    desc: 'Gastos realizados com cartões de pagamento do governo federal. Consulta por órgão, CPF do portador ou período.',
    campos: {
      codigoOrgao: 'Código do órgão responsável',
      cpfPortador: 'CPF do portador do cartão',
      cnpjFavorecido: 'CNPJ do estabelecimento favorecido',
      tipoCartao: 'Tipo de cartão (corporativo, institucional, etc.)',
      data: 'Data da transação',
      valor: 'Valor da transação',
    },
  },
  portal_servidores: {
    font: 'Portal da Transparência — Servidores Públicos',
    desc: 'Servidores públicos federais ativos e inativos. Consulta por CPF, nome ou órgão de lotação.',
    campos: {
      cpf: 'CPF do servidor',
      nome: 'Nome do servidor',
      cargo: 'Cargo ocupado',
      lotacao: 'Órgão de lotação',
      remuneracao: 'Remuneração do servidor',
      vinculo: 'Tipo de vínculo (ativo, inativo, pensionista)',
    },
  },
  portal_despesas: {
    font: 'Portal da Transparência — Despesas Governamentais',
    desc: 'Despesas executadas pela administração pública federal. Consulta por órgão, ano, UF, município ou nome do favorecido.',
    campos: {
      orgao: 'Órgão responsável pela despesa',
      ano: 'Ano de referência',
      favorecido: 'Nome do favorecido (pessoa física ou jurídica)',
      valorEmpenhado: 'Valor empenhado (reservado orçamentariamente)',
      valorLiquidado: 'Valor liquidado (bem/serviço entregue)',
      valorPago: 'Valor efetivamente pago',
    },
  },
  portal_emendas: {
    font: 'Portal da Transparência — Emendas Parlamentares',
    desc: 'Emendas parlamentares ao orçamento federal. Consulta por código, autor, ano ou tipo de emenda.',
    campos: {
      codigoEmenda: 'Código identificador da emenda',
      autor: 'Nome do autor da emenda (parlamentar)',
      ano: 'Ano de referência',
      tipo: 'Tipo de emenda (individual, de bancada, etc.)',
      valor: 'Valor da emenda',
      orgaoBeneficiado: 'Órgão beneficiado pela emenda',
      situacao: 'Situação atual da emenda',
    },
  },
  portal_recursos: {
    font: 'Portal da Transparência — Transferências a Entes',
    desc: 'Recursos federais transferidos a estados e municípios.',
    campos: {
      tipo_pessoa: 'Tipo de pessoa (Física ou Jurídica) do favorecido',
      nome_pessoa: 'Nome do favorecido',
      nome_ug: 'Unidade Gestora responsável',
      nome_orgao: 'Órgão concedente do recurso',
      valor: 'Valor do recurso transferido',
      mes_ano: 'Mês e ano de referência',
    },
  },
  convenios: {
    font: 'Portal da Transparência — Convênios',
    desc: 'Convênios firmados entre a União e órgãos públicos (estados, municípios, consórcios), incluindo dados do convenente, valores e situação.',
    campos: {
      cnpj: 'CNPJ do órgão convenente',
      uf: 'Unidade Federativa do convenente',
      municipio: 'Município do convenente',
      nome_orgao: 'Nome do órgão/entidade convenente',
      tipo: 'Tipo do convenente (ex: Estado, Município, Consórcio)',
      numero_convenio: 'Número do convênio',
      situacao_convenio: 'Situação atual do convênio',
      objeto_convenio: 'Objeto do convênio',
      valor_convenio: 'Valor total do convênio',
      valor_liberado: 'Valor já liberado',
    },
  },

  /* ─── TSE ─── */
  tse_empresas: {
    font: 'TSE — Tribunal Superior Eleitoral (Despesas e Receitas por Empresa)',
    desc: 'Despesas e receitas eleitorais declaradas ao TSE por campanhas, filtradas pelo CNPJ da empresa. Mostra valores, datas e candidatos envolvidos.',
    campos: {
      cnpj: 'CNPJ da empresa consultada',
      totalReceitas: 'Total de receitas recebidas pela empresa nas campanhas',
      totalDespesas: 'Total de despesas pagas pela empresa nas campanhas',
      receitas: 'Lista de receitas com valor, data, origem e candidato/partido',
      despesas: 'Lista de despesas com valor, data, descrição e candidato/partido',
    },
  },
  tse_cargo: {
    font: 'TSE — Tribunal Superior Eleitoral (Candidatos por Cargo)',
    desc: 'Candidatos a cargos eletivos (presidente, governador, senador, deputado federal, deputado estadual, prefeito, vereador) filtrados por cargo, UF e situação.',
    campos: {
      cargo: 'Cargo eletivo (ex: Presidente, Governador, Senador)',
      uf: 'Unidade Federativa',
      situacao: 'Situação do candidato (eleito/não eleito)',
      nome: 'Nome do candidato',
      partido: 'Partido político do candidato',
      votacao: 'Votação recebida',
    },
  },
  tse_partido: {
    font: 'TSE — Tribunal Superior Eleitoral (Candidatos por Partido)',
    desc: 'Candidatos filiados a um partido político, com opção de filtrar por UF e situação (eleitos/não eleitos).',
    campos: {
      partido: 'Partido político',
      uf: 'Unidade Federativa',
      situacao: 'Situação do candidato (eleito/não eleito)',
      nome: 'Nome do candidato',
      cargo: 'Cargo a que concorre',
    },
  },
  tse_doador: {
    font: 'TSE — Tribunal Superior Eleitoral (Relação de Doadores)',
    desc: 'Doações de campanha recebidas por candidatos e partidos, filtradas pelo CPF/CNPJ do doador. Exibe valor, data e origem de cada doação.',
    campos: {
      documento: 'CPF ou CNPJ do doador',
      nome: 'Nome do doador',
      receitas: 'Lista de doações com valor, data, origem e candidato/partido beneficiado',
    },
  },
  tse_fornecedor: {
    font: 'TSE — Tribunal Superior Eleitoral (Relação de Fornecedores)',
    desc: 'Despesas de campanha pagas a fornecedores, filtradas pelo CPF/CNPJ. Exibe valor, data e descrição de cada despesa.',
    campos: {
      documento: 'CPF ou CNPJ do fornecedor',
      nome: 'Nome do fornecedor',
      despesas: 'Lista de despesas com valor, data, descrição e candidato/partido contratante',
    },
  },
  tse_candidatos: {
    font: 'TSE — Tribunal Superior Eleitoral (Dados Eleitorais)',
    desc: 'Prefeitos, vice-prefeitos e vereadores eleitos, deputados federais e estaduais, senadores — resultados de eleições.',
    campos: {},
  },

  /* ─── Câmara dos Deputados ─── */
  camara_deputados: {
    font: 'Câmara dos Deputados — Dados Abertos',
    desc: 'Deputados federais em exercício, despesas parlamentares, órgãos de atuação, frentes parlamentares, proposições, eventos e votações.',
    campos: {
      nome: 'Nome do deputado',
      partido: 'Partido político',
      uf: 'Unidade Federativa',
      despesas: 'Despesas parlamentares por ano, mês e tipo',
      orgaos: 'Órgãos e comissões de atuação',
      frentes: 'Frentes parlamentares integradas',
      proposicoes: 'Proposições apresentadas',
      votacoes: 'Registro de votações',
    },
  },

  /* ─── Senado Federal ─── */
  senado_federal: {
    font: 'Senado Federal — Dados Abertos',
    desc: 'Senadores em exercício, cargos, comissões, mandatos, emendas parlamentares, processos legislativos e agenda do plenário.',
    campos: {
      nome: 'Nome do senador',
      partido: 'Partido político',
      uf: 'Unidade Federativa',
      comissoes: 'Comissões que integra',
      mandatos: 'Histórico de mandatos',
      emendas: 'Emendas propostas',
      processos: 'Processos legislativos',
      agenda: 'Agenda de sessões e reuniões',
    },
  },

  /* ─── SICONFI ─── */
  siconfi_despesa_pessoal: {
    font: 'SICONFI / Tesouro Nacional — RGF (Anexo 01)',
    desc: 'Demonstrativo da Despesa com Pessoal — limite da Lei de Responsabilidade Fiscal (LRF).',
    campos: {
      valor_total: 'Valor total da despesa com pessoal no exercício',
      percentual_rcl: 'Percentual em relação à Receita Corrente Líquida (RCL)',
      periodo: 'Período de referência (ano)',
    },
  },
  siconfi_despesa_categoria: {
    font: 'SICONFI / Tesouro Nacional — RGF (Anexo 01)',
    desc: 'Despesa com pessoal por categoria (ativos, inativos, pensionistas, terceirizados).',
    campos: {
      categoria: 'Categoria funcional do servidor',
      quantidade: 'Quantidade de vínculos na categoria',
      despesa_total: 'Valor total da despesa da categoria',
      percentual_despesa: 'Percentual em relação à despesa total com pessoal',
    },
  },
  siconfi_gastos_funcao: {
    font: 'SICONFI / Tesouro Nacional — RREO (Anexo 02)',
    desc: 'Despesas empenhadas, liquidadas e pagas por função de governo.',
    campos: {
      funcao: 'Função de governo (ex: Saúde, Educação, Segurança)',
      empenhado: 'Valor empenhado (reservado orçamentariamente)',
      liquidado: 'Valor liquidado (bem/serviço entregue)',
      pago: 'Valor efetivamente pago',
    },
  },
  siconfi_receitas: {
    font: 'SICONFI / Tesouro Nacional — RREO (Anexo 03)',
    desc: 'Receitas arrecadadas por categoria econômica.',
    campos: {
      conta: 'Classificação da receita orçamentária',
      coluna: 'Tipo de valor (Previsão Inicial, Previsão Atualizada, Receita Realizada)',
      valor: 'Valor da receita no exercício',
      exercicio: 'Ano de referência',
    },
  },
  siconfi_servidores: {
    font: 'SICONFI / Tesouro Nacional — RGF (Anexo 01)',
    desc: 'Despesa com pessoal por categoria funcional.',
    campos: {
      categoria: 'Categoria funcional',
      quantidade: 'Quantidade de servidores na categoria',
      despesa_total: 'Valor total da despesa da categoria',
      percentual_despesa: 'Percentual em relação à despesa total com pessoal',
    },
  },

  /* ─── TCU ─── */
  tcu_contas_irregulares: {
    font: 'TCU — Tribunal de Contas da União (CADIRREG)',
    desc: 'Pessoas físicas e jurídicas com contas julgadas irregulares pelo TCU. Consulta por nome, CPF, CNPJ, UF ou município.',
    campos: {
      nome: 'Nome da pessoa física ou jurídica',
      processo: 'Número do processo no TCU',
      tipoRegistro: 'Tipo de registro no CADIRREG',
      municipio: 'Município',
      uf: 'Unidade Federativa',
      dataTransito: 'Data de trânsito em julgado',
      acordao: 'Número do acórdão',
    },
  },
  tcu_fins_eleitorais: {
    font: 'TCU — Tribunal de Contas da União (Fins Eleitorais)',
    desc: 'Contas julgadas irregulares com implicação eleitoral nos últimos 8 anos, que podem afetar a candidatura do responsável.',
    campos: {
      nome: 'Nome da pessoa',
      processo: 'Número do processo no TCU',
      dataFimEfeito: 'Data final do efeito eleitoral',
      uf: 'Unidade Federativa',
      municipio: 'Município',
    },
  },
  tcu_inabilitados: {
    font: 'TCU — Tribunal de Contas da União (Inabilitados)',
    desc: 'Pessoas inabilitadas para o exercício de cargo em comissão por decisão do TCU.',
    campos: {
      nome: 'Nome da pessoa',
      processo: 'Número do processo',
      tipoSancao: 'Tipo de sanção aplicada',
      dataInicio: 'Início da inabilitação',
      dataFim: 'Fim da inabilitação',
    },
  },
  tcu_inidoneos: {
    font: 'TCU — Tribunal de Contas da União (Inidôneos)',
    desc: 'Empresas e pessoas físicas declaradas inidôneas pelo TCU, impedidas de licitar com a administração pública.',
    campos: {
      nome: 'Nome da empresa ou pessoa',
      processo: 'Número do processo',
      tipoSancao: 'Tipo de sanção',
      dataInicio: 'Início da sanção',
      dataFim: 'Fim da sanção',
    },
  },

  /* ─── Anomalias ─── */
  anomalia_geral: {
    font: 'Análise de Anomalias — PNCP + TSE + TCU + Portal da Transparência',
    desc: 'Cruzamento automático de dados de licitações públicas (PNCP) com bases de vínculos políticos (TSE), sanções (TCU), servidores públicos e pessoas politicamente expostas (Portal da Transparência). Quando um fornecedor ou sócio é encontrado em alguma dessas bases, um registro de anomalia é criado.',
    campos: {
      documento_rastreado: 'CPF/CNPJ rastreado (fornecedor ou sócio)',
      nome: 'Nome do documento rastreado',
      origem: 'Origem do vínculo (principal = fornecedor, socio = sócio do fornecedor)',
      orgao_cnpj: 'CNPJ do órgão contratante',
      orgao_nome: 'Nome do órgão contratante',
      uf: 'UF do órgão contratante',
      municipio: 'Município do órgão contratante',
      numero_controle_pncp: 'Identificador do contrato no PNCP',
      vinculos: 'Lista de vínculos encontrados (TSE/TCU/Servidor/PEP)',
      titulo: 'Descrição resumida do vínculo',
      tags: 'Tags de categorização do vínculo',
    },
  },
  anomalia_tse: {
    font: 'Anomalias — Verificação TSE (Tribunal Superior Eleitoral)',
    desc: 'Verifica se fornecedores e sócios de contratos públicos são doadores de campanha, fornecedores de campanha ou receberam doações partidárias. Dados provenientes do TSE.',
    campos: {
      tipo: 'Tipo de vínculo: Fornecedor, Doador, Doação Candidato ou Doação Partido',
      documento: 'CPF/CNPJ com vínculo eleitoral',
      nome: 'Nome registrado no TSE',
    },
  },
  anomalia_tcu: {
    font: 'Anomalias — Verificação TCU (Tribunal de Contas da União)',
    desc: 'Verifica se fornecedores e sócios de contratos públicos possuem contas julgadas irregulares, estão inabilitados para cargos públicos ou foram declarados inidôneos. Dados provenientes do TCU.',
    campos: {
      tipo: 'Tipo: Contas Irregulares, Inabilitado ou Inidôneo',
      documento: 'CPF/CNPJ com restrição no TCU',
      nome: 'Nome registrado no TCU',
      processo: 'Número do processo',
    },
  },
  anomalia_portal: {
    font: 'Anomalias — Verificação Portal da Transparência',
    desc: 'Verifica se fornecedores e sócios de contratos públicos são servidores públicos federais ativos ou pessoas politicamente expostas (PEPs). Dados provenientes do Portal da Transparência do Governo Federal.',
    campos: {
      tipo: 'Tipo: Servidor Público ou Pessoa Exposta (PEP)',
      documento: 'CPF com vínculo público',
      nome: 'Nome registrado no Portal',
      cargo: 'Cargo público',
    },
  },
};

interface InfoBadgeProps {
  chave: string;
  onInfoClick: (chave: string) => void;
}

export function InfoBadge({ chave, onInfoClick }: InfoBadgeProps) {
  const info = DATA_SOURCES[chave];
  if (!info) return null;
  return (
    <span
      className="info-badge"
      onClick={() => onInfoClick(chave)}
      title="Clique para ver descrição dos campos"
      style={{ cursor: 'pointer', fontSize: '0.65rem', color: 'var(--accent)', marginLeft: 8, textDecoration: 'underline dotted', whiteSpace: 'nowrap' }}
    >
      ⓘ {info.font}
    </span>
  );
}

interface PopupInfoProps {
  chave: string;
  onFechar: () => void;
}

export function PopupInfo({ chave, onFechar }: PopupInfoProps) {
  const info = DATA_SOURCES[chave];
  if (!info) return null;
  const campos = Object.entries(info.campos || {});
  return (
    <div className="dm-modal-overlay" onClick={onFechar}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="dm-modal-header">
          <h3>Fonte: {info.font}</h3>
          <button className="dm-modal-close" onClick={onFechar}>×</button>
        </div>
        <div className="dm-modal-body">
          <p style={{ marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{info.desc}</p>
          {campos.length > 0 && (
            <table className="dm-detalhe-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>Campo</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {campos.map(([campo, desc]) => (
                  <tr key={campo}>
                    <td className="dm-detalhe-label" style={{ whiteSpace: 'nowrap' }}>{campo}</td>
                    <td className="dm-detalhe-valor">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {campos.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Detalhamento dos campos não disponível para esta seção.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function useEntityInfo() {
  const [popupInfo, setPopupInfo] = useState<string | null>(null);
  return { popupInfo, setPopupInfo };
}
