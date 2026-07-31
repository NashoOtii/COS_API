import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'

const ROLES = ['Member', 'Treasurer', 'Secretary', 'Chairperson']

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '', phoneNumber: '', email: '', password: '', role: 'Member',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    setError('')
    
    if (!form.fullName.trim() || !form.phoneNumber.trim()) {
      setError('Full Name and Phone Number are required.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      // Step 1: Create the account skeleton
      const response = await api.post('/auth/register', form)
      
      // Step 2: Pass the new MemberId to the questionnaire
      navigate('/questionnaire', {
        state: { 
          memberId: response.data.memberId, 
          memberName: form.fullName 
        }
      })
    } catch (err) {
      const data = err.response?.data
      if (Array.isArray(data)) {
        setError(data.join(' '))
      } else if (typeof data === 'string') {
        setError(data)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/Logo.png"
            alt="Circle of Support"
            className="w-24 h-24 rounded-full object-contain mb-4 ring-4 ring-primary-200 shadow-lg"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Circle of Support
        </h1>
        <p className="text-gray-500 mt-2 text-sm text-center">Create your account</p>

        <div className="card mt-6">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Agalo George"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="input-field"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 0712345678"
                value={form.phoneNumber}
                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                className="input-field"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="label">
                Email{' '}
                <span className="text-gray-400 font-normal">(required)</span>
              </label>
              <input
                type="email"
                placeholder="agalo@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters, include a number"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="label">Role</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="input-field"
                disabled={loading}
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1.5">
                All accounts require executive approval before activation.
              </p>
            </div>

            {/* Locked button during submission state */}
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full py-3 text-base flex items-center justify-center gap-2 transition-all ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Loading please wait...</span>
                </>
              ) : (
                'Continue to Questionnaire →'
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}