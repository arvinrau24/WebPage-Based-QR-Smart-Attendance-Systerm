const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
const isProd = import.meta.env.PROD

// Local dev fallback only — production builds must set VITE_API_URL on Vercel.
const API_BASE_URL = rawApiUrl || (isProd ? '' : 'http://127.0.0.1:8000')

if (isProd && !rawApiUrl) {
  console.error(
    '[smart-attendance] VITE_API_URL is not set. In Vercel → Settings → Environment Variables, ' +
      'add VITE_API_URL = your Railway URL (e.g. https://xxx.up.railway.app), then redeploy.',
  )
}

if (isProd && typeof window !== 'undefined' && rawApiUrl === window.location.origin) {
  console.error(
    '[smart-attendance] VITE_API_URL must be your Railway backend URL, not this Vercel site.',
  )
}

export const API_URL = `${API_BASE_URL}/api`

export const mediaUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}${path}`
}

export default API_BASE_URL
