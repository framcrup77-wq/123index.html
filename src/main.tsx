import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/sarabun/400.css'
import '@fontsource/sarabun/600.css'
import '@fontsource/sarabun/700.css'
import '@/styles/globals.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
