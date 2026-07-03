/**
 * Formata um documento (CPF ou CNPJ).
 * CPF: 11 dígitos → XXX.XXX.XXX-XX
 * CNPJ: 14 dígitos → XX.XXX.XXX/XXXX-XX
 */
export function fmtDoc(d: string | null | undefined): string {
  if (!d) return '-';
  const s = String(d).replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return String(d);
}

/**
 * Formata um valor genérico para exibição.
 */
export function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return v.toLocaleString('pt-BR');
    return v.toFixed(2).replace('.', ',');
  }
  return String(v);
}

/**
 * Formata valor monetário em real (R$).
 */
export function fmtValor(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return '-';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Converte data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY).
 */
export function fmtData(d: string | null | undefined): string {
  if (!d) return '-';
  const m = d.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return d;
}

/**
 * Formata timestamp para string localizada.
 */
export function fmtCreated(v: string | null | undefined): string {
  if (!v) return '-';
  return new Date(v).toLocaleString('pt-BR');
}

/**
 * Formata número grande com separadores brasileiros.
 */
export function fmtNum(n: number | null | undefined): string {
  if (!n && n !== 0) return '-';
  return n.toLocaleString('pt-BR');
}

/**
 * Formata valor monetário simples (R$ X.XXX,XX).
 */
export function fmtMoney(v: number | null | undefined): string {
  if (!v && v !== 0) return '-';
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formata CNPJ puro para padrão XX.XXX.XXX/XXXX-XX.
 */
export function fmtCNPJ(c: string | null | undefined): string {
  if (!c || c.length !== 14) return c || '-';
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

/**
 * Formata booleano para "Sim" / "Não".
 */
export function fmtBool(v: boolean | null | undefined): string {
  if (v === true) return 'Sim';
  if (v === false) return 'Não';
  return '-';
}

/**
 * Formata número de 6 dígitos (YYYYMM) para MM/YYYY.
 */
export function fmtMesAno(n: string | null | undefined): string {
  if (!n) return '-';
  const s = String(n);
  if (s.length === 6) return `${s.substring(4, 6)}/${s.substring(0, 4)}`;
  return s;
}

/**
 * Formata percentual.
 */
export function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return '-';
  return `${n.toFixed(1)}%`;
}

/**
 * Normaliza CNPJ removendo todos os caracteres não-dígitos.
 * Útil para comparar CNPJs com/sem formatação.
 */
export function normalizarCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}
