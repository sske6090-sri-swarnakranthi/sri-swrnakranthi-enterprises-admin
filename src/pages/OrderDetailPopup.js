import React, { useEffect, useState } from 'react'
import './OrderDetailPopup.css'

function safeUpper(s) {
  return String(s || '').toUpperCase()
}

function safeLower(s) {
  return String(s || '').toLowerCase()
}

function money(f, n) {
  try {
    return f ? f(n) : `₹${Number(n || 0).toFixed(2)}`
  } catch {
    return `₹${Number(n || 0).toFixed(2)}`
  }
}

function getAddrText(addr) {
  if (!addr || typeof addr !== 'object') return '-'
  const parts = [addr?.name, addr?.line1, addr?.line2, addr?.city, addr?.state, addr?.pincode].filter(Boolean)
  return parts.length ? parts.join(', ') : '-'
}

function getContactText(sale) {
  if (!sale) return { name: '-', email: '-', mobile: '-' }
  return {
    name: sale?.customer_name || sale?.shipping_address?.name || 'Customer',
    email: sale?.customer_email || '-',
    mobile: sale?.customer_mobile || '-'
  }
}

export default function OrderDetailPopup({ open, loading, detail, onClose, fmt }) {
  const [activeTab, setActiveTab] = useState('items')

  useEffect(() => {
    if (!open) setActiveTab('items')
  }, [open])

  if (!open) return null

  const sale = detail?.sale || null
  const items = Array.isArray(detail?.items) ? detail.items : []
  const totals = sale?.totals || {}

  const payable = Number(totals?.payable ?? sale?.total ?? 0) || 0
  const bagTotal =
    Number(totals?.bagTotal ?? 0) ||
    (items.length ? items.reduce((acc, it) => acc + Number(it?.price || 0) * Number(it?.qty || 1), 0) : 0)
  const discount = Number(totals?.discountTotal ?? 0) || 0
  const coupon = Number(totals?.couponDiscount ?? 0) || 0
  const convenience = Number(totals?.convenience ?? 0) || 0
  const giftWrap = Number(totals?.giftWrap ?? 0) || 0

  const totalQty = items.reduce((acc, it) => acc + Number(it?.qty || 1), 0)
  const createdAt = sale?.created_at ? new Date(sale.created_at).toLocaleString('en-IN') : '-'

  const statusLabel = safeUpper(sale?.status || 'PLACED')
  const paymentMethod = safeUpper(sale?.payment_method || 'COD')
  const paymentStatus = safeUpper(sale?.payment_status || paymentMethod || 'COD')

  const contact = getContactText(sale)
  const shippingText = getAddrText(sale?.shipping_address)

  const stop = (e) => e.stopPropagation()

  const pillClass = (() => {
    const s = safeLower(statusLabel)
    if (s.includes('cancel')) return 'odp-pill odp-pill-danger'
    if (s.includes('deliver')) return 'odp-pill odp-pill-success'
    if (s.includes('ship') || s.includes('dispatch') || s.includes('transit')) return 'odp-pill odp-pill-info'
    if (s.includes('confirm') || s.includes('accept') || s.includes('process')) return 'odp-pill odp-pill-warn'
    return 'odp-pill'
  })()

  const fmtMoney = (n) => money(fmt, n)

  return (
    <div className="odp-backdrop" onClick={onClose}>
      <div className="odp-modal" onClick={stop}>
        {loading ? (
          <div className="odp-loading">
            <div className="odp-spinner" />
            <div className="odp-loading-text">Loading order details</div>
          </div>
        ) : !detail || !sale ? (
          <div className="odp-empty">
            <div className="odp-empty-ico" />
            <div className="odp-empty-title">Unable to load order</div>
            <div className="odp-empty-sub">Please refresh and try again.</div>
            <button className="odp-btn odp-btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="odp-head">
              <div className="odp-head-left">
                <div className="odp-title-row">
                  <div className="odp-title">Order #{sale?.id}</div>
                  <span className={pillClass}>{statusLabel}</span>
                </div>
                <div className="odp-sub">
                  <span>Placed on {createdAt}</span>
                  <span className="dot">•</span>
                  <span>{totalQty} item(s)</span>
                  <span className="dot">•</span>
                  <span>Payment {paymentStatus}</span>
                  <span className="dot">•</span>
                  <span className="accent">{fmtMoney(payable)}</span>
                </div>
              </div>

              <div className="odp-head-right">
                <button className="odp-btn odp-btn-ghost" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>

            <div className="odp-highlight">
              <div className="odp-hl-card">
                <div className="k">Customer</div>
                <div className="v">{contact.name}</div>
                <div className="s">{contact.email}</div>
                <div className="s">{contact.mobile}</div>
              </div>

              <div className="odp-hl-card">
                <div className="k">Shipping</div>
                <div className="v wrap">{shippingText}</div>
              </div>

              <div className="odp-hl-card">
                <div className="k">Payment</div>
                <div className="v">{paymentMethod}</div>
                <div className="s">Status: {paymentStatus}</div>
              </div>

              <div className="odp-hl-card">
                <div className="k">Payable</div>
                <div className="v accent">{fmtMoney(payable)}</div>
                <div className="s">Bag Total: {fmtMoney(bagTotal)}</div>
              </div>
            </div>

            <div className="odp-tabs">
              <button className={`odp-tab ${activeTab === 'items' ? 'on' : ''}`} onClick={() => setActiveTab('items')}>
                Items
              </button>
              <button className={`odp-tab ${activeTab === 'summary' ? 'on' : ''}`} onClick={() => setActiveTab('summary')}>
                Summary
              </button>
              <button className={`odp-tab ${activeTab === 'customer' ? 'on' : ''}`} onClick={() => setActiveTab('customer')}>
                Customer
              </button>
            </div>

            {activeTab === 'items' ? (
              <div className="odp-section">
                <div className="odp-section-head">
                  <div>
                    <div className="odp-section-title">Items in this order</div>
                    <div className="odp-section-sub">
                      {items.length} item{items.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                {items.length ? (
                  <div className="odp-items-grid">
                    {items.map((it, i) => {
                      const name = it?.product_name || it?.name || it?.title || 'Product'
                      const brand = it?.brand_name || it?.brand || ''
                      const qty = Number(it?.qty || 1)
                      const price = Number(it?.price || 0)
                      const lineTotal = qty * price
                      const size = it?.size || '-'
                      const colour = it?.colour || it?.color || '-'
                      const ean = it?.ean_code || it?.ean || it?.barcode || '-'

                      return (
                        <div className="odp-item" key={`${it?.variant_id || it?.id || i}-${i}`}>
                          <div className="odp-item-media">
                            {it?.image_url ? <img src={it.image_url} alt={name} /> : <div className="odp-item-ph" />}
                          </div>

                          <div className="odp-item-body">
                            <div className="odp-item-top">
                              <div className="odp-item-name">{name}</div>
                              {brand ? <div className="odp-item-brand">{brand}</div> : null}
                            </div>

                            <div className="odp-item-meta">
                              <div className="m">
                                <span>Size</span>
                                <strong>{size}</strong>
                              </div>
                              <div className="m">
                                <span>Color</span>
                                <strong>{colour}</strong>
                              </div>
                              <div className="m">
                                <span>EAN</span>
                                <strong className="soft">{ean}</strong>
                              </div>
                              <div className="m">
                                <span>Qty</span>
                                <strong>×{qty}</strong>
                              </div>
                            </div>

                            <div className="odp-item-price">
                              <div className="row">
                                <span>Unit</span>
                                <strong>{fmtMoney(price)}</strong>
                              </div>
                              <div className="row total">
                                <span>Total</span>
                                <strong className="accent">{fmtMoney(lineTotal)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="odp-inline-empty">No items in this order</div>
                )}
              </div>
            ) : null}

            {activeTab === 'summary' ? (
              <div className="odp-section">
                <div className="odp-section-head">
                  <div>
                    <div className="odp-section-title">Price summary</div>
                    <div className="odp-section-sub">Breakdown of payable amount</div>
                  </div>
                </div>

                <div className="odp-summary-grid">
                  <div className="odp-sum-card">
                    <div className="odp-sum-row">
                      <span>Bag Total</span>
                      <strong>{fmtMoney(bagTotal)}</strong>
                    </div>
                    <div className="odp-sum-row">
                      <span>Discount</span>
                      <strong>-{fmtMoney(discount)}</strong>
                    </div>
                    <div className="odp-sum-row">
                      <span>Coupon</span>
                      <strong>-{fmtMoney(coupon)}</strong>
                    </div>
                    <div className="odp-sum-row">
                      <span>Convenience</span>
                      <strong>{fmtMoney(convenience)}</strong>
                    </div>
                    <div className="odp-sum-row">
                      <span>Gift Wrap</span>
                      <strong>{fmtMoney(giftWrap)}</strong>
                    </div>
                    <div className="odp-sum-row total">
                      <span>Payable</span>
                      <strong className="accent">{fmtMoney(payable)}</strong>
                    </div>
                  </div>

                  <div className="odp-sum-card">
                    <div className="odp-sum-title">Order info</div>
                    <div className="odp-sum-row">
                      <span>Status</span>
                      <strong>{statusLabel}</strong>
                    </div>
                    <div className="odp-sum-row">
                      <span>Payment method</span>
                      <strong>{paymentMethod}</strong>
                    </div>
                    <div className="odp-sum-row">
                      <span>Payment status</span>
                      <strong className="accent">{paymentStatus}</strong>
                    </div>
                    <div className="odp-sum-row">
                      <span>Placed on</span>
                      <strong className="soft">{createdAt}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'customer' ? (
              <div className="odp-section">
                <div className="odp-section-head">
                  <div>
                    <div className="odp-section-title">Customer & delivery</div>
                    <div className="odp-section-sub">Contact and shipping information</div>
                  </div>
                </div>

                <div className="odp-customer-grid">
                  <div className="odp-info-card">
                    <div className="t">Customer</div>
                    <div className="kv">
                      <span>Name</span>
                      <strong>{contact.name}</strong>
                    </div>
                    <div className="kv">
                      <span>Email</span>
                      <strong className="wrap">{contact.email}</strong>
                    </div>
                    <div className="kv">
                      <span>Mobile</span>
                      <strong>{contact.mobile}</strong>
                    </div>
                  </div>

                  <div className="odp-info-card">
                    <div className="t">Shipping address</div>
                    <div className="kv">
                      <span>Address</span>
                      <strong className="wrap">{shippingText}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
