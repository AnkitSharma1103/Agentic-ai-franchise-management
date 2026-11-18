import { loadDb, saveDb } from './db'
import { ensureSeed, nextTxn, nextEmpCode } from './seed'
import { wait, fail, requireUser } from './util'
import { hasPermission } from '../config/permissions'
import { uid } from '../utils/id'
import { branchStats, revenueSeries, labels } from './dashboardData'

const DAY = 86400000
const NUM = ['amount', 'price', 'quantity', 'reorderLevel', 'unitPrice', 'performance']
const today = () => new Date().toISOString().slice(0, 10)

const SPEC = {
  sales: { prefix: 'sale', read: 'sales.view', write: 'owner', fields: ['branchId', 'customerId', 'item', 'category', 'amount', 'payment', 'status', 'date'], required: ['branchId', 'item', 'amount', 'payment'] },
  customers: { prefix: 'cus', read: 'customers.manage', write: 'customers.manage', fields: ['branchId', 'name', 'phone', 'email', 'joinedOn'], required: ['branchId', 'name', 'phone'] },
  inventory: { prefix: 'inv', read: 'inventory.manage', write: 'inventory.manage', fields: ['branchId', 'name', 'category', 'sku', 'quantity', 'reorderLevel', 'unitPrice'], required: ['branchId', 'name', 'category', 'quantity', 'reorderLevel', 'unitPrice'] },
  employees: { prefix: 'emp', read: 'employees.view', write: 'owner', fields: ['branchId', 'name', 'position', 'phone', 'email', 'joinedOn', 'performance', 'status'], required: ['branchId', 'name', 'position', 'phone'] },
  appointments: { prefix: 'apt', read: 'appointments.manage', write: 'appointments.manage', fields: ['branchId', 'customerId', 'employeeId', 'service', 'date', 'time', 'price', 'status'], required: ['branchId', 'customerId', 'employeeId', 'service', 'date', 'time', 'price'] },
}

const allowed = (u, branchId) => u.role === 'OWNER' || u.branchIds.includes(branchId)
const byId = (a) => Object.fromEntries(a.map((x) => [x.id, x]))

function open(coll, mode) {
  const db = loadDb(), u = requireUser(db), spec = SPEC[coll]
  const perm = mode === 'read' ? spec.read : spec.write
  if (!(perm === 'owner' ? u.role === 'OWNER' : hasPermission(u, perm))) throw fail(403, 'You don’t have permission to do this.')
  ensureSeed(db, u.businessId)
  return { db, u, spec }
}
const visible = (db, u, coll) => db[coll].filter((r) => r.businessId === u.businessId && allowed(u, r.branchId))

// ---- derived/enriched views ----
function customerStats(db, businessId) {
  const m = {}
  for (const s of db.sales) if (s.businessId === businessId && s.customerId && s.status === 'Completed') {
    const x = (m[s.customerId] ??= { visits: 0, totalSpend: 0, lastVisit: null })
    x.visits++; x.totalSpend += s.amount; if (!x.lastVisit || s.date > x.lastVisit) x.lastVisit = s.date
  }
  return m
}
export function segmentOf({ visits, totalSpend, lastVisit }) {
  const days = lastVisit ? (Date.now() - new Date(lastVisit)) / DAY : Infinity
  if (visits && days > 60) return 'At-risk'
  if (totalSpend >= 25000) return 'High-value'
  if (visits >= 5) return 'Regular'
  return 'Occasional'
}
const enrich = {
  sales: (db, rows) => { const c = byId(db.customers), b = byId(db.branches); return rows.map((r) => ({ ...r, customerName: r.customerId ? c[r.customerId]?.name ?? 'Deleted customer' : 'Walk-in', branchName: b[r.branchId]?.name })) },
  customers: (db, rows) => {
    const st = customerStats(db, rows[0]?.businessId), b = byId(db.branches)
    return rows.map((r) => { const s = st[r.id] ?? { visits: 0, totalSpend: 0, lastVisit: null }, months = Math.max(1, (Date.now() - new Date(r.joinedOn)) / (30 * DAY)); return { ...r, ...s, segment: segmentOf(s), visitsPerMonth: +(s.visits / months).toFixed(1), branchName: b[r.branchId]?.name } })
  },
  inventory: (db, rows) => { const b = byId(db.branches); return rows.map((r) => ({ ...r, status: r.quantity === 0 ? 'Out of stock' : r.quantity <= r.reorderLevel ? 'Low stock' : 'In stock', value: r.quantity * r.unitPrice, branchName: b[r.branchId]?.name })) },
  employees: (db, rows) => {
    const b = byId(db.branches), done = {}, up = {}
    for (const a of db.appointments) { if (a.status === 'Completed') done[a.employeeId] = (done[a.employeeId] ?? 0) + 1; if (a.status === 'Scheduled' && a.date >= today()) up[a.employeeId] = (up[a.employeeId] ?? 0) + 1 }
    return rows.map((r) => ({ ...r, completed: done[r.id] ?? 0, upcoming: up[r.id] ?? 0, branchName: b[r.branchId]?.name }))
  },
  appointments: (db, rows) => { const c = byId(db.customers), e = byId(db.employees), b = byId(db.branches); return rows.map((r) => ({ ...r, customerName: c[r.customerId]?.name ?? 'Deleted customer', employeeName: e[r.employeeId]?.name ?? 'Former employee', branchName: b[r.branchId]?.name })) },
}
const sortNew = { sales: (a, b) => b.date.localeCompare(a.date), appointments: (a, b) => (b.date + b.time).localeCompare(a.date + a.time), customers: (a, b) => a.name.localeCompare(b.name), inventory: (a, b) => a.name.localeCompare(b.name), employees: (a, b) => a.empCode.localeCompare(b.empCode) }

