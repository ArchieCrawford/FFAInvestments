import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Error boundary component to catch rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 React Error Boundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          background: '#ffe6e6', 
          border: '2px solid red', 
          margin: '20px',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2>🚨 Application Error</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details</summary>
            <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
            <p><strong>Stack:</strong></p>
            <code>{this.state.errorInfo.componentStack}</code>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

// Test importing App component
let App
try {
  console.log('� Attempting to import App component...')
  App = (await import('./App.jsx')).default
  console.log('✅ App component imported successfully')
} catch (error) {
  console.error('❌ Failed to import App component:', error)
  
  // Render error instead of App
  ReactDOM.createRoot(document.getElementById('root')).render(
    <div style={{ 
      padding: '20px', 
      background: '#ffe6e6', 
      border: '2px solid red', 
      margin: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>❌ Import Error</h2>
      <p><strong>Failed to import App component:</strong></p>
      <p>{error.message}</p>
      <details>
        <summary>Full Error</summary>
        <pre>{error.stack}</pre>
      </details>
    </div>
  )
  throw error // Stop execution
}

console.log('🚀 Starting main application with error boundary...')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)