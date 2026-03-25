// Placeholder data used when Supabase is not yet configured (.env.local still has defaults).
// The shape of each object mirrors exactly what the real Supabase queries return,
// including nested relations (e.g. items: { name } and stockrooms: { name }),
// so the page components work identically in mock and live modes.

// Mock admin users — matches the users table schema (huid, pin, billing_node, is_admin)
// Use huid "admin001" / PIN "1234" to log in when Supabase is not yet configured
export const mockUsers = [
  { huid: 'admin001', pin: '1234', billing_node: 'SEAS-ADMIN', is_admin: true },
  { huid: '12345678', pin: '5678', billing_node: 'SEAS-LAB',   is_admin: false },
]

// Two example labs / stockrooms
export const mockStockrooms = [
  { id: 's1', name: 'Lab A' },
  { id: 's2', name: 'Lab B' },
]

// Catalog of supply items with pricing and stock thresholds
export const mockItems = [
  { id: 'i1', name: 'Resistor 10k',    part_number: 'RES-10K',  supplier: 'Digi-Key',  cost: 0.10,  desired_amount: 100, low_stock_amount: 20 },
  { id: 'i2', name: 'Capacitor 100uF', part_number: 'CAP-100U', supplier: 'Digi-Key',  cost: 0.25,  desired_amount: 50,  low_stock_amount: 10 },
  { id: 'i3', name: 'Arduino Uno',     part_number: 'ARD-UNO',  supplier: 'SparkFun',  cost: 24.95, desired_amount: 10,  low_stock_amount: 3  },
  { id: 'i4', name: 'Breadboard',      part_number: 'BB-400',   supplier: 'SparkFun',  cost: 5.95,  desired_amount: 20,  low_stock_amount: 5  },
  { id: 'i5', name: 'Jumper Wires',    part_number: 'JW-M2M',   supplier: 'Adafruit',  cost: 1.95,  desired_amount: 50,  low_stock_amount: 10 },
]

// Per-stockroom inventory rows.
// Each row tracks how many of an item are in a specific stockroom,
// whether an NFC reader has been paired to that slot, and which reader ID it is.
// inv3 (Capacitor 100uF, Lab A) is intentionally below low_stock_amount to demo the red highlight.
export const mockInventory = [
  { id: 'inv1', item_id: 'i1', curr_amount: 85, is_paired: true,  reader_id: 'reader-001', items: { name: 'Resistor 10k' },    stockrooms: { name: 'Lab A' } },
  { id: 'inv2', item_id: 'i1', curr_amount: 40, is_paired: false, reader_id: null,          items: { name: 'Resistor 10k' },    stockrooms: { name: 'Lab B' } },
  { id: 'inv3', item_id: 'i2', curr_amount: 8,  is_paired: true,  reader_id: 'reader-002', items: { name: 'Capacitor 100uF' }, stockrooms: { name: 'Lab A' } },
  { id: 'inv4', item_id: 'i3', curr_amount: 2,  is_paired: false, reader_id: null,          items: { name: 'Arduino Uno' },     stockrooms: { name: 'Lab A' } },
  { id: 'inv5', item_id: 'i4', curr_amount: 12, is_paired: true,  reader_id: 'reader-003', items: { name: 'Breadboard' },       stockrooms: { name: 'Lab B' } },
  { id: 'inv6', item_id: 'i5', curr_amount: 30, is_paired: false, reader_id: null,          items: { name: 'Jumper Wires' },    stockrooms: { name: 'Lab B' } },
]

// Sample checkout transactions.
// transaction_items is the list of items taken during that session.
// t3 has no end_date to simulate a session that is still open.
export const mockTransactions = [
  {
    id: 't1',
    start_date: '2026-03-20T10:15:00Z',
    end_date: '2026-03-20T11:45:00Z',
    employee_huid: '12345678',
    charging: true,                        // cost will be billed to the user's monthly tab
    stockrooms: { name: 'Lab A' },
    transaction_items: [
      { quantity: 10, items: { name: 'Resistor 10k' } },
      { quantity: 2,  items: { name: 'Capacitor 100uF' } },
    ],
  },
  {
    id: 't2',
    start_date: '2026-03-21T14:00:00Z',
    end_date: '2026-03-21T15:30:00Z',
    employee_huid: '87654321',
    charging: false,                       // no charge — free use session
    stockrooms: { name: 'Lab B' },
    transaction_items: [
      { quantity: 1, items: { name: 'Arduino Uno' } },
      { quantity: 1, items: { name: 'Breadboard' } },
      { quantity: 5, items: { name: 'Jumper Wires' } },
    ],
  },
  {
    id: 't3',
    start_date: '2026-03-22T09:00:00Z',
    end_date: null,                        // session still open — user hasn't checked out yet
    employee_huid: '11223344',
    charging: true,
    stockrooms: { name: 'Lab A' },
    transaction_items: [
      { quantity: 3, items: { name: 'Breadboard' } },
    ],
  },
]
