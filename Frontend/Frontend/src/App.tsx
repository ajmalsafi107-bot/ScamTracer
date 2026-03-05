import { useEffect, useState } from 'react'
import './App.css'
import FraudTypeNumbersPage from './FraudTypeNumbersPage'
import HomePage from './HomePage'
import NumberReportsPage from './NumberReportsPage'
import ReportPage from './ReportPage'

type Route =
  | { name: 'home' }
  | { name: 'report' }
  | { name: 'fraudTypeNumbers'; fraudType: string }
  | { name: 'numberReports'; number: string }

const getRoute = (): Route => {
  const hash = window.location.hash.replace(/^#/, '') || '/'

  if (hash === '/rapportera') {
    return { name: 'report' }
  }

  const match = hash.match(/^\/nummer\/(.+)$/)
  if (match) {
    return { name: 'numberReports', number: decodeURIComponent(match[1]) }
  }

  const fraudTypeMatch = hash.match(/^\/bedragerityp\/(.+)$/)
  if (fraudTypeMatch) {
    return { name: 'fraudTypeNumbers', fraudType: decodeURIComponent(fraudTypeMatch[1]) }
  }

  return { name: 'home' }
}

function App() {
  const [route, setRoute] = useState<Route>(getRoute)

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const goHome = () => {
    window.location.hash = '#/'
    setRoute({ name: 'home' })
  }

  const goReport = () => {
    window.location.hash = '#/rapportera'
    setRoute({ name: 'report' })
  }

  const openNumberReports = (number: string) => {
    window.location.hash = `#/nummer/${encodeURIComponent(number)}`
    setRoute({ name: 'numberReports', number })
  }

  const openFraudTypeNumbers = (fraudType: string) => {
    window.location.hash = `#/bedragerityp/${encodeURIComponent(fraudType)}`
    setRoute({ name: 'fraudTypeNumbers', fraudType })
  }

  if (route.name === 'report') {
    return <ReportPage onCancel={goHome} />
  }

  if (route.name === 'numberReports') {
    return <NumberReportsPage number={route.number} onBack={goHome} onReportClick={goReport} />
  }

  if (route.name === 'fraudTypeNumbers') {
    return (
      <FraudTypeNumbersPage
        fraudType={route.fraudType}
        onBack={goHome}
        onReportClick={goReport}
        onOpenReports={openNumberReports}
      />
    )
  }

  return (
    <HomePage
      onReportClick={goReport}
      onOpenReports={openNumberReports}
      onOpenFraudType={openFraudTypeNumbers}
    />
  )
}

export default App
