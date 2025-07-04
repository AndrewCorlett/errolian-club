import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Configure PDF.js worker for react-pdf-viewer
import { GlobalWorkerOptions } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.js?url'

// Set worker source using local worker file (Vite ?url suffix returns the URL string)
GlobalWorkerOptions.workerSrc = workerSrc

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
