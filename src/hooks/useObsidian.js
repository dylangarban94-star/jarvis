import { useCallback } from 'react'
import { getObsidianContext } from '../services/obsidian'

export function useObsidian() {
  const fetchContext = useCallback(async (query) => {
    return await getObsidianContext(query)
  }, [])

  return { fetchContext }
}
