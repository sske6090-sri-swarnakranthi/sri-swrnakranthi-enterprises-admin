import React, { useEffect, useMemo, useState } from 'react'
import './DeleteProduct.css'

const DEFAULT_API_BASE = 'http://localhost:5000'
const DEFAULT_ASSETS_BASE = 'http://localhost:5000/uploads'

const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE

const ASSETS_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ASSETS_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ASSETS_BASE) ||
  DEFAULT_ASSETS_BASE

const API_BASE = String(API_BASE_RAW || '').replace(/\/+$/, '')
const ASSETS_BASE = String(ASSETS_BASE_RAW || '').replace(/\/+$/, '')

const toArray = (x) => (Array.isArray(x) ? x : [])
const coerceNumber = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v || '').trim())
  return Number.isFinite(n) ? n : 0
}

const normalizeAssetUrl = (maybeRelative) => {
  if (!maybeRelative) return ''
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative
  const base = ASSETS_BASE || API_BASE
  const needsSlash = !String(maybeRelative).startsWith('/')
  return `${base}${needsSlash ? '/' : ''}${maybeRelative}`
}

const computeFinal = (price, discount) => {
  const p = coerceNumber(price)
  const d = coerceNumber(discount)
  return Number((p - (p * d) / 100).toFixed(2))
}

const firstImage = (images) => {
  if (!images) return ''
  if (Array.isArray(images) && images.length) return images[0]
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed) && parsed.length) return parsed[0]
    } catch {}
  }
  return ''
}

const mapRow = (p) => {
  const id = p.id || p.product_id || p._id || p.uuid
  const img = firstImage(p.images)
  return {
    id,
    category: p.category || '',
    brand: p.brand || '',
    product_name: p.product_name || '',
    b2c_actual_price: coerceNumber(p.b2c_actual_price),
    b2c_discount: coerceNumber(p.b2c_discount),
    b2c_final_price: coerceNumber(p.b2c_final_price),
    count: coerceNumber(p.count),
    image_url: normalizeAssetUrl(img || '')
  }
}

