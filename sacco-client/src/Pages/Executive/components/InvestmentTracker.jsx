import { useState, useEffect } from 'react'
import api from '../../../api/axios'

export default function InvestmentTracker({ activeCycle }) {
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [returnsForm, setReturnsForm] = useState({})
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    projectName: '', capitalAllocated: '', notes: '',
  })

  const fetchInvestments = async () => {
    if (!activeCycle?.id) return
    try {
      const { data } = await api.get(`/investments/cycle/${activeCycle.id}`)
      setInvestments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (activeCycle) {
      fetchInvestments()
    } else {
      setLoading(false)
    }
  }, [activeCycle])

  const handleCreate = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.post('/investments', {
        cycleId: activeCycle.id,
        projectName: form.projectName,
        capitalAllocated: parseFloat(form.capitalAllocated),
        notes: form.notes,
      })
      setForm({ projectName: '', capitalAllocated: '', notes: '' })
      setShowForm(false)
      await fetchInvestments()
      setMessage('Investment created successfully.')
    } catch (err) {
      setMessage(err.response?.data || 'Failed to create investment.')
    }
  }

  const handleUpdateReturns = async (id) => {
    const returns = returnsForm[id]
    if (!returns) return
    try {
      await api.patch(`/investments/${id}/returns`,
        parseFloat(returns),
        { headers: { 'Content-Type': 'application/json' } })
      await fetchInvestments()
      setReturnsForm({ ...returnsForm, [id]: '' })
      setMessage('Returns updated successfully.')
    } catch (err) {
      setMessage(err.response?.data || 'Failed to update returns.')
    }
  }

  const handleComplete = async (id) => {
    try {
      await api.patch(`/investments/${id}/complete`)
      await fetchInvestments()
      setMessage('Investment marked as completed.')
    } catch (err) {
      setMessage(err.response?.data || 'Failed to complete investment.')
    }
  }

  const SkeletonTable = ({ rows = 6 }) => (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-10 bg-gray-200 rounded w-full animate-pulse" />
      ))}
    </div>
  )

  const totalAllocated = investments.reduce((s, i) => s + (i.capitalAllocated || 0), 0)
  const totalReturns = investments.reduce((s, i) => s + (i.returnsGenerated || 0), 0)
  const netProfit = totalReturns - totalAllocated

  const statusStyle = (status) => {
    const map = {
      Active:    'bg-blue-100 text-blue-700',
      Completed: 'bg-green-100 text-green-700',
      Cancelled: 'bg-red-100 text-red-700',
    }
    return map[status] || 'bg-gray-100 text-gray-600'
  }

  // 1. Guard check for no active cycle
  if (!activeCycle) return (
    <div className="card text-center py-16">
      <p className="text-5xl mb-4">📈</p>
      <p className="text-gray-900 font-semibold mb-2">No active cycle</p>
      <p className="text-gray-500 text-sm">Create a cycle first.</p>
    </div>
  )

  // 2. Guard check for loading states
  if (loading) return (
    <div>
      <div className="page-header">
        <div className="h-7 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      <SkeletonTable rows={6} />
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="section-title">Projects</h2>
          <p className="text-gray-500 text-sm mt-1">{activeCycle.name}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>
{/* Investment Summary — Soft Tinted Blocks */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
  {[
    { label: 'Projects',
      value: investments.length,
      bg: 'bg-blue-50 hover:bg-blue-100',
      text: 'text-blue-900', lbl: 'text-blue-600' },
    { label: 'Capital Deployed',
      value: `KES ${totalAllocated.toLocaleString()}`,
      bg: 'bg-amber-50 hover:bg-amber-100',
      text: 'text-amber-900', lbl: 'text-amber-600' },
    { label: 'Returns Generated',
      value: `KES ${totalReturns.toLocaleString()}`,
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      text: 'text-emerald-900', lbl: 'text-emerald-600' },
    { label: 'Net Profit',
      value: `${netProfit >= 0 ? '+' : ''}KES ${netProfit.toLocaleString()}`,
      bg: netProfit >= 0
        ? 'bg-green-50 hover:bg-green-100'
        : 'bg-red-50 hover:bg-red-100',
      text: netProfit >= 0 ? 'text-green-900' : 'text-red-900',
      lbl: netProfit >= 0 ? 'text-green-600' : 'text-red-600' },
  ].map(card => (
    <div key={card.label}
      className={`p-5 rounded-2xl transition-colors duration-200 
        cursor-default ${card.bg}`}>
      <p className={`text-sm font-medium mb-1 ${card.lbl}`}>
        {card.label}
      </p>
      <p className={`text-2xl font-bold ${card.text}`}>
        {card.value}
      </p>
    </div>
  ))}
</div>

      {message && (
        <div className={`mb-4 p-4 rounded-xl text-sm border ${
          message.includes('success') || message.includes('completed') || message.includes('updated')
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* New project form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">New Investment Project</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Project Name</label>
                <input type="text"
                  placeholder="e.g. Bulk Maize Purchase"
                  value={form.projectName}
                  onChange={e => setForm({ ...form, projectName: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="label">Capital to Allocate (KES)</label>
                <input type="number" placeholder="5000"
                  value={form.capitalAllocated}
                  onChange={e => setForm({ ...form, capitalAllocated: e.target.value })}
                  className="input-field" required />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                placeholder="Describe the project, expected returns, timeline..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <button type="submit" className="btn-primary">Create Project</button>
          </form>
        </div>
      )}

      {/* Projects list */}
      {investments.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">💼</p>
          <p className="text-gray-900 font-semibold mb-2">No projects yet</p>
          <p className="text-gray-500 text-sm">
            Click <strong>+ New Project</strong> to allocate funds.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {investments.map(inv => {
            const net = (inv.returnsGenerated || 0) - (inv.capitalAllocated || 0)
            return (
              <div key={inv.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">{inv.projectName}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Started {new Date(inv.investmentDate).toLocaleDateString()}
                      {inv.completedDate && ` — Completed ${new Date(inv.completedDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`badge ${statusStyle(inv.status)}`}>{inv.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Capital In', value: `KES ${inv.capitalAllocated?.toLocaleString()}`, color: 'text-amber-600' },
                    { label: 'Returns Out', value: `KES ${inv.returnsGenerated?.toLocaleString()}`, color: 'text-green-600' },
                    { label: 'Net', value: `${net >= 0 ? '+' : ''}KES ${net.toLocaleString()}`, color: net >= 0 ? 'text-green-600' : 'text-red-600' },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {inv.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{inv.notes}</p>
                  </div>
                )}

                {inv.status === 'Active' && (
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <input
                      type="number"
                      placeholder="Enter returns amount"
                      value={returnsForm[inv.id] || ''}
                      onChange={e => setReturnsForm({ ...returnsForm, [inv.id]: e.target.value })}
                      className="input-field max-w-xs"
                    />
                    <button onClick={() => handleUpdateReturns(inv.id)} className="btn-primary whitespace-nowrap">
                      Update Returns
                    </button>
                    <button onClick={() => handleComplete(inv.id)} className="btn-success whitespace-nowrap">
                      Mark Complete
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}