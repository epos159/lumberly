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
      </header>

      <main className="app-main">
        <ProjectForm onSubmit={handleSubmit} />
        {materials.length > 0 && <MaterialList materials={materials} projectName={projectName} />}
      </main>

      <footer className="app-footer">
        <a href="https://poschventures.com" target="_blank" rel="noopener noreferrer">
          poschventures.com
        </a>
      </footer>
    </div>
  )
}

export default App
