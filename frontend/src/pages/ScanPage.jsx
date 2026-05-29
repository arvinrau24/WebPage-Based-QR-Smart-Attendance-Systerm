import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { T } from '../styles/studentTheme'

function PageShell({ children }) {
  return (
    <div style={T.page}>
      <div style={T.wrap}>
        <header style={T.header}>
          <div style={T.logo}>◈</div>
          <h1 style={T.brand}>Smart Attendance</h1>
          <p style={T.tagline}>UTeM student check-in</p>
        </header>
        {children}
        <p style={T.footer}>Your location is used only to verify you are on campus.</p>
      </div>
    </div>
  )
}

export default function ScanPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [form, setForm] = useState({ full_name: '', matric_number: '' })
  const [location, setLocation] = useState({ latitude: null, longitude: null })
  const [gpsState, setGpsState] = useState('loading') // loading | ok | warn | unsupported
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsState('unsupported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setGpsState('ok')
      },
      () => setGpsState('warn'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const inputStyle = (name) => ({
    ...T.input,
    ...(focusedField === name ? T.inputFocus : {}),
  })

  const gpsBanner = () => {
    if (gpsState === 'loading') {
      return (
        <div style={T.alert('info')}>
          <span>Locating you… allow location access when prompted.</span>
        </div>
      )
    }
    if (gpsState === 'ok') {
      return (
        <div style={T.alert('success')}>
          <span>Location captured — on-campus check-in enabled.</span>
        </div>
      )
    }
    if (gpsState === 'unsupported') {
      return (
        <div style={T.alert('warn')}>
          <span>GPS is not available on this device. You can still submit attendance.</span>
        </div>
      )
    }
    return (
      <div style={T.alert('warn')}>
        <span>Location unavailable. Enable GPS or continue without it.</span>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!form.full_name.trim() || !form.matric_number.trim()) {
      setError('Please enter your full name and matric number.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/mark/', {
        token,
        full_name: form.full_name.trim(),
        matric_number: form.matric_number.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
      })
      setMessage(res.data.message)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <PageShell>
        <div style={{ ...T.card, textAlign: 'center' }}>
          <div style={T.errorIcon}>!</div>
          <h2 style={T.cardTitle}>Invalid link</h2>
          <p style={T.cardSubtitle}>
            Scan the QR code displayed by your lecturer in class. Do not bookmark or share an old link.
          </p>
        </div>
      </PageShell>
    )
  }

  if (submitted) {
    return (
      <PageShell>
        <div style={{ ...T.card, textAlign: 'center' }}>
          <div style={T.successIcon}>✓</div>
          <h2 style={T.cardTitle}>Attendance recorded</h2>
          <p style={{ ...T.cardSubtitle, marginBottom: '8px' }}>{message}</p>
          <p style={{ fontSize: '13px', color: '#a09d97', margin: 0 }}>You can close this page.</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div style={T.card}>
        <h2 style={T.cardTitle}>Mark attendance</h2>
        <p style={T.cardSubtitle}>
          Enter your details exactly as they appear on your student card.
        </p>

        {gpsBanner()}

        <form onSubmit={handleSubmit}>
          <label style={T.label} htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            style={inputStyle('full_name')}
            placeholder="e.g. Ahmad bin Ali"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            onFocus={() => setFocusedField('full_name')}
            onBlur={() => setFocusedField(null)}
            autoComplete="name"
            disabled={loading}
          />

          <label style={T.label} htmlFor="matric_number">
            Matric number
          </label>
          <input
            id="matric_number"
            style={inputStyle('matric_number')}
            placeholder="e.g. B122320018"
            value={form.matric_number}
            onChange={(e) =>
              setForm({ ...form, matric_number: e.target.value.toUpperCase() })
            }
            onFocus={() => setFocusedField('matric_number')}
            onBlur={() => setFocusedField(null)}
            autoComplete="off"
            disabled={loading}
          />

          {error && <div style={T.alert('error')}>{error}</div>}

          <button type="submit" style={T.button(loading)} disabled={loading}>
            {loading ? 'Submitting…' : 'Submit attendance'}
          </button>
        </form>
      </div>
    </PageShell>
  )
}
