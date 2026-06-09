import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = location.state?.message

  const [form, setForm] = useState({ phoneNumber: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login({
        memberId: data.memberId,
        fullName: data.fullName,
        role: data.role,
      }, data.token)
      const executiveRoles = ['Chairperson', 'Treasurer', 'Secretary']
      const isExecutive = executiveRoles.includes(data.role)
      navigate(isExecutive ? '/executive' : '/member')
    } catch (err) {
      setError('Invalid phone number or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Title */}
        <div className="flex flex-col items-center text-center mb-6">
  <img
    src="/Logo.png"
    alt="Circle of Support"
    className="w-24 h-24 rounded-full object-contain mb-4
               ring-4 ring-primary-200 shadow-lg"
  />
  <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight">
    Circle of Support
  </h1>
  <p className="text-slate-400 mt-2 text-base">
    Sign in to your account
  </p>
</div>
  

        {/* Card */}
        <div className="card">
          {successMessage && (
            <div className="mb-5 p-3 bg-green-500/10 border border-green-500/30 
              rounded-lg text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 
              rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="label">Password</label>
              <input
                type= {showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            No account?{' '}
            <Link to="/register"
              className="text-blue-400 hover:text-blue-300 transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}