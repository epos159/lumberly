import { useState } from 'react'
import ProjectForm from './components/ProjectForm'
import MaterialList from './components/MaterialList'
import { calculateTakeoff } from './utils/calculations'
import type { ProjectInput } from './types'

function App() {
  const [materials, setMaterials] = useState<ReturnType<typeof calculateTakeoff>>([])
  const [projectName, setProjectName] = useState<string | undefined>()

  const handleSubmit = (input: ProjectInput) => {
    setMaterials(calculateTakeoff(input))
    setProjectName(input.projectName)
  }

  return (
    <div className="app">
      <header className="app-header">
        <img
          src="/lumberly.png"
          alt="Lumberly - Lumber package takeoff for stick framing"
          className="app-banner"
        />
        <h1>Free Lumber Takeoff Calculator</h1>
        <p className="tagline">
          Build a quick framing material list for floor joists, wall studs, roof framing,
          and sheathing so estimators can request lumber pricing without waiting on the yard.
        </p>
      </header>

      <main className="app-main">
        <section className="seo-intro" aria-label="Lumberly overview">
          <h2>Quick Framing Estimates for Lumber Yard Pricing</h2>
          <p>
            Lumberly helps contractors and estimators turn basic project dimensions into a
            lumber package takeoff. Use it to estimate floor framing, wall framing, roof
            framing, subfloor, and sheathing quantities before sending a material list out
            for pricing.
          </p>
          <ul>
            <li>Free lumber takeoff calculator for additions, garages, and small builds.</li>
            <li>Framing material list with joists, studs, plates, rafters, headers, and sheathing.</li>
            <li>Export to Excel/CSV or print/save as PDF for quick lumber yard quotes.</li>
          </ul>
        </section>
        <ProjectForm onSubmit={handleSubmit} />
        {materials.length > 0 && <MaterialList materials={materials} projectName={projectName} />}
      </main>

      <footer className="app-footer">
        <a href="/beta">L-shape, garage wing, or partial 2nd floor? Try the advanced takeoff (beta)</a>
        {' · '}
        <a href="https://poschventures.com" target="_blank" rel="noopener noreferrer">
          For more, visit Posch Ventures
        </a>
      </footer>
    </div>
  )
}

export default App
