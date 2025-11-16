import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Simple Authentication Test Component
 * Use this to debug Supabase authentication issues
 * Temporarily replace SupabaseLogin with this component to test
 */
const AuthTest = () => {
  const [status, setStatus] = useState('Initializing...')
  const [logs, setLogs] = useState([])
  const [testUser, setTestUser] = useState(null)
  const [formData, setFormData] = useState({ email: 'admin@ffa.com', password: 'admin123' })

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, type }])
    console.log(`[${timestamp}] ${message}`)
  }

  useEffect(() => {
    addLog('Component mounted, testing Supabase connection...')
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      addLog('Testing basic Supabase connection...')
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
      
      if (error) {
        addLog(`Connection failed: ${error.message}`, 'error')
        setStatus('Connection Failed')
      } else {
        addLog('✅ Supabase connection successful!', 'success')
        setStatus('Connected')
      }
    } catch (err) {
      addLog(`Unexpected error: ${err.message}`, 'error')
      setStatus('Error')
    }
  }

  const testSignIn = async () => {
    try {
      addLog(`Attempting sign in for ${formData.email}...`)
      setStatus('Signing in...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      
      if (error) {
        addLog(`❌ Sign in failed: ${error.message}`, 'error')
        setStatus('Sign In Failed')
        
        // Log additional error details
        addLog(`Error details: Code: ${error.code || 'none'}, Status: ${error.status || 'none'}`, 'error')
      } else {
        addLog('✅ Sign in successful!', 'success')
        setTestUser(data.user)
        setStatus('Authenticated')
        
        // Check for profile
        checkProfile(data.user.id)
      }
    } catch (err) {
      addLog(`Unexpected sign in error: ${err.message}`, 'error')
      setStatus('Error')
    }
  }

  const checkProfile = async (userId) => {
    try {
      addLog(`Checking profile for user ${userId}...`)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          addLog('ℹ️ Profile not found, this is normal for new users', 'warning')
        } else {
          addLog(`Profile lookup error: ${error.message}`, 'error')
        }
      } else {
        addLog(`✅ Profile found: ${data.display_name || 'No name'}, Role: ${data.role}`, 'success')
      }
    } catch (err) {
      addLog(`Profile check error: ${err.message}`, 'error')
    }
  }

  const testSignUp = async () => {
    try {
      const testEmail = 'newuser@ffainvestments.com'
      addLog(`Testing sign up for ${testEmail}...`)
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123',
      })
      
      if (error) {
        addLog(`Sign up failed: ${error.message}`, 'error')
      } else {
        addLog('✅ Sign up test successful! (Check for confirmation email)', 'success')
      }
    } catch (err) {
      addLog(`Sign up error: ${err.message}`, 'error')
    }
  }

  const testSignOut = async () => {
    try {
      addLog('Testing sign out...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        addLog(`Sign out failed: ${error.message}`, 'error')
      } else {
        addLog('✅ Sign out successful!', 'success')
        setTestUser(null)
        setStatus('Signed Out')
      }
    } catch (err) {
      addLog(`Sign out error: ${err.message}`, 'error')
    }
  }

  const clearLogs = () => {
    setLogs([])
    addLog('Logs cleared')
  }

  const exportLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.message}`).join('\n')
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ffa-auth-debug-logs.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          FFA Investments - Authentication Debug Tool
        </h1>
        
        {/* Status */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-2">Status</h2>
          <p className="text-lg">
            <span className="font-medium">Current Status:</span> {status}
          </p>
          {testUser && (
            <p className="text-sm text-gray-600 mt-2">
              Logged in as: {testUser.email}
            </p>
          )}
        </div>

        {/* Environment Info */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-2">Environment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Supabase URL:</span>
              <br />
              {import.meta.env.VITE_SUPABASE_URL || '❌ Missing'}
            </div>
            <div>
              <span className="font-medium">Anon Key:</span>
              <br />
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
            </div>
            <div>
              <span className="font-medium">App URL:</span>
              <br />
              {import.meta.env.VITE_APP_URL || '❌ Missing'}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="space-y-4">
            {/* Sign In Test */}
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="border rounded px-3 py-2"
                placeholder="Email"
              />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="border rounded px-3 py-2"
                placeholder="Password"
              />
              <button
                onClick={testSignIn}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Test Sign In
              </button>
            </div>

            {/* Other Tests */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={testConnection}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Test Connection
              </button>
              <button
                onClick={testSignUp}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                Test Sign Up
              </button>
              {testUser && (
                <button
                  onClick={testSignOut}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Debug Logs</h2>
            <div className="space-x-2">
              <button
                onClick={clearLogs}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                Clear
              </button>
              <button
                onClick={exportLogs}
                className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600"
              >
                Export
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono mb-1 ${
                    log.type === 'error' ? 'text-red-600' :
                    log.type === 'success' ? 'text-green-600' :
                    log.type === 'warning' ? 'text-yellow-600' :
                    'text-gray-700'
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. First, test the connection to ensure Supabase is reachable</li>
            <li>2. Try signing in with the default admin credentials</li>
            <li>3. Check the logs for detailed error messages</li>
            <li>4. Export logs if you need to share them for support</li>
            <li>5. If connection fails, check your .env file and Supabase project status</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default AuthTest