import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getApiError } from '../api/errors'

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(145deg, #f7f5f0 0%, #ebe8e1 50%, #e4e0d8 100%)',
    padding: '24px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  shell: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    maxWidth: '920px',
    width: '100%',
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(26, 25, 23, 0.12)',
  },
  brand: {
    background: 'linear-gradient(160deg, #1a1917 0%, #2d2b28 100%)',
    color: '#f7f5f0',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandMark: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    marginBottom: '24px',
  },
  brandTitle: { fontSize: '28px', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' },
  brandSub: { fontSize: '14px', color: 'rgba(247,245,240,0.72)', lineHeight: 1.6, margin: 0 },
  brandList: { marginTop: '32px', padding: 0, listStyle: 'none' },
  brandItem: {
    fontSize: '13px',
    color: 'rgba(247,245,240,0.85)',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  formSide: { padding: '40px 44px' },
  tabs: {
    display: 'flex',
    gap: '4px',
    background: '#f3f2ef',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '28px',
  },
  tab: (active) => ({
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    background: active ? '#fff' : 'transparent',
    color: active ? '#1a1917' : '#6b6963',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
    transition: 'all 0.15s ease',
  }),
  title: { fontSize: '22px', fontWeight: 700, color: '#1a1917', margin: '0 0 4px' },
  subtitle: { fontSize: '13px', color: '#6b6963', margin: '0 0 24px' },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4a4845',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    marginBottom: '16px',
    borderRadius: '8px',
    border: '1px solid #e8e6e1',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    background: '#faf9f7',
  },
  passwordWrap: {
    position: 'relative',
    marginBottom: '16px',
  },
  passwordInput: {
    width: '100%',
    padding: '11px 44px 11px 14px',
    borderRadius: '8px',
    border: '1px solid #e8e6e1',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    background: '#faf9f7',
  },
  passwordToggle: {
    position: 'absolute',
    right: '4px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '36px',
    height: '36px',
    padding: 0,
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: '#6b6963',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#1a1917',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    background: '#faece7',
    color: '#9c4221',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
    border: '1px solid #fac4b3',
  },
  hint: { fontSize: '12px', color: '#a09d97', marginTop: '16px', textAlign: 'center' },
  scanLink: { color: '#1a1917', fontWeight: 600, textDecoration: 'none' },
}

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function PasswordField({ label, value, onChange, show, onToggleShow, placeholder, autoComplete, minLength }) {
  return (
    <>
      <label style={S.label}>{label}</label>
      <div style={S.passwordWrap}>
        <input
          style={S.passwordInput}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          autoComplete={autoComplete}
          minLength={minLength}
        />
        <button
          type="button"
          style={S.passwordToggle}
          onClick={onToggleShow}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <EyeIcon hidden={show} />
        </button>
      </div>
    </>
  )
}

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signIn, setSignIn] = useState({ username: '', password: '' })
  const [signUp, setSignUp] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  })
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false)
  const navigate = useNavigate()

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login/', signIn)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/lecturer')
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the server. Check that the backend is online and VITE_API_URL is set correctly.')
      } else {
        setError(getApiError(err, 'Invalid username or password'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    if (signUp.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (signUp.password !== signUp.password_confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register/', {
        ...signUp,
        role: 'lecturer',
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/lecturer')
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach the server. Check that the backend is online and VITE_API_URL is set correctly.')
      } else {
        setError(getApiError(err, 'Could not create account'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.shell}>
        <div style={S.brand}>
          <div style={S.brandMark}>◈</div>
          <h1 style={S.brandTitle}>Smart Attendance</h1>
          <p style={S.brandSub}>
            Lecturer portal for UTeM — manage courses, sessions, QR check-in, and
            student attendance alerts.
          </p>
          <ul style={S.brandList}>
            <li style={S.brandItem}>✓ Multiple lecturers, separate accounts</li>
            <li style={S.brandItem}>✓ Upload timetable & student lists</li>
            <li style={S.brandItem}>✓ Review alerts before emailing students</li>
          </ul>
        </div>

        <div style={S.formSide}>
          <div style={S.tabs}>
            <button
              type="button"
              style={S.tab(mode === 'signin')}
              onClick={() => {
                setMode('signin')
                setError('')
                setShowSignUpPassword(false)
                setShowSignUpConfirm(false)
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              style={S.tab(mode === 'signup')}
              onClick={() => {
                setMode('signup')
                setError('')
                setShowSignInPassword(false)
              }}
            >
              Create account
            </button>
          </div>

          {mode === 'signin' ? (
            <>
              <h2 style={S.title}>Welcome back</h2>
              <p style={S.subtitle}>Sign in with your lecturer credentials</p>
              {error && <div style={S.error}>{error}</div>}
              <form onSubmit={handleSignIn}>
                <label style={S.label}>Username</label>
                <input
                  style={S.input}
                  placeholder="e.g. dr.ahmad"
                  value={signIn.username}
                  onChange={(e) => setSignIn({ ...signIn, username: e.target.value })}
                  required
                  autoComplete="username"
                />
                <PasswordField
                  label="Password"
                  placeholder="Your password"
                  value={signIn.password}
                  onChange={(e) => setSignIn({ ...signIn, password: e.target.value })}
                  show={showSignInPassword}
                  onToggleShow={() => setShowSignInPassword((v) => !v)}
                  autoComplete="current-password"
                />
                <button style={S.button} type="submit" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={S.title}>Create lecturer account</h2>
              <p style={S.subtitle}>Each lecturer gets their own dashboard and courses</p>
              {error && <div style={S.error}>{error}</div>}
              <form onSubmit={handleSignUp}>
                <label style={S.label}>Username</label>
                <input
                  style={S.input}
                  placeholder="Choose a unique username"
                  value={signUp.username}
                  onChange={(e) => setSignUp({ ...signUp, username: e.target.value })}
                  required
                  autoComplete="username"
                />
                <label style={S.label}>Email</label>
                <input
                  style={S.input}
                  type="email"
                  placeholder="your.email@utem.edu.my"
                  value={signUp.email}
                  onChange={(e) => setSignUp({ ...signUp, email: e.target.value })}
                  required
                  autoComplete="email"
                />
                <PasswordField
                  label="Password"
                  placeholder="At least 8 characters"
                  value={signUp.password}
                  onChange={(e) => setSignUp({ ...signUp, password: e.target.value })}
                  show={showSignUpPassword}
                  onToggleShow={() => setShowSignUpPassword((v) => !v)}
                  autoComplete="new-password"
                  minLength={8}
                />
                <PasswordField
                  label="Confirm password"
                  placeholder="Repeat password"
                  value={signUp.password_confirm}
                  onChange={(e) => setSignUp({ ...signUp, password_confirm: e.target.value })}
                  show={showSignUpConfirm}
                  onToggleShow={() => setShowSignUpConfirm((v) => !v)}
                  autoComplete="new-password"
                />
                <button style={S.button} type="submit" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            </>
          )}

          <p style={S.hint}>
            Students mark attendance via the{' '}
            <a href="/scan" style={S.scanLink}>QR scan page</a>
          </p>
        </div>
      </div>
    </div>
  )
}
