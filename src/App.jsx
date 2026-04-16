import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import Transactions from './pages/Transactions'
import Inventory from './pages/Inventory'

// Routing
function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 overflow-auto">
        <div className="flex flex-col items-center gap-4 p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {user && <Sidebar />}

      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          {/* Public routes (blocked if logged in) */}
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" replace />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/" replace />}
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={user ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/items"
            element={user ? <Items /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/transactions"
            element={user ? <Transactions /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/inventory"
            element={user ? <Inventory /> : <Navigate to="/login" replace />}
          />

          {/* Catch-all */}
          <Route
            path="*"
            element={
              user
                ? <Navigate to="/" replace />
                : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}