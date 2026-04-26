import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

import AdminLayout from "@/components/layouts/AdminLayout";
import StaffLayout from "@/components/layouts/StaffLayout";
import CustomerLayout from "@/components/layouts/CustomerLayout";

import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import VerifyOTP from "@/pages/auth/VerifyOTP";
import ResetPassword from "@/pages/auth/ResetPassword";
import InfoPage from "@/pages/public/InfoPage";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import StaffManagement from "@/pages/admin/StaffManagement";
import PartsManagement from "@/pages/admin/PartsManagement";
import VendorManagement from "@/pages/admin/VendorManagement";
import VendorProfile from "@/pages/admin/VendorProfile";
import PurchaseInvoice from "@/pages/admin/PurchaseInvoice";
import FinancialReports from "@/pages/admin/FinancialReports";
import InventoryReports from "@/pages/admin/InventoryReports";
import AdminAuditLog from "@/pages/admin/AdminAuditLog";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminProfile from "@/pages/admin/AdminProfile";

import StaffDashboard from "@/pages/staff/StaffDashboard";
import CustomerManagement from "@/pages/staff/CustomerManagement";
import SalesPOS from "@/pages/staff/SalesPOS";
import InvoiceView from "@/pages/staff/InvoiceView";
import CustomerProfile from "@/pages/staff/CustomerProfile";
import AdvancedSearch from "@/pages/staff/AdvancedSearch";
import StaffSettings from "@/pages/staff/StaffSettings";
import StaffProfile from "@/pages/staff/StaffProfile";

import CustomerDashboard from "@/pages/customer/CustomerDashboard";
import OrderHistory from "@/pages/customer/OrderHistory";
import PartRequest from "@/pages/customer/PartRequest";
import AIMaintenanceTrends from "@/pages/customer/AIMaintenanceTrends";
import ProfileManagement from "@/pages/customer/ProfileManagement";
import Notifications from "@/pages/customer/Notifications";
import ServiceBooking from "@/pages/customer/ServiceBooking";
import BookingSuccess from "@/pages/customer/BookingSuccess";
import PaymentsBalance from "@/pages/customer/PaymentsBalance";
import ReviewsFeedback from "@/pages/customer/ReviewsFeedback";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/info/:slug" element={<InfoPage />} />

            {/* Admin routes — protected */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="inventory" element={<PartsManagement />} />
              <Route path="vendors" element={<VendorManagement />} />
              <Route path="vendors/:id" element={<VendorProfile />} />
              <Route path="purchase-invoices" element={<PurchaseInvoice />} />
              <Route path="reports" element={<FinancialReports />} />
              <Route path="inventory-reports" element={<InventoryReports />} />
              <Route path="sales" element={<SalesPOS />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="customers/:id" element={<CustomerProfile />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Staff routes — protected */}
            <Route path="/staff" element={
              <ProtectedRoute role="staff"><StaffLayout /></ProtectedRoute>
            }>
              <Route index element={<StaffDashboard />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="customers/:id" element={<CustomerProfile />} />
              <Route path="sales" element={<SalesPOS />} />
              <Route path="invoice" element={<InvoiceView />} />
              <Route path="search" element={<AdvancedSearch />} />
              <Route path="settings" element={<StaffSettings />} />
              <Route path="profile" element={<StaffProfile />} />
            </Route>

            {/* Customer routes — protected */}
            <Route path="/customer" element={
              <ProtectedRoute role="customer"><CustomerLayout /></ProtectedRoute>
            }>
              <Route index element={<CustomerDashboard />} />
              <Route path="orders" element={<OrderHistory />} />
              <Route path="parts" element={<PartRequest />} />
              <Route path="ai" element={<AIMaintenanceTrends />} />
              <Route path="profile" element={<ProfileManagement />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="booking" element={<ServiceBooking />} />
              <Route path="booking-success" element={<BookingSuccess />} />
              <Route path="payments" element={<PaymentsBalance />} />
              <Route path="reviews" element={<ReviewsFeedback />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
