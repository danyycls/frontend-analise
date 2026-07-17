import { WS_BASE_URL } from '@/shared/config'

export function listenWebSocket(
  jobId: string,
  channel: string,
  cancelRef: React.MutableRefObject<boolean>,
  timeoutMs = 120000
): Promise<any[] | null> {
  return new Promise<any[] | null>((resolve) => {
    const ws = new WebSocket(`${WS_BASE_URL}/ws`)
    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        ws.close()
        resolve(null)
      }
    }, timeoutMs)

    const finalizar = (val: any[] | null) => {
      clearTimeout(timeout)
      clearInterval(checkCancel)
      if (!resolved) {
        resolved = true
        ws.close()
        resolve(val)
      }
    }

    ws.onopen = () => {
      ws.send(JSON.stringify({ channel, job_id: jobId }))
    }

    ws.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data)
        if (ev.type === 'results') finalizar(ev.results || [])
        if (ev.type === 'error') finalizar(null)
        if (ev.type === 'done' && !resolved) finalizar(null)
      } catch (_) {}
    }

    ws.onerror = () => finalizar(null)

    cancelRef.current = false
    const checkCancel = setInterval(() => {
      if (cancelRef.current && !resolved) finalizar(null)
    }, 200)
  })
}
