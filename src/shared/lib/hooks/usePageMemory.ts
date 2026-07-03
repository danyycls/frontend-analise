import { useState, useEffect, useCallback, useRef } from 'react'

const pageMemory = new Map<string, unknown>()

export function usePageMemory<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const restored = pageMemory.has(key) ? (pageMemory.get(key) as T) : undefined
  const [state, setState] = useState<T>(restored !== undefined ? restored : initialValue)
  const keyRef = useRef(key)

  useEffect(() => {
    keyRef.current = key
  }, [key])

  useEffect(() => {
    pageMemory.set(keyRef.current, state)
  })

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState(value)
  }, [])

  return [state, setValue]
}

export function createPageMemoryGuard(key: string) {
  return {
    save<T>(state: T) {
      pageMemory.set(key, state)
    },
    restore<T>(defaultValue: T): T {
      return (pageMemory.get(key) as T) ?? defaultValue
    },
    clear() {
      pageMemory.delete(key)
    },
  }
}
