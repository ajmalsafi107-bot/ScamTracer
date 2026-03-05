import type { FraudTypeNumbersResponse, FraudTypesResponse } from '../types/fraudTypes'

export async function getFraudTypes(limit = 20): Promise<FraudTypesResponse> {
  const res = await fetch(`/api/fraud-types?limit=${limit}`)
  const data = (await res.json()) as Partial<FraudTypesResponse> & { error?: string }

  if (!res.ok) {
    throw new Error(data?.error || 'Could not load fraud types')
  }

  if (!Array.isArray(data.items)) {
    throw new Error('Invalid fraud type response from backend')
  }

  return data as FraudTypesResponse
}

export async function getFraudTypeNumbers(
  fraudType: string,
  limit = 100,
): Promise<FraudTypeNumbersResponse> {
  const res = await fetch(
    `/api/fraud-type-numbers?type=${encodeURIComponent(fraudType)}&limit=${limit}`,
  )
  const data = (await res.json()) as Partial<FraudTypeNumbersResponse> & { error?: string }

  if (!res.ok) {
    throw new Error(data?.error || 'Could not load numbers by fraud type')
  }

  if (!Array.isArray(data.items)) {
    throw new Error('Invalid fraud type numbers response from backend')
  }

  return data as FraudTypeNumbersResponse
}
