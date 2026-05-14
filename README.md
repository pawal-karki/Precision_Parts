# Precision Parts — Vehicle Parts Inventory Platform

## Project Overview

A comprehensive platform for automotive parts retail and inventory management, catering to three distinct user roles: **Admin**, **Staff**, and **Customer**. The design follows a **"Calm Industrial"** aesthetic — professional, muted, and highly functional.

## Architecture

```
Precision_Parts/
├── frontend/          # React 19 + Vite 8 SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/        # Reusable UI primitives (shadcn-style)
│   │   │   └── layouts/   # AdminLayout, StaffLayout, CustomerLayout
│   │   ├── pages/
│   │   │   ├── admin/     # Admin panel pages
│   │   │   ├── staff/     # Staff portal pages
│   │   │   └── customer/  # Customer portal pages
│   │   ├── data/          # Mock data (mock-data.js)
│   │   ├── lib/           # Utilities (utils.js) and API controller (api.js)
│   │   ├── App.jsx        # Root component with React Router
│   │   └── main.jsx       # Entry point
│   ├── tailwind.config.js # Design tokens matching stitch_assets mockups
│   └── package.json
├── backend/               # .NET Clean Architecture API
│   ├── CleanApp.API/      # HTTP: thin controllers → Application services
│   ├── CleanApp.Application/  # CRUD contracts: DTOs + `IPartsService`, `IVendorsService`, `ICustomersService`
│   ├── CleanApp.Domain/   # Entities + enums
│   └── CleanApp.Infrastructure/  # EF Core `AppDbContext`, migrations, `*Service` implementations, `DependencyInjection.AddInfrastructure`
└── stitch_assets/         # Original HTML mockups and reference images
```

## Tech Stack

### Frontend
- **Framework**: React 19 with Vite 8
- **Styling**: Tailwind CSS 3 with custom design tokens
- **Components**: shadcn/ui pattern (CVA + Radix UI primitives)
- **Routing**: React Router v7
- **Charts**: Recharts (animated)
- **Animations**: Framer Motion (page transitions, stagger lists, modals, FABs)
- **PDF Generation**: jsPDF + jspdf-autotable (invoices, reports)
- **State Management**: Custom reactive store with useSyncExternalStore (CRUD support)
- **Icons**: Material Symbols Outlined (Google Fonts)
- **Fonts**: Manrope (headings) + Inter (body)
- **Toast Notifications**: Custom animated toast system

### Backend
- **.NET** Clean Architecture (API, Application, Domain, Infrastructure)
- **CRUD**: Write operations live in `CleanApp.Application` (interfaces + DTOs) with implementations in `CleanApp.Infrastructure/Services` (`PartsService`, `VendorsService`, `CustomersService`), registered via `AddInfrastructure`. API controllers call these services (e.g. `POST/PUT/DELETE` on `api/admin/parts`, `api/admin/vendors`, `api/staff/customers`). Read-only aggregates (e.g. admin dashboard KPIs) still query `AppDbContext` directly in API controllers until you extract further use cases.
- Frontend uses an API controller pattern (`src/lib/api.js`) that can use mock data or the .NET backend (see API section below)

## Design System

