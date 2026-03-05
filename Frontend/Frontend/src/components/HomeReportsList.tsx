import { useEffect, useState } from 'react'

import { getHomeReports } from '../services/homeReportsApi'
import type { HomeReportItem } from '../types/homeReports'

function HomeReportsList() {
  const [mode, setMode] = useState<'top' | 'recent'>('recent')
  const [items, setItems] = useState<HomeReportItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getHomeReports(mode)
        if (mounted) {
          setItems(data.items)
        }
      } catch (err) {
        if (mounted) {
          setItems([])
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
      </div>

      {loading && <p>Laddar...</p>}
      {error && <p className="form-message error">{error}</p>}

      {!loading && !error && (
        <ul className="reports-list">
          {items.length === 0 && <li>Inga rapporter ännu.</li>}
          {items.map((item) => (
            <li key={`${item.id}-${item.number}`}>
              <div className="reports-row">
                <strong>{item.number}</strong>
                <span>{item.reports_count} rapporter</span>
              </div>
              {item.fraud_type && <p>{item.fraud_type}</p>}
              {item.description && <p>{item.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default HomeReportsList
