import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function HallOfFame() {
  const [cycles, setCycles] = useState([])
  const [summaries, setSummaries] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchArchivedCycles() }, [])

  const fetchArchivedCycles = async () => {
    try {
      const { data } = await api.get('/cycles')
      const archived = data.filter(c => c.status === 'Archived')
      setCycles(archived)
      const results = {}
      await Promise.all(
        archived.map(async (cycle) => {
          try {
            const { data: sum } = await api.get(
              `/cycles/${cycle.id}/summary`)
            results[cycle.id] = sum
          } catch {
            results[cycle.id] = null
          }
        })
      )
      setSummaries(results)
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id) => setExpanded(expanded === id ? null : id)

  const medals = ['🥇', '🥈', '🥉']

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-400">Loading Hall of Fame...</p>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="section-title">🏆 Hall of Fame</h2>
          <p className="text-gray-500 text-sm mt-1">
            A record of every completed cycle — the foundation this group
            was built on.
          </p>
        </div>
      </div>

      {cycles.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">🏛️</p>
          <p className="text-gray-900 font-semibold mb-2">
            No archived cycles yet
          </p>
          <p className="text-gray-500 text-sm">
            Completed cycles will appear here once closed and archived.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {cycles.map((cycle, index) => {
            const sum = summaries[cycle.id]
            const isOpen = expanded === cycle.id

            return (
              <div key={cycle.id}
                className="card p-0 overflow-hidden">

                {/* Header */}
                <div
                  onClick={() => toggle(cycle.id)}
                  className={`flex justify-between items-center p-5
                    cursor-pointer transition-colors
                    ${isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center
                      justify-center text-2xl flex-shrink-0
                      ${index === 0 ? 'bg-amber-100' :
                        index === 1 ? 'bg-gray-100' :
                        index === 2 ? 'bg-orange-100' : 'bg-blue-50'}`}>
                      {medals[index] || '🏅'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {cycle.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(cycle.startDate).toLocaleDateString()}
                        {' '}—{' '}
                        {cycle.endDate
                          ? new Date(cycle.endDate).toLocaleDateString()
                          : 'TBD'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {sum && (
                      <div className="hidden md:flex gap-6 text-right">
                        <div>
                          <p className="text-xs text-gray-400">Pool</p>
                          <p className="text-sm font-bold text-green-600">
                            KES {sum.totalContributions?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Interest</p>
                          <p className="text-sm font-bold text-blue-600">
                            KES {sum.totalInterestEarned?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    <span className="text-gray-400 text-sm">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && sum && (
                  <div className="p-5 border-t border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-5
                      gap-3 mb-4">
                      {[
                        { label: 'Contributions',
                          value: sum.totalContributions,
                          icon: '💰', color: 'text-green-600',
                          bg: 'bg-green-50' },
                        { label: 'Loans Issued',
                          value: sum.totalLoansIssued,
                          icon: '🏦', color: 'text-amber-600',
                          bg: 'bg-amber-50' },
                        { label: 'Interest',
                          value: sum.totalInterestEarned,
                          icon: '📈', color: 'text-blue-600',
                          bg: 'bg-blue-50' },
                        { label: 'Penalties',
                          value: sum.totalPenaltiesCollected,
                          icon: '⚠️', color: 'text-purple-600',
                          bg: 'bg-purple-50' },
                        { label: 'Final Balance',
                          value: sum.poolBalance,
                          icon: '🏆', color: 'text-green-600',
                          bg: 'bg-green-50' },
                      ].map(stat => (
                        <div key={stat.label}
                          className={`${stat.bg} rounded-xl p-3
                            border border-gray-100`}>
                          <p className="text-base mb-1">{stat.icon}</p>
                          <p className="text-xs text-gray-500 mb-1">
                            {stat.label}
                          </p>
                          <p className={`font-bold text-sm ${stat.color}`}>
                            KES {stat.value?.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 bg-gray-50
                      rounded-xl p-4 border border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Weekly Contribution
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          KES {cycle.weeklyContributionAmount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Max Loan
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          KES {cycle.maxLoanAmount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <span className="badge bg-green-100 text-green-700">
                          ✓ Archived
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isOpen && !sum && (
                  <div className="p-5 border-t border-gray-100
                    text-gray-500 text-sm">
                    Summary data unavailable for this cycle.
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