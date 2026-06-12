import { useState } from 'react'
import api from '../../../api/axios'

export default function CycleOverview({ activeCycle, summary, onCycleCreated }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', startDate: '',
    weeklyContributionAmount: '', maxLoanAmount: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const startDateISO = new Date(form.startDate).toISOString()

      await api.post('/cycles', {
        ...form,
        startDate: startDateISO,
        weeklyContributionAmount: parseFloat(form.weeklyContributionAmount),
        maxLoanAmount: parseFloat(form.maxLoanAmount),
      })
      setShowForm(false)
      onCycleCreated()
    } catch (err) {
      const data = err.response?.data
    if (typeof data === 'string') setError(data)
    else if (data?.errors) {
      setError(Object.values(data.errors).flat().join(' '))
    } else if (err.response?.status === 500) {
      setError('Server error.')
    } else {
      setError('Failed to create cycle.')
    }
  } finally {
    setLoading(false)
  }
}

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="section-title">Cycle Overview</h2>
          <p className="text-gray-500 text-sm mt-1">
            Financial summary for the current cycle
          </p>
        </div>
        {!activeCycle && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : '+ New Cycle'}
          </button>
        )}
      </div>

      {/* Create Cycle Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Create New Cycle</h3>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Cycle Name</label>
                <input type="text"
                  placeholder="e.g. Cycle 4 - Sept 2026"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="label">Start Date</label>
                <input type="date" value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="label">Weekly Contribution (KES)</label>
                <input type="number" placeholder="500"
                  value={form.weeklyContributionAmount}
                  onChange={e => setForm({ ...form, weeklyContributionAmount: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="label">Max Loan Amount (KES)</label>
                <input type="number" placeholder="10000"
                  value={form.maxLoanAmount}
                  onChange={e => setForm({ ...form, maxLoanAmount: e.target.value })}
                  className="input-field" required />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating...' : 'Create Cycle'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* No cycle state */}
      {!activeCycle && !showForm && (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-gray-900 font-semibold mb-2">No active cycle</p>
          <p className="text-gray-500 text-sm mb-4">
            Create a cycle to start tracking contributions.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Create First Cycle
          </button>
        </div>
      )}

      {activeCycle && summary && (
        <>
          {/* Cycle Summary — Soft Tinted Blocks */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
  {[
    { label: 'Total Contributions',
      value: summary.totalContributions,
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      text: 'text-emerald-900', lbl: 'text-emerald-600' },
    { label: 'Loans Issued',
      value: summary.totalLoansIssued,
      bg: 'bg-amber-50 hover:bg-amber-100',
      text: 'text-amber-900', lbl: 'text-amber-600' },
    { label: 'Interest Earned',
      value: summary.totalInterestEarned,
      bg: 'bg-blue-50 hover:bg-blue-100',
      text: 'text-blue-900', lbl: 'text-blue-600' },
    { label: 'Penalties Collected',
      value: summary.totalPenaltiesCollected,
      bg: 'bg-purple-50 hover:bg-purple-100',
      text: 'text-purple-900', lbl: 'text-purple-600' },
    { label: 'Pool Balance',
      value: summary.poolBalance,
      bg: 'bg-green-50 hover:bg-green-100',
      text: 'text-green-900', lbl: 'text-green-600' },
  ].map(card => (
    <div key={card.label}
      className={`p-5 rounded-2xl transition-colors duration-200 
        cursor-default ${card.bg}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider 
        mb-1 ${card.lbl}`}>
        {card.label}
      </p>
      <p className={`text-xl font-bold ${card.text}`}>
        KES {card.value?.toLocaleString()}
      </p>
    </div>
  ))}

      {activeCycle && !summary && (
  <div className="text-gray-400 text-sm py-4">
    Loading summary...
  </div>
)}

</div>

          {/* Cycle settings */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Cycle Settings
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Cycle Name', value: activeCycle?.name },
                { label: 'Weekly Contribution', value: `KES ${activeCycle?.weeklyContributionAmount?.toLocaleString()}` },
                { label: 'Max Loan Amount', value: `KES ${activeCycle?.maxLoanAmount?.toLocaleString()}` },
                { label: 'Started', value: activeCycle ? new Date(activeCycle.startDate).toLocaleDateString() : '—' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}