function normalise(spec, body) {
  const out = {}
  for (const f of spec.fields) if (body[f] !== undefined) out[f] = NUM.includes(f) ? Number(body[f]) : typeof body[f] === 'string' ? body[f].trim() : body[f]
  for (const f of NUM) if (f in out && (!Number.isFinite(out[f]) || out[f] < 0)) throw fail(400, `${f} must be a non-negative number.`)
  return out
}
function checkRefs(db, u, rec) {
  if (!db.branches.some((b) => b.id === rec.branchId && b.businessId === u.businessId)) throw fail(400, 'Choose a valid branch.')
  if (!allowed(u, rec.branchId)) throw fail(403, 'You are not assigned to this branch.')
  if (rec.customerId && !db.customers.some((c) => c.id === rec.customerId && c.branchId === rec.branchId)) throw fail(400, 'That customer does not belong to this branch.')
  if (rec.employeeId && !db.employees.some((e) => e.id === rec.employeeId && e.branchId === rec.branchId)) throw fail(400, 'That employee does not belong to this branch.')
}

function crud(coll) {
  return {
    [`GET /${coll}`]: async (_b, { query } = {}) => {
      await wait(300)
      const { db, u } = open(coll, 'read')
      if (query?.branchId && !allowed(u, query.branchId)) throw fail(403, 'You are not assigned to this branch.')
      let rows = visible(db, u, coll); if (query?.branchId) rows = rows.filter((r) => r.branchId === query.branchId)
      return enrich[coll](db, rows).sort(sortNew[coll])
    },
    [`POST /${coll}`]: async (body) => {
      await wait(350)
      const { db, u, spec } = open(coll, 'write'), rec = normalise(spec, body ?? {})
      for (const f of spec.required) if (rec[f] === undefined || rec[f] === '') throw fail(400, `${f} is required.`)
      checkRefs(db, u, rec)
      const full = { id: uid(spec.prefix), businessId: u.businessId, ...rec }
      if (coll === 'sales') Object.assign(full, { txn: nextTxn(db, u.businessId), date: rec.date || new Date().toISOString(), status: rec.status || 'Completed', customerId: rec.customerId || null })
      if (coll === 'customers') { full.joinedOn = rec.joinedOn || today(); full.email ??= '' }
      if (coll === 'employees') Object.assign(full, { empCode: nextEmpCode(db, u.businessId), joinedOn: rec.joinedOn || today(), status: rec.status || 'Active', performance: rec.performance ?? 75 })
      if (coll === 'inventory') full.sku ||= `SKU-${Math.floor(Math.random() * 90000 + 10000)}`
      if (coll === 'appointments') full.status = rec.status || 'Scheduled'
      db[coll].push(full); saveDb(db)
      return enrich[coll](db, [full])[0]
    },
    [`PATCH /${coll}/:id`]: async (body, { params }) => {
      await wait(350)
      const { db, u, spec } = open(coll, 'write')
      const rec = db[coll].find((r) => r.id === params.id && r.businessId === u.businessId && allowed(u, r.branchId))
      if (!rec) throw fail(404, 'Record not found.')
      const patch = normalise(spec, body ?? {}), next = { ...rec, ...patch }
      checkRefs(db, u, next)
      const wasDone = rec.status === 'Completed'
      Object.assign(rec, patch)
      let saleCreated = false
      if (coll === 'appointments' && rec.status === 'Completed' && !wasDone && !rec.saleId) {
        const sale = { id: uid('sale'), businessId: u.businessId, branchId: rec.branchId, txn: nextTxn(db, u.businessId), customerId: rec.customerId, item: rec.service, category: 'Service', amount: rec.price, payment: 'UPI', date: new Date().toISOString(), status: 'Completed' }
        db.sales.push(sale); rec.saleId = sale.id; saleCreated = true
      }
      saveDb(db)
      return { ...enrich[coll](db, [rec])[0], saleCreated }
    },
    [`DELETE /${coll}/:id`]: async (_b, { params }) => {
      await wait(350)
      const { db, u } = open(coll, 'write')
      const rec = db[coll].find((r) => r.id === params.id && r.businessId === u.businessId && allowed(u, r.branchId))
      if (!rec) throw fail(404, 'Record not found.')
      const key = coll === 'customers' ? 'customerId' : coll === 'employees' ? 'employeeId' : null
      if (key && db.appointments.some((a) => a[key] === rec.id && a.status === 'Scheduled')) throw fail(409, 'Cancel or reassign their scheduled appointments first.')
      db[coll] = db[coll].filter((r) => r.id !== rec.id)
      if (coll === 'customers') db.sales.forEach((s) => { if (s.customerId === rec.id) s.customerId = null })
      saveDb(db); return { removed: true }
    },
  }
}

