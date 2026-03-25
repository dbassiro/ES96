import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Pages available to all admins
const links = [
  { to: '/items', label: 'Items' },
  { to: '/transactions', label: 'Transactions' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">

      {/* App title and subtitle */}
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-semibold tracking-wide">ES96 Admin</h1>
        <p className="text-xs text-gray-400 mt-0.5">Supply Management</p>
      </div>

      {/* Navigation links — active link gets indigo highlight */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logged-in user info and logout button pinned to the bottom */}
      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-1">Signed in as</p>
        <p className="text-sm font-mono text-white truncate">{user?.huid}</p>
        <button
          onClick={logout}
          className="mt-3 w-full text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-md py-1.5 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
