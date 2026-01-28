import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import './B2BProfiles.css'

const DEFAULT_API_BASE = 'http://localhost:5000'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

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

  const showToast = (msg, type = 'ok') => {
    setToastType(type)
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setMobile('')
    setPassword('')
    setConfirmPassword('')
    setFormError('')
  }

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/user/b2b-customers`, { cache: 'no-store' })
      const data = await res.json()
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
    <div className="b2b-wrap">
      <div className="b2b-page">
        <header className="b2b-header">
          <div>
            <div className="b2b-badge">Customers</div>
            <h2 className="b2b-title">B2B Profiles</h2>
            <p className="b2b-sub">Add and manage B2B customer accounts</p>
          </div>

          <div className="b2b-actions">
            <div className="b2b-search">
              <span className="search-icn">⌕</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, mobile..." />
            </div>

            <button
              className="b2b-add"
              onClick={() => {
                setShowPopup(true)
                resetForm()
              }}
            >
              + Add Customer
            </button>
          </div>
        </header>

        <section className="b2b-card">
          <div className="b2b-table-wrap">
            <table className="b2b-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="4" className="b2b-empty">
                      Loading customers...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="cell-name">{customer.name}</td>
                      <td className="cell-email">{customer.email}</td>
                      <td className="cell-mobile">{customer.mobile}</td>
                      <td className="cell-actions">
                        <button className="btn-mini ghost">Change Password</button>
                        <button className="btn-mini danger">Delete</button>
                      </td>
                    </tr>
                  ))}

                {!loading && filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="b2b-empty">
                      No customers yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showPopup && (
          <div className="b2b-modal" role="dialog" aria-modal="true">
            <div className="b2b-modal-card" ref={popupRef}>
              <button
                className="b2b-close"
                onClick={() => {
                  setShowPopup(false)
                  resetForm()
                }}
              >
                ×
              </button>

              <div className="b2b-modal-head">
                <h3>Add New B2B Customer</h3>
                <p>Fill the details carefully</p>
              </div>

              {!!formError && <div className="b2b-error">{formError}</div>}

              <div className="b2b-form">
                <div className="field">
                  <label>Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" />
                </div>

                <div className="field">
                  <label>Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" />
                </div>

                <div className="field">
                  <label>Mobile</label>
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                  />
                </div>

                <div className="field">
                  <label>Password</label>
                  <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 chars" type="password" />
                </div>

                <div className="field">
                  <label>Confirm Password</label>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    type="password"
                  />
                </div>

                <button className="b2b-submit" onClick={handleAddCustomer}>
                  Create Customer
                </button>
              </div>
            </div>
          </div>
        )}

        {!!toast && <div className={`b2b-toast ${toastType}`}>{toast}</div>}
      </div>
    </div>
  )
}

export default B2BProfiles
