const BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:5000').replace(/\/+$/, '')

async function parseBody(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request(url, options = {}) {
  const isForm = options.body instanceof FormData
  const headers = { ...(options.headers || {}) }

  if (!isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers
  })

  const payload = await parseBody(res)

  if (!res.ok) {
    const err = new Error(payload?.message || payload?.error || 'Request failed')
    err.status = res.status
    err.payload = payload
    throw err
  }

  return payload
}

export async function apiGet(url) {
  return request(url, { method: 'GET' })
}

export async function apiPost(url, body) {
  return request(url, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function apiUpload(url, formData) {
  return request(url, {
    method: 'POST',
    body: formData
  })
}
