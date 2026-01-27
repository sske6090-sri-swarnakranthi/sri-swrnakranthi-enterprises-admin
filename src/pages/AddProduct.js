import React, { useEffect, useMemo, useRef, useState } from 'react'
import './AddProduct.css'
import { useLoading } from './LoadingContext'

const API_BASE = (process.env.REACT_APP_API_BASE || 'https://sri-swarnakranthi-enterprises-backe.vercel.app').replace(
  /\/+$/,
  ''
)

const CATEGORIES = [
  'T-SHIRTS & CAPS',
  'KEY CHAINS',
  'PENS & PEN STAND',
  'MOBILE STAND',
  'TRAVEL BAGS',
  'WALL CLOCKS',
  'TABLE CLOCKS',
  'LADIES PURSE',
  'GENTS PURSE',
  'LADIES BAGS',
  'SHOPPING BAGS',
  'ATM POUCHS',
  'CHEQUE BOOK FOLDER',
  'CALENDARS',
  'DIARYS & NOTEBOOKS',
  'GROCERY COVERS',
  'SHOPPING COVERS',
  'JEWELLERY BOXS & PURSES',
  'MUG PRINTING',
  'SUBLIMATION PRINTING',
  'VISITING CARDS',
  'PAMPHLETS',
  'WEDDING CARDS',
  'ID CARDS',
  'SCHOOL DIARYS',
  'PROGRESS REPORTS',
  'TIES & BELTS',
  'MEMONTOS & MEDALS'
]

const safeNum = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : null
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

const slugify = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const calcFinal = (price, disc) => {
  const p = safeNum(price)
  const dRaw = safeNum(disc)
  if (p === null || dRaw === null) return ''
  const d = clamp(dRaw, 0, 100)
  const final = p - (p * d) / 100
  return final < 0 ? '0.00' : final.toFixed(2)
}

const parseJsonSafe = async (res) => {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return { message: text }
  }
}

const apiGet = async (path) => {
  const res = await fetch(`${API_BASE}${path}`)
  const data = await parseJsonSafe(res)
  if (!res.ok) throw Object.assign(new Error(data?.message || 'Request failed'), { payload: data })
  return data
}

const apiPost = async (path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await parseJsonSafe(res)
  if (!res.ok) throw Object.assign(new Error(data?.message || 'Request failed'), { payload: data })
  return data
}

const apiUpload = async (path, formData) => {
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: formData })
  const data = await parseJsonSafe(res)
  if (!res.ok) throw Object.assign(new Error(data?.message || 'Upload failed'), { payload: data })
  return data
}

