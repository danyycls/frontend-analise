// @ts-nocheck
import { useState, useEffect } from 'react'
import { apiP2 } from '@/shared/api/client'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { fmtDoc } from '@/shared/lib/formatters'

interface InspectionViewProps {
  document: string
  onClose: () => void
}

function fmtValor(v: unknown): string {
  if (v == null) return '-'
  const n = Number(v)
  if (isNaN(n)) return String(v)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function InspectionView({ document, onClose }: InspectionViewProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const json = await apiP2.post<any>(ENDPOINTS.BUSCA_CONTEXTO, {
          licitacoes: [{
            numero_controle_pncp: '',
            cpf_cnpj: document,
            socios: [],
          }],
        })
        if (!cancelled) setData(json)
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Erro ao consultar')
      }
      if (!cancelled) setLoading(false)
    }
    fetchData()
    return () => { cancelled = true }
  }, [document])

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 14 }}>
        Consultando vínculos políticos...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#E74C3C', fontSize: 14 }}>
        Erro: {error}
      </div>
    )
  }

  const resultados = data?.resultados || []

  const fornecedores: any[] = []
  const doacoesCandidatos: any[] = []
  const doacoesPartidos: any[] = []
  const tcuRecords: any[] = []
  const servidoresPublicos: any[] = []

  resultados.forEach((r: any) => {
    ;(r.documentos || []).forEach((d: any) => {
      ;(d.vinculos || []).forEach((v: any) => {
        const item = { documento: d, vinculo: v, cpf_cnpj: r.cpf_cnpj }
        if (v.tipo === 'fornecedor') fornecedores.push(item)
        else if (v.tipo === 'receita_candidato') doacoesCandidatos.push(item)
        else if (v.tipo === 'receita_orgao_partidario') doacoesPartidos.push(item)
        else if (v.tipo?.startsWith('tcu_')) tcuRecords.push(item)
        else if (v.tipo === 'servidor_publico') servidoresPublicos.push(item)
      })
    })
  })

  const sectionStyle: React.CSSProperties = {
    marginBottom: 20,
    border: '1px solid #2a2a4e',
    borderRadius: 6,
    overflow: 'hidden',
  }

  const sectionHeaderStyle: React.CSSProperties = {
    background: '#1a1a2e',
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    color: '#CCC',
    borderBottom: '1px solid #2a2a4e',
  }

  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, color: '#E0E0E0' }}>
            Inspeção: {fmtDoc(document)}
          </h2>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
            {data?.documentos_processados || 0} documento(s) processado(s)
          </div>
        </div>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={onClose}
          style={{ fontSize: 11, padding: '4px 12px' }}
        >
          Voltar
        </button>
      </div>

      {fornecedores.length === 0 && doacoesCandidatos.length === 0 && doacoesPartidos.length === 0 && tcuRecords.length === 0 && servidoresPublicos.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', padding: 32, fontSize: 13 }}>
          Nenhum vínculo político encontrado para este documento.
        </div>
      )}

      {fornecedores.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            Serviços Prestados ({fornecedores.length})
          </div>
          <div style={{ padding: '8px 12px' }}>
            {fornecedores.map((item, i) => {
              const f = item.vinculo.detalhes?.fornecedor?.fornecedor || {}
              return (
                <div key={i} style={{ marginBottom: 10, padding: '8px 10px', background: '#0d0d1a', borderRadius: 4 }}>
                  <div style={{ fontSize: 12, color: '#CCC', marginBottom: 2 }}>{f.nome || f.nome_rfb || '-'}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {f.cargo_descricao_relacionada && `${f.cargo_descricao_relacionada} · `}
                    {f.partido_sigla_relacionado || ''}
                  </div>
                  {item.vinculo.descricao && (
                    <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{item.vinculo.descricao}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {doacoesCandidatos.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            Doações a Candidatos ({doacoesCandidatos.length})
          </div>
          <div style={{ padding: '8px 12px' }}>
            {doacoesCandidatos.map((item, i) => {
              const receitas = item.vinculo.detalhes?.receitas_candidato || []
              const desc = item.vinculo.descricao || ''
              const first = receitas[0] || {}
              return (
                <div key={i} style={{ marginBottom: 10, padding: '8px 10px', background: '#0d0d1a', borderRadius: 4 }}>
                  <div style={{ fontSize: 12, color: '#CCC', marginBottom: 2 }}>{desc || first.descricao || 'Candidato'}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {first.valor != null && `${fmtValor(first.valor)}`}
                    {first.data_receita && ` · ${first.data_receita}`}
                  </div>
                  {receitas.length > 1 && (
                    <div style={{ marginTop: 6 }}>
                      {receitas.map((rc: any, j: number) => (
                        <div key={j} style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                          {rc.descricao} — {fmtValor(rc.valor)}
                          {rc.data_receita && ` (${rc.data_receita})`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {doacoesPartidos.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            Doações a Partidos ({doacoesPartidos.length})
          </div>
          <div style={{ padding: '8px 12px' }}>
            {doacoesPartidos.map((item, i) => {
              const receitas = item.vinculo.detalhes?.receitas_orgao_partidario || []
              const desc = item.vinculo.descricao || ''
              const first = receitas[0] || {}
              return (
                <div key={i} style={{ marginBottom: 10, padding: '8px 10px', background: '#0d0d1a', borderRadius: 4 }}>
                  <div style={{ fontSize: 12, color: '#CCC', marginBottom: 2 }}>{desc || first.descricao || 'Partido'}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {first.valor != null && `${fmtValor(first.valor)}`}
                    {first.data_receita && ` · ${first.data_receita}`}
                  </div>
                  {receitas.length > 1 && (
                    <div style={{ marginTop: 6 }}>
                      {receitas.map((rp: any, j: number) => (
                        <div key={j} style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                          {rp.descricao} — {fmtValor(rp.valor)}
                          {rp.data_receita && ` (${rp.data_receita})`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tcuRecords.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            Registros TCU ({tcuRecords.length})
          </div>
          <div style={{ padding: '8px 12px' }}>
            {tcuRecords.map((item, i) => {
              const tipo = item.vinculo.tipo || ''
              const contas = item.vinculo.detalhes?.contas_irregulares || []
              const inab = item.vinculo.detalhes?.inabilitados || []
              const inid = item.vinculo.detalhes?.inidoneos || []
              const records = [...contas, ...inab, ...inid]
              const first = records[0] || {}
              return (
                <div key={i} style={{ marginBottom: 10, padding: '8px 10px', background: '#0d0d1a', borderRadius: 4 }}>
                  <div style={{ fontSize: 12, color: '#CCC', marginBottom: 2 }}>
                    {tipo.replace(/_/g, ' ')} — {first.nome || '-'}
                  </div>
                  {first.numeroProcessoFormatado && (
                    <div style={{ fontSize: 11, color: '#888' }}>
                      Processo: {first.numeroProcessoFormatado}
                    </div>
                  )}
                  {first.municipio && (
                    <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>
                      {first.municipio}{first.uf ? `/${first.uf}` : ''}
                    </div>
                  )}
                  {records.length > 1 && (
                    <div style={{ marginTop: 6 }}>
                      {records.map((r: any, j: number) => (
                        <div key={j} style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                          {r.nome || '-'}
                          {r.numeroProcessoFormatado && ` — ${r.numeroProcessoFormatado}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {servidoresPublicos.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            Servidor Público Federal ({servidoresPublicos.length})
          </div>
          <div style={{ padding: '8px 12px' }}>
            {servidoresPublicos.map((item, i) => {
              const servList = item.vinculo.detalhes?.servidores_publicos || []
              return servList.map((s: any, j: number) => {
                const serv = s.servidor || {}
                const pes = serv.pessoa || {}
                const orgao = serv.orgaoServidorLotacao || {}
                const func = serv.funcao || {}
                return (
                  <div key={`${i}-${j}`} style={{ marginBottom: 10, padding: '8px 10px', background: '#0d0d1a', borderRadius: 4 }}>
                    <div style={{ fontSize: 12, color: '#CCC', marginBottom: 2 }}>
                      {pes.nome || '-'}
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>
                      {func.descricaoFuncaoCargo && `${func.descricaoFuncaoCargo} · `}
                      {orgao.nome || orgao.sigla || ''}
                    </div>
                    {serv.tipoServidor && (
                      <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>
                        Tipo: {serv.tipoServidor} · Situação: {serv.situacao || '-'}
                      </div>
                    )}
                    {serv.codigoMatriculaFormatado && (
                      <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>
                        Matrícula: {serv.codigoMatriculaFormatado}
                      </div>
                    )}
                  </div>
                )
              })
            })}
          </div>
        </div>
      )}
    </div>
  )
}