const DeleteProduct = () => {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [isLoading, setIsLoading] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  const [popupType, setPopupType] = useState('')
  const [confirmIds, setConfirmIds] = useState([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/products`, { cache: 'no-store' })
      const data = res.ok ? await res.json() : []
      setRows(toArray(data).map(mapRow))
    } catch {
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const filteredSortedRows = useMemo(() => {
    let list = rows

    if (filter === 'Men') list = list.filter((r) => r.category.toLowerCase() === 'men')
    else if (filter === 'Women') list = list.filter((r) => r.category.toLowerCase() === 'women')
    else if (filter === 'Kids') list = list.filter((r) => r.category.toLowerCase().startsWith('kids'))

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((r) => (r.brand || '').toLowerCase().includes(q) || (r.product_name || '').toLowerCase().includes(q))
    }

    const sorted = [...list]

    if (sortBy === 'recent') sorted.sort((a, b) => (b.id || 0) - (a.id || 0))
    else if (sortBy === 'price_b2c_asc') sorted.sort((a, b) => computeFinal(a.b2c_actual_price, a.b2c_discount) - computeFinal(b.b2c_actual_price, b.b2c_discount))
    else if (sortBy === 'price_b2c_desc') sorted.sort((a, b) => computeFinal(b.b2c_actual_price, b.b2c_discount) - computeFinal(a.b2c_actual_price, a.b2c_discount))
    else if (sortBy === 'stock_desc') sorted.sort((a, b) => coerceNumber(b.count) - coerceNumber(a.count))
    else if (sortBy === 'brand_asc') sorted.sort((a, b) => String(a.brand || '').localeCompare(String(b.brand || '')))

    return sorted
  }, [rows, filter, search, sortBy])

  const askDelete = (ids) => {
    if (!ids.length) {
      setPopupMessage('Select at least one product')
      setPopupType('error')
      setTimeout(() => setPopupMessage(''), 1800)
      return
    }
    setConfirmIds(ids)
    setShowConfirm(true)
  }

  const confirmDelete = async (ok) => {
    setShowConfirm(false)
    if (!ok) return
    try {
      for (const id of confirmIds) {
        await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
      }
      const remain = rows.filter((r) => !confirmIds.includes(r.id))
      setRows(remain)
      setSelectedIds(new Set())
      setPopupMessage('Deleted successfully')
      setPopupType('success')
      setTimeout(() => setPopupMessage(''), 1800)
    } catch {
      setPopupMessage('Failed to delete some items')
      setPopupType('error')
      setTimeout(() => setPopupMessage(''), 2000)
    } finally {
      setConfirmIds([])
    }
  }

  const toggleSelect = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredSortedRows.map((r) => r.id)
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
    const next = new Set(selectedIds)
    if (allSelected) visibleIds.forEach((id) => next.delete(id))
    else visibleIds.forEach((id) => next.add(id))
    setSelectedIds(next)
  }

  return (
    <div className="dp-wrap">
      <div className="dp-toolbar">
        <div className="dp-filters">
          {['All', 'Men', 'Women', 'Kids'].map((f) => (
            <button key={f} className={`dp-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        <div className="dp-tools">
          <input className="dp-search" placeholder="Search brand, product" value={search} onChange={(e) => setSearch(e.target.value)} />

          <select className="dp-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Sort: Recent</option>
            <option value="price_b2c_asc">Price B2C: Low to High</option>
            <option value="price_b2c_desc">Price B2C: High to Low</option>
            <option value="stock_desc">Stock: High to Low</option>
            <option value="brand_asc">Brand: A → Z</option>
          </select>

          <button className="dp-btn" onClick={fetchAll} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>

          <button className="dp-danger" onClick={() => askDelete(Array.from(selectedIds))}>
            Delete Selected
          </button>
        </div>
      </div>

      <div className="dp-card">
        <div className="dp-card-head">
          <h2 className="dp-title">Delete Products</h2>
          <div className="dp-meta">
            <span className="dp-pill">Visible: {filteredSortedRows.length}</span>
            <span className="dp-pill">Selected: {selectedIds.size}</span>
          </div>
        </div>

        <div className="dp-table-wrap">
          <table className="dp-table">
            <thead>
              <tr>
                <th className="dp-th">
                  <input
                    className="dp-check"
                    type="checkbox"
                    onChange={toggleSelectAllVisible}
                    checked={filteredSortedRows.length > 0 && filteredSortedRows.every((r) => selectedIds.has(r.id))}
                    aria-label="Select all visible"
                  />
                </th>
                <th className="dp-th">Sl</th>
                <th className="dp-th">Category</th>
                <th className="dp-th">Brand</th>
                <th className="dp-th">Product Name</th>
                <th className="dp-th">B2C Price</th>
                <th className="dp-th">B2C %</th>
                <th className="dp-th">B2C Final</th>
                <th className="dp-th">Stock</th>
                <th className="dp-th">Image</th>
                <th className="dp-th">Delete</th>
              </tr>
            </thead>

            <tbody>
              {filteredSortedRows.map((p, idx) => (
                <tr key={p.id} className={selectedIds.has(p.id) ? 'dp-row-selected' : ''}>
                  <td className="dp-td">
                    <input className="dp-check" type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>
                  <td className="dp-td">{idx + 1}</td>
                  <td className="dp-td">{p.category}</td>
                  <td className="dp-td">{p.brand}</td>
                  <td className="dp-td">{p.product_name}</td>
                  <td className="dp-td">{p.b2c_actual_price}</td>
                  <td className="dp-td">{p.b2c_discount}</td>
                  <td className="dp-td dp-strong">{computeFinal(p.b2c_actual_price, p.b2c_discount).toFixed(2)}</td>
                  <td className="dp-td">{p.count}</td>
                  <td className="dp-td">
                    <div className="dp-imgbox">
                      <img src={p.image_url} alt="product" className="dp-img" />
                    </div>
                  </td>
                  <td className="dp-td">
                    <button className="dp-del" onClick={() => askDelete([p.id])}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {!filteredSortedRows.length && (
                <tr>
                  <td colSpan="11" className="dp-empty">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {popupMessage && <div className={`dp-toast ${popupType}`}>{popupMessage}</div>}

      {showConfirm && (
        <div className="dp-modal">
          <div className="dp-modal-box">
            <p className="dp-modal-title">{confirmIds.length > 1 ? `Delete ${confirmIds.length} products?` : 'Delete this product?'}</p>
            <div className="dp-modal-actions">
              <button className="dp-modal-btn primary" onClick={() => confirmDelete(true)}>
                Yes
              </button>
              <button className="dp-modal-btn" onClick={() => confirmDelete(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeleteProduct
