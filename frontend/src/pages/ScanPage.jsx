import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'

export default function ScanPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [form, setForm] = useState({ full_name: '', matric_number: '' })
  const [location, setLocation] = useState({ latitude: null, longitude: null })
  const [gpsStatus, setGpsStatus] = useState('Getting your location...')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get GPS location automatically
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          })
          setGpsStatus('📍 Location captured')
        },
        (err) => {
          setGpsStatus('⚠️ Location unavailable — attendance will be marked without GPS')
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setGpsStatus('⚠️ GPS not supported on this device')
    }
  }, [])

  const handleSubmit = async () => {
    if (!form.full_name || !form.matric_number) {
      setError('Please fill in both fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/mark/', {
        token,
        full_name: form.full_name,
        matric_number: form.matric_number,
        latitude: location.latitude,
        longitude: location.longitude
      })
      setMessage(res.data.message)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

  if (!token) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.errorTitle}>❌ Invalid QR Code</h2>
        <p>Please scan a valid QR code from your lecturer.</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.successTitle}>✅ Done!</h2>
        <p style={styles.successMsg}>{message}</p>
        <p style={{ color: '#888', fontSize: '13px' }}>You may close this page.</p>
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>📋 Mark Attendance</h2>
        <p style={styles.subtitle}>Fill in your details to mark attendance</p>

        <div style={styles.gpsBar}>
          <span style={{ fontSize: '13px' }}>{gpsStatus}</span>
        </div>

        <input
          style={styles.input}
          placeholder="Full Name (as per matric card)"
          value={form.full_name}
          onChange={e => setForm({ ...form, full_name: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Matric Number (e.g. B122320018)"
          value={form.matric_number}
          onChange={e => setForm({ ...form, matric_number: e.target.value.toUpperCase() })}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Mark My Attendance'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', padding: '1rem' },
  card: { background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { textAlign: 'center', margin: '0 0 4px', color: '#1a1a2e' },
  subtitle: { textAlign: 'center', color: '#888', fontSize: '14px', marginBottom: '1.5rem' },
  gpsBar: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', marginBottom: '1rem' },
  input: { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' },
  error: { color: 'red', fontSize: '13px', marginBottom: '8px' },
  errorTitle: { color: '#ef4444', textAlign: 'center' },
  successTitle: { color: '#22c55e', textAlign: 'center' },
  successMsg: { textAlign: 'center', fontSize: '16px' }
}