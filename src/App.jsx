import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import Transactions from './pages/Transactions'

// Inner component so it can access the AuthContext provided by AuthProvider above it
function AppRoutes() {
  const { user } = useAuth()

  // If no admin is logged in, show the login page for all routes
  if (!user) {
    return <Login />
  }

  // Admin is authenticated — render the full admin layout
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/items" element={<Items />} />
          <Route path="/transactions" element={<Transactions />} />
          {/* Catch-all redirects unknown paths back to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    // AuthProvider wraps everything so all components can access login state
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}