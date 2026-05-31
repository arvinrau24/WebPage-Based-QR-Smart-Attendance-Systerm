export function getApiError(err, fallback) {
  const data = err?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.error) return String(data.error)
  if (data.detail) return String(data.detail)
  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
    return String(data.non_field_errors[0])
  }
  const firstKey = Object.keys(data)[0]
  if (!firstKey) return fallback
  const value = data[firstKey]
  if (Array.isArray(value) && value[0]) return String(value[0])
  if (typeof value === 'string') return value
  return fallback
}
