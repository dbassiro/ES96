import { useEffect, useState } from 'react'
import { supabase, useMock } from '../lib/supabase'
import { mockItems, mockInventory } from '../lib/mockData'

// Default blank state for the Add Item form
const EMPTY_FORM = {
  name: '',
  part_number: '',
  supplier: '',
  cost: '',
  desired_amount: '',
  low_stock_amount: '',
}

export default function Items() {
  // Full list of items from the database
  const [items, setItems] = useState([])
  // All inventory rows (item + stockroom + quantity)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Active filter values — empty string means "no filter applied"
  const [filterStockroom, setFilterStockroom] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')

  // Modal visibility and form state for adding a new item
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  // Fetch data once when the page first loads
  useEffect(() => {
    fetchAll()
  }, [])

  // Loads items and inventory in parallel.
  // In mock mode, skips the network calls and uses local placeholder data.
  async function fetchAll() {
    setLoading(true)
    setError(null)
    if (useMock) {
      setItems(mockItems)
      setInventory(mockInventory)
      setLoading(false)
      return
    }
    const [itemsRes, invRes] = await Promise.all([
      supabase.from('items').select('*').order('name'),
      // Join inventory with stockrooms so we get the stockroom name alongside each row
      supabase.from('inventory').select('*, stockrooms(name)'),
    ])
    if (itemsRes.error) { setError(itemsRes.error.message); setLoading(false); return }
    setItems(itemsRes.data)
    setInventory(invRes.data ?? [])
    setLoading(false)
  }

  // Build a lookup: { item_id: [{ stockroom, amount }, ...] }
  // This lets each table row instantly find its stock counts without re-scanning the array
  const inventoryByItem = inventory.reduce((acc, row) => {
    if (!acc[row.item_id]) acc[row.item_id] = []
    acc[row.item_id].push({ stockroom: row.stockrooms?.name ?? '—', amount: row.curr_amount })
    return acc
  }, {})

  // Derive unique supplier names from the loaded items for the filter dropdown
  const suppliers = [...new Set(items.map(i => i.supplier).filter(Boolean))].sort()

  // Derive unique stockroom names from inventory rows for the filter dropdown
  const stockroomNames = [...new Set(inventory.map(r => r.stockrooms?.name).filter(Boolean))].sort()

  // Apply active filters client-side — no extra network request needed
  const filtered = items.filter(item => {
    // Skip items not from the selected supplier
    if (filterSupplier && item.supplier !== filterSupplier) return false
    // Skip items not present in the selected stockroom
    if (filterStockroom) {
      const inv = inventoryByItem[item.id] ?? []
      if (!inv.some(r => r.stockroom === filterStockroom)) return false
    }
    return true
  })

  // Sends the new item to Supabase and refreshes the table on success.
  // Empty optional fields are sent as null rather than empty strings.
  async function handleAddItem(e) {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    const { error } = await supabase.from('items').insert({
      name: form.name,
      part_number: form.part_number || null,
      supplier: form.supplier || null,
      cost: form.cost ? parseFloat(form.cost) : null,
      desired_amount: form.desired_amount ? parseInt(form.desired_amount) : null,
      low_stock_amount: form.low_stock_amount ? parseInt(form.low_stock_amount) : null,
    })
    setSaving(false)
    if (error) { setFormError(error.message); return }
    // Close modal, reset form, and reload table with the new item included
    setShowModal(false)
    setForm(EMPTY_FORM)
    fetchAll()
  }

  return (
    <div>
      {/* Page header with title and Add Item button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Items</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* Filter bar — dropdowns update state, which re-runs the filtered array above */}
      <div className="flex gap-4 mb-5">
        <select
          value={filterStockroom}
          onChange={e => setFilterStockroom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Stockrooms</option>
          {stockroomNames.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterSupplier}
          onChange={e => setFilterSupplier(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Suppliers</option>
          {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* Only show Clear button when at least one filter is active */}
        {(filterStockroom || filterSupplier) && (
          <button
            onClick={() => { setFilterStockroom(''); setFilterSupplier('') }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Inline error message if the Supabase fetch failed */}
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {/* Show spinner while loading, then render table */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Part #', 'Supplier', 'Cost', 'Desired Amt', 'Low Stock', 'Inventory'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No items found</td></tr>
              ) : filtered.map(item => {
                // Look up all inventory rows for this item across all stockrooms
                const inv = inventoryByItem[item.id] ?? []
                // Sum stock across all stockrooms to check against the low-stock threshold
                const totalStock = inv.reduce((s, r) => s + (r.amount ?? 0), 0)
                // Flag the row if total stock is at or below the low_stock_amount threshold
                const isLow = item.low_stock_amount != null && totalStock <= item.low_stock_amount
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{item.part_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.supplier ?? '—'}</td>
                    {/* Format cost as a dollar amount; show dash if not set */}
                    <td className="px-4 py-3 text-gray-600">{item.cost != null ? `$${Number(item.cost).toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.desired_amount ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.low_stock_amount ?? '—'}</td>
                    <td className="px-4 py-3">
                      {inv.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        // Show one line per stockroom with the quantity; red if low stock
                        <div className="space-y-0.5">
                          {inv.map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-green-700'}`}>{r.amount}</span>
                              <span className="text-gray-400 text-xs">in {r.stockroom}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Item Modal — rendered as a full-screen overlay when showModal is true */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Item</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              {/* Render each field from a config array to avoid repeating input markup */}
              {[
                { key: 'name', label: 'Name', required: true },
                { key: 'part_number', label: 'Part Number' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'cost', label: 'Cost ($)', type: 'number' },
                { key: 'desired_amount', label: 'Desired Amount', type: 'number' },
                { key: 'low_stock_amount', label: 'Low Stock Threshold', type: 'number' },
              ].map(({ key, label, required, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && ' *'}</label>
                  <input
                    type={type ?? 'text'}
                    required={required}
                    value={form[key]}
                    // Spread update: only change the field that was typed into
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ))}
              {/* Show Supabase error inline if the insert fails */}
              {formError && <p className="text-red-500 text-xs">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                {/* Cancel resets form and closes modal without saving */}
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError(null) }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {/* Disabled and shows "Saving..." while the Supabase insert is in flight */}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
