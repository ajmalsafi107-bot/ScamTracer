import { useEffect, useState } from 'react'
import './App.css'
import HomePage from './HomePage'
import ReportPage from './ReportPage'

type Route = 'home' | 'report'

const getRoute = (): Route => (window.location.hash === '#/rapportera' ? 'report' : 'home')

function App() {
  const [route, setRoute] = useState<Route>(getRoute)

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const goHome = () => {
    window.location.hash = '#/'
    setRoute('home')
  }

  const goReport = () => {
    window.location.hash = '#/rapportera'
    setRoute('report')
  }

  if (route === 'report') {
    return <ReportPage onCancel={goHome} />
  }

  return <HomePage onReportClick={goReport} />
}

export default App
