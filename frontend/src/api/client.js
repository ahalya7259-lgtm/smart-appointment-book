const BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getPublicServices: (slug) => request(`/services/public/${slug}`),
  getAvailability: (slug, serviceId, date) =>
    request(`/appointments/availability?slug=${slug}&serviceId=${serviceId}&date=${date}`),
  book: (body) => request('/appointments/book', { method: 'POST', body: JSON.stringify(body) }),
  getAppointments: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/appointments${q ? `?${q}` : ''}`)
  },
  updateStatus: (id, status) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getServices: () => request('/services'),
  createService: (body) => request('/services', { method: 'POST', body: JSON.stringify(body) }),
  getWorkingHours: () => request('/working-hours'),
  updateWorkingHours: (hours) =>
    request('/working-hours', { method: 'PUT', body: JSON.stringify({ hours }) }),
}
