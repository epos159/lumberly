import { useState } from 'react'
import BetaForm from './components/BetaForm'
import MaterialList from './components/MaterialList'
import { calculateBetaTakeoff } from './utils/betaCalculations'
import type { BetaInput } from './betaTypes'
import type { MaterialItem } from './types'

export default function BetaApp() {
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [projectName, setProjectName] = useState<string | undefined>()

  function handleSubmit(input: BetaInput) {
    setMaterials(calculateBetaTakeoff(input))
    setProjectName(input.projectName)
  }

  return (
    <div className="app">
      {/* noindex for beta — keep out of search results until ready */}
      <meta name="robots" content="noindex,nofollow" />

      <header className="app-header">
        <img
          src="/lumberly.png"
          alt="Lumberly - Advanced Lumber Takeoff"
          className="app-banner"
        />
        <div className="beta-badge">BETA</div>
        <h1>Advanced Framing Takeoff</h1>
        <p className="tagline">
          For L-shapes, garage wings, partial second floors, and any addition that isn't a single rectangle.
          Enter area and lineal feet measured from your plan.
        </p>
      </header>

      <div className="beta-banner">
        <strong>Beta page — work in progress.</strong>{' '}
        Results are estimates. Compare against your plan before sending to the yard.{' '}
        <a href="/">← Back to standard calculator</a>
      </div>

      <main className="app-main">
        <BetaForm onSubmit={handleSubmit} />
        {materials.length > 0 && (
          <MaterialList materials={materials} projectName={projectName} />
        )}
      </main>

      <footer className="app-footer">
        <a href="/">← Standard calculator</a>
        {' · '}
        <a href="https://poschventures.com" target="_blank" rel="noopener noreferrer">
          For more, visit Posch Ventures
        </a>
      </footer>
    </div>
  )
}
