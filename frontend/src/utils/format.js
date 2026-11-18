export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
export const lakh = (n) => '₹' + (n / 100000).toFixed(2).replace(/\.?0+$/, '') + 'L'
export const num = (n) => Math.round(n).toLocaleString('en-IN')
export const pct = (n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
export function ago(iso) {
  if (!iso) return 'Never'
  const m = Math.round((Date.now() - new Date(iso)) / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} min ago`
  if (m < 1440) return `${Math.round(m / 60)} hr ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
export const fmtTime = (t) => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}` }
export const todayStr = () => new Date().toISOString().slice(0, 10)
