import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './B2BProfiles.css'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')

const isValidEmail = (v) => /^\S+@\S+\.\S+$/.test(v)
const isValidMobile = (v) => /^[6-9]\d{9}$/.test(v)

const B2BProfiles = () => {
  const [b2bCustomers, setB2bCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  const [showPopup, setShowPopup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('ok')
  const [formError, setFormError] = useState('')

  const [query, setQuery] = useState('')
  const popupRef = useRef(null)

  const showToast = useCallback((msg, type = 'ok') => {
    setToastType(type)
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }, [])

  const resetForm = useCallback(() => {
    setName('')
    setEmail('')
    setMobile('')
    setPassword('')
    setConfirmPassword('')
    setFormError('')
  }, [])

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/user/b2b-customers`, { cache: 'no-store' })
      const data = await res.json().catch(() => [])
      setB2bCustomers(Array.isArray(data) ? data : [])
    } catch {
      setB2bCustomers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return b2bCustomers
    return b2bCustomers.filter((c) => {
      const n = String(c?.name || '').toLowerCase()
      const e = String(c?.email || '').toLowerCase()
      const m = String(c?.mobile || '').toLowerCase()
      return n.includes(q) || e.includes(q) || m.includes(q)
    })
  }, [b2bCustomers, query])

  const validateForm = () => {
    if (!name.trim()) return 'Please enter full name'
    if (!email.trim()) return 'Please enter email'
    if (!isValidEmail(email.trim())) return 'Please enter a valid email address'
    if (!mobile.trim()) return 'Please enter mobile number'
    if (!isValidMobile(mobile.trim())) return 'Mobile number must be 10 digits and start with 6-9'
    if (!password) return 'Please enter password'
    if (password.length < 6) return 'Password must be at least 6 characters'
    if (password !== confirmPassword) return 'Passwords do not match'
    return ''
  }

  const handleAddCustomer = async () => {
    const err = validateForm()
    if (err) {
      setFormError(err)
      return
    }

    setFormError('')
    try {
      const res = await fetch(`${API_BASE}/api/user/b2b-customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), mobile: mobile.trim(), password })
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        showToast('Customer added successfully', 'ok')
        setShowPopup(false)
        resetForm()
        await loadCustomers()
      } else {
        const msg = data?.message || 'Error adding customer'
        setFormError(msg)
        showToast(msg, 'err')
      }
    } catch {
      setFormError('Server error, please try again')
      showToast('Server error', 'err')
    }
  }

  const handleClickOutside = useCallback(
    (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false)
        resetForm()
      }
    },
    [resetForm]
  )

  useEffect(() => {
    if (showPopup) document.addEventListener('mousedown', handleClickOutside)
    else document.removeEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPopup, handleClickOutside])

  return (
    <div className="b2b2-screen">
      <div className="b2b2-head">
        <div>
          <div className="b2b2-pill">B2B</div>
          <h2 className="b2b2-title">Customer Profiles</h2>
          <p className="b2b2-sub">Search, add, and manage B2B accounts</p>
        </div>

        <div className="b2b2-actions">
          <div className="b2b2-search">
            <span className="b2b2-icn">⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, mobile" />
          </div>

          <button
            className="b2b2-primary"
            onClick={() => {
              setShowPopup(true)
              resetForm()
            }}
          >
            Add Customer
          </button>
        </div>
      </div>

      <section className="b2b2-card">
        <div className="b2b2-card-top">
          <div className="b2b2-stat">
            <div className="k">Total</div>
            <div className="v">{loading ? '...' : b2bCustomers.length}</div>
          </div>
          <div className="b2b2-stat">
            <div className="k">Visible</div>
            <div className="v">{loading ? '...' : filteredCustomers.length}</div>
          </div>
          <button className="b2b2-ghost" onClick={loadCustomers} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="b2b2-table-wrap">
          <table className="b2b2-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th className="ar">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="4" className="b2b2-empty">
                    Loading customers...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredCustomers.map((customer) => (
                  <tr key={customer.id || customer.email}>
                    <td className="b2b2-strong">{customer.name}</td>
                    <td className="b2b2-soft">{customer.email}</td>
                    <td className="b2b2-soft">{customer.mobile}</td>
                    <td className="ar">
                      <div className="b2b2-row-actions">
                        <button className="b2b2-mini b2b2-mini-ghost" type="button">
                          Change Password
                        </button>
                        <button className="b2b2-mini b2b2-mini-outline" type="button">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="4" className="b2b2-empty">
                    No customers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showPopup && (
        <div className="b2b2-modal" role="dialog" aria-modal="true">
          <div className="b2b2-modal-card" ref={popupRef}>
            <div className="b2b2-modal-head">
              <div>
                <div className="b2b2-pill sm">New</div>
                <h3 className="b2b2-modal-title">Add B2B Customer</h3>
                <p className="b2b2-modal-sub">Create an account with email and mobile</p>
              </div>

              <button
                className="b2b2-close"
                onClick={() => {
                  setShowPopup(false)
                  resetForm()
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {!!formError && <div className="b2b2-error">{formError}</div>}

            <div className="b2b2-form">
              <div className="b2b2-field">
                <label>Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </div>

              <div className="b2b2-field">
                <label>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
              </div>

              <div className="b2b2-grid">
                <div className="b2b2-field">
                  <label>Mobile</label>
                  <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" />
                </div>

                <div className="b2b2-field">
                  <label>Password</label>
                  <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 chars" type="password" />
                </div>

                <div className="b2b2-field">
                  <label>Confirm</label>
                  <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" type="password" />
                </div>
              </div>

              <button className="b2b2-primary full" onClick={handleAddCustomer}>
                Create Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {!!toast && <div className={`b2b2-toast ${toastType}`}>{toast}</div>}
    </div>
  )
}

export default B2BProfiles
