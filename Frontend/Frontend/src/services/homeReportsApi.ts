import type { HomeReportsResponse } from '../types/homeReports'

export async function getHomeReports(mode: 'top' | 'recent'): Promise<HomeReportsResponse> {
  const res = await fetch(`/api/homepage-reports?mode=${mode}&limit=10`)
  const raw = await res.text()
  let data: (Partial<HomeReportsResponse> & { error?: string }) | null = null
  if (raw) {
    try {
      data = JSON.parse(raw) as Partial<HomeReportsResponse> & { error?: string }
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || `Could not load homepage reports (${res.status})`)
  }

  if (!data || !Array.isArray(data.items)) {
    throw new Error('Invalid response format from backend')
  }

  return data as HomeReportsResponse
}
