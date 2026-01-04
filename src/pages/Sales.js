import React, { useEffect, useMemo, useState } from 'react'
import './Sales.css'
import Navbar from './NavbarAdmin'
import OrderDetailPopup from './OrderDetailPopup'

const DEFAULT_API_BASE = 'http://localhost:5000'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || '').replace(/\/+$/, '')

const STATUSES = ['ALL', 'PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const PAYMENT_FILTERS = ['ALL', 'COD', 'PREPAID', 'PENDING', 'FAILED']
const STAGE_FILTERS = ['ALL', 'COMPLETE', 'INCOMPLETE']

function statusText(s) {
  return String(s || '').toUpperCase()
}

function normalizePayMode(paymentStatus) {
  const p = statusText(paymentStatus)
  if (!p) return 'UNKNOWN'
  if (p.includes('COD') || p.includes('CASH')) return 'COD'
  if (p.includes('PREPAID') || p.includes('PAID') || p.includes('ONLINE') || p.includes('RAZORPAY')) return 'PREPAID'
  if (p.includes('PENDING') || p.includes('INIT') || p.includes('CREATED') || p.includes('PROCESSING')) return 'PENDING'
  if (p.includes('FAILED') || p.includes('CANCEL')) return 'FAILED'
  return p
}

function normalizeOrderStage(orderStatus) {
  const st = statusText(orderStatus)
  if (!st) return 'UNKNOWN'
  if (st.includes('CANCEL')) return 'CANCELLED'
  if (st.includes('DELIVER')) return 'DELIVERED'
  if (st.includes('SHIP')) return 'SHIPPED'
  if (st.includes('PACK')) return 'PACKED'
  if (st.includes('CONFIRM')) return 'CONFIRMED'
  if (st.includes('PLACE')) return 'PLACED'
  return st
}

function isIncompleteOrder(o) {
  const stage = normalizeOrderStage(o?.status)
  const pay = normalizePayMode(o?.payment_status || o?.paymentStatus)
  const payable = Number(o?.totals?.payable ?? o?.total ?? 0)
  const hasCustomer =
    (o?.customer_name && String(o.customer_name).trim()) ||
    (o?.customer_email && String(o.customer_email).trim()) ||
    (o?.customer_mobile && String(o.customer_mobile).trim())
  const hasItems = Array.isArray(o?.items) ? o.items.length > 0 : true
  const missingTotal = !Number.isFinite(payable) || payable <= 0
  const badStage = stage === 'UNKNOWN'
  const badPay = pay === 'UNKNOWN'
  return !hasCustomer || !hasItems || missingTotal || badStage || badPay
}

function firstItem(items) {
  if (!Array.isArray(items) || !items.length) return null
  return items[0] || null
}

function firstImg(items) {
  if (!Array.isArray(items) || !items.length) return ''
  const img = items.find((it) => it?.image_url)?.image_url || items[0]?.image_url || ''
  return typeof img === 'string' ? img : ''
}

function firstName(items) {
  const it = firstItem(items)
  if (!it) return ''
  return it?.product_name || it?.name || it?.title || ''
}

export default function Sales() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('ALL')
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [stageFilter, setStageFilter] = useState('ALL')
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/orders/web/admin`, { cache: 'no-store' })
      const data = await res.json().catch(() => [])
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const getPayable = (o) => {
    if (o?.totals?.payable != null) return Number(o.totals.payable)
    if (o?.total != null) return Number(o.total)
    if (Array.isArray(o?.items) && o.items.length) {
      return o.items.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.qty || 0), 0)
    }
    return 0
  }

  const getCustomerLabel = (o) => {
    const name = o?.customer_name && String(o.customer_name).trim()
    if (name) return name
    return 'Customer'
  }

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    const fromTs = from ? new Date(from + 'T00:00:00').getTime() : null
    const toTs = to ? new Date(to + 'T23:59:59').getTime() : null

    return orders.filter((o) => {
      const st = statusText(o?.status || 'PLACED')
      const okStatus = status === 'ALL' ? true : st === status

      const payMode = normalizePayMode(o?.payment_status || o?.paymentStatus)
      const okPayment = paymentFilter === 'ALL' ? true : payMode === paymentFilter

      const incomplete = isIncompleteOrder(o)
      const okStage = stageFilter === 'ALL' ? true : stageFilter === 'INCOMPLETE' ? incomplete : !incomplete

      const created = o?.created_at ? new Date(o.created_at).getTime() : null
      const okFrom = fromTs ? (created ? created >= fromTs : true) : true
      const okTo = toTs ? (created ? created <= toTs : true) : true

      const t = o?.totals || {}
      const hay = [
        o?.id,
        getCustomerLabel(o),
        o?.customer_email,
        o?.customer_mobile,
        o?.status,
        o?.payment_status,
        t?.payable,
        getPayable(o)
      ]
        .join(' ')
        .toLowerCase()

      const okQ = ql ? hay.includes(ql) : true
      return okStatus && okPayment && okStage && okFrom && okTo && okQ
    })
  }, [orders, status, paymentFilter, stageFilter, q, from, to])

  const grand = useMemo(() => filtered.reduce((acc, o) => acc + getPayable(o), 0), [filtered])

  const openDetail = async (id) => {
    setDetailLoading(true)
    setDetail({
      sale: { id, status: 'PLACED', payment_status: 'COD', totals: { payable: 0 } },
      items: [],
      shipments: [],
      trackingSnapshot: null,
      latestShipment: null
    })

    try {
      const res = await fetch(`${API_BASE}/api/orders/web/${encodeURIComponent(id)}`, { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json) {
        setDetail(null)
        return
      }
      const order = json.order || json.sale || json || null
      const items = Array.isArray(json.items) ? json.items : Array.isArray(order?.items) ? order.items : []

      setDetail({
        sale: order || { id, status: 'PLACED', payment_status: 'COD', totals: { payable: 0 } },
        items,
        shipments: [],
        trackingSnapshot: null,
        latestShipment: null
      })
    } catch {
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0))

  return (
    <div className="sales-screen">
      <Navbar />

      <div className="sales-wrap">
        <div className="sales-hero">
          <div className="sales-hero-left">
            <div className="sales-title">Sales</div>
            <div className="sales-subtitle">Manage orders with faster search, cleaner filters, and crisp visuals</div>
          </div>
          <div className="sales-hero-right">
            <button className="sales-btn sales-btn-primary" onClick={fetchOrders}>
              Refresh
            </button>
          </div>
        </div>

        <div className="sales-stats">
          <div className="sales-stat">
            <div className="k">Orders</div>
            <div className="v">{loading ? '...' : filtered.length}</div>
          </div>
          <div className="sales-stat">
            <div className="k">Total</div>
            <div className="v accent">{loading ? '...' : fmt(grand)}</div>
          </div>
          <div className="sales-stat">
            <div className="k">Date Range</div>
            <div className="v small">{from && to ? `${from} → ${to}` : from ? `From ${from}` : to ? `To ${to}` : 'All time'}</div>
          </div>
        </div>

        <div className="sales-table-card">
          {loading ? (
            <div className="sales-loading">
              <div className="spinner" />
              <div className="txt">Fetching latest orders</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="sales-empty">
              <div className="ico" />
              <h3>No orders found</h3>
              <p>Try adjusting filters or clearing the search.</p>
            </div>
          ) : (
            <div className="sales-table-scroll">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Placed</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th className="ar">Payable</th>
                    <th className="ar">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => {
                    const items = Array.isArray(o?.items) ? o.items : []
                    const title = firstName(items) || 'Order'
                    const img = firstImg(items)
                    const st = statusText(o?.status || 'PLACED')
                    const payMode = normalizePayMode(o?.payment_status || o?.paymentStatus)

                    return (
                      <tr key={o.id}>
                        <td>
                          <div className="ordercell">
                            <div className="thumb">{img ? <img src={img} alt={title} /> : <div className="ph" />}</div>
                            <div className="meta">
                              <div className="id">#{o.id}</div>
                              <div className="name">{title}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="soft">{o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '-'}</span>
                        </td>
                        <td>
                          <span className="badge">{st}</span>
                        </td>
                        <td>
                          <span className="chip">{payMode}</span>
                        </td>
                        <td>
                          <span className="main">{getCustomerLabel(o)}</span>
                        </td>
                        <td>
                          <span className="main">{o.customer_mobile || '-'}</span>
                        </td>
                        <td>
                          <span className="soft">{o.customer_email || '-'}</span>
                        </td>
                        <td className="ar">
                          <span className="amt">{fmt(getPayable(o))}</span>
                        </td>
                        <td className="ar">
                          <button className="sales-btn sales-btn-mini" onClick={() => openDetail(o.id)}>
                            View
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
      </div>

      <OrderDetailPopup
        open={!!detail}
        loading={detailLoading}
        detail={detail}
        onClose={() => setDetail(null)}
        apiBase={API_BASE}
        orderSteps={['PLACED']}
        statusText={statusText}
        computeStepFromLocal={() => 0}
        computeStepFromShiprocket={() => 0}
        computeStepFromShipment={() => 0}
        buildExpectedDeliveryText={() => '-'}
        fmt={fmt}
      />
    </div>
  )
}
