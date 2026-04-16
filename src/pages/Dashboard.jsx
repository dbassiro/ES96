import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CRIMSON = '#A51C30'
const CRIMSON_LIGHT = '#f9e8ea'

const STOCKROOM_NAMES = {
  '7539130a-095a-43b6-a30f-b58f86851e0e': 'Stockroom A',
  '62cdfe44-f293-49e6-ab98-077597178df6': 'Stockroom B',
  '970485b5-efd5-48ae-a07b-e6b1aa9eacaf': 'Stockroom C',
}

const AVAILABLE_LABS = [
  'Machine Shop',
  'Living Materials',
  'Soft Robotics',
  'Biofabrication',
  'Microfluidics',
  'Imaging',
]

function getStockroomName(stockroomId) {
  return STOCKROOM_NAMES[stockroomId] ?? '—'
}

export default function Dashboard() {
  const [inventory, setInventory] = useState([])
  const [transactions, setTransactions] = useState([])
  const [itemCount, setItemCount] = useState(0)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [showLabAssignment, setShowLabAssignment] = useState(false)
  const [openLabDropdownFor, setOpenLabDropdownFor] = useState(null)
  const [savingUserId, setSavingUserId] = useState(null)

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchAll()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchAll()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchUsers()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchAll() {
    setLoading(true)
    setError(null)

    const [itemsRes, invRes, txRes, usersRes] = await Promise.all([
      supabase.from('items').select('id', { count: 'exact', head: true }),
      supabase
        .from('inventory')
        .select('id, quantity, min_quantity, item_id, stockroom_id, items(name)'),
      supabase
        .from('transactions')
        .select('id, type, quantity, created_at, stockroom_id, items(name), users(name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('users')
        .select('id, name, email, labs')
        .order('name', { ascending: true }),
    ])

    if (itemsRes.error) {
      setError(itemsRes.error.message)
      setLoading(false)
      return
    }

    if (invRes.error) {
      setError(invRes.error.message)
      setLoading(false)
      return
    }

    if (txRes.error) {
      setError(txRes.error.message)
      setLoading(false)
      return
    }

    if (usersRes.error) {
      setError(usersRes.error.message)
      setLoading(false)
      return
    }

    setItemCount(itemsRes.count ?? 0)
    setInventory(invRes.data ?? [])
    setTransactions(txRes.data ?? [])
    setUsers(usersRes.data ?? [])
    setLoading(false)
  }

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, labs')
      .order('name', { ascending: true })

    if (error) {
      setError(error.message)
      return
    }

    setUsers(data ?? [])
  }

  async function updateUserLabs(userId, nextLabs) {
    setSavingUserId(userId)
    setError(null)

    const { error } = await supabase
      .from('users')
      .update({ labs: nextLabs })
      .eq('id', userId)

    if (error) {
      setError(error.message)
      setSavingUserId(null)
      return
    }

    setUsers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, labs: nextLabs } : user
      )
    )

    setSavingUserId(null)
  }

  function toggleLab(user, lab) {
    const currentLabs = Array.isArray(user.labs) ? user.labs : []
    const hasLab = currentLabs.includes(lab)

    const nextLabs = hasLab
      ? currentLabs.filter(currentLab => currentLab !== lab)
      : [...currentLabs, lab]

    updateUserLabs(user.id, nextLabs)
  }

  const lowStock = inventory.filter(
    row => row.min_quantity != null && row.quantity <= row.min_quantity
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="border-b pb-5" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: CRIMSON }} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              ES96 Supply Management — Harvard SEAS
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: CRIMSON }}>{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Total Items
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">
            {loading ? '—' : itemCount}
          </p>
          <Link
            to="/items"
            className="text-xs font-medium mt-3 inline-block hover:underline"
            style={{ color: CRIMSON }}
          >
            View items →
          </Link>
        </div>

        <div
          className="rounded-xl p-6 shadow-sm border"
          style={{
            backgroundColor: lowStock.length > 0 ? CRIMSON_LIGHT : 'white',
            borderColor: lowStock.length > 0 ? CRIMSON : '#e5e7eb',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Low Stock
          </p>
          <p
            className="text-4xl font-bold mt-2"
            style={{ color: lowStock.length > 0 ? CRIMSON : '#111827' }}
          >
            {loading ? '—' : lowStock.length}
          </p>
          <p className="text-xs text-gray-500 mt-3">items below minimum</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Recent Activity
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-2">
            {loading ? '—' : transactions.length}
          </p>
          <Link
            to="/transactions"
            className="text-xs font-medium mt-3 inline-block hover:underline"
            style={{ color: CRIMSON }}
          >
            View all →
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-screen overflow-auto bg-white">
          <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
        </div>
      ) : (
        <>
  <div>
    <button
      onClick={() => setShowLabAssignment(prev => !prev)}
      className="w-full flex items-center justify-between mb-3 text-left hover:bg-gray-50 px-2 py-1 rounded transition-colors"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Lab Assignment
      </h2>

      <span
        className={`text-gray-500 text-lg transition-transform duration-300 ${
          showLabAssignment ? 'rotate-45' : 'rotate-0'
        }`}
      >
        +
      </span>
    </button>

    <div
      className={`grid transition-all duration-300 ease-in-out ${
        showLabAssignment
          ? 'grid-rows-[1fr] opacity-100 mt-3'
          : 'grid-rows-[0fr] opacity-0 mt-0'
      }`}
    >
      <div className="overflow-hidden">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: CRIMSON }}>
                {['User', 'Email', 'Current Labs', 'Assign / Remove'].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => {
                  const currentLabs = Array.isArray(user.labs) ? user.labs : []
                  const isOpen = openLabDropdownFor === user.id
                  const isSaving = savingUserId === user.id

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors align-top">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.name ?? '—'}
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {user.email ?? '—'}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {currentLabs.length === 0 ? (
                          <span className="text-gray-400">No labs assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {currentLabs.map(lab => (
                              <span
                                key={lab}
                                className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700"
                              >
                                {lab}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="relative w-72">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenLabDropdownFor(prev => prev === user.id ? null : user.id)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-left flex items-center justify-between hover:border-gray-400"
                          >
                            <span className="text-gray-700 truncate">
                              {isSaving ? 'Saving...' : 'Manage labs'}
                            </span>
                            <span className="ml-3 text-gray-400">▾</span>
                          </button>

                          {isOpen && (
                            <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg p-2">
                              <div className="max-h-64 overflow-auto">
                                {AVAILABLE_LABS.map(lab => {
                                  const checked = currentLabs.includes(lab)

                                  return (
                                    <label
                                      key={lab}
                                      className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-50 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={isSaving}
                                        onChange={() => toggleLab(user, lab)}
                                      />
                                      <span className="text-sm text-gray-700">{lab}</span>
                                    </label>
                                  )
                                })}
                              </div>

                              <div className="border-t border-gray-100 mt-2 pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setOpenLabDropdownFor(null)}
                                  className="text-xs font-medium hover:underline"
                                  style={{ color: CRIMSON }}
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
</div>

    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
        Low Stock Items
      </h2>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: CRIMSON }}>
                    {['Item', 'Stockroom', 'Quantity', 'Minimum'].map(h => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lowStock.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">
                        All items are sufficiently stocked
                      </td>
                    </tr>
                  ) : (
                    lowStock.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.items?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {getStockroomName(row.stockroom_id)}
                        </td>
                        <td className="px-4 py-3 font-bold" style={{ color: CRIMSON }}>
                          {row.quantity}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{row.min_quantity}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Recent Transactions
              </h2>
              <Link
                to="/transactions"
                className="text-xs font-medium hover:underline"
                style={{ color: CRIMSON }}
              >
                View all →
              </Link>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: CRIMSON }}>
                    {['Item', 'Type', 'Qty', 'User', 'Stockroom', 'Date'].map(h => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900">{tx.items?.name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                            style={
                              tx.type === 'checkout'
                                ? { backgroundColor: CRIMSON_LIGHT, color: CRIMSON }
                                : { backgroundColor: '#dcfce7', color: '#15803d' }
                            }
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{tx.quantity}</td>
                        <td className="px-4 py-3 text-gray-500">{tx.users?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {getStockroomName(tx.stockroom_id)}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}