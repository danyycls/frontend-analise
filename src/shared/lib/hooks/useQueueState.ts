import { useState, useRef, useEffect } from 'react'

export function useQueueState() {
  const [filaPausada, setFilaPausada] = useState(false)
  const cancelRef = useRef(false)
  const processandoRef = useRef(false)
  const filaPausadaRef = useRef(false)

  useEffect(() => {
    filaPausadaRef.current = filaPausada
  }, [filaPausada])

  return { filaPausada, setFilaPausada, cancelRef, processandoRef, filaPausadaRef }
}
