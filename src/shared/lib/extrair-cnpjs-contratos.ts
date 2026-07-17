import { normalizarCNPJ } from './formatters';

export function extrairCnpjsDosContratos(contratos: any[]): string[] {
  const cnpjs = new Set<string>();
  for (const ct of contratos) {
    const cnpj = ct.orgaoEntidade?.cnpj || ct.cnpjOrgao;
    if (cnpj) {
      const norm = normalizarCNPJ(cnpj);
      if (norm.length === 14) cnpjs.add(norm);
    }
  }
  return [...cnpjs];
}
