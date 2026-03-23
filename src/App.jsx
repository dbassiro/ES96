import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './admin.css'

function App() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchItems() {
      const { data, error } = await supabase
        .from('stockroom_items')
        .select('*')

      if (error) {
        console.error(error)
        setError(error.message)
      } else {
        setItems(data)
      }
    }

    fetchItems()
  }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Wyss Institute App Template</h1>
      <h2>Backend Test</h2>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!error && items.length === 0 && <p>Loading or no data...</p>}

      {items.length > 0 && (
        <table border="1" cellPadding="10" style={{ marginTop: '20px' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Code</th>
              <th>Quantity</th>
              <th>Stockroom</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.code}</td>
                <td>{item.quantity}</td>
                <td>{item.stockroom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default App