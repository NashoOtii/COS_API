import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import api from '../../api/axios'

const questions = [
  {
    id: 'motivation',
    question: 'Why do you want to join the Circle of Support?',
    hint: 'Tell us what drew you to this group.',
    type: 'textarea',
  },
  {
    id: 'financialGoal',
    question: 'What is your primary financial goal? And how will Circle Of Support help you achieve that.',
    hint: 'e.g. Build savings, access a loan for a project, invest in something specific.',
    type: 'textarea',
  },
  {
    id: 'weeklyCommitment',
    question: 'How confident are you that you can make weekly contributions consistently?',
    hint: 'Be honest — consistency is what makes the group work.',
    type: 'select',
    options: [
      'Very confident — I have a reliable income source',
      'Fairly confident — I can budget for it',
      'Somewhat confident — it may be tight some weeks',
      'Uncertain — I need to plan better first',
    ],
  },
  {
    id: 'valueAlignment',
    question: 'Which of our core values resonates most with you?',
    hint: 'Pick the one that best reflects who you are.',
    type: 'select',
    options: [
      'Accountability — I believe in transparency with money',
      'Growth Mindset — I want to learn and invest wisely',
      'Integrity — I believe rules apply equally to everyone',
      'Mutual Support — I believe in lifting others as I rise',
    ],
  },
  {
    id: 'contribution',
    question: 'Beyond money, what can you contribute to this group?',
    hint: 'Skills, networks, ideas, leadership — what do you bring?',
    type: 'textarea',
  },
]

export default function Questionnaire() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Extract values passed from Register.jsx
  const { memberId } = useParams()
  const memberName = location.state?.memberName || 'there'
  console.log("Questionnaire state:", location.state)
  console.log("MemberId:", memberId)
  console.log("Member Name:", memberName)
  // Guard clause: redirect to register if memberId is missing
  useEffect(() => {
    if (!memberId) {
      navigate('/register', { replace: true })
    }
  }, [memberId, navigate])

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const q = questions[current]
  const isLast = current === questions.length - 1
  const progressPct = Math.round((current / questions.length) * 100)
  const hasAnswer = answers[q.id]?.trim()?.length > 0

  // The API Submission Logic
  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await api.put(`/auth/questionnaire/${memberId}`, answers)
      setDone(true)

    } catch (err) {
      const data = err.response?.data
      if (!data) {
        setError('Network error. Please check your connection and try again.')
      } else if (typeof data === 'string') {
        setError(data)
      } else if (data?.errors) {
        if (Array.isArray(data.errors)) {
          setError(data.errors.map(e => e.description || JSON.stringify(e)).join(' '))
        } else {
          setError(Object.values(data.errors).flat().join(' '))
        }
      } else if (Array.isArray(data)) {
        setError(data.map(e => e.description || JSON.stringify(e)).join(' '))
      } else if (data?.message) {
        setError(data.message)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (!hasAnswer || submitting) return
    if (isLast) {
      handleSubmit() // Trigger the API call instead of just setting "done"
    } else {
      setCurrent(c => c + 1)
      window.scrollTo(0, 0)
    }
  }

  // Completion screen
  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/Logo.png" 
               alt="CoS" 
               className="w-16 h-16 rounded-full object-cover mx-auto ring-4 ring-primary-200 shadow-md mb-4" />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Complete!</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Thank you, <strong className="text-gray-900">{memberName}</strong>. Your responses have been noted. An executive will review your application and activate your account.
          </p>

          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-3">What happens next</p>
            <div className="space-y-2">
              {[
                'Executives review your application',
                'Your account gets activated',
                'You receive confirmation to log in',
                'Start contributing and growing together',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => navigate('/login')} className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-xl transition-colors">
            Go to Login →
          </button>
          <p className="text-xs text-gray-400 mt-4">Contact your Chairperson if you need urgent access.</p>
        </div>
      </div>
    </div>
  )

  // Question screen
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top progress header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src="/Logo.png" alt="CoS" className="w-7 h-7 rounded-full object-cover" />
              <span className="text-sm font-semibold text-gray-700">Member Application</span>
            </div>
            <span className="text-xs font-medium text-gray-400">{current + 1} / {questions.length}</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-10">
        
        {/* Error notification banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm whitespace-pre-line shadow-sm">
            {error}
          </div>
        )}

        {/* Question label */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex-shrink-0">
              {current + 1}
            </span>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Question {current + 1} of {questions.length}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 leading-snug mb-2">{q.question}</h2>
          <p className="text-sm text-gray-400">{q.hint}</p>
        </div>

        {/* Answer area */}
        <div className="mb-6">
          {q.type === 'textarea' ? (
            <textarea
              rows={5}
              placeholder="Share your thoughts..."
              value={answers[q.id] || ''}
              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm resize-none shadow-sm"
              autoFocus
            />
          ) : (
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const selected = answers[q.id] === opt
                return (
                  <label key={i} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={selected}
                      onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                      className="sr-only"
                    />
                    <span className={`text-sm leading-relaxed ${selected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>{opt}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {current > 0 && (
            <button
              onClick={() => { setCurrent(c => c - 1); window.scrollTo(0,0) }}
              className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl cursor-pointer transition-all"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!hasAnswer || submitting}
            className={`flex-1 py-3 text-sm font-semibold rounded-xl border-none transition-all ${hasAnswer && !submitting ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-sm cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            {submitting ? 'Submitting...' : isLast ? 'Submit Application' : 'Next →'}
          </button>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mt-8">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-blue-600 w-6' : i < current ? 'bg-blue-300 w-3' : 'bg-slate-200 w-3'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}