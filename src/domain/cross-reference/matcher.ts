import type { CrossReference, EntityDocument, MatchResult } from './types'
import type { RelationType } from '../graph/types'

function normalizeDoc(doc: string): string {
  return doc.replace(/\D/g, '')
}

function refId(src: string, tgt: string, rel: RelationType): string {
  return `${src}__${tgt}__${rel}`
}

export function matchByDocument(
  entities: EntityDocument[]
): CrossReference[] {
  const refs: CrossReference[] = []
  const byDoc: Record<string, EntityDocument[]> = {}

  for (const e of entities) {
    if (!e.document) continue
    const norm = normalizeDoc(e.document)
    if (norm.length < 3) continue
    if (!byDoc[norm]) byDoc[norm] = []
    byDoc[norm].push(e)
  }

  for (const [, group] of Object.entries(byDoc)) {
    if (group.length < 2) continue
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i]
        const b = group[j]
        if (a.source === b.source) continue
        refs.push({
          id: refId(a.id, b.id, 'mesmo_documento'),
          sourceId: a.id,
          targetId: b.id,
          type: 'mesmo_documento',
          confidence: 0.95,
          evidence: `Mesmo documento: ${a.document}`,
          metadata: { document: a.document },
        })
      }
    }
  }

  return refs
}

export function matchBySocio(
  entities: EntityDocument[],
  qsaMap: Record<string, string[]>
): CrossReference[] {
  const refs: CrossReference[] = []

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i]
      const b = entities[j]

      const aQsas = qsaMap[a.id] || []
      const bQsas = qsaMap[b.id] || []

      const common = aQsas.filter((doc) => bQsas.includes(doc))

      if (common.length > 0) {
        const socioDoc = common[0]
        refs.push({
          id: refId(a.id, b.id, 'socio'),
          sourceId: a.id,
          targetId: b.id,
          type: 'socio',
          confidence: 0.8,
          evidence: `Sócio em comum: ${socioDoc}`,
          metadata: { socioDocument: socioDoc, commonSocios: common },
        })
      }
    }
  }

  return refs
}

export function matchByDonation(
  entities: EntityDocument[],
  donationLinks: { doadorId: string; receptorId: string; domain: string }[]
): CrossReference[] {
  const refs: CrossReference[] = []

  for (const link of donationLinks) {
    const doador = entities.find((e) => e.id === link.doadorId)
    const receptor = entities.find((e) => e.id === link.receptorId)

    if (doador && receptor) {
      refs.push({
        id: refId(doador.id, receptor.id, 'doacao_campanha'),
        sourceId: doador.id,
        targetId: receptor.id,
        type: 'doacao_campanha',
        confidence: 0.85,
        evidence: `Doação de campanha (${link.domain})`,
        metadata: { domain: link.domain },
      })
    }
  }

  return refs
}

export function findCrossReferences(
  entities: EntityDocument[],
  extra?: {
    qsaMap?: Record<string, string[]>
    donationLinks?: { doadorId: string; receptorId: string; domain: string }[]
  }
): MatchResult {
  let allRefs: CrossReference[] = []

  const results = [
    matchByDocument(entities),
  ]

  if (extra?.qsaMap) {
    results.push(matchBySocio(entities, extra.qsaMap))
  }
  if (extra?.donationLinks) {
    results.push(matchByDonation(entities, extra.donationLinks))
  }

  allRefs = results.flat()

  const byType: Record<string, number> = {}
  for (const r of allRefs) {
    byType[r.type] = (byType[r.type] ?? 0) + 1
  }

  const uniquePairs = new Set<string>()
  const deduped = allRefs.filter((r) => {
    const pair = [r.sourceId, r.targetId].sort().join('|')
    if (uniquePairs.has(pair)) return false
    uniquePairs.add(pair)
    return true
  })

  return {
    references: deduped,
    stats: {
      totalComparisons: entities.length * entities.length,
      matchCount: deduped.length,
      byType,
    },
  }
}
