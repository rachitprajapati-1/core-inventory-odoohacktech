import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products/Products';
import ProductForm from './pages/Products/ProductForm';
import Categories from './pages/Products/Categories';
import Receipts from './pages/Receipts/Receipts';
import ReceiptDetail from './pages/Receipts/ReceiptDetail';
import ReceiptForm from './pages/Receipts/ReceiptForm';
import Deliveries from './pages/Deliveries/Deliveries';
import DeliveryDetail from './pages/Deliveries/DeliveryDetail';
import DeliveryForm from './pages/Deliveries/DeliveryForm';
import Transfers from './pages/Transfers/Transfers';
import TransferForm from './pages/Transfers/TransferForm';
import TransferDetail from './pages/Transfers/TransferDetail';
import Adjustments from './pages/Adjustments/Adjustments';
import AdjustmentForm from './pages/Adjustments/AdjustmentForm';
import MoveHistory from './pages/History/MoveHistory';
import Warehouses from './pages/Settings/Warehouses';
import Profile from './pages/Settings/Profile';
import Reports from './pages/Reports/Reports';
import NotFound from './pages/NotFound';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading CoreInventory...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="products/categories" element={<Categories />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="receipts/new" element={<ReceiptForm />} />
        <Route path="receipts/:id" element={<ReceiptDetail />} />
        <Route path="receipts/:id/edit" element={<ReceiptForm />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="deliveries/new" element={<DeliveryForm />} />
        <Route path="deliveries/:id" element={<DeliveryDetail />} />
        <Route path="deliveries/:id/edit" element={<DeliveryForm />} />
        <Route path="transfers" element={<Transfers />} />
        <Route path="transfers/new" element={<TransferForm />} />
        <Route path="transfers/:id" element={<TransferDetail />} />
        <Route path="adjustments" element={<Adjustments />} />
        <Route path="adjustments/new" element={<AdjustmentForm />} />
        <Route path="history" element={<MoveHistory />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings/warehouses" element={<Warehouses />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
