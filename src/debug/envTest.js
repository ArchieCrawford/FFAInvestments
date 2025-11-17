/**
 * Simple test to check environment variables in browser
 * Open browser console on the site to see debug output
 */

console.log('🔍 Environment Variable Debug Test:')
console.log('VITE_SCHWAB_CLIENT_ID:', import.meta.env.VITE_SCHWAB_CLIENT_ID)
console.log('REACT_APP_SCHWAB_CLIENT_ID:', import.meta.env.REACT_APP_SCHWAB_CLIENT_ID)
console.log('All VITE vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')))
console.log('All REACT_APP vars:', Object.keys(import.meta.env).filter(key => key.startsWith('REACT_APP_')))

export default {}