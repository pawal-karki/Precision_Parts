const BASE = import.meta.env.VITE_API_URL?.trim() || "http://localhost:5147/api";

class ApiClient {
  async _req(path, opts = {}) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...opts.headers },
      credentials: "include",
      ...opts,
    });
    if (res.status === 401 && path === "/auth/me") return null;
    if (res.status === 204) return null;
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const b = await res.json(); msg = b.message || b.error || msg; } catch {}
      throw new Error(msg);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  _get(p) { return this._req(p); }
  _post(p, body) { return this._req(p, { method: "POST", body: JSON.stringify(body) }); }
  _put(p, body) { return this._req(p, { method: "PUT", body: JSON.stringify(body) }); }
  _patch(p, body) { return this._req(p, { method: "PATCH", body: JSON.stringify(body) }); }
  _delete(p) { return this._req(p, { method: "DELETE" }); }

  // ── Auth ──────────────────────────────────────────────────────
  getMe()                  { return this._get("/auth/me"); }
  login(dto)               { return this._post("/auth/login", dto); }
  register(dto)            { return this._post("/auth/register", dto); }
  logout()                 { return this._post("/auth/logout", {}); }
  requestPasswordReset(email) { return this._post("/auth/request-reset", { email }); }
  verifyOtp(dto)           { return this._post("/auth/verify-otp", dto); }
  resetPassword(dto)       { return this._post("/auth/reset", dto); }

  // ── Admin: Dashboard ─────────────────────────────────────────
  getAdminKpis()           { return this._get("/admin/dashboard/kpis"); }
  getRevenueData()         { return this._get("/admin/dashboard/revenue"); }
  getDistribution()        { return this._get("/admin/dashboard/distribution"); }
  getTopParts()            { return this._get("/admin/dashboard/top-parts"); }
  getAlerts()              { return this._get("/admin/dashboard/alerts"); }
  getActivity()            { return this._get("/admin/dashboard/activity"); }
  getAuditLog()            { return this._get("/admin/dashboard/audit-log"); }

  // ── Admin: Staff ──────────────────────────────────────────────
  getStaff()               { return this._get("/admin/staff"); }
  createStaff(dto)         { return this._post("/admin/staff", dto); }
  updateStaff(id, dto)     { return this._put(`/admin/staff/${id}`, dto); }
  deleteStaff(id)          { return this._delete(`/admin/staff/${id}`); }

  // ── Admin: Parts / Inventory ──────────────────────────────────
  getParts()               { return this._get("/admin/parts"); }
  createPart(dto)          { return this._post("/admin/parts", dto); }
  updatePart(id, dto)      { return this._put(`/admin/parts/${id}`, dto); }
  deletePart(id)           { return this._delete(`/admin/parts/${id}`); }
  uploadPartImage(file) {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`${BASE}/admin/parts/upload`, {
      method: "POST",
      body: fd,
      credentials: "include",
    }).then(async res => {
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Upload failed");
      }
      return res.json();
    });
  }

  // ── Admin: Vendors ────────────────────────────────────────────
  getVendors()             { return this._get("/admin/vendors"); }
  createVendor(dto)        { return this._post("/admin/vendors", dto); }
  updateVendor(id, dto)    { return this._put(`/admin/vendors/${id}`, dto); }
  deleteVendor(id)         { return this._delete(`/admin/vendors/${id}`); }

  // ── Admin: Purchase Invoices ──────────────────────────────────
  getPurchaseInvoices()    { return this._get("/admin/purchase-invoices"); }

  // ── Admin: Financial ─────────────────────────────────────────
  getFinancialSummary()    { return this._get("/admin/financial/summary"); }
  getProfitLoss()          { return this._get("/admin/financial/profit-loss"); }
  getFinancialReports()    { return this._get("/admin/financial/reports"); }

  // ── Admin: Inventory Reports ──────────────────────────────────
  getInventoryReports()    { return this._get("/admin/inventory/reports"); }

  // ── Staff: Customers ─────────────────────────────────────────
  getCustomers()           { return this._get("/staff/customers"); }
  createCustomer(dto)      { return this._post("/staff/customers", dto); }
  updateCustomer(pid, dto) { return this._put(`/staff/customers/${pid}`, dto); }
  deleteCustomer(pid)      { return this._delete(`/staff/customers/${pid}`); }

  getCustomerDetailedReport(pid)                          { return this._get(`/staff/customers/${pid}/detailed-report`); }
  getCustomerActivityLog(pid, page = 1, size = 10)        { return this._get(`/staff/customers/${pid}/activity?page=${page}&size=${size}`); }
  getCustomerLoginActivity(pid, page = 1, size = 10)      { return this._get(`/staff/customers/${pid}/login-activity?page=${page}&size=${size}`); }
  getCustomerServiceHistory(pid)                          { return this._get(`/staff/customers/${pid}/service-history`); }
  getCustomerPurchases(pid)                               { return this._get(`/staff/customers/${pid}/purchases`); }

  // ── Staff: POS & Invoice ──────────────────────────────────────
  getPosProducts() { return this._get("/staff/pos/products"); }
  createPosSale(dto) { return this._post("/staff/pos/checkout", dto); }
  getInvoice()             { return this._get("/staff/invoice"); }

  // ── Customer: Dashboard ───────────────────────────────────────
  getCustomerDashboard()   { return this._get("/customer/dashboard"); }
  getCustomerLedger()      { return this._get("/customer/dashboard/ledger"); }

  // ── Customer: Orders ─────────────────────────────────────────
  getOrderHistory()        { return this._get("/customer/orders"); }

  // ── Customer: Profile ────────────────────────────────────────
  updateProfile(dto)       { return this._put("/customer/profile", dto); }

  // ── Customer: Vehicles ────────────────────────────────────────
  getVehicles()            { return this._get("/customer/vehicles"); }
  addVehicle(dto)          { return this._post("/customer/vehicles", dto); }
  updateVehicle(id, dto)   { return this._put(`/customer/vehicles/${id}`, dto); }
  deleteVehicle(id)        { return this._delete(`/customer/vehicles/${id}`); }

  // ── Customer: Appointments ───────────────────────────────────
  createAppointment(dto)   { return this._post("/customer/appointments", dto); }
  getAppointments()        { return this._get("/customer/appointments"); }
  getAvailableServices()   { return this._get("/customer/appointments/services"); }
  cancelAppointment(id)    { return this._patch(`/customer/appointments/${id}/cancel`, {}); }

  // ── Customer: Reviews ────────────────────────────────────────
  createReview(dto)        { return this._post("/customer/reviews", dto); }
  getReviews()             { return this._get("/customer/reviews"); }

  // ── Customer: Part Requests ───────────────────────────────────
  createPartRequest(dto)   { return this._post("/customer/part-requests", dto); }
  getPartRequests()        { return this._get("/customer/part-requests"); }

  // ── Customer: AI Recommendations ─────────────────────────────
  getAiRecommendation(vehicleId, prompt) {
    return this._post("/customer/ai/recommend", { vehicleId, prompt });
  }
  getAiPredictions()       { return this._get("/customer/ai/predictions"); }
  getMaintenanceTrends()   { return this._get("/customer/ai/trends"); }

  // ── Notifications ─────────────────────────────────────────────
  getNotifications()       { return this._get("/notifications"); }
  markNotificationRead(id) { return this._patch(`/notifications/${id}/read`, {}); }
  markAllRead()            { return this._patch("/notifications/read-all", {}); }

  // ── Admin: Appointments ──────────────────────────────────────
  getAdminAppointments()        { return this._get("/admin/appointments"); }
  getAdminSlotOccupancy(date)   { return this._get(`/admin/appointments/occupancy?date=${date}`); }
  adminCreateAppointment(dto)   { return this._post("/admin/appointments", dto); }
  updateAppointmentStatus(id, s) { return this._patch(`/admin/appointments/${id}/status`, { status: s }); }
  deleteAppointment(id)         { return this._delete(`/admin/appointments/${id}`); }

  // ── Staff: Appointments ──────────────────────────────────────
  getStaffAppointments()        { return this._get("/staff/appointments"); }
  getStaffSlotOccupancy(date)   { return this._get(`/staff/appointments/occupancy?date=${date}`); }
  staffCreateAppointment(dto)   { return this._post("/staff/appointments", dto); }
  updateStaffAppointmentStatus(id, s) { return this._patch(`/staff/appointments/${id}/status`, { status: s }); }
}

export const api = new ApiClient();

export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  const baseUrl = BASE.replace('/api', '');
  return `${baseUrl}${url}`;
};