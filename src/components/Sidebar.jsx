import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const CRIMSON = '#A51C30'
const CRIMSON_DARK = '#8b1726'

// Pages available to all admins
const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/items', label: 'Items' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/inventory', label: 'Inventory' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-56 min-h-screen text-white flex flex-col" style={{ backgroundColor: CRIMSON }}>

      {/* App title and subtitle */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <h1 className="text-lg font-bold tracking-wide">ES96 Admin</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Harvard SEAS Supply</p>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-red-900 font-semibold'
                  : 'hover:bg-white/20'
              }`
            }
            style={({ isActive }) => isActive ? { color: CRIMSON_DARK } : { color: 'rgba(255,255,255,0.9)' }}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logged-in user info and logout button pinned to the bottom */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Signed in as</p>
        <p className="text-sm font-mono text-white truncate">{user?.huid}</p>
        <button
          onClick={logout}
          className="mt-3 w-full text-xs rounded-md py-1.5 transition-colors hover:bg-white/20"
          style={{ color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}