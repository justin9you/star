import { Routes, Route, Navigate } from 'react-router-dom'
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
import DailyReport from './pages/Report/DailyReport'
import InventoryReport from './pages/Report/InventoryReport'
import Settings from './pages/Settings'
import './App.css'

function App() {
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