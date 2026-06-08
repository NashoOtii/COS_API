import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import HallOfFame from '../HallOfFame'
import Constitution from '../Constitution'

const memberTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'contributions', label: 'Contributions' },
  { id: 'loans', label: 'My Loans' },
  { id: 'investments', label: 'Investments'},
  { id: 'halloffame', label: 'Hall of Fame' },
  { id: 'constitution', label: 'Constitution' },
]

export default function MemberDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [activeCycle, setActiveCycle] = useState(null)
  const [contributions, setContributions] = useState([])
  const [streak, setStreak] = useState(0)
  const [loans, setLoans] = useState([])
  const [investments, setInvestments] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [loanForm, setLoanForm] = useState({ principal: '', repaymentWeeks: '' })
  const [loanMessage, setLoanMessage] = useState('')
  const [loanLoading, setLoanLoading] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const { data: cycle } = await api.get('/cycles/active')
      setActiveCycle(cycle)

      const [contribRes, streakRes, loansRes, invRes, sumRes] =
        await Promise.all([
          api.get(`/contributions/member/${user.memberId}`),
          api.get(`/contributions/member/${user.memberId}/streak`),
          api.get(`/loans/member/${user.memberId}`),
          api.get(`/investments/cycle/${cycle.id}`),
          api.get(`/cycles/${cycle.id}/summary`),
        ])

      setContributions(contribRes.data)
      setStreak(streakRes.data.currentStreak)
      setLoans(loansRes.data)
      setInvestments(invRes.data)
      setSummary(sumRes.data)
    } catch {
      // No active cycle is fine
    } finally {
      setLoading(false)
    }
  }

  const handleLoanRequest = async (e) => {
    e.preventDefault()
    setLoanMessage('')
    setLoanLoading(true)
    try {
      await api.post('/loans', {
        memberId: user.memberId,
        cycleId: activeCycle.id,
        principal: parseFloat(loanForm.principal),
        repaymentWeeks: parseInt(loanForm.repaymentWeeks),
      })
      setLoanForm({ principal: '', repaymentWeeks: '' })
      setShowLoanForm(false)
      setLoanMessage('Loan request submitted. Awaiting executive approval.')
      await fetchAll()
    } catch (err) {
      setLoanMessage(err.response?.data || 'Failed to submit loan request.')
    } finally {
      setLoanLoading(false)
    }
  }

  const totalContributed = contributions
    .filter(c => c.status === 'Paid')
    .reduce((sum, c) => sum + c.amount, 0)

  const activeLoan = loans.find(l =>
    l.status === 'Active' || l.status === 'Approved' || l.status === 'Pending')

  const statusColor = (status) => {
    const map = {
      Pending:  'bg-amber-100 text-amber-700',
      Approved: 'bg-green-100 text-green-700',
      Active:   'bg-blue-100 text-blue-700',
      Repaid:   'bg-gray-100 text-gray-600',
      Defaulted:'bg-red-100 text-red-700',
    }
    return map[status] || 'bg-gray-100 text-gray-600'
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
    <div className="relative w-12 h-12">
    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
    <div className="absolute inset-0 border-4 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
    <p className="text-sm font-semibold text-gray-500 tracking wide uppercase animate-pulse">
     Securing Connection & loading dashboard...
     </p>
     </div>
     </div>
  )

  return (
    <DashboardLayout
      tabs={memberTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      activeCycle={activeCycle}
    >

      {/* ── OVERVIEW TAB ── */}
      <div className="pd-20 md:pb-0"></div>
      {activeTab === 'overview' && (
        <div>
          {/* Welcome banner */}
          <div className="bg-slate-900 rounded-2xl p-6 mb-6 text-white shadow-md">
            <p className="text-slate-400 text-sm mb-1">Welcome back</p>
            <h2 className="text-2xl font-bold tracking-tight">
              {user?.fullName?.split(' ')[0] || 'Member'} 👋
            </h2>
            {activeCycle ? (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <p className="text-slate-300 text-sm">
                  Active in <span className="font-semibold text-white">{activeCycle.name}</span>
                   <span className="mx-2 text-slate-500">|</span>
                  Weekly: <span className="font-semibold text-white">KES {activeCycle.weeklyContributionAmount?.toLocaleString()}</span>
                  </p>
    </div>
  ) : (
    <p className="text-slate-400 text-sm mt-3 pt-3 border-t border-slate-700/50">
      No active cycle yet.
    </p>
  )}
</div>

          {/* Personal stat cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
  {[
    { label: 'Total Contributed',
      value: `KES ${totalContributed.toLocaleString()}`,
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      text: 'text-emerald-900', lbl: 'text-emerald-700' },
    { label: 'Payment Streak',
      value: `${streak} week${streak !== 1 ? 's' : ''}`,
      bg: 'bg-amber-50 hover:bg-amber-100',
      text: 'text-amber-900', lbl: 'text-amber-700' },
    { label: 'Active Loan',
      value: activeLoan ? `KES ${activeLoan.totalRepayable?.toLocaleString()}` : 'None',
      bg: activeLoan ? 'bg-blue-50 hover:bg-blue-100' : 'bg-slate-50 hover:bg-slate-100',
      text: activeLoan ? 'text-blue-900' : 'text-slate-700',
      lbl: activeLoan ? 'text-blue-700' : 'text-slate-500' },
    { label: 'My Role',
      value: user?.role || user?.user?.role || '—',
      bg: 'bg-purple-50 hover:bg-purple-100',
      text: 'text-purple-900', lbl: 'text-purple-700' },
  ].map(card => (
    <div key={card.label}
      className={`p-5 rounded-2xl transition-colors duration-200 cursor-default border border-white/50 shadow-sm ${card.bg}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${card.lbl}`}>
        {card.label}
      </p>
      <p className={`text-xl font-bold ${card.text}`}>
        {card.value}
      </p>
    </div>
  ))}
</div>

          {/* Group pool summary */}
          {summary && (
            <div className="card mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase 
                tracking-wider mb-4">
                Group Pool — {summary.cycleName}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Contributions',
                    value: summary.totalContributions, color: 'text-green-600' },
                  { label: 'Loans Issued',
                    value: summary.totalLoansIssued, color: 'text-amber-600' },
                  { label: 'Interest Earned',
                    value: summary.totalInterestEarned, color: 'text-blue-600' },
                  { label: 'Pool Balance',
                    value: summary.poolBalance, color: 'text-green-600' },
                ].map(item => (
                  <div key={item.label}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className={`text-base font-bold ${item.color}`}>
                      KES {item.value?.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active loan card */}
          {activeLoan && (
            <div className="card border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gray-900">
                  Your Active Loan
                </h3>
                <span className={`badge ${statusColor(activeLoan.status)}`}>
                  {activeLoan.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Principal',
                    value: `KES ${activeLoan.principal?.toLocaleString()}` },
                  { label: 'Flat Fee (10%)',
                    value: `KES ${activeLoan.flatFee?.toLocaleString()}` },
                  { label: 'Total Repayable',
                    value: `KES ${activeLoan.totalRepayable?.toLocaleString()}` },
                  { label: 'Due Date',
                    value: activeLoan.dueDate
                      ? new Date(activeLoan.dueDate).toLocaleDateString()
                      : 'TBD' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CONTRIBUTIONS TAB ── */}
      {activeTab === 'contributions' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="section-title">My Contributions</h2>
              <p className="text-gray-500 text-sm mt-1">
                Your payment history across all cycles
              </p>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border 
              border-amber-200 rounded-xl px-4 py-2.5">
              
              <div>
                <p className="text-xs text-amber-600">Current Streak</p>
                <p className="text-sm font-bold text-amber-700">
                  {streak} week{streak !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {contributions.length === 0 ? (
            <div className="card text-center py-16">
              
              <p className="text-gray-900 font-semibold mb-2">
                No contributions yet
              </p>
              <p className="text-gray-500 text-sm">
                Your payment history will appear here.
              </p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="table-header">Cycle</th>
                    <th className="table-header">Week</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contributions.map(c => (
                    <tr key={c.id}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell text-gray-500 text-xs">
                        {c.cycle?.name ?? `Cycle #${c.cycleId}`}
                      </td>
                      <td className="table-cell font-medium">
                        Week {c.weekNumber}
                      </td>
                      <td className="table-cell font-semibold text-green-600">
                        KES {c.amount?.toLocaleString()}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${
                          c.status === 'Paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {c.status === 'Paid' ? '✓ Paid' : c.status}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500 text-xs">
                        {new Date(c.dateRecorded).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── LOANS TAB ── */}
      {activeTab === 'loans' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="section-title">My Loans</h2>
              <p className="text-gray-500 text-sm mt-1">
                Your loan history and requests
              </p>
            </div>
            {activeCycle && !activeLoan && (
              <button
                onClick={() => setShowLoanForm(!showLoanForm)}
                className="btn-primary"
              >
                {showLoanForm ? 'Cancel' : '+ Request Loan'}
              </button>
            )}
          </div>

          {loanMessage && (
            <div className={`mb-4 p-4 rounded-xl text-sm border ${
              loanMessage.includes('submitted')
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {loanMessage}
            </div>
          )}

          {/* Loan request form */}
          {showLoanForm && (
            <div className="card mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Request a Loan
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Max:{' '}
                <strong className="text-gray-900">
                  KES {activeCycle?.maxLoanAmount?.toLocaleString()}
                </strong>
                . A 10% flat fee applies. Executives will review your request.
              </p>
              <form onSubmit={handleLoanRequest}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label">Amount (KES)</label>
                    <input
                      type="number"
                      placeholder={`Max KES ${activeCycle?.maxLoanAmount?.toLocaleString()}`}
                      value={loanForm.principal}
                      onChange={e => setLoanForm({
                        ...loanForm, principal: e.target.value })}
                      className="input-field" required
                    />
                  </div>
                  <div>
                    <label className="label">Repayment Period (weeks)</label>
                    <input
                      type="number" placeholder="e.g. 4"
                      min="1" max="52"
                      value={loanForm.repaymentWeeks}
                      onChange={e => setLoanForm({
                        ...loanForm, repaymentWeeks: e.target.value })}
                      className="input-field" required
                    />
                  </div>
                </div>

                {/* Live fee preview */}
                {loanForm.principal && (
                  <div className="bg-blue-50 border border-blue-200 
                    rounded-xl p-4 mb-4 flex flex-wrap gap-4 text-sm">
                    <div>
                      <p className="text-blue-600 text-xs mb-0.5">
                        You receive
                      </p>
                      <p className="font-bold text-blue-900">
                        KES {parseFloat(loanForm.principal).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600 text-xs mb-0.5">
                        Fee (10%)
                      </p>
                      <p className="font-bold text-amber-700">
                        KES {(parseFloat(loanForm.principal) * 0.1)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600 text-xs mb-0.5">
                        You repay
                      </p>
                      <p className="font-bold text-green-700">
                        KES {(parseFloat(loanForm.principal) * 1.1)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loanLoading}
                  className="btn-primary">
                  {loanLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </div>
          )}

          {/* Loans table */}
          {loans.length === 0 ? (
            <div className="card text-center py-16">
              
              <p className="text-gray-900 font-semibold mb-2">
                No loan history yet
              </p>
              {activeCycle && !activeLoan && (
                <p className="text-gray-500 text-sm">
                  Click <strong>+ Request Loan</strong> to apply.
                </p>
              )}
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Principal', 'Fee', 'Total', 'Weeks',
                      'Due Date', 'Status', 'Requested'].map(h => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loans.map(loan => (
                    <tr key={loan.id}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell font-semibold text-green-600">
                        KES {loan.principal?.toLocaleString()}
                      </td>
                      <td className="table-cell text-amber-600">
                        KES {loan.flatFee?.toLocaleString()}
                      </td>
                      <td className="table-cell font-bold text-gray-900">
                        KES {loan.totalRepayable?.toLocaleString()}
                      </td>
                      <td className="table-cell text-gray-500">
                        {loan.repaymentWeeks}w
                      </td>
                      <td className="table-cell text-gray-500 text-xs">
                        {loan.dueDate
                          ? new Date(loan.dueDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${statusColor(loan.status)}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500 text-xs">
                        {new Date(loan.requestedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── INVESTMENTS TAB ── */}
      {activeTab === 'investments' && (
        <div>
          <div className="page-header">
            <div>
              <h2 className="section-title">Group Investments</h2>
              <p className="text-gray-500 text-sm mt-1">
                See where the group's money is working
              </p>
            </div>
            {activeCycle && (
              <span className="bg-gray-100 border border-gray-200 
                text-gray-600 text-xs font-medium px-3 py-1.5 rounded-lg">
                {activeCycle.name}
              </span>
            )}
          </div>

          {/* Investment summary cards */}
          {investments.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Active Projects',
                  value: investments.filter(i => i.status === 'Active').length,
                  color: 'text-blue-600' },
                { label: 'Capital Deployed',
                  value: `KES ${investments.reduce(
                    (s, i) => s + i.capitalAllocated, 0).toLocaleString()}`,
                  color: 'text-amber-600' },
                { label: 'Returns Generated',
                  value: `KES ${investments.reduce(
                    (s, i) => s + i.returnsGenerated, 0).toLocaleString()}`,
                  color: 'text-green-600'},
                { label: 'Net Profit',
                  value: (() => {
                    const net = investments.reduce(
                      (s, i) => s + i.returnsGenerated - i.capitalAllocated, 0)
                    return `${net >= 0 ? '+' : ''}KES ${net.toLocaleString()}`
                  })(),
                  color: investments.reduce(
                    (s, i) => s + i.returnsGenerated - i.capitalAllocated,
                    0) >= 0 ? 'text-green-600' : 'text-red-600'
                 },
              ].map(card => (
                <div key={card.label} className="stat-card">
                  <p className="text-2xl mb-2">{card.icon}</p>
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className={`text-lg font-bold ${card.color}`}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {investments.length === 0 ? (
            <div className="card text-center py-16">
              
              <p className="text-gray-900 font-semibold mb-2">
                No investment projects yet
              </p>
              <p className="text-gray-500 text-sm">
                Executives will post investment projects here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {investments.map(inv => {
                const net = inv.returnsGenerated - inv.capitalAllocated
                const statusMap = {
                  Active:    'bg-blue-100 text-blue-700',
                  Completed: 'bg-green-100 text-green-700',
                  Cancelled: 'bg-red-100 text-red-700',
                }
                return (
                  <div key={inv.id} className="card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base">
                          {inv.projectName}
                        </h3>
                        <p className="text-gray-500 text-xs mt-0.5">
                          Started{' '}
                          {new Date(inv.investmentDate).toLocaleDateString()}
                          {inv.completedDate && ` — Completed ${
                            new Date(inv.completedDate).toLocaleDateString()}`}
                        </p>
                      </div>
                      <span className={`badge ${
                        statusMap[inv.status] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {inv.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { label: 'Capital In',
                          value: `KES ${inv.capitalAllocated?.toLocaleString()}`,
                          color: 'text-amber-600' },
                        { label: 'Returns Out',
                          value: `KES ${inv.returnsGenerated?.toLocaleString()}`,
                          color: 'text-green-600' },
                        { label: 'Net',
                          value: `${net >= 0 ? '+' : ''}KES ${net.toLocaleString()}`,
                          color: net >= 0 ? 'text-green-600' : 'text-red-600' },
                      ].map(item => (
                        <div key={item.label}
                          className="bg-gray-50 rounded-lg p-3 
                            border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">
                            {item.label}
                          </p>
                          <p className={`font-bold text-sm ${item.color}`}>
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {inv.notes && (
                      <div className="bg-gray-50 rounded-lg p-3 
                        border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{inv.notes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── HALL OF FAME TAB ── */}
      {activeTab === 'halloffame' && <HallOfFame />}
      {activeTab === 'constitution' && <Constitution />}

    </DashboardLayout>
  )
}