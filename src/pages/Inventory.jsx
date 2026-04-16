import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STOCKROOMS = [
  {
    key: 'A',
    title: 'Stockroom A',
    id: '7539130a-095a-43b6-a30f-b58f86851e0e',
  },
  {
    key: 'B',
    title: 'Stockroom B',
    id: '62cdfe44-f293-49e6-ab98-077597178df6',
  },
  {
    key: 'C',
    title: 'Stockroom C',
    id: '970485b5-efd5-48ae-a07b-e6b1aa9eacaf',
  },
]

function getStatus(quantity, minQuantity) {
  if (quantity === 0) {
    return { label: 'Out', className: 'bg-red-100 text-red-700' }
  }

  if (quantity <= minQuantity) {
    return { label: 'Low', className: 'bg-yellow-100 text-yellow-700' }
  }

  return { label: 'OK', className: 'bg-green-100 text-green-700' }
}

export default function Inventory() {
  const [inventoryRows, setInventoryRows] = useState([])
  const [itemsList, setItemsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [openSections, setOpenSections] = useState({
    A: true,
    B: true,
    C: true,
  })

  const [searchQueries, setSearchQueries] = useState({
    A: '',
    B: '',
    C: '',
  })

  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const [form, setForm] = useState({
    item_id: '',
    stockroom_id: STOCKROOMS[0].id,
    quantity: '',
    min_quantity: '',
    nfc_id: '',
  })

  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [updatingCell, setUpdatingCell] = useState(false)

  const [editingNfcRowId, setEditingNfcRowId] = useState(null)
  const [nfcValue, setNfcValue] = useState('')
  const [updatingNfc, setUpdatingNfc] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)

    await Promise.all([fetchAll(), fetchItems()])

    setLoading(false)
  }

  async function fetchAll() {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        id,
        quantity,
        min_quantity,
        nfc_id,
        stockroom_id,
        item_id,
        items (
          id,
          name,
          code
        )
      `)
      .order('quantity', { ascending: true })

    if (error) {
      setError(error.message)
      return
    }

    setInventoryRows(data ?? [])
  }

  async function fetchItems() {
    const { data, error } = await supabase
      .from('items')
      .select('id, name, code')
      .order('name', { ascending: true })

    if (error) {
      setError(error.message)
      return
    }

    setItemsList(data ?? [])
  }

  function toggleSection(key) {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  function updateSearch(key, value) {
    setSearchQueries(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  function clearSearch(key) {
    setSearchQueries(prev => ({
      ...prev,
      [key]: '',
    }))
  }

  function getRowsForStockroom(stockroomId, query) {
    return inventoryRows.filter(row => {
      if (row.stockroom_id !== stockroomId) return false

      if (query) {
        const q = query.toLowerCase()
        const matchesName = row.items?.name?.toLowerCase().includes(q)
        const matchesCode = row.items?.code?.toLowerCase().includes(q)
        const matchesNfc = row.nfc_id?.toLowerCase().includes(q)

        if (!matchesName && !matchesCode && !matchesNfc) return false
      }

      return true
    })
  }

  async function handleAddInventory(e) {
    e.preventDefault()
    setFormError(null)
    setSaving(true)

    const { error } = await supabase.from('inventory').insert({
      item_id: form.item_id,
      stockroom_id: form.stockroom_id,
      quantity: Number(form.quantity),
      min_quantity: Number(form.min_quantity),
      nfc_id: form.nfc_id.trim() || null,
    })

    if (error) {
      setFormError(error.message)
      setSaving(false)
      return
    }

    setForm({
      item_id: '',
      stockroom_id: STOCKROOMS[0].id,
      quantity: '',
      min_quantity: '',
      nfc_id: '',
    })

    setShowAddForm(false)
    setSaving(false)
    fetchAll()
  }

  function beginEdit(rowId, field, currentValue) {
    setEditingCell({ rowId, field })
    setEditValue(String(currentValue ?? 0))
  }

  function cancelEdit() {
    setEditingCell(null)
    setEditValue('')
  }

  async function saveEdit(rowId, field) {
    if (updatingCell) return

    const trimmed = editValue.trim()

    if (trimmed === '') {
      setError('Value cannot be empty.')
      return
    }

    const numericValue = Number(trimmed)

    if (!Number.isInteger(numericValue) || numericValue < 0) {
      setError('Please enter a whole number greater than or equal to 0.')
      return
    }

    setUpdatingCell(true)
    setError(null)

    const { error } = await supabase
      .from('inventory')
      .update({ [field]: numericValue })
      .eq('id', rowId)

    if (error) {
      setError(error.message)
      setUpdatingCell(false)
      return
    }

    setInventoryRows(prev =>
      prev.map(row =>
        row.id === rowId ? { ...row, [field]: numericValue } : row
      )
    )

    setEditingCell(null)
    setEditValue('')
    setUpdatingCell(false)

    fetchAll()
  }

  function handleEditKeyDown(e, rowId, field) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit(rowId, field)
    }

    if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  function renderEditableCell(row, field, className = '') {
    const isEditing =
      editingCell?.rowId === row.id && editingCell?.field === field

    if (isEditing) {
      return (
        <input
          type="number"
          min="0"
          step="1"
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={e => handleEditKeyDown(e, row.id, field)}
          onBlur={() => saveEdit(row.id, field)}
          className="w-24 border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
      )
    }

    return (
      <button
        type="button"
        onDoubleClick={() => beginEdit(row.id, field, row[field])}
        className={`text-left hover:bg-indigo-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors ${className}`}
        title="Double-click to edit"
      >
        {row[field] ?? '—'}
      </button>
    )
  }

  function beginNfcEdit(row) {
    setEditingNfcRowId(row.id)
    setNfcValue(row.nfc_id ?? '')
  }

  function cancelNfcEdit() {
    setEditingNfcRowId(null)
    setNfcValue('')
  }

  async function saveNfcEdit(rowId) {
    if (updatingNfc) return

    setUpdatingNfc(true)
    setError(null)

    const trimmedValue = nfcValue.trim()

    const { error } = await supabase
      .from('inventory')
      .update({ nfc_id: trimmedValue || null })
      .eq('id', rowId)

    if (error) {
      setError(error.message)
      setUpdatingNfc(false)
      return
    }

    setInventoryRows(prev =>
      prev.map(row =>
        row.id === rowId ? { ...row, nfc_id: trimmedValue || null } : row
      )
    )

    setEditingNfcRowId(null)
    setNfcValue('')
    setUpdatingNfc(false)

    fetchAll()
  }

  function handleNfcKeyDown(e, rowId) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveNfcEdit(rowId)
    }

    if (e.key === 'Escape') {
      cancelNfcEdit()
    }
  }

  function renderNfcCell(row) {
    const isEditing = editingNfcRowId === row.id

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            autoFocus
            value={nfcValue}
            onChange={e => setNfcValue(e.target.value)}
            onKeyDown={e => handleNfcKeyDown(e, row.id)}
            onBlur={() => saveNfcEdit(row.id)}
            placeholder="Enter NFC ID"
            className="w-40 border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-gray-700">
          {row.nfc_id ?? '—'}
        </span>
        <button
          type="button"
          onClick={() => beginNfcEdit(row)}
          className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {row.nfc_id ? 'Edit' : 'Add'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>

        <button
          onClick={() => setShowAddForm(prev => !prev)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showAddForm ? 'Close' : 'Add Inventory'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Add Inventory
          </h3>

          <form onSubmit={handleAddInventory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Item
              </label>
              <select
                value={form.item_id}
                onChange={(e) => setForm({ ...form, item_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              >
                <option value="">Select an item</option>
                {itemsList.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.code ? `(${item.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Stockroom + NFC ID (same row) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Stockroom
              </label>
              <select
                value={form.stockroom_id}
                onChange={(e) => setForm({ ...form, stockroom_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              >
                {STOCKROOMS.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                NFC ID
              </label>
              <input
                type="text"
                value={form.nfc_id}
                onChange={(e) => setForm({ ...form, nfc_id: e.target.value })}
                placeholder="Enter NFC tag ID"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Quantity + Min Quantity (same row) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="Enter quantity"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Min Quantity
              </label>
              <input
                type="number"
                min="0"
                value={form.min_quantity}
                onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                placeholder="Enter minimum quantity"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            {formError && (
              <p className="md:col-span-2 text-red-500 text-sm">{formError}</p>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Inventory'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center min-h-screen overflow-auto bg-white">
          <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {STOCKROOMS.map(section => {
            const query = searchQueries[section.key]
            const isOpen = openSections[section.key]
            const rows = getRowsForStockroom(section.id, query)

            return (
              <div key={section.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {rows.length} item{rows.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <span className="text-gray-500 text-lg">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div className="p-5">
                    <div className="flex gap-4 mb-5 items-center">
                      <input
                        type="text"
                        placeholder={`Search ${section.title} by name, code, or NFC ID`}
                        value={query}
                        onChange={e => updateSearch(section.key, e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 w-72"
                      />

                      {query && (
                        <button
                          onClick={() => clearSearch(section.key)}
                          className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            {['Name', 'Code', 'NFC ID', 'Quantity', 'Min Quantity', 'Status'].map(h => (
                              <th
                                key={h}
                                className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                          {rows.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                No inventory found
                              </td>
                            </tr>
                          ) : (
                            rows.map(row => {
                              const status = getStatus(row.quantity, row.min_quantity)

                              return (
                                <tr key={row.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">
                                    {row.items?.name ?? '—'}
                                  </td>

                                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">
                                    {row.items?.code ?? '—'}
                                  </td>

                                  <td className="px-4 py-3 text-gray-700">
                                    {renderNfcCell(row)}
                                  </td>

                                  <td className="px-4 py-3 text-gray-700">
                                    {renderEditableCell(row, 'quantity', 'text-gray-700')}
                                  </td>

                                  <td className="px-4 py-3 text-gray-600">
                                    {renderEditableCell(row, 'min_quantity', 'text-gray-600')}
                                  </td>

                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                                    >
                                      {status.label}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                      Double-click Quantity or Min Quantity to edit. Use Add/Edit in the NFC ID column to update NFC tags.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}