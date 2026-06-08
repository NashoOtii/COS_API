import { useState, useEffect } from 'react'
import api from '../../../api/axios'
import { useAuth } from '../../../context/AuthContext'
import { SkeletonTable } from '../../../components/Skeleton'

export default function LoanQueue({ activeCycle }) {
  const { user } = useAuth()
  const [loans, setLoans] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({
    memberId: '', principal: '', repaymentWeeks: '',
  })

  useEffect(() => {
    fetchLoans()
    api.get('/members').then(({ data }) =>
      setMembers(data.filter(m => m.status === 'Active')))
  }, [])

  const fetchLoans = async () => {
    try {
      const { data } = await api.get('/loans')
      setLoans(data)
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.post('/loans', {
        memberId: parseInt(requestForm.memberId),
        cycleId: activeCycle.id,
        principal: parseFloat(requestForm.principal),
        repaymentWeeks: parseInt(requestForm.repaymentWeeks),
      })
      setRequestForm({ memberId: '', principal: '', repaymentWeeks: '' })
      setShowRequestForm(false)
      await fetchLoans()
      setMessage('Loan request submitted successfully.')
    } catch (err) {
      setMessage(err.response?.data || 'Failed to submit loan request.')
    }
  }

  const approve = async (loanId) => {
    setMessage('')
    try {
      await api.patch(
        `/loans/${loanId}/approve?approvedById=${user.memberId}`)
      await fetchLoans()
      setMessage('Loan approved successfully.')
    } catch (err) {
      setMessage(err.response?.data || 'Failed to approve loan.')
    }
  }

  const disburse = async (loanId) => {
    setMessage('')
    try {
      await api.patch(`/loans/${loanId}/disburse`)
      await fetchLoans()
      setMessage('Loan disbursed successfully.')
    } catch (err) {
      setMessage(err.response?.data || 'Failed to disburse loan.')
    }
  }

  const statusStyle = (status) => {
    const map = {
      Pending:  'bg-amber-100 text-amber-700',
      Approved: 'bg-green-100 text-green-700',
      Active:   'bg-blue-100 text-blue-700',
      Repaid:   'bg-gray-100 text-gray-600',
      Defaulted:'bg-red-100 text-red-700',
    }
    return map[status] || 'bg-gray-100 text-gray-600'
  }

  const pendingCount = loans.filter(l => l.status === 'Pending').length

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
          <h2 className="section-title">Loan Queue</h2>
          <p className="text-gray-500 text-sm mt-1">
            {loans.length} total ·{' '}
            {pendingCount > 0 && (
              <span className="text-amber-600 font-medium">
                {pendingCount} pending approval
              </span>
            )}
            {pendingCount === 0 && 'All loans processed'}
          </p>
        </div>
        {activeCycle && (
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="btn-primary"
          >
            {showRequestForm ? 'Cancel' : '+ Request Loan'}
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-xl text-sm border ${
          message.includes('success') || message.includes('approved')
            || message.includes('disbursed')
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Loan Request Form */}
      {showRequestForm && (
        <div className="card mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            New Loan Request
          </h3>
          <form onSubmit={handleRequest}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label">Member</label>
                <select
                  value={requestForm.memberId}
                  onChange={e => setRequestForm({
                    ...requestForm, memberId: e.target.value })}
                  className="input-field" required
                >
                  <option value="">Select member...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Principal (KES)</label>
                <input type="number"
                  placeholder={`Max KES ${
                    activeCycle?.maxLoanAmount?.toLocaleString()}`}
                  value={requestForm.principal}
                  onChange={e => setRequestForm({
                    ...requestForm, principal: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="label">Repayment Weeks</label>
                <input type="number" placeholder="e.g. 4"
                  min="1" max="52"
                  value={requestForm.repaymentWeeks}
                  onChange={e => setRequestForm({
                    ...requestForm, repaymentWeeks: e.target.value })}
                  className="input-field" required />
              </div>
            </div>

            {/* Fee preview */}
            {requestForm.principal && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl
                p-4 mb-4 flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-blue-600 text-xs mb-0.5">Principal</p>
                  <p className="font-bold text-blue-900">
                    KES {parseFloat(requestForm.principal).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600 text-xs mb-0.5">Fee (10%)</p>
                  <p className="font-bold text-amber-700">
                    KES {(parseFloat(requestForm.principal) * 0.1)
                      .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600 text-xs mb-0.5">
                    Total Repayable
                  </p>
                  <p className="font-bold text-green-700">
                    KES {(parseFloat(requestForm.principal) * 1.1)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary">
              Submit Request
            </button>
          </form>
        </div>
      )}

      {/* Loans Table */}
      {loans.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">🏦</p>
          <p className="text-gray-900 font-semibold mb-2">No loans yet</p>
          <p className="text-gray-500 text-sm">
            Loan requests will appear here.
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {['Member', 'Principal', 'Fee', 'Total',
                  'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.map(loan => (
                <tr key={loan.id}
                  className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100
                        text-blue-600 flex items-center justify-center
                        font-semibold text-xs flex-shrink-0">
                        {loan.member?.fullName?.charAt(0) ?? '?'}
                      </div>
                      <span className="font-medium text-gray-900">
                        {loan.member?.fullName ?? `Member #${loan.memberId}`}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell font-semibold text-green-600">
                    KES {loan.principal?.toLocaleString()}
                  </td>
                  <td className="table-cell text-amber-600">
                    KES {loan.flatFee?.toLocaleString()}
                  </td>
                  <td className="table-cell font-bold text-gray-900">
                    KES {loan.totalRepayable?.toLocaleString()}
                  </td>
                  <td className="table-cell text-gray-500 text-xs">
                    {loan.dueDate
                      ? new Date(loan.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${statusStyle(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      {loan.status === 'Pending' && (
                        <button onClick={() => approve(loan.id)}
                          className="text-xs font-semibold px-3 py-1.5
                            bg-green-600 hover:bg-green-700 text-white
                            rounded-lg border-none cursor-pointer
                            transition-colors">
                          Approve
                        </button>
                      )}
                      {loan.status === 'Approved' && (
                        <button onClick={() => disburse(loan.id)}
                          className="text-xs font-semibold px-3 py-1.5
                            bg-blue-600 hover:bg-blue-700 text-white
                            rounded-lg border-none cursor-pointer
                            transition-colors">
                          Disburse
                        </button>
                      )}
                      {loan.status === 'Active' && (
                        <span className="text-xs text-blue-600 font-medium">
                          Active
                        </span>
                      )}
                      {loan.status === 'Repaid' && (
                        <span className="text-xs text-gray-400 font-medium">
                          ✓ Repaid
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}