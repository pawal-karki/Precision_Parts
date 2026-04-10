The Vehicle Parts Selling and Inventory Management System is a platform designed to streamline operations for vehicles services and parts retail center. It supports three main user roles—Admin, Staff, and Customers each with suitable functionalities to improve the overall efficiency, customer service, and ensure proper and smooth inventory and financial management.
The admin has the highest level of control in the system, including the registration and managing of staff, handle the vendor details, and view the overall inventory. They can add, edit, or delete vehicle parts, create invoices of purchase from vendors, and maintain the accurate financial records through reports that are generated automatically. The admin can also evaluate business performance by reviewing financial and inventory reports, ensuring informed decision-making and long-term planning.
Staff members interact directly with customers by registering them in the system and recording their vehicle details. They handle part sales, create and email invoices, and access customer histories such as past purchases and vehicle information. Using built-in search features, staff can locate customers by name, phone number, ID, or vehicle number. They can also generate customer-focused reports to identify top spenders, regular customers, and those with overdue credit payments, enabling better service and follow-up.
Customers can self-register through the system and access a range of self-service features. They can learn about the Vehicle Service Center, book service appointments, submit reviews, and request unavailable parts. The system allows them to view their complete service and purchase history. An integrated Artificial Intelligence (AI) analyzes their vehicle’s condition and usage patterns to predict potential part failures, alerting them in advance. Additionally, the system automatically notifies the admin when any part stock falls below 10 units and sends email reminders to customers with unpaid credit balances overdue by more than one month.

---

## Implementation map (repo)

| Requirement area | Where it lives |
|------------------|----------------|
| Admin financial / inventory views | SPA pages + `GET /api/admin/financial/*`, `GET /api/admin/inventory/reports` (KPIs derived from PostgreSQL invoices/parts where applicable; static demo rows where noted in code). |
| Staff / customers / POS sample invoice | `GET /api/staff/customers`, `GET /api/staff/pos/products`, `GET /api/staff/invoice`; Customer Directory syncs from API when `VITE_USE_MOCK=false`. |
| Customer dashboard, orders, AI | `GET /api/customer/dashboard`, `GET /api/customer/orders`, `GET /api/customer/ai/*` (Elena Schmidt demo profile; AI rows from `AiPredictions`). |
| Low stock & credit alerts | Admin dashboard `GET /api/admin/dashboard/alerts` builds from parts under threshold and `CustomerProfiles.OutstandingCredit`. |
| Loyalty 10% over $5,000 | Still enforced in SPA POS/invoice (`mock-data` / UI); sample invoice in `DemoCatalog` shows loyalty line. |
| Email to customers / background jobs | Not wired: add SMTP + hosted worker or Hangfire when you harden for production. |
| CRUD (parts, vendors, CRM customers) | **Application layer**: `CleanApp.Application/*` interfaces + DTOs; **Infrastructure**: `Services/PartsService.cs`, `VendorsService.cs`, `CustomersService.cs`; **API**: `POST/PUT/DELETE` on `api/admin/parts`, `api/admin/vendors`, `api/staff/customers` (use part/vendor **Guid** `id` from list payload `entityId` for updates/deletes). |

Section Topic Full Marks
(100)

A Development 90
AA Feature 60
1 Admin can generate and view financial reports (daily, monthly, yearly) 4
2 Admin can manage staff registration and roles 4
3 Admin can perform parts management (purchase, edit, delete) 4
4 Admin can create purchase invoices for stock updates 4
5 Admin can manage vendor details (CRUD operations) 4
6 Staff can register new customers with vehicle details 2
7 Staff can sell vehicle parts and create sales invoices 4
8 Staff can view customer details, history, and vehicle info 4
9 Staff can generate customer-related reports (regulars, high spenders, pending credits) 4
10 Staff can search customers by vehicle number, phone, ID, or name 4
11 Staff can send invoices via email to customers 4
12 Customers can self-register and manage profile & vehicle details 2
13 Customers can book appointments, request unavailable parts, and review services 4
14 Customers can view their purchase/service history 4
15 System automatically notifies Admin for low stock (<10) and sends email reminders to customers with unpaid credits for more than 1 month 4
16 Loyalty Program: Customers get 10% discount if they spend more than 5000 in a single purchase 4

AB Quality 30
1 Code Readability (i.e. naming convention, comments, indentation, consistent formatting/styles, organization, error messages, logical flow, expressions)
5
2 Code Efficiency (Data structures, algorithms, optimizations, redundant computations)
5
3 Code Modularity (SoC, code reusability, SRP, abstraction, Dependency Injection (DI))
5
4 Error Handling (exception handling, input validation, logging, graceful degradation, error propagation)
5
5 Version Control (VCS (i.e. Git), meaningful commit messages, logical commit history, effective branching/merging, Tagging/Releases)
5
6 User Experience (UX) (Design, Usability, Responsiveness, Consistency)
5
