import type { CrossReference, EntityDocument, MatchResult } from './types'
import type { RelationType } from '../graph/types'

function normalizeDoc(doc: string): string {
  return doc.replace(/\D/g, '')
}

function levenshtein(a: string, b: string): number {
  const an = a.length
  const bn = b.length
  const matrix: number[][] = Array.from({ length: an + 1 }, () =>
    Array(bn + 1).fill(0)
  )
  for (let i = 0; i <= an; i++) matrix[i][0] = i
  for (let j = 0; j <= bn; j++) matrix[0][j] = j
  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[an][bn]
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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

export function matchByName(
  entities: EntityDocument[],
  threshold = 0.35
): CrossReference[] {
  const refs: CrossReference[] = []

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i]
      const b = entities[j]
      if (a.source === b.source) continue

      const na = normalizeName(a.label)
      const nb = normalizeName(b.label)

      if (na.length < 4 || nb.length < 4) continue
      if (na === nb) continue

      const dist = levenshtein(na, nb)
      const maxLen = Math.max(na.length, nb.length)
      const ratio = 1 - dist / maxLen

      if (ratio >= threshold) {
        refs.push({
          id: refId(a.id, b.id, 'nome_similar'),
          sourceId: a.id,
          targetId: b.id,
          type: 'nome_similar',
          confidence: ratio,
          evidence: `Nomes similares: "${a.label}" ↔ "${b.label}" (${(ratio * 100).toFixed(0)}%)`,
          metadata: { ratio, nameA: a.label, nameB: b.label },
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

export function matchByContract(
  entities: EntityDocument[],
  contractLinks: { documentId: string; contratoId: string }[]
): CrossReference[] {
  const refs: CrossReference[] = []

  const entityToContracts: Record<string, Set<string>> = {}
  for (const link of contractLinks) {
    if (!entityToContracts[link.documentId]) {
      entityToContracts[link.documentId] = new Set()
    }
    entityToContracts[link.documentId].add(link.contratoId)
  }

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i]
      const b = entities[j]
      const aContracts = entityToContracts[a.id] || new Set()
      const bContracts = entityToContracts[b.id] || new Set()

      const common = [...aContracts].filter((c) => bContracts.has(c))
      if (common.length > 0) {
        refs.push({
          id: refId(a.id, b.id, 'contrato'),
          sourceId: a.id,
          targetId: b.id,
          type: 'contrato',
          confidence: 0.7,
          evidence: `${common.length} contrato(s) em comum: ${common.slice(0, 3).join(', ')}`,
          metadata: { contratos: common },
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

export function matchByTCU(
  entities: EntityDocument[],
  tcuMatches: string[]
): CrossReference[] {
  const refs: CrossReference[] = []
  const tcuSet = new Set(tcuMatches)

  for (const e of entities) {
    if (!e.document) continue
    const norm = normalizeDoc(e.document)
    if (tcuSet.has(norm)) {
      refs.push({
        id: refId(e.id, `tcu_${norm}`, 'tcu_irregular'),
        sourceId: e.id,
        targetId: `tcu_${norm}`,
        type: 'tcu_irregular',
        confidence: 0.9,
        evidence: `Registro no TCU (contas irregulares)`,
        metadata: { document: e.document },
      })

      entities.push({
        id: `tcu_${norm}`,
        label: `TCU: ${e.document}`,
        type: 'tcu_record',
        document: e.document,
        source: 'tcu',
        originalData: { document: e.document },
      })
    }
  }

  return refs
}

export function findCrossReferences(
  entities: EntityDocument[],
  extra?: {
    qsaMap?: Record<string, string[]>
    contractLinks?: { documentId: string; contratoId: string }[]
    donationLinks?: { doadorId: string; receptorId: string; domain: string }[]
    tcuMatches?: string[]
  }
): MatchResult {
  let allRefs: CrossReference[] = []

  const results = [
    matchByDocument(entities),
    matchByName(entities, 0.4),
  ]

  if (extra?.qsaMap) {
    results.push(matchBySocio(entities, extra.qsaMap))
  }
  if (extra?.contractLinks) {
    results.push(matchByContract(entities, extra.contractLinks))
  }
  if (extra?.donationLinks) {
    results.push(matchByDonation(entities, extra.donationLinks))
  }
  if (extra?.tcuMatches) {
    results.push(matchByTCU(entities, extra.tcuMatches))
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
