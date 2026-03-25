import { createContext, useContext, useState } from 'react'
import { supabase, useMock } from '../lib/supabase'
import { mockUsers } from '../lib/mockData'

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

  // Looks up the HUID + PIN against the users table and checks is_admin.
  // Returns true on success, false on failure.
  async function login(huid, pin) {
    setLoading(true)
    setLoginError(null)

    if (useMock) {
      // Find the user in mock data — match on huid, pin, and is_admin
      const found = mockUsers.find(
        u => u.huid === huid && u.pin === pin && u.is_admin
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

    // Query Supabase — match on huid and pin, check is_admin flag
    const { data, error } = await supabase
      .from('users')
      .select('huid, billing_node, is_admin')
      .eq('huid', huid)
      .eq('pin', pin)
      .single()

    setLoading(false)

    if (error || !data) {
      setLoginError('Invalid credentials.')
      return false
    }
    if (!data.is_admin) {
      setLoginError('This account does not have admin access.')
      return false
    }

    setUser(data)
    localStorage.setItem('es96_admin_user', JSON.stringify(data))
    return true
  }

  function logout() {
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