// ---- branches ----
const branchRow = (db, b) => {
  const s = branchStats(b), m = db.users.find((x) => x.id === b.managerId)
  return { ...b, address: b.address ?? '', phone: b.phone ?? '', manager: m?.name ?? null, revenue: s.revenue, customers: s.customers, appointments: s.appointments, employees: s.employees, growth: s.growth }
}
function setManager(db, branch, managerId) {
  for (const u of db.users) if (u.role === 'MANAGER' && u.businessId === branch.businessId && u.branchIds.includes(branch.id) && u.id !== managerId) u.branchIds = u.branchIds.filter((x) => x !== branch.id)
  branch.managerId = null
  if (managerId) {
    const m = db.users.find((x) => x.id === managerId && x.businessId === branch.businessId && x.role === 'MANAGER')
    if (!m) throw fail(400, 'Choose a valid manager.')
    if (!m.branchIds.includes(branch.id)) m.branchIds.push(branch.id)
    branch.managerId = m.id
  }
}
const ownerOnly = (db) => { const u = requireUser(db); if (u.role !== 'OWNER') throw fail(403, 'Only the owner can manage branches.'); return u }

const branchHandlers = {
  'GET /branches/options': async () => { const db = loadDb(), u = requireUser(db); return db.branches.filter((b) => b.businessId === u.businessId && allowed(u, b.id)).map((b) => ({ id: b.id, name: b.name, status: b.status })) },
  'GET /branches': async () => {
    await wait(300)
    const db = loadDb(), u = requireUser(db)
    if (!hasPermission(u, 'branches.view')) throw fail(403, 'You don’t have permission to view branches.')
    return db.branches.filter((b) => b.businessId === u.businessId && allowed(u, b.id)).map((b) => branchRow(db, b))
  },
  'GET /branches/:id': async (_b, { params }) => {
    await wait(350)
    const db = loadDb(), u = requireUser(db)
    if (!hasPermission(u, 'branches.view')) throw fail(403, 'You don’t have permission to view branches.')
    ensureSeed(db, u.businessId)
    const b = db.branches.find((x) => x.id === params.id && x.businessId === u.businessId)
    if (!b) throw fail(404, 'Branch not found.')
    if (!allowed(u, b.id)) throw fail(403, 'You are not assigned to this branch.')
    const inB = (k) => db[k].filter((r) => r.branchId === b.id)
    const custs = enrich.customers(db, inB('customers')).sort((x, y) => y.totalSpend - x.totalSpend)
    const svc = {}; for (const s of inB('sales')) if (s.status === 'Completed') svc[s.category] = (svc[s.category] ?? 0) + s.amount
    const total = Object.values(svc).reduce((t, v) => t + v, 0) || 1
    return {
      branch: branchRow(db, b), series: labels(6).map((month, i) => ({ month, revenue: revenueSeries(b, 6)[i] })),
      serviceMix: Object.entries(svc).map(([name, v]) => ({ name, pct: Math.round((v / total) * 100) })).sort((x, y) => y.pct - x.pct),
      sales: enrich.sales(db, inB('sales')).sort(sortNew.sales).slice(0, 12), employees: enrich.employees(db, inB('employees')),
      customers: custs.slice(0, 12), appointments: enrich.appointments(db, inB('appointments').filter((a) => a.status === 'Scheduled' && a.date >= today())).sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time)).slice(0, 12),
      inventory: enrich.inventory(db, inB('inventory')),
    }
  },
  'POST /branches': async (p) => {
    await wait(400)
    const db = loadDb(), u = ownerOnly(db)
    if (!p?.name?.trim() || !p?.city?.trim()) throw fail(400, 'Branch name and city are required.')
    if (db.branches.some((b) => b.businessId === u.businessId && b.name.toLowerCase() === p.name.trim().toLowerCase())) throw fail(409, 'A branch with this name already exists.')
    const b = { id: uid('br'), businessId: u.businessId, name: p.name.trim(), city: p.city.trim(), address: p.address?.trim() ?? '', phone: p.phone?.trim() ?? '', managerId: null, status: p.status || 'Active', createdAt: new Date().toISOString() }
    db.branches.push(b); if (p.managerId) setManager(db, b, p.managerId)
    saveDb(db); return branchRow(db, b)
  },
  'PATCH /branches/:id': async (p, { params }) => {
    await wait(400)
    const db = loadDb(), u = ownerOnly(db), b = db.branches.find((x) => x.id === params.id && x.businessId === u.businessId)
    if (!b) throw fail(404, 'Branch not found.')
    if (p.name && db.branches.some((x) => x.businessId === u.businessId && x.id !== b.id && x.name.toLowerCase() === p.name.trim().toLowerCase())) throw fail(409, 'A branch with this name already exists.')
    for (const k of ['name', 'city', 'address', 'phone', 'status']) if (p[k] !== undefined) b[k] = typeof p[k] === 'string' ? p[k].trim() : p[k]
    if (p.managerId !== undefined) setManager(db, b, p.managerId || null)
    saveDb(db); return branchRow(db, b)
  },
  'DELETE /branches/:id': async (_b, { params }) => {
    await wait(450)
    const db = loadDb(), u = ownerOnly(db), b = db.branches.find((x) => x.id === params.id && x.businessId === u.businessId)
    if (!b) throw fail(404, 'Branch not found.')
    if (db.branches.filter((x) => x.businessId === u.businessId).length <= 1) throw fail(409, 'A business needs at least one branch.')
    db.branches = db.branches.filter((x) => x.id !== b.id)
    for (const k of ['sales', 'customers', 'inventory', 'employees', 'appointments']) db[k] = (db[k] ?? []).filter((r) => r.branchId !== b.id)
    db.users.forEach((x) => { x.branchIds = x.branchIds.filter((id) => id !== b.id) })
    db.invitations?.forEach((i) => { i.branchIds = i.branchIds.filter((id) => id !== b.id) })
    saveDb(db); return { removed: true }
  },
}

export const collectionHandlers = {
  ...branchHandlers, ...crud('sales'), ...crud('customers'), ...crud('inventory'), ...crud('employees'), ...crud('appointments'),
  'GET /customers/:id/history': async (_b, { params }) => {
    await wait(250)
    const { db, u } = open('customers', 'read')
    const c = db.customers.find((x) => x.id === params.id && x.businessId === u.businessId && allowed(u, x.branchId))
    if (!c) throw fail(404, 'Customer not found.')
    return { sales: enrich.sales(db, db.sales.filter((s) => s.customerId === c.id)).sort(sortNew.sales), appointments: enrich.appointments(db, db.appointments.filter((a) => a.customerId === c.id)).sort(sortNew.appointments) }
  },
}
