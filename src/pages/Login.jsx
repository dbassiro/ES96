import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMock } from '../lib/supabase'

export default function Login() {
  const { login, loginError, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    await login(email, password)
    // On success, App.jsx will detect user is set and render the main layout
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">

        {/* Logo / title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">ES96 Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Supply Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* HUID field */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Error message from AuthContext */}
          {loginError && (
            <p className="text-red-500 text-xs">{loginError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Hint shown only in mock mode so devs know the test credentials */}
        {useMock && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Mock mode — Email: <span className="font-mono">admin@es96.com</span> / Password: <span className="font-mono">admin123</span>
          </p>
        )}
      </div>
    </div>
  )
}
