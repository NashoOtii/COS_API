import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios' // Make sure you import your axios instance

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
                required
              />
            </div>

            <div>
              <label className="label">Role</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="input-field"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1.5">
                All accounts require executive approval before activation.
              </p>
            </div>

            {/* Adjusted naming to denote multi-step progression */}
            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
            >
              Continue to Questionnaire →
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