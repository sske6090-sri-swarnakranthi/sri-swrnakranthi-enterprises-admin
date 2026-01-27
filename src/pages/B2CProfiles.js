import React, { useEffect, useMemo, useState } from 'react'
import './B2CProfiles.css'
import { FiSearch, FiUsers } from 'react-icons/fi'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')

const B2CProfiles = () => {
  const [b2cCustomers, setB2cCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)

    fetch(`${API_BASE}/api/user/b2c-customers`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        setB2cCustomers(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!active) return
        setB2cCustomers([])
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return b2cCustomers

    return b2cCustomers.filter((c) => {
      const name = String(c?.name || '').toLowerCase()
      const email = String(c?.email || '').toLowerCase()
      const mobile = String(c?.mobile || '').toLowerCase()
      return name.includes(q) || email.includes(q) || mobile.includes(q)
    })
  }, [b2cCustomers, query])

  return (
    <div className="b2c-wrap">
      <div className="b2c-page">
        <header className="b2c-header">
          <div className="b2c-title-block">
            <div className="b2c-badge">
              <FiUsers />
              Customers
            </div>
            <h2 className="b2c-title">B2C Profiles</h2>
            <p className="b2c-sub">View and manage B2C customer accounts</p>
          </div>

          <div className="b2c-tools">
            <div className="b2c-search">
              <FiSearch />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, mobile..." />
            </div>

            <div className="b2c-count">
              <span>Total</span>
              <strong>{filtered.length}</strong>
            </div>
          </div>
        </header>

        <section className="b2c-card">
          <div className="b2c-table-wrap">
            <table className="b2c-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="3" className="b2c-empty">
                      Loading customers...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filtered.map((customer) => (
                    <tr key={customer.id}>
                      <td className="cell-name">{customer.name}</td>
                      <td className="cell-email">{customer.email}</td>
                      <td className="cell-mobile">{customer.mobile}</td>
                    </tr>
                  ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="3" className="b2c-empty">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default B2CProfiles
