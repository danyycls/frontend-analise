import type { GraphEdge } from '@/domain'

export interface PoliticalEntity {
  id: string
  type: string
  label: string
  document?: string
  source: string
  originalData: Record<string, unknown>
  context?: string
}

export interface DocLinkedEntity {
  entityId: string
  context: string
  parentId: string
}

export interface LpProcessResult {
  politicalEntities: PoliticalEntity[]
  lpResultEdges: GraphEdge[]
  tcuContexts: Array<{ entityId: string; context: string }>
  docLinkedEntities: DocLinkedEntity[]
  vinculoEntityIds: string[]
}

const norm = (d: string | undefined | null): string => (d || '').replace(/\D/g, '')

export function processLpResults(
  json: any,
  panelEntities: Array<{ id: string; document?: string }>,
  entityOrder: string[],
  entitiesRecord: Record<string, { id: string; document?: string } | undefined>
): LpProcessResult {
  const lpResultEdges: GraphEdge[] = []
  const politicalEntities: PoliticalEntity[] = []
  const tcuContexts: Array<{ entityId: string; context: string }> = []
  const docLinkedEntities: DocLinkedEntity[] = []
  const targetIdMap = new Map<string, string>()
  let edgeCounter = 0
  let lpIdCounter = 0
  let hasAnyConnection = false
  const vinculoEntityIdsSet = new Set<string>()

  const nextLpId = () => {
    lpIdCounter++
    return `lp_ent_${Date.now()}_${lpIdCounter}`
  }

  const lpParentId = `lp_parent_${Date.now()}`

  const normDocToId = new Map<string, string>()
  for (const id of entityOrder) {
    const ent = entitiesRecord[id]
    if (ent?.document) {
      const nd = norm(ent.document)
      if (nd.length >= 3) normDocToId.set(nd, ent.id)
    }
  }

  const panelEntitiesNorm = panelEntities.map((e) => ({
    ...e,
    normDoc: norm(e.document),
  }))

  ;(json.resultados || []).forEach((resultado: any) => {
    const sourceDocRaw = resultado.cpf_cnpj
    const sourceDocNorm = norm(sourceDocRaw)

    const sourceEntity = panelEntitiesNorm.find(
      (e) => e.normDoc === sourceDocNorm && sourceDocNorm.length >= 3
    )
    const sourceNodeId = sourceEntity?.id
    if (!sourceNodeId) return

    ;(resultado.documentos || []).forEach((doc: any) => {
      ;(doc.vinculos || []).forEach((vinculo: any) => {
        vinculoEntityIdsSet.add(sourceNodeId)
        const detalhes = vinculo.detalhes || {}

        if (vinculo.tipo === 'fornecedor' && detalhes.fornecedor?.fornecedor) {
          hasAnyConnection = true
          docLinkedEntities.push({
            entityId: sourceNodeId,
            context: 'Prestação de serviço político',
            parentId: lpParentId,
          })
          return
        }

        if (vinculo.tipo === 'despesa_candidato' || vinculo.tipo === 'despesa_orgao_partidario') {
          hasAnyConnection = true
          docLinkedEntities.push({
            entityId: sourceNodeId,
            context: vinculo.tipo === 'despesa_candidato'
              ? 'Contratado por campanha eleitoral'
              : 'Contratado por partido político',
            parentId: lpParentId,
          })
          return
        }

        if (vinculo.tipo?.startsWith('tcu_')) {
          hasAnyConnection = true
          tcuContexts.push({ entityId: sourceNodeId, context: 'Restrição TCU' })
          docLinkedEntities.push({
            entityId: sourceNodeId,
            context: 'Restrição TCU',
            parentId: lpParentId,
          })
          return
        }

        let targetType = ''
        let targetLabel = ''
        let targetDocument = ''
        let relationType = ''
        let entityContext = ''
        const targetOriginalData: Record<string, unknown> = {}

        if (vinculo.tipo === 'receita_candidato') {
          targetType = 'candidato'
          targetLabel = detalhes.receitas_candidato?.[0]?.descricao || 'Receita Candidato'
          relationType = 'doacao_campanha'
          entityContext = 'Doação para candidato'
        } else if (vinculo.tipo === 'receita_orgao_partidario') {
          targetType = 'candidato'
          targetLabel = detalhes.receitas_orgao_partidario?.[0]?.descricao || 'Receita Partido'
          targetDocument = norm(detalhes.receitas_orgao_partidario?.[0]?.cnpj_prestador) || ''
          relationType = 'doacao_campanha'
          entityContext = 'Doação para partido político'
        } else {
          return
        }

        hasAnyConnection = true
        const targetKey = targetDocument || targetLabel
        let targetNodeId = targetIdMap.get(targetKey)

        if (!targetNodeId && targetDocument) {
          targetNodeId = normDocToId.get(targetDocument)
        }

        if (!targetNodeId) {
          targetNodeId = nextLpId()
          targetIdMap.set(targetKey, targetNodeId)
          politicalEntities.push({
            id: targetNodeId,
            type: targetType,
            label: targetLabel,
            document: targetDocument || undefined,
            source: 'tse',
            originalData: targetOriginalData,
            context: entityContext,
          })
        }

        edgeCounter++
        lpResultEdges.push({
          id: `lp_edge_${Date.now()}_${edgeCounter}`,
          source: sourceNodeId,
          target: targetNodeId,
          type: relationType as any,
          label: (vinculo.descricao || vinculo.tipo || '').slice(0, 60),
          weight: 0.8,
        })
      })
    })
  })

  if (hasAnyConnection) {
    for (const pe of politicalEntities) {
      pe.originalData = { ...pe.originalData, parent_id: lpParentId }
    }
    politicalEntities.push({
      id: lpParentId,
      type: 'ligacao_politica',
      label: `Ligação Política (${politicalEntities.length + docLinkedEntities.length} ent.)`,
      source: 'tse',
      originalData: {},
      context: 'Ligação Política',
    })
  }

  return { politicalEntities, lpResultEdges, tcuContexts, docLinkedEntities, vinculoEntityIds: [...vinculoEntityIdsSet] }
}
