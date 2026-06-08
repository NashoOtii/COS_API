import { useState, useEffect, useCallback } from 'react'
import api from '../../../api/axios'
import { SkeletonTable } from '../../../components/Skeleton'

export default function MemberList() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState([])

  // 1. Centralized fetch function for both initial load and refetching after actions
  const fetchData = useCallback(async () => {
    try {
      const [allResponse, pendResponse] = await Promise.all([
        api.get('/members'),
        api.get('/members/pending')
      ])
      
      setMembers(allResponse.data.filter(m => m.status === 'Active'))
      setPending(pendResponse.data)
    } catch (error) {
      console.error("Error fetching member data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 2. Initial mount fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 3. Fixed closing braces for approveMember
  const approveMember = async (member) => {
    try {
      await api.patch(`/members/${member.id}/status`, 0, {
        headers: { 'Content-Type': 'application/json' }
      })
      // Reuse our clean refetch function
      await fetchData()
    } catch (error) {
      console.error("Error approving member:", error)
    }
  }

  // 4. toggleStatus is now correctly sitting at the component level
  const toggleStatus = async (member) => {
    try {
      const newStatus = member.status === 'Active' ? 1 : 0
      await api.patch(`/members/${member.id}/status`, newStatus, {
        headers: { 'Content-Type': 'application/json' }
      })
      
      // Optimistically update the local state UI 
      setMembers(members.map(m =>
        m.id === member.id
          ? { ...m, status: member.status === 'Active' ? 'Inactive' : 'Active' }
          : m
      ))
    } catch (error) {
      console.error("Error toggling status:", error)
    }
  }

  const roleColor = (role) => {
    const map = {
      Chairperson: 'bg-purple-100 text-purple-700',
      Treasurer:   'bg-blue-100 text-blue-700',
      Secretary:   'bg-cyan-100 text-cyan-700',
      Member:      'bg-gray-100 text-gray-600',
    }
    return map[role] || 'bg-gray-100 text-gray-600'
  }

  const filtered = members.filter(m =>
    m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    m.phoneNumber?.includes(search)
  )

  const activeCount = members.filter(m => m.status === 'Active').length

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
          <h2 className="section-title">Members</h2>
          <p className="text-gray-500 text-sm mt-1">
            {activeCount} active · {members.length} total
          </p>
        </div>
      </div>

      {/* Pending Approvals */}
{pending.length > 0 && (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"/>
      <h3 className="text-sm font-semibold text-amber-700">
        Pending Approval ({pending.length})
      </h3>
    </div>
    <div className="card p-0 overflow-hidden border-amber-200">
      <table className="w-full">
        <thead>
          <tr className="border-b border-amber-100 bg-amber-50">
            <th className="table-header text-amber-700">Member</th>
            <th className="table-header text-amber-700">Phone</th>
            <th className="table-header text-amber-700">Role Requested</th>
            <th className="table-header text-amber-700">Registered</th>
            <th className="table-header text-amber-700">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-50">
          {pending.map(member => (
            <tr key={member.id} className="hover:bg-amber-50/50">
              <td className="table-cell">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100
                    text-amber-600 flex items-center justify-center
                    font-semibold text-sm">
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
              <td className="table-cell">
                <span className="badge bg-amber-100 text-amber-700">
                  {member.role}
                </span>
              </td>
              <td className="table-cell text-gray-500 text-xs">
                {new Date(member.dateJoined).toLocaleDateString()}
              </td>
              <td className="table-cell">
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMember(member)}
                    className="text-xs font-semibold px-3 py-1.5
                      bg-green-600 hover:bg-green-700 text-white
                      rounded-lg border-none cursor-pointer transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={async () => {
                      await api.patch(`/members/${member.id}/status`, 1, {
                        headers: { 'Content-Type': 'application/json' }
                      })
                      setPending(pending.filter(m => m.id !== member.id))
                    }}
                    className="text-xs font-semibold px-3 py-1.5
                      bg-red-50 hover:bg-red-100 text-red-600
                      rounded-lg border-none cursor-pointer transition-colors"
                  >
                    ✗ Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field max-w-sm"
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="table-header text-left">Member</th>
              <th className="table-header text-left">Phone</th>
              <th className="table-header text-left">Role</th>
              <th className="table-header text-left">Status</th>
              <th className="table-header text-left">Joined</th>
              <th className="table-header text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(member => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {member.fullName ? member.fullName.charAt(0) : '?'}
                    </div>
                    <span className="font-medium text-gray-900">
                      {member.fullName}
                    </span>
                  </div>
                </td>
                <td className="table-cell text-gray-500">
                  {member.phoneNumber}
                </td>
                <td className="table-cell">
                  <span className={`badge ${roleColor(member.role)}`}>
                    {member.role}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`badge ${
                    member.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {member.status === 'Active' ? '● Active' : '● Inactive'}
                  </span>
                </td>
                <td className="table-cell text-gray-500 text-xs">
                  {member.dateJoined ? new Date(member.dateJoined).toLocaleDateString() : 'N/A'}
                </td>
                <td className="table-cell">
                  <button
                    onClick={() => toggleStatus(member)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors ${
                      member.status === 'Active'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {member.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No members match your search.
          </div>
        )}
      </div>
    </div>
  )
}