// Deterministic demo records, generated lazily per branch so every business has independent data.
import { saveDb } from './db'
import { hash, branchStats } from './dashboardData'
import { CATALOG, PRODUCTS, POSITIONS } from '../config/catalog'

const DAY = 86400000
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const FIRST = ['Aarav', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Anjali', 'Karan', 'Pooja', 'Rahul', 'Neha', 'Amit', 'Kavita', 'Sanjay', 'Divya', 'Arjun', 'Meera', 'Imran', 'Sana', 'Deepak', 'Ritu', 'Manish', 'Swati', 'Nikhil', 'Isha']
const LAST = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Chauhan', 'Kapoor', 'Malhotra', 'Yadav', 'Mehra', 'Rathi', 'Tyagi', 'Saini', 'Qureshi', 'Jain', 'Agarwal', 'Bansal', 'Tomar', 'Pandey']
const iso = (t) => new Date(t).toISOString()
const dateOnly = (t) => iso(t).slice(0, 10)
const clamp = (n, a, b) => Math.min(b, Math.max(a, n))

export function ensureSeed(db, businessId) {
  for (const k of ['sales', 'customers', 'inventory', 'employees', 'appointments']) db[k] ??= []
  db.seededBranches ??= []; db.counters ??= {}
  const todo = db.branches.filter((b) => b.businessId === businessId && !db.seededBranches.includes(b.id))
  if (!todo.length) return
  for (const b of todo) { seedBranch(db, b); db.seededBranches.push(b.id) }
  saveDb(db)
}
export const nextTxn = (db, businessId) => { db.counters ??= {}; db.counters[businessId] = (db.counters[businessId] ?? 10000) + 1; return `TXN-${db.counters[businessId]}` }
export const nextEmpCode = (db, businessId) => `EMP-${String(db.employees.filter((e) => e.businessId === businessId).length + 1).padStart(3, '0')}`

function seedBranch(db, b) {
  const biz = db.businesses.find((x) => x.businessId === b.businessId), type = biz?.type ?? 'other'
  const cat = CATALOG[type] ?? CATALOG.other, prods = PRODUCTS[type] ?? PRODUCTS.default, pos = POSITIONS[type] ?? POSITIONS.default
  const r = rng(hash(b.id)), pick = (a) => a[Math.floor(r() * a.length)], st = branchStats(b), now = Date.now()
  const person = () => { const f = pick(FIRST), l = pick(LAST); return { name: `${f} ${l}`, email: `${f}.${l}${Math.floor(r() * 90 + 10)}@example.in`.toLowerCase(), phone: `+91 9${Math.floor(r() * 9e8 + 1e8)}` } }
  const base = { businessId: b.businessId, branchId: b.id }

  const emps = []
  for (let i = 0; i < st.employees; i++) {
    const p = person()
    const e = { ...base, id: `emp-${b.id}-${i}`, empCode: nextEmpCode(db, b.businessId), name: p.name, position: i === 0 ? 'Branch Supervisor' : pick(pos), phone: p.phone, email: p.email, joinedOn: dateOnly(now - (30 + r() * 1000) * DAY), performance: 68 + Math.floor(r() * 30), status: r() < 0.92 ? 'Active' : 'On leave' }
    db.employees.push(e); emps.push(e)
  }

  const custN = clamp(Math.round(st.customers / 200), 10, 30), custs = []
  const sell = (c, item, ago) => db.sales.push({ ...base, id: `sale-${b.id}-${db.sales.length}`, txn: nextTxn(db, b.businessId), customerId: c.id, item: item.name, category: item.category, amount: Math.round((item.price * (0.9 + r() * 0.4)) / 10) * 10, payment: (() => { const x = r(); return x < 0.5 ? 'UPI' : x < 0.75 ? 'Cash' : x < 0.95 ? 'Card' : 'Wallet' })(), date: iso(now - ago * DAY - r() * 6 * 3600000), status: (() => { const x = r(); return x < 0.94 ? 'Completed' : x < 0.98 ? 'Pending' : 'Refunded' })() })
  for (let i = 0; i < custN; i++) {
    const p = person(), a = r(), kind = a < 0.15 ? 'vip' : a < 0.55 ? 'regular' : a < 0.7 ? 'new' : a < 0.88 ? 'occasional' : 'lapsed'
    const visits = { vip: 9 + Math.floor(r() * 8), regular: 5 + Math.floor(r() * 4), new: 1 + Math.floor(r() * 2), occasional: 1 + Math.floor(r() * 3), lapsed: 2 + Math.floor(r() * 3) }[kind]
    let ago = { vip: 1 + r() * 18, regular: 3 + r() * 35, new: 1 + r() * 20, occasional: 10 + r() * 45, lapsed: 75 + r() * 70 }[kind]
    const c = { ...base, id: `cus-${b.id}-${i}`, name: p.name, phone: p.phone, email: r() < 0.65 ? p.email : '', joinedOn: '' }
    const pool = kind === 'vip' ? cat.slice(Math.floor(cat.length / 2)) : cat
    for (let v = 0; v < visits; v++) { sell(c, pick(pool), ago); ago += 8 + r() * 22 }
    c.joinedOn = kind === 'new' ? dateOnly(now - (visits ? Math.max(ago - 8, 1) : 5) * DAY) : dateOnly(now - (ago + r() * 20) * DAY)
    db.customers.push(c); custs.push(c)
  }

  const apptN = clamp(Math.round(st.appointments / 28), 12, 30), active = emps.filter((e) => e.status === 'Active')
  for (let i = 0; i < apptN; i++) {
    const off = Math.floor(r() * 23) - 12, svc = pick(cat), c = pick(custs), e = pick(active.length ? active : emps), h = 10 + Math.floor(r() * 10), m = r() < 0.5 ? '00' : '30'
    db.appointments.push({ ...base, id: `apt-${b.id}-${i}`, customerId: c.id, employeeId: e.id, service: svc.name, date: dateOnly(now + off * DAY), time: `${String(h).padStart(2, '0')}:${m}`, price: svc.price, status: off < 0 ? (r() < 0.88 ? 'Completed' : 'Cancelled') : (r() < 0.1 ? 'Cancelled' : 'Scheduled') })
  }

  prods.slice(0, clamp(8 + Math.floor(r() * 4), 6, prods.length)).forEach((p, i) => {
    const reorder = pick([10, 15, 20, 25, 30]), x = r()
    db.inventory.push({ ...base, id: `inv-${b.id}-${i}`, name: p.name, category: p.category, sku: `SKU-${(hash(b.id + p.name) % 90000) + 10000}`, quantity: x < 0.12 ? 0 : x < 0.4 ? 1 + Math.floor(r() * reorder) : reorder + 8 + Math.floor(r() * 50), reorderLevel: reorder, unitPrice: p.price })
  })
}
