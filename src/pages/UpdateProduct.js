import React, { useState, useEffect, useMemo } from 'react'
import './UpdateProduct.css'

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

const API_BASE = API_BASE_RAW.replace(/\/+$/, '')
const ASSETS_BASE = ASSETS_BASE_RAW.replace(/\/+$/, '')

const normalizeAssetUrl = (maybeRelative) => {
  if (!maybeRelative) return ''
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative
  const base = ASSETS_BASE || API_BASE
  const needsSlash = !maybeRelative.startsWith('/')
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
    <div className="up-wrap">
      <div className="up-toolbar">
        <div className="up-filters">
          {['All', 'Men', 'Women', 'Kids'].map((f) => (
            <button key={f} className={`up-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        <div className="up-tools">
          <div className="up-search">
            <input
              className="up-search-input"
              placeholder="Search brand, product, color, size"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="up-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Sort: Recent</option>
            <option value="price_b2c_asc">Price B2C: Low to High</option>
            <option value="price_b2c_desc">Price B2C: High to Low</option>
            <option value="stock_desc">Stock: High to Low</option>
            <option value="brand_asc">Brand: A → Z</option>
          </select>

          <button className="up-btn" onClick={fetchAll} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="up-card">
        <div className="up-card-head">
          <h2 className="up-title">Update Products</h2>
          <div className="up-meta">
            <span className="up-meta-item">Total: {filteredSortedRows.length}</span>
            <span className="up-meta-item">Edited: {dirtyRows.length}</span>
          </div>
        </div>

        <div className="up-table-wrap">
          <table className="up-table">
            <thead>
              <tr>
                <th>Sl</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Product Name</th>
                <th>B2B Price</th>
                <th>B2B %</th>
                <th>B2B Final</th>
                <th>B2C Price</th>
                <th>B2C %</th>
                <th>B2C Final</th>
                <th>Stock</th>
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
                    <td className="up-td up-center">{idx + 1}</td>

                    <td className="up-td">
                      <input className="up-input" value={product.category} onChange={(e) => updateField(index, 'category', e.target.value)} />
                    </td>

                    <td className="up-td">
                      <input className="up-input" value={product.brand} onChange={(e) => updateField(index, 'brand', e.target.value)} />
                    </td>

                    <td className="up-td">
                      <input className="up-input" value={product.product_name} onChange={(e) => updateField(index, 'product_name', e.target.value)} />
                    </td>

                    <td className="up-td">
                      <input className="up-input" type="number" value={product.b2b_actual_price} onChange={(e) => updateField(index, 'b2b_actual_price', e.target.value)} />
                    </td>

                    <td className="up-td">
                      <input className="up-input" type="number" value={product.b2b_discount} onChange={(e) => updateField(index, 'b2b_discount', e.target.value)} />
                    </td>

                    <td className="up-td up-center up-bold">{b2bFinal}</td>

                    <td className="up-td">
                      <input className="up-input" type="number" value={product.b2c_actual_price} onChange={(e) => updateField(index, 'b2c_actual_price', e.target.value)} />
                    </td>

                    <td className="up-td">
                      <input className="up-input" type="number" value={product.b2c_discount} onChange={(e) => updateField(index, 'b2c_discount', e.target.value)} />
                    </td>

                    <td className="up-td up-center up-bold">{b2cFinal}</td>

                    <td className="up-td">
                      <input className="up-input" type="number" value={product.count} onChange={(e) => updateField(index, 'count', e.target.value)} />
                    </td>

                    <td className="up-td up-center">
                      <div className="up-img-box">
                        <img className="up-img" src={imgSrc} alt="product" />
                      </div>

                      <label className="up-upload">
                        Add Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(index, e.target.files && e.target.files[0])}
                        />
                      </label>
                    </td>

                    <td className="up-td up-center">
                      <span className={`up-status ${product.dirty ? 'dirty' : 'clean'}`}>{product.dirty ? 'Edited' : 'Saved'}</span>
                    </td>
                  </tr>
                )
              })}

              {!filteredSortedRows.length && (
                <tr>
                  <td colSpan="13" className="up-empty">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="up-actions">
          <button className="up-save" onClick={handleUpdateClick}>
            Save Changes
          </button>
        </div>
      </div>

      {popupMessage && <div className={`up-toast ${popupType}`}>{popupMessage}</div>}

      {popupConfirm && (
        <div className="up-modal">
          <div className="up-modal-box">
            <p className="up-modal-title">Save all edited rows?</p>
            <div className="up-modal-actions">
              <button className="up-modal-btn primary" onClick={() => confirmUpdate(true)}>
                Yes
              </button>
              <button className="up-modal-btn" onClick={() => confirmUpdate(false)}>
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
