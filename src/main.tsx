import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRouter } from './app/Router.tsx'
import { ensureServiceWorker } from '@/shared/lib/webPush'
import './shared/styles/index.css'

void ensureServiceWorker().catch(() => {
  // SW optional — ignore register errors (e.g. unsupported)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)