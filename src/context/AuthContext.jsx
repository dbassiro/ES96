import { createContext, useContext, useState } from 'react'
import { supabase, useMock } from '../lib/supabase'
import { mockUsers, mockPasswords } from '../lib/mockData'

const AuthContext = createContext(null)

// Wraps the app and provides the logged-in admin user to all children
export function AuthProvider({ children }) {
  // Persist login across page refreshes using localStorage
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('es96_admin_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loginError, setLoginError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Authenticates via email + password, then verifies the user has role = 'admin'.
  // Returns true on success, false on failure.
  async function login(email, password) {
    setLoading(true)
    setLoginError(null)

    if (useMock) {
      // Find the user in mock data — match on email, password, and admin role
      const found = mockUsers.find(
        u => u.email === email && mockPasswords[u.email] === password && u.role === 'admin'
      )
      setLoading(false)
      if (!found) {
        setLoginError('Invalid credentials or not an admin account.')
        return false
      }
      setUser(found)
      localStorage.setItem('es96_admin_user', JSON.stringify(found))
      return true
    }

    // Step 1: authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData.user) {
      setLoading(false)
      setLoginError('Invalid credentials.')
      return false
    }

    // Step 2: check the users table to confirm this account has admin role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, name, email, role, department')
      .eq('id', authData.user.id)
      .single()

    setLoading(false)

    if (profileError || !profile) {
      setLoginError('Could not load user profile.')
      return false
    }
    if (profile.role !== 'admin') {
      setLoginError('This account does not have admin access.')
      return false
    }

    setUser(profile)
    localStorage.setItem('es96_admin_user', JSON.stringify(profile))
    return true
  }

  async function logout() {
    if (!useMock) await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem('es96_admin_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loginError, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Convenience hook — use this in any component to access auth state
export function useAuth() {
  return useContext(AuthContext)
}
