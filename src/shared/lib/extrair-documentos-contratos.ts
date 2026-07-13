export interface LicitacaoInput {
  numero_controle_pncp: string;
  cpf_cnpj: string;
  socios: { nome: string; documento: string }[];
  orgao_cnpj: string;
  orgao_nome: string;
  uf: string;
  municipio: string;
  valor_global: number;
  nome_empresa: string;
  data_publicacao_pncp?: string;
  valor_total_estimado?: number;
  valor_total_homologado?: number;
  amparo_legal?: { codigo?: string; nome?: string; descricao?: string };
  orgao_entidade?: { cnpj?: string; razao_social?: string; esfera_id?: string; poder_id?: string };
  anormalidades?: AnormalidadeInput[];
  objeto_contrato?: string;
  data_vigencia_inicio?: string;
  data_vigencia_fim?: string;
}

interface AnormalidadeInput {
  tipo: string;
  descricao: string;
  detalhes: {
    dispensa_valor_limite: {
      modalidade: string;
      categoria: string;
      valor_global: number;
      limite: number;
      excedente: number;
      objeto: string;
      regra: string;
    };
  };
}

function isDispensa(ct: any): boolean {
  const modalidade = (ct.modalidadeNome || '').toLowerCase();
  return modalidade.includes('dispensa');
}

const AMPARO_LEGAL_LIMITES: Record<number, { categoria: string; limite: number }> = {
  18: { categoria: 'obras e serviços de engenharia', limite: 100000 },
  19: { categoria: 'outros serviços e compras', limite: 50000 },
  24: { categoria: 'produtos para pesquisa e desenvolvimento', limite: 300000 },
  84: { categoria: 'obras e serviços de engenharia (estatais)', limite: 100000 },
  85: { categoria: 'outros serviços e compras (estatais)', limite: 50000 },
};

function amparoLegalDispensa(ct: any): { categoria: string; limite: number } | null {
  const codigo = ct.amparoLegal?.codigo;
  if (codigo != null) {
    const num = Number(codigo);
    if (AMPARO_LEGAL_LIMITES[num]) return AMPARO_LEGAL_LIMITES[num];
  }
  return null;
}

