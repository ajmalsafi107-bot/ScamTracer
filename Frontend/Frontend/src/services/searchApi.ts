import type { SearchResult } from '../types/search'

export async function searchNumber(number: string): Promise<SearchResult> {
  const res = await fetch(`/api/search?number=${encodeURIComponent(number.trim())}`)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || 'Could not search number')
  }
  return data as SearchResult
}
