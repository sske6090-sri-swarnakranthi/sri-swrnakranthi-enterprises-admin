import React, { useEffect, useMemo, useState } from 'react'
import './AddProduct.css'
import { useLoading } from './LoadingContext'
import { apiGet, apiUpload, apiPost } from './api'

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
  return Number.isFinite(n) ? n : ''
}

const calcFinal = (price, disc) => {
  const p = safeNum(price)
  const d = safeNum(disc)
  if (p === '' || d === '') return ''
  const final = p - (p * d) / 100
  return final < 0 ? '0.00' : final.toFixed(2)
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

  const [b2bPrice, setB2bPrice] = useState('')
  const [b2bDiscount, setB2bDiscount] = useState('')
  const [b2bFinal, setB2bFinal] = useState('')

  const [b2cPrice, setB2cPrice] = useState('')
  const [b2cDiscount, setB2cDiscount] = useState('')
  const [b2cFinal, setB2cFinal] = useState('')

  const [totalCount, setTotalCount] = useState('')
  const [images, setImages] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [popupMessage, setPopupMessage] = useState('')
  const [popupType, setPopupType] = useState('')

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true)
      try {
        const data = await apiGet('/api/products?limit=10000')
        const list = Array.isArray(data) ? data : []
        const brandSet = new Set()
        const productSet = new Set()
        list.forEach((item) => {
          if (item.brand) brandSet.add(item.brand)
          if (item.product_name) productSet.add(item.product_name)
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
    setB2bFinal(calcFinal(b2bPrice, b2bDiscount))
  }, [b2bPrice, b2bDiscount])

  useEffect(() => {
    setB2cFinal(calcFinal(b2cPrice, b2cDiscount))
  }, [b2cPrice, b2cDiscount])

  const showToast = (msg, type = 'success') => {
    setPopupMessage(msg)
    setPopupType(type)
    setTimeout(() => {
      setPopupMessage('')
      setPopupType('')
    }, 2500)
  }

  const resetForm = () => {
    setCategory('')
    setBrandInput('')
    setProductInput('')
    setB2bPrice('')
    setB2bDiscount('')
    setB2bFinal('')
    setB2cPrice('')
    setB2cDiscount('')
    setB2cFinal('')
    setTotalCount('')
    setImages([])
  }

  const handleBrandSearch = (e) => {
    const value = e.target.value
    setBrandInput(value)
    if (!value) {
      setBrandDropdown(false)
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
        const url = res.imageUrl || res.url || res.path || ''
        if (url) uploaded.push(url)
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, 6))
    } catch {
      showToast('Image upload failed', 'error')
    } finally {
      hide()
    }
  }

  const removeImage = (url) => setImages((prev) => prev.filter((i) => i !== url))

  const payload = useMemo(() => {
    return {
      category: category.trim(),
      brand: brandInput.trim(),
      product_name: productInput.trim(),
      b2b_actual_price: b2bPrice,
      b2b_discount: b2bDiscount,
      b2b_final_price: b2bFinal,
      b2c_actual_price: b2cPrice,
      b2c_discount: b2cDiscount,
      b2c_final_price: b2cFinal,
      count: totalCount,
      images
    }
  }, [category, brandInput, productInput, b2bPrice, b2bDiscount, b2bFinal, b2cPrice, b2cDiscount, b2cFinal, totalCount, images])

  const validate = () => {
    if (!payload.category) return 'Please select category'
    if (!payload.brand) return 'Please enter brand'
    if (!payload.product_name) return 'Please enter product name'
    if (!payload.b2b_actual_price) return 'Enter B2B actual price'
    if (payload.b2b_discount === '') return 'Enter B2B discount'
    if (!payload.b2b_final_price) return 'B2B final price is missing'
    if (!payload.b2c_actual_price) return 'Enter B2C actual price'
    if (payload.b2c_discount === '') return 'Enter B2C discount'
    if (!payload.b2c_final_price) return 'B2C final price is missing'
    if (!payload.count) return 'Enter product count'
    if (!payload.images.length) return 'Upload at least one image'
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
    <div className="ap-wrap">
      <div className="ap-top">
        <div>
          <h1 className="ap-heading">Add Product</h1>
          <p className="ap-desc">Fill all details and save product instantly</p>
        </div>
        <div className="ap-status">{loadingOptions ? 'Loading...' : 'Ready'}</div>
      </div>

      <div className="ap-section">
        <h2 className="ap-title">Basic Information</h2>

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

          <div className="ap-field">
            <label>Brand</label>
            <div className="ap-row">
              <input value={brandInput} onChange={handleBrandSearch} placeholder="Type or search brand" />
              <button type="button" onClick={() => setBrandPopup(true)}>
                +
              </button>
            </div>

            {brandDropdown && brandFiltered.length > 0 && (
              <div className="ap-drop">
                {brandFiltered.slice(0, 8).map((b) => (
                  <div
                    key={b}
                    onClick={() => {
                      setBrandInput(b)
                      setBrandDropdown(false)
                    }}
                  >
                    {b}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ap-field">
            <label>Product Name</label>
            <div className="ap-row">
              <input value={productInput} onChange={handleProductSearch} placeholder="Type or search product" />
              <button type="button" onClick={() => setProductPopup(true)}>
                +
              </button>
            </div>

            {productDropdown && productFiltered.length > 0 && (
              <div className="ap-drop">
                {productFiltered.slice(0, 8).map((p) => (
                  <div
                    key={p}
                    onClick={() => {
                      setProductInput(p)
                      setProductDropdown(false)
                    }}
                  >
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ap-field full">
            <label>Total Stock</label>
            <input type="number" value={totalCount} onChange={(e) => setTotalCount(e.target.value)} placeholder="Enter stock count" />
          </div>
        </div>
      </div>

      <div className="ap-section">
        <h2 className="ap-title">Pricing</h2>

        <div className="ap-price-grid">
          <div className="ap-box">
            <h3>B2B</h3>
            <label>Actual Price</label>
            <input type="number" value={b2bPrice} onChange={(e) => setB2bPrice(e.target.value)} />
            <label>Discount %</label>
            <input type="number" value={b2bDiscount} onChange={(e) => setB2bDiscount(e.target.value)} />
            <label>Final Price</label>
            <input value={b2bFinal} readOnly />
          </div>

          <div className="ap-box">
            <h3>B2C</h3>
            <label>Actual Price</label>
            <input type="number" value={b2cPrice} onChange={(e) => setB2cPrice(e.target.value)} />
            <label>Discount %</label>
            <input type="number" value={b2cDiscount} onChange={(e) => setB2cDiscount(e.target.value)} />
            <label>Final Price</label>
            <input value={b2cFinal} readOnly />
          </div>
        </div>
      </div>

      <div className="ap-section">
        <h2 className="ap-title">Images</h2>

        <label className="ap-upload">
          Upload Images
          <input type="file" accept="image/*" multiple onChange={handleMultiImageUpload} />
        </label>

        <div className="ap-images">
          {images.map((url) => (
            <div key={url} className="ap-img">
              <img src={url} alt="p" />
              <button type="button" onClick={() => removeImage(url)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <button className="ap-save" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Product'}
      </button>

      {brandPopup && (
        <div className="ap-modal">
          <div className="ap-modal-box">
            <h3>Add Brand</h3>
            <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Brand name" />
            <div className="ap-modal-actions">
              <button onClick={handleAddNewBrand}>Add</button>
              <button onClick={() => setBrandPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {productPopup && (
        <div className="ap-modal">
          <div className="ap-modal-box">
            <h3>Add Product</h3>
            <input value={newProduct} onChange={(e) => setNewProduct(e.target.value)} placeholder="Product name" />
            <div className="ap-modal-actions">
              <button onClick={handleAddNewProduct}>Add</button>
              <button onClick={() => setProductPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {popupMessage && <div className={`ap-toast ${popupType}`}>{popupMessage}</div>}
    </div>
  )
}
