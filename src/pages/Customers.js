import React, { useMemo, useState } from 'react'
import NavbarAdmin from './NavbarAdmin'
import './Customers.css'
import B2BProfiles from './B2BProfiles'
import B2CProfiles from './B2CProfiles'

const Customers = () => {
  const [activeTab, setActiveTab] = useState('B2B')

  const subtitle = useMemo(() => {
    return activeTab === 'B2B' ? 'B2B customer profiles and access management' : 'B2C customer profiles and accounts'
  }, [activeTab])

  return (
    <div className="cust-screen">
      <NavbarAdmin />

      <div className="cust-page">
        <header className="cust-hero">
          <div className="cust-hero-left">
            <div className="cust-badge">Admin</div>
            <h1 className="cust-title">Customers</h1>
            <p className="cust-sub">{subtitle}</p>
          </div>

          <div className="cust-tabs" role="tablist" aria-label="Customer type tabs">
            <button
              type="button"
              className={`cust-tab ${activeTab === 'B2B' ? 'active' : ''}`}
              onClick={() => setActiveTab('B2B')}
              role="tab"
              aria-selected={activeTab === 'B2B'}
            >
              B2B
            </button>

            <button
              type="button"
              className={`cust-tab ${activeTab === 'B2C' ? 'active' : ''}`}
              onClick={() => setActiveTab('B2C')}
              role="tab"
              aria-selected={activeTab === 'B2C'}
            >
              B2C
            </button>

            <div className={`cust-indicator ${activeTab === 'B2C' ? 'right' : ''}`} />
          </div>
        </header>

        <section className="cust-shell">
          <div className="cust-shell-inner">{activeTab === 'B2B' ? <B2BProfiles /> : <B2CProfiles />}</div>
        </section>
      </div>
    </div>
  )
}

export default Customers
