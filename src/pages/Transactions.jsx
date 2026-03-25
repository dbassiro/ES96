import { useEffect, useState } from 'react'
import { supabase, useMock } from '../lib/supabase'
import { mockTransactions } from '../lib/mockData'

// Available sort options shown in the dropdown
const SORT_OPTIONS = [
  { value: 'start_date_desc', label: 'Date (Newest)' },
  { value: 'start_date_asc', label: 'Date (Oldest)' },
]

// Converts a raw UTC timestamp string into a readable local date/time.
// Returns a dash if the timestamp is null (e.g. session still open).
function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

export default function Transactions() {
  // Full list of transactions returned from the last fetch
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Active filter values — empty string means no filter applied
  const [filterHUID, setFilterHUID] = useState('')
  const [filterLab, setFilterLab] = useState('')
  const [filterItem, setFilterItem] = useState('')
  // Sort state — changing this triggers a re-fetch so the DB does the ordering
  const [sort, setSort] = useState('start_date_desc')

  // Options for the Lab and Item filter dropdowns, derived from the fetched data
  const [labs, setLabs] = useState([])
  const [itemNames, setItemNames] = useState([])

  // Re-fetch whenever the sort order changes
  useEffect(() => {
    fetchTransactions()
  }, [sort])

  // Fetches transactions with their related stockroom and items.
  // In mock mode, sorts the local placeholder data instead of hitting the DB.
  async function fetchTransactions() {
    setLoading(true)
    setError(null)

    if (useMock) {
      // Sort mock data in the browser to mirror what Supabase would return
      const sorted = [...mockTransactions].sort((a, b) => {
        const dir = sort === 'start_date_desc' ? -1 : 1
        return dir * (new Date(a.start_date) - new Date(b.start_date))
      })
      setTransactions(sorted)
      // Derive filter dropdown options from the mock data
      setLabs([...new Set(sorted.map(t => t.stockrooms?.name).filter(Boolean))].sort())
      setItemNames([...new Set(sorted.flatMap(t => t.transaction_items.map(ti => ti.items?.name)).filter(Boolean))].sort())
      setLoading(false)
      return
    }

    const isDesc = sort === 'start_date_desc'
    // Nested select: fetch transaction + joined stockroom name + all items in that transaction
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        start_date,
        end_date,
        charging,
        employee_huid,
        stockrooms ( name ),
        transaction_items (
          quantity,
          items ( name )
        )
      `)
      // Sort is done at the DB level so results arrive pre-ordered
      .order('start_date', { ascending: !isDesc })

    if (error) { setError(error.message); setLoading(false); return }

    setTransactions(data ?? [])

    // Build filter dropdown options from the returned data
    setLabs([...new Set((data ?? []).map(t => t.stockrooms?.name).filter(Boolean))].sort())
    const names = (data ?? []).flatMap(t =>
      (t.transaction_items ?? []).map(ti => ti.items?.name).filter(Boolean)
    )
    setItemNames([...new Set(names)].sort())

    setLoading(false)
  }

  // Apply active filters client-side against the already-fetched data
  const filtered = transactions.filter(t => {
    // HUID filter is a partial text match so you can type part of an ID
    if (filterHUID && !(t.employee_huid ?? '').toLowerCase().includes(filterHUID.toLowerCase())) return false
    // Lab filter is an exact match from the dropdown
    if (filterLab && t.stockrooms?.name !== filterLab) return false
    // Item filter — true only if this transaction includes the selected item
    if (filterItem) {
      const hasItem = (t.transaction_items ?? []).some(ti => ti.items?.name === filterItem)
      if (!hasItem) return false
    }
    return true
  })

  // True when any filter is active — used to show/hide the Clear button
  const hasFilters = filterHUID || filterLab || filterItem

  return (
    <div>
      {/* Page header with title and live record count */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
        <span className="text-sm text-gray-400">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filter and sort controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* HUID text input — partial match search */}
        <input
          type="text"
          placeholder="Filter by HUID..."
          value={filterHUID}
          onChange={e => setFilterHUID(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 w-48"
        />
        {/* Lab dropdown — populated from data returned by the last fetch */}
        <select
          value={filterLab}
          onChange={e => setFilterLab(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Labs</option>
          {labs.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {/* Item dropdown — populated from all items seen across all transactions */}
        <select
          value={filterItem}
          onChange={e => setFilterItem(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Items</option>
          {itemNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {/* Sort dropdown — changing this triggers a re-fetch via the useEffect dependency */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {/* Only render Clear button when at least one filter is active */}
        {hasFilters && (
          <button
            onClick={() => { setFilterHUID(''); setFilterLab(''); setFilterItem('') }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Inline error if the Supabase fetch failed */}
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['HUID', 'Lab / Stockroom', 'Items Checked Out', 'Start', 'End', 'Charging'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No transactions found</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  {/* HUID in monospace so digit widths are consistent */}
                  <td className="px-4 py-3 font-mono text-gray-700">{t.employee_huid ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{t.stockrooms?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {/* List each item taken during this session with its quantity */}
                    {(t.transaction_items ?? []).length === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <div className="space-y-0.5">
                        {t.transaction_items.map((ti, i) => (
                          <div key={i} className="text-gray-700">
                            {ti.items?.name ?? '?'}
                            {ti.quantity != null && <span className="text-gray-400 ml-1">×{ti.quantity}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  {/* formatDate handles null end_date (open session) gracefully */}
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(t.start_date)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(t.end_date)}</td>
                  <td className="px-4 py-3">
                    {/* Yellow badge = being charged to monthly tab; gray = free session */}
                    {t.charging != null ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${t.charging ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.charging ? 'Yes' : 'No'}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
