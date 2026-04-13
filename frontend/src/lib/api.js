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

  // ── Staff: POS & Invoice ──────────────────────────────────────
  getPosProducts()         { return this._get("/staff/pos/products"); }
  getInvoice()             { return this._get("/staff/invoice"); }

  // ── Customer: Dashboard ───────────────────────────────────────
  getCustomerDashboard()   { return this._get("/customer/dashboard"); }

  // ── Customer: Orders ─────────────────────────────────────────
  getOrderHistory()        { return this._get("/customer/orders"); }

  // ── Customer: Appointments ───────────────────────────────────
  createAppointment(dto)   { return this._post("/customer/appointments", dto); }
  getAppointments()        { return this._get("/customer/appointments"); }

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

  // ── Customer: Vehicles ────────────────────────────────────────
  getVehicles()            { return this._get("/customer/vehicles"); }
  addVehicle(dto)          { return this._post("/customer/vehicles", dto); }

  // ── Notifications ─────────────────────────────────────────────
  getNotifications()       { return this._get("/notifications"); }
  markNotificationRead(id) { return this._patch(`/notifications/${id}/read`, {}); }
  markAllRead()            { return this._patch("/notifications/read-all", {}); }
}

export const api = new ApiClient();
    