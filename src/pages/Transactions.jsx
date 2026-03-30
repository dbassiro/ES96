import { useEffect, useState } from 'react'
import { supabase, useMock } from '../lib/supabase'
import { mockTransactions } from '../lib/mockData'

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Date (Newest)' },
  { value: 'created_at_asc',  label: 'Date (Oldest)' },
]

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Active filter values — empty string means no filter applied
  const [filterUser, setFilterUser]         = useState('')
  const [filterStockroom, setFilterStockroom] = useState('')
  const [filterType, setFilterType]         = useState('')
  const [sort, setSort]                     = useState('created_at_desc')

  // Options for filter dropdowns, derived from fetched data
  const [userNames, setUserNames]       = useState([])
  const [stockroomNames, setStockroomNames] = useState([])

  // Re-fetch whenever sort changes
  useEffect(() => {
    fetchTransactions()
  }, [sort])

  async function fetchTransactions() {
    setLoading(true)
    setError(null)

    if (useMock) {
      const sorted = [...mockTransactions].sort((a, b) => {
        const dir = sort === 'created_at_desc' ? -1 : 1
        return dir * (new Date(a.created_at) - new Date(b.created_at))
      })
      setTransactions(sorted)
      setUserNames([...new Set(sorted.map(t => t.users?.name).filter(Boolean))].sort())
      setStockroomNames([...new Set(sorted.map(t => t.stockrooms?.name).filter(Boolean))].sort())
      setLoading(false)
      return
    }

    const isDesc = sort === 'created_at_desc'
    // Each transaction row directly references one item, one user, and one stockroom
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        type,
        quantity,
        notes,
        created_at,
        items      ( name ),
        users      ( name, email ),
        stockrooms ( name )
      `)
      .order('created_at', { ascending: !isDesc })

    if (error) { setError(error.message); setLoading(false); return }

    setTransactions(data ?? [])
    setUserNames([...new Set((data ?? []).map(t => t.users?.name).filter(Boolean))].sort())
    setStockroomNames([...new Set((data ?? []).map(t => t.stockrooms?.name).filter(Boolean))].sort())
    setLoading(false)
  }

  // Apply active filters client-side
  const filtered = transactions.filter(t => {
    if (filterUser      && t.users?.name !== filterUser)           return false
    if (filterStockroom && t.stockrooms?.name !== filterStockroom) return false
    if (filterType      && t.type !== filterType)                  return false
    return true
  })

  const hasFilters = filterUser || filterStockroom || filterType

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
        <span className="text-sm text-gray-400">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filter and sort controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* User dropdown */}
        <select
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Users</option>
          {userNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {/* Stockroom dropdown */}
        <select
          value={filterStockroom}
          onChange={e => setFilterStockroom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Stockrooms</option>
          {stockroomNames.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* Type dropdown */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Types</option>
          <option value="checkout">Checkout</option>
          <option value="return">Return</option>
        </select>
        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setFilterUser(''); setFilterStockroom(''); setFilterType('') }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date', 'User', 'Stockroom', 'Item', 'Qty', 'Type', 'Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No transactions found</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(t.created_at)}</td>
                  <td className="px-4 py-3 text-gray-700">{t.users?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{t.stockrooms?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{t.items?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{t.quantity ?? '—'}</td>
                  <td className="px-4 py-3">
                    {t.type === 'checkout' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Checkout</span>
                    ) : t.type === 'return' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Return</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{t.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