function textoNormalizado(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function valorContrato(ct: any): number {
  return Number(
    ct.valorGlobal ??
    ct.valorInicialGlobal ??
    ct.valorTotalEstimado ??
    ct.valorTotalHomologado ??
    ct.valorInicial ??
    0
  ) || 0;
}

function objetoContrato(ct: any): string {
  return [
    ct.objetoContrato,
    ct.objetoCompra,
    ct.objeto,
    ct.produto,
    ct.categoriaProcesso?.nome,
    ct.tipoContrato?.nome,
    ct.amparoLegal?.nome,
    ct.amparoLegal?.descricao,
  ].filter(Boolean).join(' ');
}

function classificarDispensa(ct: any): { categoria: string; limite: number } {
  const byCode = amparoLegalDispensa(ct);
  if (byCode) return byCode;

  const texto = textoNormalizado(objetoContrato(ct));
  const engenharia = /\b(obra|obras|engenharia|servico de engenharia|servicos de engenharia)\b/.test(texto);

  return engenharia
    ? { categoria: 'obras e serviços de engenharia', limite: 100000 }
    : { categoria: 'outros serviços e compras', limite: 50000 };
}

function anormalidadesDispensa(ct: any): AnormalidadeInput[] {
  if (!isDispensa(ct)) return [];

  const valor = valorContrato(ct);
  const { categoria, limite } = classificarDispensa(ct);
  if (valor <= limite) return [];

  const modalidade = ct.modalidadeNome || 'Dispensa de Licitação';
  const objeto = objetoContrato(ct);
  const orgaoNome = ct.orgaoEntidade?.razaoSocial || ct.nomeOrgao || 'Órgão';
  const perc = ((valor - limite) / limite * 100).toFixed(1);

  return [{
    tipo: 'dispensa_valor_limite',
    descricao: `${orgaoNome} aprovou licitacao no valor de R$ ${valor.toFixed(2)}, na modalidade de ${modalidade}, sendo o valor ${perc}% superior ao limite legal permitido (R$ ${limite.toFixed(2)}).`,
    detalhes: {
      dispensa_valor_limite: {
        modalidade,
        categoria,
        valor_global: valor,
        limite,
        excedente: valor - limite,
        objeto,
        regra: 'Art. 75 da Lei 14.133/2021: baixo valor limitado a R$ 100.000,00 para obras e serviços de engenharia e R$ 50.000,00 para outros serviços e compras.',
      },
    },
  }];
}

function extrairDadosContrato(ct: any) {
  return {
    orgao_cnpj: ct.orgaoEntidade?.cnpj || ct.cnpjOrgao || '',
    orgao_nome: ct.orgaoEntidade?.razaoSocial || ct.nomeOrgao || '',
    uf: ct.unidadeOrgao?.ufSigla || ct.orgaoEntidade?.ufSigla || '',
    municipio: ct.unidadeOrgao?.municipioNome || ct.orgaoEntidade?.municipioNome || '',
    valor_global: valorContrato(ct),
    nome_empresa: ct.fornecedor?.razaoSocial || ct.fornecedor?.nomeFantasia || 'não localizado',
    data_publicacao_pncp: ct.dataPublicacaoPncp ?? undefined,
    valor_total_estimado: ct.valorTotalEstimado ?? undefined,
    valor_total_homologado: ct.valorTotalHomologado ?? undefined,
    amparo_legal: ct.amparoLegal ? {
      codigo: ct.amparoLegal.codigo != null ? String(ct.amparoLegal.codigo) : undefined,
      nome: ct.amparoLegal.nome,
      descricao: ct.amparoLegal.descricao,
    } : undefined,
    orgao_entidade: ct.orgaoEntidade ? {
      cnpj: ct.orgaoEntidade.cnpj,
      razao_social: ct.orgaoEntidade.razaoSocial,
      esfera_id: ct.orgaoEntidade.esferaId,
      poder_id: ct.orgaoEntidade.poderId,
    } : undefined,
  };
}

function makeInput(
  ct: any,
  cpf_cnpj: string,
  socios: { nome: string; documento: string }[],
  anormalidades: AnormalidadeInput[] = [],
): LicitacaoInput {
  return {
    numero_controle_pncp: ct.numeroControlePNCP || '',
    cpf_cnpj,
    socios,
    objeto_contrato: objetoContrato(ct),
    data_vigencia_inicio: ct.dataVigenciaInicio || ct.vigenciaInicio || '',
    data_vigencia_fim: ct.dataVigenciaFim || ct.vigenciaFim || '',
    ...(anormalidades.length > 0 ? { anormalidades } : {}),
    ...extrairDadosContrato(ct),
  };
}

export function extrairDocumentosDosContratos(dados: any[]): LicitacaoInput[] {
  const contratos = dados.flatMap(d =>
    Array.isArray(d.contratos) ? d.contratos : [d]
  );

  const lista: LicitacaoInput[] = [];
  const seen = new Set<string>();

  contratos.forEach(ct => {
    const anormalidades = anormalidadesDispensa(ct);
    if (isDispensa(ct) && anormalidades.length === 0) return;

    const mainDoc = ct.fornecedor?.cnpj || ct.niFornecedor || ct.orgaoEntidade?.cnpj;
    if (mainDoc && mainDoc.length >= 3) {
      const key = `${ct.numeroControlePNCP || ''}_${mainDoc}`;
      if (!seen.has(key)) {
        seen.add(key);
        lista.push(makeInput(ct, mainDoc,
          (ct.fornecedor?.qsa || []).map((s: any) => ({
            nome: s.nome_socio || '',
            documento: s.cnpj_cpf_socio || '',
          })),
          anormalidades,
        ));
      }
    }

    if (ct.niFornecedor && ct.niFornecedor !== mainDoc && ct.niFornecedor !== ct.orgaoEntidade?.cnpj && ct.niFornecedor.length >= 3) {
      const key = `${ct.numeroControlePNCP || ''}_ni_${ct.niFornecedor}`;
      if (!seen.has(key)) {
        seen.add(key);
        lista.push(makeInput(ct, ct.niFornecedor,
          (ct.fornecedor?.qsa || []).map((s: any) => ({
            nome: s.nome_socio || '',
            documento: s.cnpj_cpf_socio || '',
          })),
          anormalidades,
        ));
      }
    }

    (ct.fornecedor?.qsa || []).forEach((s: any) => {
      const sd = s.cnpj_cpf_socio;
      if (sd && sd.length >= 3 && sd !== mainDoc && sd !== ct.niFornecedor) {
        const key = `${ct.numeroControlePNCP || ''}_socio_${sd}`;
        if (!seen.has(key)) {
          seen.add(key);
          lista.push(makeInput(ct, sd, [], anormalidades));
        }
      }
    });
  });

  return lista;
}
