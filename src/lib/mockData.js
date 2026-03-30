// Placeholder data used when Supabase is not yet configured (.env.local still has defaults).
// The shape of each object mirrors exactly what the real Supabase queries return,
// including nested relations, so the page components work identically in mock and live modes.

// Mock admin users — matches the users table schema
// Use email "admin@es96.com" / password "admin123" to log in when Supabase is not yet configured
export const mockUsers = [
  { id: 'u1', name: 'Admin User',  email: 'admin@es96.com', role: 'admin', phone: '617-555-0001', department: 'SEAS Admin' },
  { id: 'u2', name: 'Lab Staff',   email: 'staff@es96.com', role: 'staff', phone: '617-555-0002', department: 'SEAS Lab' },
]

// Password store only used in mock mode (real auth goes through Supabase Auth)
export const mockPasswords = {
  'admin@es96.com': 'admin123',
  'staff@es96.com': 'staff123',
}

// Two example stockrooms
export const mockStockrooms = [
  { id: 's1', name: 'Room A', location: 'Wyss First Floor', description: 'Yo motha', capacity: 500, manager: 'Admin User', is_active: true },
  { id: 's2', name: 'Room B', location: 'Wyss Second Floor', description: 'Yo Motha 2',       capacity: 300, manager: 'Admin User', is_active: true },
]

// Catalog of supply items — no pricing or stock thresholds (those live in inventory now)
export const mockItems = [
  { id: 'i1', name: 'Resistor 10k',    code: 'RES-10K',  category: 'Passive',     price: 0.10, description: '10kΩ through-hole resistor' },
  { id: 'i2', name: 'Capacitor 100uF', code: 'CAP-100U', category: 'Passive',     price: 0.25, description: '100µF electrolytic capacitor' },
  { id: 'i3', name: 'Arduino Uno',     code: 'ARD-UNO',  category: 'MCU',         price: 27.00, description: 'Arduino Uno R3 development board' },
  { id: 'i4', name: 'Breadboard',      code: 'BB-400',   category: 'Prototyping', price: 5.00, description: '400-point solderless breadboard' },
  { id: 'i5', name: 'Jumper Wires',    code: 'JW-M2M',   category: 'Prototyping', price: 3.50, description: 'Male-to-male jumper wire set' },
  ]
// Per-stockroom inventory rows.
// quantity = current stock; min_quantity = low-stock threshold.
// inv3 (Capacitor 100uF, Lab A) is intentionally below min_quantity to demo the red highlight.
export const mockInventory = [
  { id: 'inv1', item_id: 'i1', stockroom_id: 's1', quantity: 85, min_quantity: 20, items: { name: 'Resistor 10k' },    stockrooms: { name: 'Lab A' } },
  { id: 'inv2', item_id: 'i1', stockroom_id: 's2', quantity: 40, min_quantity: 20, items: { name: 'Resistor 10k' },    stockrooms: { name: 'Lab B' } },
  { id: 'inv3', item_id: 'i2', stockroom_id: 's1', quantity: 8,  min_quantity: 10, items: { name: 'Capacitor 100uF' }, stockrooms: { name: 'Lab A' } },
  { id: 'inv4', item_id: 'i3', stockroom_id: 's1', quantity: 2,  min_quantity: 3,  items: { name: 'Arduino Uno' },     stockrooms: { name: 'Lab A' } },
  { id: 'inv5', item_id: 'i4', stockroom_id: 's2', quantity: 12, min_quantity: 5,  items: { name: 'Breadboard' },      stockrooms: { name: 'Lab B' } },
  { id: 'inv6', item_id: 'i5', stockroom_id: 's2', quantity: 30, min_quantity: 10, items: { name: 'Jumper Wires' },    stockrooms: { name: 'Lab B' } },
]

// Sample transactions — each row is one item checked out or returned.
// type: 'checkout' | 'return'
export const mockTransactions = [
  {
    id: 't1',
    item_id: 'i1',
    user_id: 'u1',
    stockroom_id: 's1',
    type: 'checkout',
    quantity: 10,
    notes: null,
    created_at: '2026-03-20T10:15:00Z',
    updated_at: '2026-03-20T10:15:00Z',
    items: { name: 'Resistor 10k' },
    users: { name: 'Admin User', email: 'admin@es96.com' },
    stockrooms: { name: 'Lab A' },
  },
  {
    id: 't2',
    item_id: 'i2',
    user_id: 'u1',
    stockroom_id: 's1',
    type: 'checkout',
    quantity: 2,
    notes: null,
    created_at: '2026-03-20T10:15:00Z',
    updated_at: '2026-03-20T10:15:00Z',
    items: { name: 'Capacitor 100uF' },
    users: { name: 'Admin User', email: 'admin@es96.com' },
    stockrooms: { name: 'Lab A' },
  },
  {
    id: 't3',
    item_id: 'i3',
    user_id: 'u2',
    stockroom_id: 's2',
    type: 'checkout',
    quantity: 1,
    notes: 'For project demo',
    created_at: '2026-03-21T14:00:00Z',
    updated_at: '2026-03-21T14:00:00Z',
    items: { name: 'Arduino Uno' },
    users: { name: 'Lab Staff', email: 'staff@es96.com' },
    stockrooms: { name: 'Lab B' },
  },
  {
    id: 't4',
    item_id: 'i3',
    user_id: 'u2',
    stockroom_id: 's2',
    type: 'return',
    quantity: 1,
    notes: null,
    created_at: '2026-03-22T09:00:00Z',
    updated_at: '2026-03-22T09:00:00Z',
    items: { name: 'Arduino Uno' },
    users: { name: 'Lab Staff', email: 'staff@es96.com' },
    stockrooms: { name: 'Lab B' },
  },
]
