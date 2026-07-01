import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setBaseUrl } from '@workspace/api-client-react'

setBaseUrl('/api')

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
