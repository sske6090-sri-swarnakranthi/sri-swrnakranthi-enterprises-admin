const BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000'

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Content-Type': options.body instanceof FormData ? undefined : 'application/json'
    }
  })

  const text = await res.text()
  let payload = null

  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = text
  }

  if (!res.ok) {
    const err = new Error(payload?.message || 'Request failed')
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
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    body: formData
  })

  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    const err = new Error(payload?.message || payload?.error || 'Upload failed')
    err.status = res.status
    err.payload = payload
    throw err
  }

  return payload
}
