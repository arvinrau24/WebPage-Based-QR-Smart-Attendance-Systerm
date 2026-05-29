import { T } from '../styles/studentTheme'

const steps = [
  {
    title: 'Open the QR code',
    text: 'Your lecturer will display a QR code at the start of class.',
  },
  {
    title: 'Scan with your phone',
    text: 'Use your camera or QR scanner — it opens the check-in page automatically.',
  },
  {
    title: 'Confirm your details',
    text: 'Enter your name and matric number, then submit. Done in under a minute.',
  },
]

export default function StudentDashboard() {
  return (
    <div style={T.page}>
      <div style={T.wrap}>
        <header style={T.header}>
          <div style={T.logo}>◈</div>
          <h1 style={T.brand}>Smart Attendance</h1>
          <p style={T.tagline}>How to mark your attendance</p>
        </header>

        <div style={T.card}>
          <h2 style={T.cardTitle}>Student check-in</h2>
          <p style={T.cardSubtitle}>
            You do not need to sign in. Attendance is marked by scanning the session QR code in class.
          </p>

          <ol style={T.steps}>
            {steps.map((step, i) => (
              <li key={step.title} style={T.step}>
                <span style={T.stepNum}>{i + 1}</span>
                <div>
                  <strong style={{ display: 'block', color: '#1a1917', marginBottom: '2px' }}>
                    {step.title}
                  </strong>
                  {step.text}
                </div>
              </li>
            ))}
          </ol>

          <div style={T.alert('info')}>
            <span>
              If the QR link does not open, ask your lecturer to generate a fresh code — codes expire after a few minutes.
            </span>
          </div>
        </div>

        <p style={T.footer}>
          Lecturers sign in at the{' '}
          <a href="/login" style={{ color: '#1a1917', fontWeight: 600 }}>
            lecturer portal
          </a>
          .
        </p>
      </div>
    </div>
  )
}
