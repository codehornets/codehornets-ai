import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Initialize Sentry for error tracking and monitoring
import { initSentry } from '@/lib/sentry'
import { initPerformanceMonitoring } from '@/lib/performanceMonitoring'
import { installApiInterceptor } from '@/lib/apiInterceptor'

// Initialize monitoring and tracking
initSentry()
initPerformanceMonitoring()
installApiInterceptor()

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}



