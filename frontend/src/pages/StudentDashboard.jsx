import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function StudentDashboard() {
  const [token, setToken] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) navigate('/login')
  }, [])

  const markAttendance = async () => {
    setMessage('')
    setError('')
    try {
      const res = await api.post('/mark/', { token })
      setMessage(res.data.message)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
  }

  const logout = () => {
    api.post('/auth/logout/')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>🎓 Student Attendance</h2>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>
      <div style={styles.card}>
        <p>Enter the QR token shown by your lecturer:</p>
        <input
          style={styles.input}
          placeholder="Paste QR token here"
          value={token}
          onChange={e => setToken(e.target.value)}
        />
        <button style={styles.button} onClick={markAttendance}>Mark Attendance</button>
        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { background: '#f9f9f9', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' },
  button: { width: '100%', padding: '10px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' },
  success: { color: 'green', textAlign: 'center' },
  error: { color: 'red', textAlign: 'center' },
  logoutBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }
}