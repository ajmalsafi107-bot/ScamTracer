export type NumberReportItem = {
  id: number
  phone_number: string
  fraud_type: string
  description: string
  reported_at: string | null
}

export type NumberReportsResponse = {
  phone: string
  count: number
  reports: NumberReportItem[]
}

export type NumberStatsResponse = {
  number: string
  search_count: number
  reports_count: number
}
