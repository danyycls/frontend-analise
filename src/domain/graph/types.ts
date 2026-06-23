export type NodeType =
  | 'pessoa_fisica'
  | 'empresa'
  | 'orgao_publico'
  | 'candidato'
  | 'deputado'
  | 'senador'
  | 'partido'
  | 'contrato'
  | 'tcu_record'

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
}

export type RelationType =
  | 'mesmo_documento'
  | 'socio'
  | 'contrato'
  | 'doacao_campanha'
  | 'despesa_cota'
  | 'tcu_irregular'
  | 'mesmo_partido'
  | 'orgao_lotacao'
  | 'nome_similar'

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
