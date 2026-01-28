import React, { useState, useEffect, useMemo } from 'react'
import './UpdateProduct.css'

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

const normalizeAssetUrl = (maybeRelative) => {
  if (!maybeRelative) return ''
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative
  const base = ASSETS_BASE || API_BASE
  const needsSlash = !String(maybeRelative).startsWith('/')
  return `${base}${needsSlash ? '/' : ''}${maybeRelative}`
}

const coerceNumber = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').trim())
  return Number.isFinite(n) ? n : 0
}

const rowFromApi = (p) => {
  const id = p.id ?? p.product_id ?? p._id ?? p.uuid
  const images = p.images
  let firstImage = ''
  try {
    if (typeof images === 'string') {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed) && parsed.length) firstImage = parsed[0]
    } else if (Array.isArray(images) && images.length) {
      firstImage = images[0]
    }
  } catch {}
  const imageRaw = firstImage || p.image_url || p.image || p.imageUrl || p.path || ''
  return {
    id,
    category: p.category || '',
    brand: p.brand || '',
    product_name: p.product_name || '',
    color: p.color || '',
    size: p.size || '',
    b2b_actual_price: coerceNumber(p.b2b_actual_price),
    b2b_discount: coerceNumber(p.b2b_discount),
    b2b_final_price: coerceNumber(p.b2b_final_price),
    b2c_actual_price: coerceNumber(p.b2c_actual_price),
    b2c_discount: coerceNumber(p.b2c_discount),
    b2c_final_price: coerceNumber(p.b2c_final_price),
    count: Number.isFinite(p.count) ? p.count : Math.floor(coerceNumber(p.count)),
    images: p.images || [],
    image_url: normalizeAssetUrl(imageRaw),
    newImageFile: null,
    preview_url: '',
    dirty: false
  }
}

const computeFinal = (price, discount) => {
  const p = coerceNumber(price)
  const d = coerceNumber(discount)
  return Number((p - (p * d) / 100).toFixed(2))
}

