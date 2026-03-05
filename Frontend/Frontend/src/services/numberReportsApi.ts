import type { NumberReportsResponse, NumberStatsResponse } from '../types/numberReports'

export async function getReportsByNumber(number: string): Promise<NumberReportsResponse> {
  const res = await fetch(`/api/reports?phone=${encodeURIComponent(number.trim())}`)
  const data = (await res.json()) as Partial<NumberReportsResponse> & { error?: string }

  if (!res.ok) {
    throw new Error(data?.error || 'Could not load reports for number')
  }

  if (!Array.isArray(data.reports)) {
    throw new Error('Invalid reports response from backend')
  }

  return data as NumberReportsResponse
}

export async function getNumberStats(number: string): Promise<NumberStatsResponse> {
  const res = await fetch(`/api/number-stats?number=${encodeURIComponent(number.trim())}`)
  const data = (await res.json()) as Partial<NumberStatsResponse> & { error?: string }

  if (!res.ok) {
    throw new Error(data?.error || 'Could not load number stats')
  }

  if (typeof data.search_count !== 'number') {
    throw new Error('Invalid number stats response from backend')
  }

  return data as NumberStatsResponse
}
