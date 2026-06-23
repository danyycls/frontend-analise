export type { NodeType, GraphNode, GraphEdge, RelationType, GraphData } from './graph/types'
export { RELATION_META, NODE_COLORS } from './graph/relations'
export { buildGraph } from './graph/builder'
export type { CrossReference, EntityDocument, MatchResult } from './cross-reference/types'
export {
  findCrossReferences,
  matchByDocument,
  matchByName,
  matchBySocio,
  matchByContract,
  matchByDonation,
  matchByTCU,
} from './cross-reference/matcher'
