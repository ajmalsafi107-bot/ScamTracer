import { useEffect, useState } from 'react'

import { getFraudTypes } from '../services/fraudTypesApi'
import { getHomeReports } from '../services/homeReportsApi'
import type { FraudTypeItem } from '../types/fraudTypes'
import type { HomeReportItem } from '../types/homeReports'

const FULL_RISK_SEARCHES = 50

function getRiskLevel(searchCount: number): { label: string; percentage: number; className: 'low' | 'medium' | 'high' } {
  const percentage = Math.min(100, Math.round((searchCount / FULL_RISK_SEARCHES) * 100))

  if (percentage >= 70) {
    return { label: 'Hög risk', percentage, className: 'high' }
  }
  if (percentage >= 35) {
    return { label: 'Medel risk', percentage, className: 'medium' }
  }
  return { label: 'Låg risk', percentage, className: 'low' }
}

type HomeReportsListProps = {
  onOpenReports: (number: string) => void
  onOpenFraudType: (fraudType: string) => void
}

function HomeReportsList({ onOpenReports, onOpenFraudType }: HomeReportsListProps) {
  const [mode, setMode] = useState<'top' | 'recent' | 'searched' | 'fraudTypes'>('recent')
  const [items, setItems] = useState<HomeReportItem[]>([])
  const [fraudTypeItems, setFraudTypeItems] = useState<FraudTypeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        if (mode === 'fraudTypes') {
          const data = await getFraudTypes(20)
          if (mounted) {
            setFraudTypeItems(data.items)
            setItems([])
          }
        } else {
          const data = await getHomeReports(mode)
          if (mounted) {
            setItems(data.items)
            setFraudTypeItems([])
          }
        }
      } catch (err) {
        if (mounted) {
          setItems([])
          setFraudTypeItems([])
          setError(err instanceof Error ? err.message : 'Could not load reports')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [mode])

  return (
    <div>
      <div className="reports-tabs">
        <button
          type="button"
          className={mode === 'top' ? 'active' : ''}
          onClick={() => setMode('top')}
        >
          Top reported numbers
        </button>
        <button
          type="button"
          className={mode === 'recent' ? 'active' : ''}
          onClick={() => setMode('recent')}
        >
          Recent reports
        </button>
        <button
          type="button"
          className={mode === 'searched' ? 'active' : ''}
          onClick={() => setMode('searched')}
        >
          Most searched (no reports)
        </button>
        <button
          type="button"
          className={mode === 'fraudTypes' ? 'active' : ''}
          onClick={() => setMode('fraudTypes')}
        >
          Fraud types
        </button>
      </div>

      {loading && <p>Laddar...</p>}
      {error && <p className="form-message error">{error}</p>}

      {!loading && !error && mode === 'fraudTypes' && (
        <ul className="reports-list">
          {fraudTypeItems.length === 0 && <li>Inga bedrägerityper hittades ännu.</li>}
          {fraudTypeItems.map((item) => (
            <li key={item.fraud_type}>
              <button
                type="button"
                className="report-item-button"
                onClick={() => onOpenFraudType(item.fraud_type)}
              >
                <div className="reports-row">
                  <strong>{item.fraud_type}</strong>
                  <span>{item.numbers_count} nummer</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && mode !== 'fraudTypes' && (
        <ul className="reports-list">
          {items.length === 0 && (
            <li>{mode === 'searched' ? 'Inga sökta nummer utan rapporter ännu.' : 'Inga rapporter ännu.'}</li>
          )}
          {items.map((item) => {
            const risk = getRiskLevel(item.search_count)
            return (
              <li key={`${item.id}-${item.number}`}>
                <button
                  type="button"
                  className="report-item-button"
                  onClick={() => onOpenReports(item.number)}
                >
                  <div className="reports-row">
                    <strong>{item.number}</strong>
                    <span>{item.reports_count} rapporter</span>
                  </div>
                  <div className="reports-meta">
                    <span>{item.search_count} sökningar</span>
                    <span className={`risk-chip risk-${risk.className}`}>
                      {risk.label} ({risk.percentage}%)
                    </span>
                  </div>
                  {item.fraud_type && <p>{item.fraud_type}</p>}
                  {item.description && <p>{item.description}</p>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default HomeReportsList
