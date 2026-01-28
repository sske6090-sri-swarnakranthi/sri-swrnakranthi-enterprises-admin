import React, { useEffect, useMemo, useState } from 'react'
import './DeleteProduct.css'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const DEFAULT_ASSETS_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app/uploads'

const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE

const ASSETS_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ASSETS_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ASSETS_BASE) ||
  DEFAULT_ASSETS_BASE

const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')
const ASSETS_BASE = String(ASSETS_BASE_RAW || DEFAULT_ASSETS_BASE).replace(/\/+$/, '')

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
    else if (sortBy === 'price_b2c_asc')
      sorted.sort((a, b) => computeFinal(a.b2c_actual_price, a.b2c_discount) - computeFinal(b.b2c_actual_price, b.b2c_discount))
    else if (sortBy === 'price_b2c_desc')
      sorted.sort((a, b) => computeFinal(b.b2c_actual_price, b.b2c_discount) - computeFinal(a.b2c_actual_price, a.b2c_discount))
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

  const selectedCount = selectedIds.size
  const allVisibleSelected = filteredSortedRows.length > 0 && filteredSortedRows.every((r) => selectedIds.has(r.id))

  return (
    <div className="dp2-screen">
      <div className="dp2-hero">
        <div className="dp2-hero-left">
          <div className="dp2-title">Delete Products</div>
          <div className="dp2-subtitle">Select items safely, then delete in one click</div>
        </div>

        <div className="dp2-hero-right">
          <button className="dp2-btn dp2-btn-ghost" onClick={fetchAll} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="dp2-btn dp2-btn-primary" onClick={() => askDelete(Array.from(selectedIds))} disabled={!selectedCount}>
            Delete Selected ({selectedCount})
          </button>
        </div>
      </div>

      <div className="dp2-panel">
        <div className="dp2-row">
          <div className="dp2-chips">
            {['All', 'Men', 'Women', 'Kids'].map((f) => (
              <button key={f} className={`dp2-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>

          <div className="dp2-tools">
            <div className="dp2-search">
              <span className="dp2-sicon" />
              <input className="dp2-search-input" placeholder="Search brand or product" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <select className="dp2-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Sort: Recent</option>
              <option value="price_b2c_asc">Price B2C: Low to High</option>
              <option value="price_b2c_desc">Price B2C: High to Low</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="brand_asc">Brand: A → Z</option>
            </select>
          </div>
        </div>

        <div className="dp2-meta">
          <div className="pill">
            <span className="k">Visible</span>
            <span className="v">{filteredSortedRows.length}</span>
          </div>
          <div className={`pill ${selectedCount ? 'pill-accent' : ''}`}>
            <span className="k">Selected</span>
            <span className="v">{selectedCount}</span>
          </div>
        </div>
      </div>

      <div className="dp2-card">
        {isLoading ? (
          <div className="dp2-loading">
            <div className="spinner" />
            <div className="txt">Fetching products</div>
          </div>
        ) : filteredSortedRows.length === 0 ? (
          <div className="dp2-empty">
            <div className="ico" />
            <h3>No products found</h3>
            <p>Try clearing search or switching category filters.</p>
          </div>
        ) : (
          <div className="dp2-table-wrap">
            <table className="dp2-table">
              <thead>
                <tr>
                  <th className="center w-check">
                    <input
                      className="dp2-check"
                      type="checkbox"
                      onChange={toggleSelectAllVisible}
                      checked={allVisibleSelected}
                      aria-label="Select all visible"
                    />
                  </th>
                  <th className="w-sl">Sl</th>
                  <th>Product</th>
                  <th className="w-cat">Category</th>
                  <th className="w-brand">Brand</th>
                  <th className="ar w-price">B2C Final</th>
                  <th className="ar w-stock">Stock</th>
                  <th className="center w-action">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSortedRows.map((p, idx) => {
                  const isSel = selectedIds.has(p.id)
                  const final = computeFinal(p.b2c_actual_price, p.b2c_discount).toFixed(2)

                  return (
                    <tr key={p.id} className={isSel ? 'is-selected' : ''}>
                      <td className="center">
                        <input className="dp2-check" type="checkbox" checked={isSel} onChange={() => toggleSelect(p.id)} aria-label={`Select ${p.product_name}`} />
                      </td>

                      <td className="muted">{idx + 1}</td>

                      <td>
                        <div className="prodcell">
                          <div className="thumb">{p.image_url ? <img src={p.image_url} alt={p.product_name} /> : <div className="ph" />}</div>
                          <div className="meta">
                            <div className="pname">{p.product_name || 'Product'}</div>
                            <div className="psub muted">{p.brand || 'Brand'} · {p.category || 'Category'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="muted">{p.category || '-'}</td>
                      <td className="muted">{p.brand || '-'}</td>

                      <td className="ar">
                        <span className="price">{final}</span>
                      </td>

                      <td className="ar">
                        <span className={`stock ${coerceNumber(p.count) <= 0 ? 'low' : ''}`}>{coerceNumber(p.count)}</span>
                      </td>

                      <td className="center">
                        <button className="dp2-btn dp2-btn-mini" onClick={() => askDelete([p.id])}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {popupMessage && <div className={`toast ${popupType}`}>{popupMessage}</div>}

      {showConfirm && (
        <div className="modal">
          <div className="modal-box">
            <p className="modal-title">{confirmIds.length > 1 ? `Delete ${confirmIds.length} products?` : 'Delete this product?'}</p>
            <p className="modal-sub">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="dp2-btn dp2-btn-primary" onClick={() => confirmDelete(true)}>
                Yes, delete
              </button>
              <button className="dp2-btn dp2-btn-ghost" onClick={() => confirmDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeleteProduct
