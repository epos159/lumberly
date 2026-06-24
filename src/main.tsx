import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import BetaApp from './BetaApp'
import './index.css'

const isBeta = window.location.pathname.startsWith('/beta')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isBeta ? <BetaApp /> : <App />}
  </React.StrictMode>,
)
