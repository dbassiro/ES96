import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, useMock } from '../lib/supabase'
import { mockItems, mockInventory, mockTransactions } from '../lib/mockData'

const CRIMSON = '#A51C30'
const CRIMSON_LIGHT = '#f9e8ea'

export default function Dashboard() {
  const [inventory, setInventory] = useState([])
  const [transactions, setTransactions] = useState([])
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAll()

    if (!useMock) {
      const channel = supabase
        .channel('dashboard-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
          fetchAll()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
          fetchAll()
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [])

  async function fetchAll() {
    setLoading(true)
    setError(null)

    if (useMock) {
      setItemCount(mockItems.length)
      setInventory(mockInventory)
      setTransactions(
        [...mockTransactions]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
      )
      setLoading(false)
      return
    }

    const [itemsRes, invRes, txRes] = await Promise.all([
      supabase.from('items').select('id', { count: 'exact', head: true }),
      supabase.from('inventory').select('id, quantity, min_quantity, item_id, items(name), stockrooms(name)'),
      supabase
        .from('transactions')
        .select('id, type, quantity, created_at, items(name), users(name), stockrooms(name)')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    if (itemsRes.error) { setError(itemsRes.error.message); setLoading(false); return }
    if (invRes.error)   { setError(invRes.error.message);   setLoading(false); return }
    if (txRes.error)    { setError(txRes.error.message);    setLoading(false); return }

    setItemCount(itemsRes.count ?? 0)
    setInventory(invRes.data ?? [])
    setTransactions(txRes.data ?? [])
    setLoading(false)
    console.log('[Dashboard] inventory rows:', invRes.data)
    console.log('[Dashboard] low stock rows:', (invRes.data ?? []).filter(r => r.min_quantity != null && r.quantity <= r.min_quantity))
  }

  const lowStock = inventory.filter(row => row.min_quantity != null && row.quantity <= row.min_quantity)

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="border-b pb-5" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: CRIMSON }} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">ES96 Supply Management — Harvard SEAS</p>
          </div>
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: CRIMSON }}>{error}</p>}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Items */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Items</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{loading ? '—' : itemCount}</p>
          <Link
            to="/items"
            className="text-xs font-medium mt-3 inline-block hover:underline"
            style={{ color: CRIMSON }}
          >
            View items →
          </Link>
        </div>

        {/* Low Stock */}
        <div
          className="rounded-xl p-6 shadow-sm border"
          style={{
            backgroundColor: lowStock.length > 0 ? CRIMSON_LIGHT : 'white',
            borderColor: lowStock.length > 0 ? CRIMSON : '#e5e7eb',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Low Stock</p>
          <p
            className="text-4xl font-bold mt-2"
            style={{ color: lowStock.length > 0 ? CRIMSON : '#111827' }}
          >
            {loading ? '—' : lowStock.length}
          </p>
          <p className="text-xs text-gray-500 mt-3">items below minimum</p>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Recent Activity</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{loading ? '—' : transactions.length}</p>
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
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <>
          {/* Low Stock table */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Low Stock Items
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: CRIMSON }}>
                    {['Item', 'Stockroom', 'Quantity', 'Minimum'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">{h}</th>
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
                  ) : lowStock.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.items?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{row.stockrooms?.name ?? '—'}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: CRIMSON }}>{row.quantity}</td>
                      <td className="px-4 py-3 text-gray-500">{row.min_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Transactions table */}
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
                    {['Item', 'Type', 'Qty', 'User', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No transactions yet</td>
                    </tr>
                  ) : transactions.map(tx => (
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
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
