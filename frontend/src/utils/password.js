export function passwordStrength(pw = '') {
  const checks = [pw.length >= 8, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)]
  const score = checks.filter(Boolean).length
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-line', 'bg-danger', 'bg-warning', 'bg-secondary', 'bg-success']
  return { score: pw ? Math.max(score, 1) : 0, label: pw ? labels[Math.max(score, 1)] : '', color: colors[pw ? Math.max(score, 1) : 0], checks }
}
