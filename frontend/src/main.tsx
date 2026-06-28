import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-country-state-city/dist/react-country-state-city.css'
import App from './App.tsx'
import { setupChunkLoadRecovery } from './utils/chunk-load-recovery'

setupChunkLoadRecovery()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
