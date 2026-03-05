export type HomeReportItem = {
  id: number
  number: string
  reports_count: number
  fraud_type?: string
  description?: string
  reported_at?: string | null
}

export type HomeReportsResponse = {
  mode: 'top' | 'recent'
  items: HomeReportItem[]
}
