import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './pages/AdminAuth'
import { LoadingProvider } from './pages/LoadingContext'
import HomePage from './pages/HomePage'
import Transaction from './pages/Transaction'
import Stocks from './pages/Stocks'
import Sales from './pages/Sales'
import Customers from './pages/Customers'
import ImportStock from './pages/ImportStock'
import POS from './pages/POS'
import AdminHomepageImages from './pages/AdminHomepageImages'
import OrderIssues from './pages/OrderIssues'
import ReturnReview from './pages/ReturnReview'
import LoginAdmin from './pages/LoginAdmin'

export default function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginAdmin />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/transactions" element={<Transaction />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/import" element={<ImportStock />} />
            <Route path="/homepage-images" element={<AdminHomepageImages />} />
            <Route path="/order-issues" element={<OrderIssues />} />
            <Route path="/returns/:id" element={<ReturnReview />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LoadingProvider>
    </AuthProvider>
  )
}