export default function AddProduct() {
  const { show, hide } = useLoading()

  const [loadingOptions, setLoadingOptions] = useState(false)
  const [brandList, setBrandList] = useState([])
  const [productList, setProductList] = useState([])

  const [category, setCategory] = useState('')
  const [brandInput, setBrandInput] = useState('')
  const [brandFiltered, setBrandFiltered] = useState([])
  const [brandDropdown, setBrandDropdown] = useState(false)
  const [brandPopup, setBrandPopup] = useState(false)
  const [newBrand, setNewBrand] = useState('')

  const [productInput, setProductInput] = useState('')
  const [productFiltered, setProductFiltered] = useState([])
  const [productDropdown, setProductDropdown] = useState(false)
  const [productPopup, setProductPopup] = useState(false)
  const [newProduct, setNewProduct] = useState('')

  const [modelName, setModelName] = useState('')
  const [description, setDescription] = useState('')

  const [b2cPrice, setB2cPrice] = useState('')
  const [b2cDiscount, setB2cDiscount] = useState('')
  const [b2cFinal, setB2cFinal] = useState('')

  const [totalCount, setTotalCount] = useState('')
  const [images, setImages] = useState([])
  const [published, setPublished] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  const [popupType, setPopupType] = useState('')

  const brandBoxRef = useRef(null)
  const productBoxRef = useRef(null)

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true)
      try {
        const data = await apiGet('/api/products?limit=10000')
        const list = Array.isArray(data) ? data : []
        const brandSet = new Set()
        const productSet = new Set()
        list.forEach((item) => {
          if (item?.brand) brandSet.add(String(item.brand))
          if (item?.name) productSet.add(String(item.name))
        })
        setBrandList(Array.from(brandSet).sort())
        setProductList(Array.from(productSet).sort())
      } catch {
        setBrandList([])
        setProductList([])
      } finally {
        setLoadingOptions(false)
      }
    }
    loadOptions()
  }, [])

  useEffect(() => {
    setB2cFinal(calcFinal(b2cPrice, b2cDiscount))
  }, [b2cPrice, b2cDiscount])

  useEffect(() => {
    const onDoc = (e) => {
      const b = brandBoxRef.current
      const p = productBoxRef.current
      if (b && !b.contains(e.target)) setBrandDropdown(false)
      if (p && !p.contains(e.target)) setProductDropdown(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const showToast = (msg, type = 'success') => {
    setPopupMessage(msg)
    setPopupType(type)
    setTimeout(() => {
      setPopupMessage('')
      setPopupType('')
    }, 2400)
  }

  const resetForm = () => {
    setCategory('')
    setBrandInput('')
    setProductInput('')
    setModelName('')
    setDescription('')
    setB2cPrice('')
    setB2cDiscount('')
    setB2cFinal('')
    setTotalCount('')
    setImages([])
    setPublished(true)
    setBrandDropdown(false)
    setProductDropdown(false)
  }

  const handleBrandSearch = (e) => {
    const value = e.target.value
    setBrandInput(value)
    if (!value) {
      setBrandDropdown(false)
      setBrandFiltered([])
      return
    }
    const filtered = brandList.filter((b) => b.toLowerCase().includes(value.toLowerCase()))
    setBrandFiltered(filtered)
    setBrandDropdown(true)
  }

  const handleProductSearch = (e) => {
    const value = e.target.value
    setProductInput(value)
    if (!value) {
      setProductDropdown(false)
      setProductFiltered([])
      return
    }
    const filtered = productList.filter((p) => p.toLowerCase().includes(value.toLowerCase()))
    setProductFiltered(filtered)
    setProductDropdown(true)
  }

  const handleAddNewBrand = () => {
    const value = newBrand.trim()
    if (!value) return
    if (!brandList.includes(value)) setBrandList((prev) => [...prev, value].sort())
    setBrandInput(value)
    setNewBrand('')
    setBrandPopup(false)
    setBrandDropdown(false)
  }

  const handleAddNewProduct = () => {
    const value = newProduct.trim()
    if (!value) return
    if (!productList.includes(value)) setProductList((prev) => [...prev, value].sort())
    setProductInput(value)
    setNewProduct('')
    setProductPopup(false)
    setProductDropdown(false)
  }

  const handleMultiImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    try {
      show()
      const uploaded = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('image', file)
        const res = await apiUpload('/api/upload', formData)
        let url = res?.imageUrl || res?.url || res?.path || ''
        url = typeof url === 'string' ? url.trim() : ''
        if (url) uploaded.push(url)
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, 6))
    } catch {
      showToast('Image upload failed', 'error')
    } finally {
      hide()
      e.target.value = ''
    }
  }

  const removeImage = (url) => setImages((prev) => prev.filter((i) => i !== url))

  const payload = useMemo(() => {
    const priceNum = safeNum(b2cPrice)
    const discountedNum = safeNum(b2cFinal)
    const stock = String(totalCount || '').trim()
    const descLines = []
    if (description.trim()) descLines.push(description.trim())
    if (stock) descLines.push(`Stock: ${stock}`)
    const finalDesc = descLines.length ? descLines.join('\n') : null

    return {
      name: productInput.trim(),
      model_name: modelName.trim() ? modelName.trim() : null,
      brand: brandInput.trim() ? brandInput.trim() : null,
      category_slug: slugify(category) || null,
      price: priceNum,
      discounted_price: discountedNum,
      description: finalDesc,
      images,
      published: !!published
    }
  }, [productInput, modelName, brandInput, category, b2cPrice, b2cFinal, description, totalCount, images, published])

  const validate = () => {
    const name = productInput.trim()
    const cat = slugify(category)
    const priceNum = safeNum(b2cPrice)
    const discountNum = safeNum(b2cDiscount)
    const finalNum = safeNum(b2cFinal)

    if (!name) return 'Please enter product name'
    if (!cat) return 'Please select category'
    if (!brandInput.trim()) return 'Please enter brand'
    if (priceNum === null || priceNum <= 0) return 'Enter valid price'
    if (discountNum === null || discountNum < 0 || discountNum > 100) return 'Enter valid discount'
    if (finalNum === null || finalNum <= 0) return 'Final price is missing'
    if (!images.length) return 'Upload at least one image'
    return ''
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) {
      showToast(err, 'error')
      return
    }

    try {
      setSubmitting(true)
      show()
      await apiPost('/api/products', payload)
      showToast('Product added successfully', 'success')
      resetForm()
    } catch (e) {
      const msg = e?.payload?.message || e?.message || 'Failed to add product'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
      hide()
    }
  }

  return (
    <div className="ap-page">
      <div className="ap-top">
        <div className="ap-titlebar">
          <div className="ap-title">Add Product</div>
          <div className={`ap-status ${loadingOptions ? 'loading' : 'ready'}`}>{loadingOptions ? 'Loading…' : 'Ready'}</div>
        </div>
      </div>

      <div className="ap-layout">
        <div className="ap-panel">
          <div className="ap-panel-head">
            <div className="ap-panel-title">Basic Details</div>
          </div>

          <div className="ap-grid">
            <div className="ap-field full">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="ap-field" ref={brandBoxRef}>
              <label>Brand</label>
              <div className="ap-input-row">
                <input value={brandInput} onChange={handleBrandSearch} placeholder="Search or type brand" />
                <button type="button" className="ap-mini" onClick={() => setBrandPopup(true)}>
                  Add
                </button>
              </div>

              {brandDropdown && brandFiltered.length > 0 && (
                <div className="ap-dropdown">
                  {brandFiltered.slice(0, 10).map((b) => (
                    <button
                      type="button"
                      key={b}
                      className="ap-dd-item"
                      onClick={() => {
                        setBrandInput(b)
                        setBrandDropdown(false)
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="ap-field" ref={productBoxRef}>
              <label>Product Name</label>
              <div className="ap-input-row">
                <input value={productInput} onChange={handleProductSearch} placeholder="Search or type product" />
                <button type="button" className="ap-mini" onClick={() => setProductPopup(true)}>
                  Add
                </button>
              </div>

              {productDropdown && productFiltered.length > 0 && (
                <div className="ap-dropdown">
                  {productFiltered.slice(0, 10).map((p) => (
                    <button
                      type="button"
                      key={p}
                      className="ap-dd-item"
                      onClick={() => {
                        setProductInput(p)
                        setProductDropdown(false)
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="ap-field full">
              <label>Model Name</label>
              <input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="Optional model name" />
            </div>

            <div className="ap-field full">
              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={4} />
            </div>

            <div className="ap-field">
              <label>Stock</label>
              <input type="number" value={totalCount} onChange={(e) => setTotalCount(e.target.value)} placeholder="Optional" />
            </div>

            <div className="ap-field">
              <label>Published</label>
              <select value={published ? 'true' : 'false'} onChange={(e) => setPublished(e.target.value === 'true')}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>

        <div className="ap-right">
          <div className="ap-panel">
            <div className="ap-panel-head">
              <div className="ap-panel-title">Pricing</div>
            </div>

            <div className="ap-grid ap-grid-1">
              <div className="ap-field">
                <label>Actual Price</label>
                <input type="number" value={b2cPrice} onChange={(e) => setB2cPrice(e.target.value)} placeholder="0.00" />
              </div>

              <div className="ap-field">
                <label>Discount %</label>
                <input type="number" value={b2cDiscount} onChange={(e) => setB2cDiscount(e.target.value)} placeholder="0 - 100" />
              </div>

              <div className="ap-field">
                <label>Discounted Price</label>
                <input value={b2cFinal} readOnly placeholder="Auto calculated" />
              </div>
            </div>
          </div>

          <div className="ap-panel">
            <div className="ap-panel-head">
              <div className="ap-panel-title">Images</div>
              <div className="ap-panel-sub">Up to 6 images</div>
            </div>

            <label className="ap-upload">
              <div className="ap-upload-title">Choose images</div>
              <div className="ap-upload-sub">PNG, JPG, WEBP (multiple allowed)</div>
              <input type="file" accept="image/*" multiple onChange={handleMultiImageUpload} />
            </label>

            {images.length > 0 && (
              <div className="ap-images">
                {images.map((url) => (
                  <div key={url} className="ap-img">
                    <img src={url} alt="product" />
                    <button type="button" className="ap-img-x" onClick={() => removeImage(url)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="ap-save" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </div>

      {brandPopup && (
        <div className="ap-modal" role="dialog" aria-modal="true">
          <div className="ap-modal-box">
            <div className="ap-modal-title">Add Brand</div>
            <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Brand name" />
            <div className="ap-modal-actions">
              <button type="button" className="ap-btn primary" onClick={handleAddNewBrand}>
                Add
              </button>
              <button type="button" className="ap-btn" onClick={() => setBrandPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {productPopup && (
        <div className="ap-modal" role="dialog" aria-modal="true">
          <div className="ap-modal-box">
            <div className="ap-modal-title">Add Product</div>
            <input value={newProduct} onChange={(e) => setNewProduct(e.target.value)} placeholder="Product name" />
            <div className="ap-modal-actions">
              <button type="button" className="ap-btn primary" onClick={handleAddNewProduct}>
                Add
              </button>
              <button type="button" className="ap-btn" onClick={() => setProductPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {popupMessage && <div className={`ap-toast ${popupType}`}>{popupMessage}</div>}
    </div>
  )
}
