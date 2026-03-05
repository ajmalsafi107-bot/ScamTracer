import { useEffect, useState } from 'react'

import { getNumberStats, getReportsByNumber } from './services/numberReportsApi'
import type { NumberReportItem } from './types/numberReports'

type NumberReportsPageProps = {
  number: string
  onBack: () => void
  onReportClick: () => void
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

function NumberReportsPage({ number, onBack, onReportClick }: NumberReportsPageProps) {
  const [reports, setReports] = useState<NumberReportItem[]>([])
  const [searchCount, setSearchCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const risk = getRiskLevel(searchCount)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [reportsData, statsData] = await Promise.all([
          getReportsByNumber(number),
          getNumberStats(number),
        ])
        if (mounted) {
          setReports(reportsData.reports)
          setSearchCount(statsData.search_count)
        }
      } catch (err) {
        if (mounted) {
          setReports([])
          setSearchCount(0)
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
  }, [number])

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
          <h1>Alla rapporter för {number}</h1>

          {loading && <p>Laddar rapporter...</p>}
          {error && <p className="form-message error">{error}</p>}

          {!loading && !error && (
            <section className={`risk-level risk-${risk.className}`}>
              <p className="risk-level-title">Risknivå</p>
              <p className="risk-level-value">
                {risk.label} - {risk.percentage}%
              </p>
              <p className="risk-level-note">
                {searchCount} sökningar registrerade. 50 sökningar motsvarar 100% risk.
              </p>
            </section>
          )}

          {!loading && !error && reports.length === 0 && <p>Inga rapporter hittades för numret.</p>}

          {!loading && !error && reports.length > 0 && (
            <ul className="reports-list reports-list-detailed">
              {reports.map((report) => (
                <li key={report.id}>
                  <div className="reports-row">
                    <strong>{report.fraud_type}</strong>
                    <span>{report.reported_at ? new Date(report.reported_at).toLocaleString('sv-SE') : ''}</span>
                  </div>
                  <p>{report.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default NumberReportsPage
