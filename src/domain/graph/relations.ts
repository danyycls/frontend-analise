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
    color: '#888888',
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
  pertence: {
    type: 'pertence',
    label: 'Pertence',
    color: '#5D6D7E',
    dash: true,
    width: 1,
  },
}

export const ANOMALY_EDGE_COLOR = '#E74C3C'

export const NODE_COLORS: Record<string, string> = {
  pessoa_fisica: '#4A90D9',
  empresa: '#27AE60',
  orgao_publico: '#E67E22',
  candidato: '#8E44AD',
  deputado: '#E91E63',
  senador: '#C2185B',
  servidor_publico: '#7D3C98',
  fornecedor: '#F39C12',
  doador: '#D35400',
  socio: '#3498DB',
  consulta: '#95A5A6',
  ligacao_politica: '#1ABC9C',
}
