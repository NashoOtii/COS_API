import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import DashboardLayout from '../../components/DashboardLayout'
import CycleOverview from './components/CycleOverview'
import MemberList from './components/MemberList'
import ContributionLogger from './components/ContributionLogger'
import LoanQueue from './components/LoanQueue'
import InvestmentTracker from './components/InvestmentTracker'
import HallOfFame from '../HallOfFame'
import Constitution from '../Constitution'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'contributions',  label: 'Contributions' },
  { id: 'loans', label: 'Loans' },
  { id: 'investments', label: 'Investments' },
  { id: 'halloffame', label: 'Hall of Fame' },
  { id: 'constitution',label: 'Constitution' },
]

export default function ExecutiveDashboard() {
  const [activeCycle, setActiveCycle] = useState(null)
  const [summary, setSummary] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => { fetchCycleData() }, [])

  const fetchCycleData = async () => {
    try {
      const { data: cycle } = await api.get('/cycles/active')
      setActiveCycle(cycle)
      const { data: sum } = await api.get(`/cycles/${cycle.id}/summary`)
      setSummary(sum)
    } catch (error) {
      if (error.response?.status === 404) {
        setActiveCycle(null)
        setSummary(null)
      } else { 
        setFetchError( "Failed to fetch cycle data. Please refresh." )
        setActiveCycle(null)
      } 
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      activeCycle={activeCycle}
    >
      {/*Show fetch error banner if something went wrong */}
      {fetchError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200
          rounded-xl text-red-700 text-sm flex items-center
          justify-between">
          <span>{fetchError}</span>
          <button
            onClick={fetchCycleData}
            className="text-red-700 font-semibold underline
              bg-transparent border-none cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
      {activeTab === 'overview' && (
        <CycleOverview
          activeCycle={activeCycle}
          summary={summary}
          onCycleCreated={fetchCycleData}
        />
      )}
      {activeTab === 'members' && <MemberList />}
      {activeTab === 'contributions' && (
        <ContributionLogger
          activeCycle={activeCycle}
          onContributionLogged={fetchCycleData}
        />
      )}
      {activeTab === 'loans' && 
      <LoanQueue activeCycle={activeCycle}
       onLoanAction={fetchCycleData}
      />}

      {activeTab === 'investments' && (
        <InvestmentTracker activeCycle={activeCycle} />
      )}
      {activeTab === 'halloffame' && <HallOfFame />}
      {activeTab === 'constitution' && <Constitution />}
    </DashboardLayout>
  )
}