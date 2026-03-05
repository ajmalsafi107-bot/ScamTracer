export type SearchReport = {
  id: number
  fraud_type: string
  description: string
  reported_at: string
}

export type SearchResult = {
  number: string
  search_count: number
  reports_count: number
  reports: SearchReport[]
}