### Visual Identity
- **Style**: Minimalist ERP/Inventory (Notion/Linear inspired)
- **Grid**: 8px system
- **Components**: Rounded (8px), soft shadows, high readability
- **Palette**: Charcoal (#5e5e5e), Steel Blue (#4d6172), and Warm Ivory accents on neutral grays

### Color Tokens (Material Design 3 inspired)
| Token | Hex |
|-------|-----|
| `primary` | `#5e5e5e` |
| `secondary` | `#4d6172` |
| `tertiary` | `#616049` |
| `background` / `surface` | `#f9f9f7` |
| `on-surface` | `#2d3432` |
| `error` | `#9f403d` |
| `outline` | `#767c79` |

### Dark Mode
- Fully supported via `darkMode: "class"` in Tailwind config
- Toggle available in all layouts via the contrast icon button
- Dark surfaces use `neutral-950`, `neutral-900`, `zinc-*`, `stone-*`

## Information Architecture

### Admin Panel (`/admin/*`)
| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Dashboard | KPIs, revenue chart, alerts, activity ledger |
| `/admin/staff` | Staff Management | Role assignment, status tracking |
| `/admin/inventory` | Parts Management | Inventory with slide-over detail panel |
| `/admin/vendors` | Vendor Management | Profiles, contacts, ratings |
| `/admin/vendors/:id` | Vendor Profile | Purchase history, contact details |
| `/admin/purchase-invoices` | Purchase Invoice | Dynamic stock entry flow |
| `/admin/reports` | Financial Reports | P&L trends, exportable data |
| `/admin/inventory-reports` | Inventory Reports | Stock levels by category |

### Staff Portal (`/staff/*`)
| Route | Page | Description |
|-------|------|-------------|
| `/staff` | Dashboard | Daily sales KPIs, quick actions |
| `/staff/customers` | Customer Management | Searchable CRM with vehicle linking |
| `/staff/customers/:id` | Customer Profile | Timeline, vehicles, tabs |
| `/staff/sales` | Sales / POS | Parts search, cart, loyalty discounts |
| `/staff/invoice` | Invoice View | Printable, professional layout |
| `/staff/search` | Advanced Search | Filters, image grid results |

### Customer Portal (`/customer/*`)
| Route | Page | Description |
|-------|------|-------------|
| `/customer` | Dashboard | Spending overview, vehicles, AI alerts |
| `/customer/orders` | Order History | Purchase logs with spending chart |
| `/customer/parts` | Part Request | Form-based part sourcing request |
| `/customer/ai` | AI Predictions | Part failure risk, maintenance trends |
| `/customer/profile` | Profile Management | Personal info form + vehicle garage |
| `/customer/notifications` | Notifications | Alert feed with severity indicators |

## Key Features

### Automated Alerts
- Low stock alerts when inventory falls below 10 units
- Overdue credit notifications when accounts exceed 30 days

### Loyalty Logic
- 10% discount automatically applied for purchases over $5,000
- Visual indicator in POS cart and invoice view

### Dual Mode (Light/Dark)
- Full support for both themes
- Toggle in every layout's top navigation bar
- Dark mode uses class-based toggling

## API Controller Pattern

The `src/lib/api.js` exports an `ApiController` class that:
1. Uses mock data from `src/data/mock-data.js` when `VITE_USE_MOCK` is not set to `false` and no `VITE_API_URL` is set (local-first UX).
2. Calls the .NET API when `VITE_API_URL` is set and `VITE_USE_MOCK` is not `"true"`.
3. All methods map to REST endpoints (e.g., `getAdminKpis()` → `GET /api/admin/dashboard/kpis`).
4. Default API base URL is `http://localhost:5147/api` (matches `launchSettings.json` http profile).

### Full-stack local development
```bash
# Terminal 1 — PostgreSQL running; then:
cd backend/CleanApp.API
dotnet run --launch-profile http   # listens on http://localhost:5147

# Terminal 2
cd frontend
cp .env.example .env.development     # sets VITE_API_URL + VITE_USE_MOCK=false
npm install
npm run dev
```

Health check: `GET http://localhost:5147/api/health`

**Swagger UI** (enabled in Development, or when `Swagger:Enabled` is `true` in `appsettings`):

- HTTP profile: `http://localhost:5147/swagger`
- HTTPS profile: `https://localhost:7034/swagger`

Endpoints are grouped by area (Admin dashboard, Parts CRUD, Staff, Customer, etc.). Use **Try it out** to execute calls; see the API description in Swagger for `entityId` vs `publicId` rules.

Demo seed runs on API startup (idempotent). Seeded sign-in (BCrypt): use any seeded staff/customer email with password **`Demo123!`** when you add auth endpoints; dashboard data is served anonymously today for read APIs aligned with the SPA.

### Switching to production API
Set in `.env.production` or hosting env:
`VITE_API_URL=https://your-api.com/api` and `VITE_USE_MOCK=false`.

## Component Library

### UI Primitives (`src/components/ui/`)
- `Button` — CVA-based with variants: default, secondary, destructive, outline, ghost, link, surface
- `Input` — Styled text input with focus ring
- `Badge` — Status pills: default, success, warning, error, info, neutral, primary, tertiary
- `Card` — Container with header, content, footer slots
- `Icon` — Material Symbols wrapper with optional filled style
- `KpiCard` — Dashboard stat card with icon, value, trend indicator
- `DataTable` — Table, TableHeader, TableBody, TableRow, TableHead, TableCell
- `Modal` — Animated overlay dialog with backdrop blur
- `Toast` / `ToastProvider` / `useToast()` — Animated notification system (success/error/warning/info)
- `motion` exports — PageTransition, StaggerList, FadeInItem, fadeInUp, slideInRight, etc.

### State Management (`src/lib/store.js`)
- Reactive store using `useSyncExternalStore`
- `useList(key)` hook returns `{ list, add, update, remove }` for CRUD operations
- `store.get(key)` / `store.set(key, value)` for scalar data
- All mock data is mutable in-session

### PDF Generation (`src/lib/pdf.js`)
- `generateInvoicePdf(invoice)` — Creates professional invoice PDFs
- `generateReportPdf(title, columns, rows)` — Creates tabular report PDFs
- `downloadPdf(doc, filename)` — Triggers browser download
- `printPdf(doc)` — Opens browser print dialog

## Development

```bash
cd frontend
npm install
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Reference Assets

The `stitch_assets/` directory contains:
- `html/` — 25 standalone HTML mockups with inline Tailwind CDN
- `images/` — WebP screenshots of each mockup

These serve as the definitive design reference for all pages.
