import React, { useState, useMemo } from 'react'
import './HomePage.css'
import Navbar from './NavbarAdmin'
import AddProduct from './AddProduct'
import UpdateProduct from './UpdateProduct'
import DeleteProduct from './DeleteProduct'

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('Add')

  const content = useMemo(() => {
    if (activeTab === 'Add') return <AddProduct />
    if (activeTab === 'Update') return <UpdateProduct />
    if (activeTab === 'Delete') return <DeleteProduct />
    return null
  }, [activeTab])

  return (
    <div className="hp-wrap">
      <Navbar active="Products" />

      <div className="hp-page">
        <header className="hp-hero">
          <h1 className="hp-title">Manage Products</h1>

          <div className="hp-tabs" role="tablist" aria-label="Product actions">
            <button
              type="button"
              className={`hp-tab ${activeTab === 'Add' ? 'active' : ''}`}
              onClick={() => setActiveTab('Add')}
              role="tab"
              aria-selected={activeTab === 'Add'}
            >
              Add
            </button>

            <button
              type="button"
              className={`hp-tab ${activeTab === 'Update' ? 'active' : ''}`}
              onClick={() => setActiveTab('Update')}
              role="tab"
              aria-selected={activeTab === 'Update'}
            >
              Update
            </button>

            <button
              type="button"
              className={`hp-tab ${activeTab === 'Delete' ? 'active' : ''}`}
              onClick={() => setActiveTab('Delete')}
              role="tab"
              aria-selected={activeTab === 'Delete'}
            >
              Delete
            </button>

            <div className={`hp-indicator ${activeTab === 'Update' ? 'mid' : activeTab === 'Delete' ? 'right' : ''}`} />
          </div>
        </header>

        <section className="hp-card">
          <div className="hp-card-inner">{content}</div>
        </section>
      </div>
    </div>
  )
}

export default HomePage
