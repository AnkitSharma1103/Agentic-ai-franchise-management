// Deterministic demo analytics. Each branch's numbers derive from its id, so businesses never share data.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PRESET = {
  'br-modinagar': { revenue: 1193000, customers: 5200, appointments: 812, employees: 18, growth: 14.8 },
  'br-meerut': { revenue: 967200, customers: 4380, appointments: 642, employees: 14, growth: 10.2 },
  'br-hapur': { revenue: 685120, customers: 2900, appointments: 478, employees: 10, growth: 6.4 },
}
const CURVE = [0.58, 0.61, 0.66, 0.64, 0.71, 0.75, 0.74, 0.82, 0.86, 0.9, 0.94, 1]
const SERVICES = {
  salon: ['Hair Services', 'Skin Services', 'Spa & Wellness', 'Others'],
  restaurant: ['Dine-in', 'Takeaway', 'Delivery', 'Catering'], cafe: ['Beverages', 'Food', 'Bakery', 'Merchandise'],
  hardware: ['Building Materials', 'Tools', 'Plumbing & Electrical', 'Others'], retail: ['Apparel', 'Accessories', 'Home', 'Others'],
  fitness: ['Memberships', 'Personal Training', 'Classes', 'Others'], education: ['Courses', 'Coaching', 'Workshops', 'Others'], other: ['Core', 'Add-ons', 'Packages', 'Others'],
}
const NAMES = ['Sneha Kapoor', 'Rohit Malhotra', 'Pooja Yadav', 'Imran Qureshi', 'Kavita Singh', 'Deepak Chauhan', 'Anjali Mehra', 'Vikram Rathi']
const PRODUCTS = ['Keratin Hair Mask 500ml', 'Hair Colour – Natural Brown', 'Professional Shampoo 1L', 'Facial Kit – Gold', 'Hair Serum 100ml', 'Disposable Towels (pack)']

export const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }

export function branchStats(b) {
  if (PRESET[b.id]) return { ...PRESET[b.id] }
  const h = hash(b.id), revenue = Math.round((300000 + (h % 700000)) / 10) * 10
  return { revenue, customers: Math.round(revenue / 230), appointments: Math.round(revenue / 1470), employees: Math.max(3, Math.round(revenue / 66000)), growth: (((h >>> 4) % 240) - 40) / 10 }
}
export const labels = (n) => { const d = new Date(); return Array.from({ length: n }, (_, i) => MONTHS[new Date(d.getFullYear(), d.getMonth() - (n - 1 - i), 1).getMonth()]) }
export function revenueSeries(b, n) {
  const s = branchStats(b), h = hash(b.id)
  const out = CURVE.map((f, i) => Math.round(s.revenue * f * (1 + ((((h >>> (i % 8)) % 7) - 3) / 100))))
  out[11] = s.revenue; out[10] = Math.round(s.revenue / (1 + s.growth / 100))
  return out.slice(12 - n)
}
const ago = ['10 min ago', '35 min ago', '1 hr ago', '3 hrs ago', 'Yesterday']
const sum = (a, f) => a.reduce((t, x) => t + f(x), 0)

function activity(branches, unitName) {
  const t = [(b) => `New ${unitName} booked at ${b.name}`, (b) => `Stock received at ${b.name}`, (b) => `${b.name} reached its daily sales target`, (b) => `New customer registered at ${b.name}`, (b) => `Payment settled at ${b.name}`]
  return t.map((f, i) => ({ text: f(branches[i % branches.length]), time: ago[i] }))
}
function inventoryAlerts(b) {
  const h = hash(b.id)
  return [0, 1, 2].map((i) => ({ product: PRODUCTS[(h + i * 2) % PRODUCTS.length], stock: 2 + ((h >>> (i * 3)) % 8), reorder: 20 + ((h >>> (i + 2)) % 4) * 10 }))
}

