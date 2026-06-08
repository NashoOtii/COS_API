import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'

const ROLES = ['Member', 'Treasurer', 'Secretary', 'Chairperson']

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '', phoneNumber: '', email: '',
    password: '', role: 'Member',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      if (typeof data === 'string') setError(data)
      else if (data?.errors) {
        setError(Object.values(data.errors).flat().join(' '))
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (success) return (
  <div className="min-h-screen bg-gray-50 flex items-center 
    justify-center px-4 py-8">
    <div className="w-full max-w-2xl">

      {/* Main card */}
      <div className="card text-center mb-6">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          You're on the list!
        </h2>
        <p className="text-gray-600 text-sm mb-2">
          Your account is <strong>pending approval</strong> from the
          executive team.
        </p>
        <p className="text-gray-400 text-xs mb-6">
          Contact your Chairperson, Treasurer, or Secretary
          if you need urgent access.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl 
          p-4 text-sm text-amber-700 mb-6">
          You will receive confirmation once an executive activates
          your account. Then you can log in normally.
        </div>
        <button
          onClick={() => navigate('/login')}
          className="btn-primary w-full py-3"
        >
          Back to Login
        </button>
      </div>

      {/* While you wait section */}
      <p className="text-center text-gray-400 text-xs font-semibold 
        uppercase tracking-wider mb-4">
        While you wait...
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            
            step: 'Step 1',
            title: 'Our Mission',
            text: 'We pool resources to empower members and achieve collective financial growth — one week at a time.',
          },
          {
          
            step: 'Step 2',
            title: 'How It Works',
            text: 'Weekly contributions build a shared pool. Members access loans, earn dividends, and grow together transparently.',
          },
          {
            
            step: 'Step 3',
            title: 'Read the Rules',
            text: 'Our constitution defines your rights, responsibilities, and how the group is governed. Knowledge is power.',
            link: true,
          },
        ].map(item => (
          <div key={item.step}
            className="card text-center hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">{item.icon}</div>
            <p className="text-xs font-semibold text-blue-600 uppercase 
              tracking-wider mb-1">
              {item.step}
            </p>
            <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {item.text}
            </p>
            {item.link && (
              <a
                href="/constitution.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-blue-600 text-sm 
                  font-medium hover:underline"
              >
                Read Constitution ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
)

  // Registration form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center 
      justify-center px-4 py-8">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/Logo.png"
            alt="Circle of Support"
            className="w-24 h-24 rounded-full object-contain mb-4
                       ring-4 ring-primary-200 shadow-lg"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Circle of Support
        </h1>
        <p className="text-gray-500 mt-2 text-sm">Create your account</p>

        <div className="card">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200
              rounded-lg text-red-600 text-sm">
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
                onChange={e => setForm({
                  ...form, phoneNumber: e.target.value })}
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
              
            

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? 'Submitting...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}