const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export const API_URL = `${API_BASE_URL}/api`

export const mediaUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}${path}`
}

export default API_BASE_URL
