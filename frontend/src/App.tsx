import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { App as AntApp } from 'antd'
import Login from './pages/Login'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import BrandManagement from './pages/Inventory/BrandManagement'
import CategoryManagement from './pages/Inventory/CategoryManagement'
import ProductManagement from './pages/Inventory/ProductManagement'
import WarehouseManagement from './pages/Inventory/WarehouseManagement'
import InventoryList from './pages/Inventory/InventoryList'
import CustomerManagement from './pages/Sales/CustomerManagement'
import SalesOrder from './pages/Sales/SalesOrder'
import OrderList from './pages/Sales/OrderList'
import DispatchList from './pages/Sales/DispatchList'
import PurchaseOrder from './pages/Purchase/PurchaseOrder'
import PurchaseOrderList from './pages/Purchase/PurchaseOrderList'
import DailyReport from './pages/Report/DailyReport'
import InventoryReport from './pages/Report/InventoryReport'
import Settings from './pages/Settings'
import { setMessageApi } from './services/api'
import './App.css'

function App() {
  const { message } = AntApp.useApp()

  useEffect(() => {
    setMessageApi(message)
  }, [message])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inventory">
          <Route path="brands" element={<BrandManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="warehouses" element={<WarehouseManagement />} />
          <Route path="list" element={<InventoryList />} />
        </Route>
        <Route path="sales">
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="order" element={<SalesOrder />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="dispatch" element={<DispatchList />} />
        </Route>
        <Route path="purchase">
          <Route path="order" element={<PurchaseOrder />} />
          <Route path="orders" element={<PurchaseOrderList />} />
        </Route>
        <Route path="report">
          <Route path="daily" element={<DailyReport />} />
          <Route path="inventory" element={<InventoryReport />} />
        </Route>
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App