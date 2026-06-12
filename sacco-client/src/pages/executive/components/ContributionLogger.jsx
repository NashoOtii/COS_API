import { useState, useEffect } from 'react'
import api from '../../../api/axios'
import { useAuth } from '../../../context/AuthContext'
import { SkeletonTable } from '../../../components/Skeleton'

export default function ContributionLogger({ activeCycle, onContributionLogged }) {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [contributions, setContributions] = useState([])
  const [weekNumber, setWeekNumber] = useState(1)
  const [pageLoading, setPageLoading] = useState(true)
  const [submitting, setSubmitting] = useState(null) 
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  if (loading) return (
  <div>
    <div className="page-header">
      <div className="h-7 bg-gray-200 rounded w-32 animate-pulse" />
    </div>
    <SkeletonTable rows={6} />
  </div>
)

  useEffect(() => {
    api.get('/members').then(({ data }) =>
      setMembers(data.filter(m => m.status === 'Active')))
    if (activeCycle) {
      api.get(`/contributions/cycle/${activeCycle.id}`)
        .then(({ data }) => setContributions(data))
    }
  }, [activeCycle])

  const hasPaid = (memberId) =>
    contributions.some(c =>
      c.memberId === memberId &&
      c.weekNumber === weekNumber &&
      c.status === 'Paid'
    )

  const logContribution = async (memberId) => {
    if (!activeCycle) return
    setSubmitting(memberId)
    setMessage('')
    try {
      await api.post('/contributions', {
        memberId, cycleId: activeCycle.id,
        amount: activeCycle.weeklyContributionAmount,
        weekNumber, status: 'Paid',
        recordedById: user.memberId,
      })
      const { data } = await api.get(
        `/contributions/cycle/${activeCycle.id}`)
      setContributions(data)
      setMessage('Contribution logged successfully.')
      onContributionLogged()
    } catch (err) {
      setMessage(err.response?.data || 'Failed to log contribution.')
    } finally {
      setSubmitting(null)
    }
  }

  if (!activeCycle) return (
    <div className="card text-center py-16">
      <p className="text-5xl mb-4">📋</p>
      <p className="text-gray-900 font-semibold mb-2">No active cycle</p>
      <p className="text-gray-500 text-sm">Create a cycle first.</p>
    </div>
  )

  const paidCount = members.filter(m => hasPaid(m.id)).length
  const progressPct = members.length > 0
    ? Math.round((paidCount / members.length) * 100) : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="section-title">Log Contributions</h2>
          <p className="text-gray-500 text-sm mt-1">
            {activeCycle.name} · KES{' '}
            {activeCycle.weeklyContributionAmount?.toLocaleString()} per week
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-gray-600 text-sm font-medium">Week:</label>
          <input
            type="number" min="1" max="52" value={weekNumber}
            onChange={e => setWeekNumber(parseInt(e.target.value))}
            className="w-20 px-3 py-2 bg-white border border-gray-300
              rounded-lg text-gray-900 text-center text-sm focus:outline-none
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Progress */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Week {weekNumber} Progress
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {paidCount} of {members.length} members paid
            </p>
          </div>
          <span className={`text-2xl font-bold ${
            progressPct === 100 ? 'text-green-600' : 'text-blue-600'
          }`}>
            {progressPct}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              progressPct === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-xl text-sm border ${
          message.includes('success')
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="table-header">Member</th>
              <th className="table-header">Phone</th>
              <th className="table-header">Amount</th>
              <th className="table-header">Week {weekNumber}</th>
              <th className="table-header">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map(member => {
              const paid = hasPaid(member.id)
              return (
                <tr key={member.id}
                  className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100
                        text-blue-600 flex items-center justify-center
                        font-semibold text-sm flex-shrink-0">
                        {member.fullName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">
                        {member.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">
                    {member.phoneNumber}
                  </td>
                  <td className="table-cell font-semibold text-green-600">
                    KES {activeCycle.weeklyContributionAmount?.toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${
                      paid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => logContribution(member.id)}
                      disabled={paid || submitting === member.id}
                      className={`text-xs font-semibold px-4 py-2 rounded-lg
                        border-none cursor-pointer transition-all
                        ${paid
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        }`}
                    >
                      {/*spinner inside button only */}
                      {isSubmitting === member.id ? (
                        <span className="flex items-center gap-1.5
                          justify-center">
                          <svg className="w-3 h-3 animate-spin"
                            viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12"
                              cy="12" r="10" stroke="currentColor"
                              strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                          Saving...
                        </span>
                      ) : paid ? 'Already Logged' : 'Log Payment'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}