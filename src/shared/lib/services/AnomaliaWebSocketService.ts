import { store } from '@/app/store'
import { updateActiveAnalise, addAnalise } from '@/app/store/slices/anomaliaSlice'
import type { WorkerProgresso } from '@/app/store/slices/anomaliaSlice'
import { P2_WS_BASE_URL } from '@/shared/config'
import { ENDPOINTS } from '@/shared/api/endpoints'

const MAX_WS_RETRIES = 3
const INITIAL_DELAY_MS = 2000

class AnomaliaWebSocketService {
  private ws: WebSocket | null = null
  private retryCount = 0
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private initialTimer: ReturnType<typeof setTimeout> | null = null
  private currentJobId: string | null = null
  private unsubscribe: (() => void) | null = null
  private started = false

  start(): void {
    if (this.started) return
    this.started = true

    const state = store.getState()
    const active = state.anomalia.active

    if (active?.job_id && active?.processando) {
      this.initialTimer = setTimeout(() => {
        const s = store.getState()
        const a = s.anomalia.active
        if (a?.job_id && a?.processando) {
          if (a.job_id === this.currentJobId) return
          this.connect(a.job_id)
        }
      }, INITIAL_DELAY_MS)
    }

    this.unsubscribe = store.subscribe(() => {
      const s = store.getState()
      const a = s.anomalia.active

      if (a?.job_id && a?.processando) {
        if (a.job_id !== this.currentJobId) {
          if (this.initialTimer) {
            clearTimeout(this.initialTimer)
            this.initialTimer = null
          }
          this.connect(a.job_id)
        }
      } else {
        if (this.currentJobId) {
          this.disconnect()
        }
      }
    })
  }

  stop(): void {
    this.started = false
    if (this.initialTimer) {
      clearTimeout(this.initialTimer)
      this.initialTimer = null
    }
    this.disconnect()
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
  }

  private connect(jobId: string): void {
    if (this.ws && this.currentJobId === jobId && this.ws.readyState === WebSocket.OPEN) return

    this.disconnect()
    this.currentJobId = jobId
    this.retryCount = 0
    this.createConnection(jobId)
  }

  private createConnection(jobId: string): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    const ws = new WebSocket(`${P2_WS_BASE_URL}/ws`)
    this.ws = ws

    ws.onopen = () => {
      this.retryCount = 0
      ws.send(JSON.stringify({ channel: ENDPOINTS.ANOMALIA_WS_CHANNEL, job_id: jobId }))
    }

    ws.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data)
        const ev: WorkerProgresso = raw.data || raw

        store.dispatch(updateActiveAnalise({
          progresso: ev,
          etapa_atual: ev.etapa_atual,
          totalAnomalias: ev.anomalias_encontradas,
          mensagem: ev.message || '',
        }))

        if (ev.type === 'done') {
          const state = store.getState()
          const active = state.anomalia.active
          if (active) {
            store.dispatch(addAnalise({
              id: Date.now(),
              timestamp: new Date().toISOString(),
              tipo: active.tipo,
              valor: active.valor,
              ano: active.ano,
              totalAnomalias: ev.anomalias_encontradas ?? 0,
            }))
          }
          store.dispatch(updateActiveAnalise({
            processando: false,
            concluido: true,
            etapa_atual: 'concluido',
            mensagem: 'Análise concluída',
          }))
          this.currentJobId = null
        }

        if (ev.type === 'cancelled') {
          store.dispatch(updateActiveAnalise({
            processando: false,
            concluido: true,
            etapa_atual: 'concluido',
            mensagem: 'Análise cancelada',
          }))
          this.currentJobId = null
        }

        if (ev.type === 'error') {
          store.dispatch(updateActiveAnalise({
            processando: false,
            mensagem: ev.message || 'Erro na análise',
          }))
          this.currentJobId = null
        }
      } catch {}
    }

    ws.onerror = () => {
      if (this.retryCount < MAX_WS_RETRIES && this.currentJobId) {
        this.retryCount++
        this.scheduleReconnect()
      } else {
        store.dispatch(updateActiveAnalise({
          processando: false,
          mensagem: 'Conexão WebSocket perdida',
        }))
        this.currentJobId = null
      }
    }

    ws.onclose = () => {
      if (this.ws === ws) {
        this.ws = null
        if (this.currentJobId && this.retryCount < MAX_WS_RETRIES) {
          this.scheduleReconnect()
        }
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.retryTimer) return
    const delay = Math.min(Math.pow(2, this.retryCount + 1) * 1000, 15000)
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      if (this.currentJobId) {
        this.createConnection(this.currentJobId)
      }
    }, delay)
  }

  private disconnect(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.currentJobId = null
  }
}

export const anomaliaWebSocketService = new AnomaliaWebSocketService()
