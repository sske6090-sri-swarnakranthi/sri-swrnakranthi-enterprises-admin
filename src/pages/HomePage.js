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
          <div className="hp-left">
            <div className="hp-badge">Products</div>
            <h1 className="hp-title">Manage Products</h1>
            <p className="hp-sub">
              Add new items, update existing inventory, or delete products safely.
            </p>
          </div>

          <div className="hp-tabs">
            <button
              className={`hp-tab ${activeTab === 'Add' ? 'active' : ''}`}
              onClick={() => setActiveTab('Add')}
            >
              Add Product
            </button>

            <button
              className={`hp-tab ${activeTab === 'Update' ? 'active' : ''}`}
              onClick={() => setActiveTab('Update')}
            >
              Update Product
            </button>

            <button
              className={`hp-tab ${activeTab === 'Delete' ? 'active' : ''}`}
              onClick={() => setActiveTab('Delete')}
            >
              Delete Product
            </button>

            <div
              className={`hp-indicator ${
                activeTab === 'Update'
                  ? 'mid'
                  : activeTab === 'Delete'
                  ? 'right'
                  : ''
              }`}
            />
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