export function ownerDashboard(db, businessId, { months = 6, branchId } = {}) {
  const biz = db.businesses.find((b) => b.businessId === businessId)
  const all = db.branches.filter((b) => b.businessId === businessId && b.status !== 'Deleted')
  const scope = branchId && branchId !== 'all' ? all.filter((b) => b.id === branchId) : all
  const stats = scope.map((b) => ({ b, s: branchStats(b) }))
  const revenue = sum(stats, (x) => x.s.revenue)
  const prev = sum(stats, (x) => x.s.revenue / (1 + x.s.growth / 100))
  const isDemoAll = businessId === 'FAI-DEMO01' && scope.length === 3
  const revGrowth = isDemoAll ? 12.4 : prev ? ((revenue - prev) / prev) * 100 : 0
  const series = scope.map((b) => revenueSeries(b, months))
  const lab = labels(months)
  const cat = SERVICES[biz?.type] ?? SERVICES.other, base = [42, 26, 18, 14]
  const sh = scope.length ? hash(scope[0].id) % 5 : 0
  const pcts = base.map((v, i) => (i === 0 ? v + sh - 2 : i === 3 ? v - sh + 2 : v))
  const best = [...stats].sort((a, b) => b.s.revenue - a.s.revenue)[0], worst = [...stats].sort((a, b) => a.s.growth - b.s.growth)[0]
  const unit = biz?.type === 'salon' ? 'appointment' : 'order'
  return {
    business: { name: biz?.name, type: biz?.type },
    branches: all.map((b) => ({ id: b.id, name: b.name })),
    kpis: {
      revenue, revenueGrowth: revGrowth, branches: scope.length, branchesActive: scope.filter((b) => b.status === 'Active').length,
      customers: sum(stats, (x) => x.s.customers), customersGrowth: isDemoAll ? 8.2 : 5.1,
      employees: sum(stats, (x) => x.s.employees), appointments: sum(stats, (x) => x.s.appointments), appointmentsGrowth: isDemoAll ? 10.5 : 6.3,
    },
    trend: lab.map((month, i) => ({ month, revenue: sum(series, (s) => s[i]) })),
    branchShare: stats.map((x) => ({ name: x.b.name, revenue: x.s.revenue, pct: revenue ? Math.round((x.s.revenue / revenue) * 100) : 0 })),
    comparison: stats.map((x) => ({ name: x.b.name, thisMonth: x.s.revenue, lastMonth: Math.round(x.s.revenue / (1 + x.s.growth / 100)) })),
    services: cat.map((name, i) => ({ name, pct: pcts[i] })),
    branchTable: stats.map((x) => ({ id: x.b.id, name: x.b.name, location: x.b.city ?? x.b.name, revenue: x.s.revenue, customers: x.s.customers, appointments: x.s.appointments, growth: x.s.growth, status: x.b.status })),
    insight: best ? `Revenue ${revGrowth >= 0 ? 'increased' : 'decreased'} by ${Math.abs(revGrowth).toFixed(1)}% this month. ${best.b.name} is currently the best-performing branch.` : 'Add a branch to see insights.',
    recommendations: best && worst ? [
      `Run a promotional campaign for ${worst.b.name} to improve footfall (growth ${pct1(worst.s.growth)}).`,
      `Replicate ${best.b.name}'s weekend slot scheduling across other branches.`,
      'Reorder low-stock products before the weekend peak to avoid missed sales.',
    ] : [],
    alerts: [
      { level: 'warning', text: `${inventoryAlerts(scope[0] ?? { id: 'x' })[0].product} is running low${scope[0] ? ' at ' + scope[0].name : ''}.` },
      { level: 'danger', text: worst && worst.s.growth < 8 ? `${worst.b.name} growth is below the business average.` : 'All branches are growing steadily.' },
      { level: 'info', text: 'Month-end reports are ready to generate.' },
    ],
    activity: scope.length ? activity(scope, unit) : [],
  }
}
const pct1 = (n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`

export function managerDashboard(db, user, { branchId } = {}) {
  const assigned = db.branches.filter((b) => b.businessId === user.businessId && user.branchIds.includes(b.id))
  const branch = assigned.find((b) => b.id === branchId) ?? assigned[0]
  if (!branch) return { branches: [], branch: null }
  const s = branchStats(branch), h = hash(branch.id), today = new Date()
  const dailySales = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (13 - i))
    const weekend = [0, 6].includes(d.getDay()) ? 1.35 : 1
    return { day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue: Math.round((s.revenue / 30) * weekend * (0.85 + (((h >>> i) % 30) / 100))) }
  })
  const total = Math.round(s.appointments / 30), completed = Math.round(total * 0.55), cancelled = Math.max(1, Math.round(total * 0.06))
  const emp = Array.from({ length: Math.min(5, s.employees) }, (_, i) => ({ name: NAMES[(h + i) % NAMES.length], rating: +(4.9 - (((h >>> i) % 8) * 0.1) - i * 0.05).toFixed(1), services: 140 - i * 12 - ((h >>> i) % 9) }))
    .sort((a, b) => b.rating - a.rating)
  const biz = db.businesses.find((b) => b.businessId === user.businessId)
  return {
    business: { name: biz?.name, type: biz?.type },
    branches: assigned.map((b) => ({ id: b.id, name: b.name })), branch: { id: branch.id, name: branch.name },
    kpis: { revenue: s.revenue, revenueGrowth: s.growth, customers: s.customers, appointments: s.appointments, employees: s.employees },
    dailySales,
    appointmentOverview: { total, completed, upcoming: total - completed - cancelled, cancelled },
    inventoryAlerts: inventoryAlerts(branch), employeePerformance: emp,
    insights: [
      `${branch.name} revenue ${s.growth >= 0 ? 'grew' : 'fell'} ${Math.abs(s.growth).toFixed(1)}% versus last month.`,
      'Weekends bring about 35% more revenue. Keep your busiest stylists on Saturday and Sunday.',
      `${emp[0]?.name ?? 'Your top performer'} has the highest customer rating this month.`,
    ],
    activity: activity([branch], biz?.type === 'salon' ? 'appointment' : 'order'),
  }
}