const UpdateProduct = () => {
  const [rows, setRows] = useState([])
  const [popupMessage, setPopupMessage] = useState('')
  const [popupType, setPopupType] = useState('')
  const [popupConfirm, setPopupConfirm] = useState(false)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [isLoading, setIsLoading] = useState(false)

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/products`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Fetch failed ${res.status}`)
      const data = await res.json()
      const mapped = Array.isArray(data) ? data.map(rowFromApi) : []
      setRows(mapped)
    } catch {
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const updateField = (index, field, value) => {
    const next = [...rows]
    const numFields = ['b2b_actual_price', 'b2b_discount', 'b2c_actual_price', 'b2c_discount', 'count']

    if (numFields.includes(field)) next[index][field] = value === '' ? '' : coerceNumber(value)
    else next[index][field] = value

    if (field === 'b2b_actual_price' || field === 'b2b_discount') {
      next[index].b2b_final_price = computeFinal(next[index].b2b_actual_price, next[index].b2b_discount)
    }

    if (field === 'b2c_actual_price' || field === 'b2c_discount') {
      next[index].b2c_final_price = computeFinal(next[index].b2c_actual_price, next[index].b2c_discount)
    }

    next[index].dirty = true
    setRows(next)
  }

  const handleImageChange = (index, file) => {
    if (!file) return
    const next = [...rows]
    next[index].newImageFile = file
    next[index].preview_url = URL.createObjectURL(file)
    next[index].dirty = true
    setRows(next)
  }

  const filteredSortedRows = useMemo(() => {
    let list = rows

    if (filter === 'Men') list = list.filter((r) => r.category.toLowerCase() === 'men')
    else if (filter === 'Women') list = list.filter((r) => r.category.toLowerCase() === 'women')
    else if (filter === 'Kids') list = list.filter((r) => r.category.toLowerCase().startsWith('kids'))

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          (r.brand || '').toLowerCase().includes(q) ||
          (r.product_name || '').toLowerCase().includes(q) ||
          (r.color || '').toLowerCase().includes(q) ||
          (r.size || '').toLowerCase().includes(q)
      )
    }

    const sorted = [...list]

    if (sortBy === 'recent') sorted.sort((a, b) => (b.id || 0) - (a.id || 0))
    else if (sortBy === 'price_b2c_asc') sorted.sort((a, b) => coerceNumber(a.b2c_final_price) - coerceNumber(b.b2c_final_price))
    else if (sortBy === 'price_b2c_desc') sorted.sort((a, b) => coerceNumber(b.b2c_final_price) - coerceNumber(a.b2c_final_price))
    else if (sortBy === 'stock_desc') sorted.sort((a, b) => coerceNumber(b.count) - coerceNumber(a.count))
    else if (sortBy === 'brand_asc') sorted.sort((a, b) => String(a.brand || '').localeCompare(String(b.brand || '')))

    return sorted
  }, [rows, filter, search, sortBy])

  const dirtyRows = useMemo(() => rows.filter((r) => r.dirty), [rows])

  const validateDirty = () => {
    if (!dirtyRows.length) return false
    return dirtyRows.every((p) => {
      return (
        p.id &&
        p.category &&
        p.brand &&
        p.product_name &&
        Number.isFinite(coerceNumber(p.b2b_actual_price)) &&
        Number.isFinite(coerceNumber(p.b2b_discount)) &&
        Number.isFinite(coerceNumber(p.b2c_actual_price)) &&
        Number.isFinite(coerceNumber(p.b2c_discount)) &&
        Number.isFinite(coerceNumber(p.count)) &&
        (p.image_url || p.preview_url || p.newImageFile)
      )
    })
  }

  const handleUpdateClick = () => {
    if (!dirtyRows.length) {
      setPopupMessage('No changes to update')
      setPopupType('error')
      setTimeout(() => setPopupMessage(''), 2000)
      return
    }
    if (!validateDirty()) {
      setPopupMessage('Please complete all required fields in edited rows')
      setPopupType('error')
      setTimeout(() => setPopupMessage(''), 2000)
      return
    }
    setPopupConfirm(true)
  }

  const uploadImageIfNeeded = async (r) => {
    if (!r.newImageFile) return r.image_url
    const formData = new FormData()
    formData.append('image', r.newImageFile)
    const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData })
    if (!res.ok) throw new Error(`Upload failed ${res.status}`)
    const data = await res.json()
    const url = normalizeAssetUrl(data.imageUrl || data.url || data.path)
    return url
  }

  const persistRow = async (r) => {
    const image_url = await uploadImageIfNeeded(r)
    const imagesPayload = image_url ? [image_url] : []

    const payload = {
      category: r.category,
      brand: r.brand,
      product_name: r.product_name,
      b2b_actual_price: coerceNumber(r.b2b_actual_price),
      b2b_discount: coerceNumber(r.b2b_discount),
      b2b_final_price: computeFinal(r.b2b_actual_price, r.b2b_discount),
      b2c_actual_price: coerceNumber(r.b2c_actual_price),
      b2c_discount: coerceNumber(r.b2c_discount),
      b2c_final_price: computeFinal(r.b2c_actual_price, r.b2c_discount),
      count: Math.max(0, Math.floor(coerceNumber(r.count))),
      images: imagesPayload
    }

    const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(r.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) throw new Error(`Update failed ${res.status}`)

    const updated = await res.json().catch(() => payload)
    const updatedRow = rowFromApi({ ...updated, id: r.id, images: updated.images || payload.images })
    return { ...updatedRow, newImageFile: null, preview_url: '', dirty: false }
  }

  const confirmUpdate = async (confirmed) => {
    setPopupConfirm(false)
    if (!confirmed) return
    try {
      const updatedMap = new Map()
      for (const r of rows) {
        if (!r.dirty) continue
        const u = await persistRow(r)
        updatedMap.set(r.id, u)
      }
      const next = rows.map((r) => updatedMap.get(r.id) || r)
      setRows(next)
      setPopupMessage('Changes saved')
      setPopupType('success')
      setTimeout(() => setPopupMessage(''), 2000)
    } catch {
      setPopupMessage('Error saving changes')
      setPopupType('error')
      setTimeout(() => setPopupMessage(''), 2000)
    }
  }

  return (
    <div className="up2-screen">
      <div className="up2-hero">
        <div className="up2-hero-left">
          <div className="up2-title">Update Products</div>
          <div className="up2-subtitle">Edit pricing, stock, and images, then save only what changed</div>
        </div>

        <div className="up2-hero-right">
          <button className="up2-btn up2-btn-ghost" onClick={fetchAll} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="up2-btn up2-btn-primary" onClick={handleUpdateClick}>
            Save Changes
          </button>
        </div>
      </div>

      <div className="up2-panel">
        <div className="up2-row">
          <div className="up2-chips">
            {['All', 'Men', 'Women', 'Kids'].map((f) => (
              <button key={f} className={`up2-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>

          <div className="up2-tools">
            <div className="up2-search">
              <span className="up2-sicon" />
              <input
                className="up2-search-input"
                placeholder="Search brand, product, color, size"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select className="up2-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Sort: Recent</option>
              <option value="price_b2c_asc">Price B2C: Low to High</option>
              <option value="price_b2c_desc">Price B2C: High to Low</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="brand_asc">Brand: A → Z</option>
            </select>
          </div>
        </div>

        <div className="up2-meta">
          <div className="pill">
            <span className="k">Total</span>
            <span className="v">{filteredSortedRows.length}</span>
          </div>
          <div className={`pill ${dirtyRows.length ? 'pill-accent' : ''}`}>
            <span className="k">Edited</span>
            <span className="v">{dirtyRows.length}</span>
          </div>
        </div>
      </div>

      <div className="up2-card">
        {isLoading ? (
          <div className="up2-loading">
            <div className="spinner" />
            <div className="txt">Fetching products</div>
          </div>
        ) : (
          <div className="up2-table-wrap">
            <table className="up2-table">
              <thead>
                <tr>
                  <th>Sl</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Product Name</th>
                  <th className="ar">B2B Price</th>
                  <th className="ar">B2B %</th>
                  <th className="ar">B2B Final</th>
                  <th className="ar">B2C Price</th>
                  <th className="ar">B2C %</th>
                  <th className="ar">B2C Final</th>
                  <th className="ar">Stock</th>
                  <th>Image</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredSortedRows.map((product, idx) => {
                  const index = rows.findIndex((r) => r.id === product.id)
                  const b2bFinal = computeFinal(product.b2b_actual_price, product.b2b_discount).toFixed(2)
                  const b2cFinal = computeFinal(product.b2c_actual_price, product.b2c_discount).toFixed(2)
                  const imgSrc = product.preview_url || product.image_url

                  return (
                    <tr key={product.id || idx} className={product.dirty ? 'is-dirty' : ''}>
                      <td className="center">{idx + 1}</td>

                      <td>
                        <input className="cell-input" value={product.category} onChange={(e) => updateField(index, 'category', e.target.value)} />
                      </td>

                      <td>
                        <input className="cell-input" value={product.brand} onChange={(e) => updateField(index, 'brand', e.target.value)} />
                      </td>

                      <td>
                        <input
                          className="cell-input"
                          value={product.product_name}
                          onChange={(e) => updateField(index, 'product_name', e.target.value)}
                        />
                      </td>

                      <td className="ar">
                        <input
                          className="cell-input ar"
                          type="number"
                          value={product.b2b_actual_price}
                          onChange={(e) => updateField(index, 'b2b_actual_price', e.target.value)}
                        />
                      </td>

                      <td className="ar">
                        <input
                          className="cell-input ar"
                          type="number"
                          value={product.b2b_discount}
                          onChange={(e) => updateField(index, 'b2b_discount', e.target.value)}
                        />
                      </td>

                      <td className="ar">
                        <span className="final">{b2bFinal}</span>
                      </td>

                      <td className="ar">
                        <input
                          className="cell-input ar"
                          type="number"
                          value={product.b2c_actual_price}
                          onChange={(e) => updateField(index, 'b2c_actual_price', e.target.value)}
                        />
                      </td>

                      <td className="ar">
                        <input
                          className="cell-input ar"
                          type="number"
                          value={product.b2c_discount}
                          onChange={(e) => updateField(index, 'b2c_discount', e.target.value)}
                        />
                      </td>

                      <td className="ar">
                        <span className="final">{b2cFinal}</span>
                      </td>

                      <td className="ar">
                        <input className="cell-input ar" type="number" value={product.count} onChange={(e) => updateField(index, 'count', e.target.value)} />
                      </td>

                      <td className="center">
                        <div className="img-stack">
                          <div className="imgbox">{imgSrc ? <img className="img" src={imgSrc} alt="product" /> : <div className="imgph" />}</div>
                          <label className="upload">
                            Replace
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageChange(index, e.target.files && e.target.files[0])}
                            />
                          </label>
                        </div>
                      </td>

                      <td className="center">
                        <span className={`status ${product.dirty ? 'dirty' : 'clean'}`}>{product.dirty ? 'Edited' : 'Saved'}</span>
                      </td>
                    </tr>
                  )
                })}

                {!filteredSortedRows.length && (
                  <tr>
                    <td colSpan="13" className="empty">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {popupMessage && <div className={`toast ${popupType}`}>{popupMessage}</div>}

      {popupConfirm && (
        <div className="modal">
          <div className="modal-box">
            <p className="modal-title">Save all edited rows?</p>
            <div className="modal-actions">
              <button className="up2-btn up2-btn-primary" onClick={() => confirmUpdate(true)}>
                Yes
              </button>
              <button className="up2-btn up2-btn-ghost" onClick={() => confirmUpdate(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UpdateProduct
