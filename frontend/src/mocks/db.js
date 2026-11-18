// Mock database persisted in localStorage. Every record carries businessId (and branchId where relevant).
// Replace by pointing services at the real API (VITE_USE_MOCK=false).
const KEY = 'fai_db_v1'
const D = 'FAI-DEMO01'

const seed = () => ({
  businesses: [{
    businessId: D, name: 'Royal Salon', type: 'salon', category: 'Unisex Salon',
    email: 'hello@royalsalon.in', phone: '+91 98765 43210', country: 'India', state: 'Uttar Pradesh', city: 'Modinagar',
    address: 'Main Market Road, Modinagar', status: 'Active', createdAt: '2024-04-12T09:00:00.000Z', ownerId: 'usr-owner-demo',
  }],
  users: [
    { id: 'usr-owner-demo', businessId: D, name: 'Riya Sharma', email: 'owner@demo.com', phone: '+91 98765 43210', password: 'Demo@123', role: 'OWNER', branchIds: ['*'], status: 'Active', lastLogin: null },
    { id: 'usr-mgr-demo', businessId: D, name: 'Aman Verma', email: 'manager@demo.com', phone: '+91 98111 22233', password: 'Demo@123', role: 'MANAGER', branchIds: ['br-modinagar'], status: 'Active', lastLogin: null },
    { id: 'usr-mgr-rahul', businessId: D, name: 'Rahul Singh', email: 'rahul@demo.com', phone: '+91 98222 33344', password: 'Demo@123', role: 'MANAGER', branchIds: ['br-meerut'], status: 'Active', lastLogin: null },
    { id: 'usr-mgr-priya', businessId: D, name: 'Priya Gupta', email: 'priya@demo.com', phone: '+91 98333 44455', password: 'Demo@123', role: 'MANAGER', branchIds: ['br-hapur'], status: 'Active', lastLogin: null },
    { id: 'usr-franchise-demo', businessId: D, name: 'Vikram Mehta', email: 'franchise@demo.com', phone: '+91 98444 55566', password: 'Demo@123', role: 'FRANCHISE_OWNER', branchIds: ['br-modinagar', 'br-meerut'], status: 'Active', lastLogin: null },
    { id: 'usr-staff-demo', businessId: D, name: 'Neha Kapoor', email: 'staff@demo.com', phone: '+91 98555 66677', password: 'Demo@123', role: 'STAFF', branchIds: ['br-modinagar'], permissions: ['appointments.manage', 'ai.use'], status: 'Active', lastLogin: null },
  ],
  branches: [
    { id: 'br-modinagar', businessId: D, name: 'Modinagar', city: 'Modinagar', managerId: 'usr-mgr-demo', status: 'Active' },
    { id: 'br-meerut', businessId: D, name: 'Meerut', city: 'Meerut', managerId: 'usr-mgr-rahul', status: 'Active' },
    { id: 'br-hapur', businessId: D, name: 'Hapur', city: 'Hapur', managerId: 'usr-mgr-priya', status: 'Active' },
  ],
  invitations: [],
  registrations: [],
})

// Older saved databases are topped up with any missing seed records.
function migrate(db) {
  const s = seed()
  db.invitations ??= []
  for (const k of ['users', 'branches']) for (const r of s[k]) if (!db[k].some((x) => x.id === r.id)) db[k].push(r)
  return db
}

export function loadDb() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { const db = migrate(JSON.parse(raw)); return db }
  } catch { /* fall through to seed */ }
  const fresh = seed()
  saveDb(fresh)
  return fresh
}
export function saveDb(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* storage full or blocked */ }
}
