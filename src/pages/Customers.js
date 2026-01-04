import React, { useState } from 'react'
import NavbarAdmin from './NavbarAdmin'
import './Customers.css'
import B2BProfiles from './B2BProfiles'
import B2CProfiles from './B2CProfiles'

const Customers = () => {
  const [activeTab, setActiveTab] = useState('B2B')

  return (
    <div className="customers-wrap">
      <NavbarAdmin />

      <div className="customers-page">
        <header className="customers-hero">
          <div className="customers-hero-left">
            <div className="customers-badge">Admin Panel</div>
            <h1 className="customers-title">Customers</h1>
            <p className="customers-sub">
              Manage your B2B and B2C customers in one place
            </p>
          </div>

          <div className="customers-tabs">
            <button
              className={`customers-tab ${activeTab === 'B2B' ? 'active' : ''}`}
              onClick={() => setActiveTab('B2B')}
            >
              B2B Profiles
            </button>

            <button
              className={`customers-tab ${activeTab === 'B2C' ? 'active' : ''}`}
              onClick={() => setActiveTab('B2C')}
            >
              B2C Profiles
            </button>

            <div
              className={`customers-indicator ${activeTab === 'B2C' ? 'right' : ''}`}
            />
          </div>
        </header>

        <section className="customers-card">
          <div className="customers-card-inner">
            {activeTab === 'B2B' ? <B2BProfiles /> : <B2CProfiles />}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Customers
