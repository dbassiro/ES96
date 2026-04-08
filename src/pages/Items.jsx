import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Default blank state for the Add Item form
const EMPTY_FORM = {
  name: '',
  code: '',
  category: '',
  price: '',
}

export default function Items() {
  // Full list of items from the database
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Active filter values — empty string means "no filter applied"
  const [filterCategory, setFilterCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal visibility and form state for adding a new item
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  // Fetch data once when the page first loads
  useEffect(() => {
    fetchAll()
  }, [])

  // Loads items from Supabase
  async function fetchAll() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name')

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setItems(data ?? [])
    setLoading(false)
  }

  // Derive unique category names from the loaded items for the filter dropdown
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))].sort()

  // Apply filters client-side
  const filtered = items.filter(item => {
    if (filterCategory && item.category !== filterCategory) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesName = item.name?.toLowerCase().includes(q)
      const matchesCode = item.code?.toLowerCase().includes(q)

      if (!matchesName && !matchesCode) return false
    }

    return true
  })

  // Sends the new item to Supabase and refreshes the table on success
  async function handleAddItem(e) {
    e.preventDefault()
    setFormError(null)
    setSaving(true)

    const { error } = await supabase.from('items').insert({
      name: form.name,
      code: form.code || null,
      category: form.category || null,
      price: form.price || null,
    })

    setSaving(false)

    if (error) {
      setFormError(error.message)
      return
    }

    setShowModal(false)
    setForm(EMPTY_FORM)
    fetchAll()
  }

  // Delete Item from Database Function
  async function deleteItem(item_id) {
    setError(null)

    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('id', item_id)
      .select()

    if (error) {
      console.error(error)
      setError(error.message)
      return
    }

    if (!data || data.length === 0) {
      setError('Delete did not succeed in the database.')
      return
    }

    fetchAll()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Items</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Item
        </button>
      </div>

      <div className="flex gap-4 mb-5 items-center">
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64"
        />

        {(filterCategory || searchQuery) && (
          <button
            onClick={() => {
              setFilterCategory('')
              setSearchQuery('')
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear
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
                {['Name', 'Code', 'Category', 'Price', ''].map(h => (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No items found
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs">
                      {item.code ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.category ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      ${item.price ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="delete-button"
                        onClick={() => {
                          if (confirm('Delete this item?')) {
                            deleteItem(item.id)
                          }
                        }}
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Item</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              {[
                { key: 'name', label: 'Name', required: true },
                { key: 'code', label: 'Code' },
                { key: 'category', label: 'Category' },
                { key: 'price', label: 'Price' },
              ].map(({ key, label, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {label}
                    {required && ' *'}
                  </label>
                  <input
                    type="text"
                    required={required}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ))}

              {formError && <p className="text-red-500 text-xs">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setForm(EMPTY_FORM)
                    setFormError(null)
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
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