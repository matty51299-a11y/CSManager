import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

function hardResetCareer() {
  try {
    Object.keys(localStorage).filter((key) => key.startsWith('csdm-career')).forEach((key) => localStorage.removeItem(key));
  } finally {
    window.location.reload();
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary onReset={hardResetCareer}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
