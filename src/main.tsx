import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Add error handling for CSS loading issues
window.addEventListener('error', (e) => {
  if (e.target && e.target instanceof HTMLLinkElement && e.target.rel === 'stylesheet') {
    console.error('CSS loading failed:', e.target.href)
    // Try to reload the CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = e.target.href
    document.head.appendChild(link)
  }
})

// Configure PDF.js worker for react-pdf-viewer
import { GlobalWorkerOptions } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.js?url'

// Set worker source using local worker file (Vite ?url suffix returns the URL string)
GlobalWorkerOptions.workerSrc = workerSrc

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
