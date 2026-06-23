import type { RelationType } from './types'

export interface RelationMeta {
  type: RelationType
  label: string
  color: string
  dash: boolean
  width: number
}

export const RELATION_META: Record<RelationType, RelationMeta> = {
  mesmo_documento: {
    type: 'mesmo_documento',
    label: 'Mesmo Documento',
    color: '#FFFFFF',
    dash: false,
    width: 3,
  },
  socio: {
    type: 'socio',
    label: 'Sócio',
    color: '#27AE60',
    dash: true,
    width: 2,
  },
  contrato: {
    type: 'contrato',
    label: 'Contrato',
    color: '#E67E22',
    dash: false,
    width: 2,
  },
  doacao_campanha: {
    type: 'doacao_campanha',
    label: 'Doação Campanha',
    color: '#8E44AD',
    dash: true,
    width: 1.5,
  },
  despesa_cota: {
    type: 'despesa_cota',
    label: 'Despesa Cota',
    color: '#E91E63',
    dash: false,
    width: 1.5,
  },
  tcu_irregular: {
    type: 'tcu_irregular',
    label: 'TCU Irregular',
    color: '#E74C3C',
    dash: false,
    width: 2.5,
  },
  mesmo_partido: {
    type: 'mesmo_partido',
    label: 'Mesmo Partido',
    color: '#F1C40F',
    dash: true,
    width: 1.5,
  },
  orgao_lotacao: {
    type: 'orgao_lotacao',
    label: 'Lotação',
    color: '#E67E22',
    dash: true,
    width: 1.5,
  },
  nome_similar: {
    type: 'nome_similar',
    label: 'Nome Similar',
    color: '#7F8C8D',
    dash: true,
    width: 1,
  },
}

export const NODE_COLORS: Record<string, string> = {
  pessoa_fisica: '#4A90D9',
  empresa: '#27AE60',
  orgao_publico: '#E67E22',
  candidato: '#8E44AD',
  deputado: '#E91E63',
  senador: '#C2185B',
  partido: '#F1C40F',
  contrato: '#7F8C8D',
  tcu_record: '#E74C3C',
}
