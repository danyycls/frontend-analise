export type NodeType =
  | 'pessoa_fisica'
  | 'empresa'
  | 'orgao_publico'
  | 'candidato'
  | 'deputado'
  | 'senador'
  | 'servidor_publico'
  | 'contrato'
  | 'fornecedor'
  | 'doador'
  | 'socio'
  | 'consulta'
  | 'ligacao_politica'

export interface GraphNode {
  id: string
  type: NodeType
  label: string
  metadata: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: RelationType
  label: string
  weight?: number
  metadata?: Record<string, unknown>
}

export type RelationType =
  | 'mesmo_documento'
  | 'socio'
  | 'doacao_campanha'
  | 'despesa_cota'
  | 'tcu_irregular'
  | 'mesmo_partido'
  | 'orgao_lotacao'
  | 'pertence'

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
