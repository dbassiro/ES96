import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('es96_admin_user')
    return stored ? JSON.parse(stored) : null
  })

  const [loginError, setLoginError] = useState(null)
  const [signupError, setSignupError] = useState(null)
  const [signupMessage, setSignupMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  async function login(email, password) {
    setLoading(true)
    setLoginError(null)

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData.user) {
      setLoading(false)
      setLoginError('Invalid credentials.')
      return false
    }

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

  async function register(email, password) {
    setLoading(true)
    setSignupError(null)
    setSignupMessage(null)

    // Step 1: Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setSignupError(error.message)
      setLoading(false)
      return { success: false }
    }

    const newUser = data.user

    if (!newUser) {
      setSignupError('Signup failed.')
      setLoading(false)
      return { success: false }
    }

    const { error: insertError } = await supabase.from('users').insert([
      {
        id: newUser.id,
        email: newUser.email,
        role: 'admin',
        name: '',
        department: '',
      },
    ])

    if (insertError) {
      setSignupError('User created but profile insert failed.')
      setLoading(false)
      return { success: false }
    }

    // Step 3: Handle email confirmation case
    if (!data.session) {
      setSignupMessage('Check your email to confirm your account.')
    } else {
      setSignupMessage('Account created successfully.')
    }

    setLoading(false)
    return { success: true }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem('es96_admin_user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loginError,
        signupError,
        signupMessage,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}