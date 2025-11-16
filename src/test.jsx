import React from 'react'
import ReactDOM from 'react-dom/client'

// Minimal test component
const TestApp = () => {
  console.log('🎯 TestApp component rendering')
  
  return (
    <div style={{ 
      padding: '20px', 
      fontSize: '24px', 
      color: 'green', 
      background: 'white',
      border: '2px solid green',
      borderRadius: '8px',
      margin: '20px'
    }}>
      <h1>✅ React is Working!</h1>
      <p>Current time: {new Date().toLocaleString()}</p>
      <p>If you can see this, React is rendering correctly.</p>
      <button onClick={() => alert('Button clicked!')}>
        Test Interaction
      </button>
    </div>
  )
}

console.log('🚀 Starting minimal React app...')

try {
  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(<TestApp />)
  console.log('✅ Minimal React app rendered successfully')
} catch (error) {
  console.error('❌ Error rendering minimal React app:', error)
  document.getElementById('root').innerHTML = `
    <div style="color: red; padding: 20px; background: #ffe6e6; border: 2px solid red; margin: 20px;">
      <h2>❌ React Error</h2>
      <p><strong>Error:</strong> ${error.message}</p>
      <p>Check the browser console for more details.</p>
    </div>
  `
}