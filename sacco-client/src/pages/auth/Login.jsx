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
      const userRole = data.role?.toLowerCase().trim() || '';
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
              rounded-lg text-green-700 text-sm">
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
               <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Password</label>
                <button
                  type="button"
                  onClick={() => setError('Please contact the Chairperson, Secretary, or Treasurer to reset your password.')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  type= {showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1
                    text-gray-400 hover:text-gray-600 transition-colors
                    bg-transparent border-none cursor-pointer p-1"
                >
                  {showPassword ? 'Hide' : 'Show'}{showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor"
                      strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 
                           0-8.268-2.943-9.543-7a9.97 9.97 0 011.563
                           -3.029m5.858.908a3 3 0 114.243 4.243M9.878 
                           9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 
                           7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 
                           0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 
                           10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor"
                      strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 
                           8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 
                           7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    )}
                </button>
              </div>
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