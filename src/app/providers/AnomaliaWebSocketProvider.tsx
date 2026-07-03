import { useEffect } from 'react'
import { anomaliaWebSocketService } from '@/shared/lib/services/AnomaliaWebSocketService'

export function AnomaliaWebSocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    anomaliaWebSocketService.start()
    return () => {
      anomaliaWebSocketService.stop()
    }
  }, [])

  return <>{children}</>
}
