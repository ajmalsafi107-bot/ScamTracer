import { useState } from 'react'

import { searchNumber } from '../services/searchApi'
import type { SearchResult } from '../types/search'

function NumberSearch() {
  const [number, setNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)

  const handleSearch = async () => {
    if (!number.trim()) return
    setLoading(true)
    setError('')

    try {
      const data = await searchNumber(number)
      setResult(data)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'Could not search number')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="search-box" role="group" aria-label="Sok nummer">
        <button type="button" onClick={handleSearch} disabled={loading}>
          Sök
        </button>
        <input
          className="search-field"
          type="tel"
          placeholder="ange nummret, t.ex 070xxxxxxx"
          aria-label="Ange nummer"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
        />
      </div>
      {error && <p className="form-message error">{error}</p>}

      {result && (
        <section className="search-result">
          <h3>Sökresultat för {result.number}</h3>
          <p>Antal sökningar på numret: {result.search_count}</p>
          <p>Antal rapporter: {result.reports_count}</p>

          {result.reports_count > 0 ? (
            <ul>
              {result.reports.map((report) => (
                <li key={report.id}>
                  <strong>{report.fraud_type}</strong>: {report.description}
                </li>
              ))}
            </ul>
          ) : (
            <p>Inga rapporter hittades för numret.</p>
          )}
        </section>
      )}
    </>
  )
}

export default NumberSearch
