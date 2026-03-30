import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './admin.css'

function App() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')

  console.log(import.meta.env.VITE_SUPABASE_URL)

  // Load Database
  useEffect(() => {
    async function fetchItems() {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('items')
        .select('id, name, code, price, description, category, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch error:', error)
        setError(error.message)
      } else {
        setItems(data || [])
      }

      setLoading(false)
    }

    fetchItems()
  }, [])

  // Add Item Function
  async function addItem() {
    setError(null)

    if (!name.trim() || !code.trim()) {
      setError('Name and code are required.')
      return
    }

    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          name: name.trim(),
          code: code.trim(),
          price: price.trim(),
          description: description.trim(),
          category: category.trim(),
        },
      ])
      .select('id, name, code, description, category, created_at, updated_at')

    if (error) {
      console.error('Insert error:', error)
      setError(error.message)
    } else {
      setItems((prev) => [...data, ...prev])
      setName('')
      setCode('')
      setPrice('')
      setDescription('')
      setCategory('')
    }
  }

  async function deleteItem(item_id) {
    setError(null)

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', item_id)

    if (error) {
      console.error(error)
      setError(error.message)
    } else {
      setItems((prev) => prev.filter((item) => item.id !== item_id))
    }
  }

  // Run App
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Wyss Institute App Template</h1>
      <h2>Backend Testing Page</h2>

      <h3>Adding Item Functionality</h3>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <input
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <button onClick={addItem}>Add Item</button>

      <h3 style={{ marginTop: '2rem' }}>Database Loading Functionality</h3>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {loading && <p>Loading...</p>}

      {!loading && !error && items.length === 0 && <p>No data found.</p>}

      {!loading && items.length > 0 && (
        <table border="1" cellPadding="10" style={{ marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Price</th>
              <th>Description</th>
              <th>Category</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.code}</td>
                <td>${item.price}</td>
                <td>{item.description}</td>
                <td>{item.category}</td>
                <td>
                  <button onClick={() => {
                    if (confirm("Delete this item?")) {
                      deleteItem(item.id)
                    }
                  }}>
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default App