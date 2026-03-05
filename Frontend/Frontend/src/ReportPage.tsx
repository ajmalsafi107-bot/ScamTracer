import { useState } from 'react'
import type { FormEvent } from 'react'

type ReportPageProps = {
  onCancel: () => void
}

function ReportPage({ onCancel }: ReportPageProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [scamType, setScamType] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('idle')
    setStatusMessage('')

    try {
      setSubmitting(true)
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: phoneNumber,
          category: scamType,
          description,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Could not submit report')
      }

      setStatus('success')
      setStatusMessage('Rapport skickad. Tack for att du hjalper andra.')
      setPhoneNumber('')
      setScamType('')
      setDescription('')
    } catch (error) {
      setStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'Could not submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <header className="site-header">
        <div className="container nav-shell">
          <a className="brand" href="#" onClick={onCancel}>
            ScamTracer
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#" onClick={onCancel}>
              Hem
            </a>
            <a href="#">Bedrägeriarter</a>
            <a href="#">Artiklar</a>
            <a href="#">Om oss</a>
          </nav>
        </div>
      </header>

      <main className="report-main">
        <div className="container report-layout">
          <section className="report-card">
            <h1>Rapportera en bluff</h1>
            <p>Hjälp andra användare genom att rapportera misstänkta bluffnummer</p>

            <form className="report-form" onSubmit={handleSubmit}>
              <label htmlFor="phone">Telefonnummer *</label>
              <input
                id="phone"
                type="tel"
                placeholder="T.ex. +46701234567 eller 0701234567"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                required
              />
              <small>Det nummer du vill rapportera</small>

              <label htmlFor="scamType">Typ av bedrägeri *</label>
              <select
                id="scamType"
                value={scamType}
                onChange={(event) => setScamType(event.target.value)}
                required
              >
                <option value="" disabled>
                  Välj en kategori...
                </option>
                <option value="SMS-bluff">SMS-bluff</option>
                <option value="Bank-ID">Bank-ID</option>
                <option value="Leveransbluff">Leveransbluff</option>
                <option value="Annat">Annat</option>
              </select>
              <small>Vad slags bedrägeri var det?</small>

              <label htmlFor="description">Beskrivning *</label>
              <textarea
                id="description"
                rows={6}
                placeholder="Beskriv vad som hände. T.ex. vilken typ av meddelande du fick, vad de ville ha från dig, etc."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
              <small>Mer detaljer hjälper andra att identifiera bedrägerier</small>

              {status !== 'idle' && (
                <p className={status === 'success' ? 'form-message success' : 'form-message error'}>
                  {statusMessage}
                </p>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={onCancel}>
                  Avbryt
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  Skicka rapport
                </button>
              </div>
            </form>
          </section>

          <aside className="tips-card">
            <h2>Tips för en bra rapport:</h2>
            <ul>
              <li>✓ Inkludera det fullständiga telefonnumret</li>
              <li>✓ Beskriv exakt vad som hände</li>
              <li>✓ Nämn tidpunkten om du kommer ihåg den</li>
              <li>✓ Beskriv vad de försökte få dig att göra</li>
              <li>✓ Din rapport hjälper andra att undvika samma bedrägerier</li>
            </ul>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default ReportPage
