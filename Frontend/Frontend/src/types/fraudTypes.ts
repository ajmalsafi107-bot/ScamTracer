export type FraudTypeItem = {
  fraud_type: string
  numbers_count: number
}

export type FraudTypesResponse = {
  items: FraudTypeItem[]
}

export type FraudTypeNumberItem = {
  number: string
  reports_count: number
  search_count: number
  last_reported_at?: string | null
}

export type FraudTypeNumbersResponse = {
  fraud_type: string
  items: FraudTypeNumberItem[]
}
