namespace CleanApp.API.Documentation;

public class ApiAppendix
{
    1. AUTHENTICATION & IDENTITY
    POST /api/auth/login
    Body: { "email": "string", "password": "string" }
    Returns: { "token": "jwt", "user": { ... } }

    POST /api/auth/register
    Body: { "fullName": "string", "email": "string", "password": "string", "phone": "string" }

    GET /api/auth/me
    Header: Authorization: Bearer {token}
    Returns current user profile.

    2. ADMIN: FINANCIAL & KPI (Role: Admin)
    GET /api/admin/dashboard/kpis
    Returns: Monthly Revenue, Active Customers, Pending Appointments, Low Stock count.

    GET /api/admin/financial/summary
    Returns: Daily, Monthly, and Yearly revenue breakdown.

    GET /api/admin/financial/reports
    Returns detailed financial records.

    3. ADMIN: STAFF MANAGEMENT (Role: Admin)
    GET /api/admin/staff
    Returns list of all staff.

    GET /api/admin/staff?id={guid}
    Returns specific staff member details.

    POST /api/admin/staff
    Body: { "fullName": "string", "email": "string", "password": "string", "department": "string", "positionTitle": "string" }

    PUT /api/admin/staff/{id}
    Body: { "fullName": "string", "email": "string", "department": "string", "positionTitle": "string", "isActive": bool }

    DELETE /api/admin/staff/{id}

    4. ADMIN: INVENTORY & VENDORS (Role: Admin)
    GET /api/admin/parts
    GET /api/admin/vendors
    
    POST /api/admin/vendors
    Body: { "name": "string", "contactName": "string", "email": "string", "phone": "string", "address": "string", "city": "string", "country": "string" }

    POST /api/admin/purchase-invoices
    Body: { "vendorId": "guid", "items": [ { "partId": "guid", "quantity": int, "costPrice": decimal } ] }

    5. STAFF: CUSTOMER OPERATIONS (Role: Admin, Staff)
    POST /api/staff/customers
    Body: { "fullName": "string", "email": "string", "phone": "string", "vehicle": { "nickname": "string", "mileageKm": int } }

    GET /api/staff/customers?search={query}
    Query params: search (name, phone, or vehicle number)

    GET /api/staff/customers/{publicId}/detailed-report
    Returns customer spend history, regular status, and pending credits.

    6. STAFF: SALES & POS (Role: Admin, Staff)
    GET /api/staff/pos/products
    Returns parts available for sale.

    POST /api/staff/pos/checkout
    Body: { "customerId": "guid", "items": [ { "partId": "guid", "quantity": int, "unitPrice": decimal } ], "paymentMethod": "string" }
    Logic: Applies 10% discount if Total > 5000.

    POST /api/email/send-invoice/{invoiceId}
    Sends PDF invoice via email to customer.

    7. CUSTOMER: VEHICLES & APPOINTMENTS (Role: Customer)
    GET /api/customer/vehicles
    POST /api/customer/vehicles
    Body: { "nickname": "string", "mileageKm": int, "imageUrl": "string" }

    POST /api/customer/appointments
    Body: { "vehicleId": "guid", "scheduledAt": "datetime", "pickupRequired": bool, "notes": "string", "serviceTypeIds": ["guid"] }

    POST /api/customer/part-requests
    Body: { "partName": "string", "vehicleModel": "string", "urgency": "string" }

    8. SYSTEM: NOTIFICATIONS & AI
    GET /api/notifications
    Returns: Low stock alerts (<10) and unpaid credit reminders.

    GET /api/ai-recommendations/health/{vehicleId}
    Returns predicted part failures and risk levels.
}
