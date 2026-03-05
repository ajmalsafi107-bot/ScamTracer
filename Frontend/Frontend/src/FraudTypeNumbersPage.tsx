import { useEffect, useState } from 'react'

import { getFraudTypeNumbers } from './services/fraudTypesApi'
import type { FraudTypeNumberItem } from './types/fraudTypes'

type FraudTypeNumbersPageProps = {
  fraudType: string
  onBack: () => void
  onReportClick: () => void
  onOpenReports: (number: string) => void
}

const FULL_RISK_SEARCHES = 50

function getRiskLevel(searchCount: number): {
  percentage: number
  label: string
  className: 'low' | 'medium' | 'high'
} {
  const percentage = Math.min(100, Math.round((searchCount / FULL_RISK_SEARCHES) * 100))

  if (percentage >= 70) {
    return { percentage, label: 'Hög risk', className: 'high' }
  }

  if (percentage >= 35) {
    return { percentage, label: 'Medel risk', className: 'medium' }
  }

  return { percentage, label: 'Låg risk', className: 'low' }
}

function FraudTypeNumbersPage({
  fraudType,
  onBack,
  onReportClick,
  onOpenReports,
}: FraudTypeNumbersPageProps) {
  const [items, setItems] = useState<FraudTypeNumberItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getFraudTypeNumbers(fraudType, 100)
        if (mounted) {
          setItems(data.items)
        }
      } catch (err) {
        if (mounted) {
          setItems([])
          setError(err instanceof Error ? err.message : 'Could not load fraud type numbers')
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
  }, [fraudType])

  return (
    <div className="page">
      <header className="site-header">
        <div className="container nav-shell">
          <a className="brand" href="#" onClick={onBack}>
            ScamTracer
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#" onClick={onBack}>
              Hem
            </a>
            <a href="#">Bedrägeriarter</a>
            <a href="#">Artiklar</a>
            <a href="#">Om oss</a>
          </nav>
          <button className="report-btn" type="button" onClick={onReportClick}>
            Rapportera bluff
          </button>
        </div>
      </header>

      <main className="report-main">
        <div className="container reports-detail-card">
          <button type="button" className="btn-secondary" onClick={onBack}>
            Tillbaka
          </button>
          <h1>Nummer för bedrägerityp: {fraudType}</h1>

          {loading && <p>Laddar...</p>}
          {error && <p className="form-message error">{error}</p>}

          {!loading && !error && items.length === 0 && (
            <p>Inga nummer hittades för den här bedrägeritypen.</p>
          )}

          {!loading && !error && items.length > 0 && (
            <ul className="reports-list reports-list-detailed">
              {items.map((item) => {
                const risk = getRiskLevel(item.search_count)
                return (
                  <li key={`${item.number}-${item.reports_count}`}>
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
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default FraudTypeNumbersPage
