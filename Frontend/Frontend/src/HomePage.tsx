import HomeReportsList from './components/HomeReportsList'
import NumberSearch from './components/NumberSearch'

type HomePageProps = {
  onReportClick: () => void
}

function HomePage({ onReportClick }: HomePageProps) {
  return (
    <div className="page">
      <header className="site-header">
        <div className="container nav-shell">
          <a className="brand" href="#">
            ScamTracer
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#">Hem</a>
            <a href="#">Bedrägeriarter</a>
            <a href="#">Artiklar</a>
            <a href="#">Om oss</a>
          </nav>
          <button className="report-btn" type="button" onClick={onReportClick}>
            Rapportera bluff
          </button>
        </div>
      </header>

      <main className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">Sakerhet online, enkelt</p>
          <h1>ScamTracer</h1>
          <p>
            Osäker på ett meddelande eller samtal? Ta reda på om numret är rapporterat som bluff i Sverige.
          </p>

          <NumberSearch />
        </div>
      </main>

      <section className="reports-section">
        <div className="container">
          <h2>Senaste rapporterade bluffar</h2>
          <p>Nyligen anmälda bedrägeriförsök i Sverige</p>
          <HomeReportsList />
        </div>
      </section>
    </div>
  )
}

export default HomePage
