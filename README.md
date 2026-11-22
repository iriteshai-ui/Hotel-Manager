# AURA Dining & Hotel Management System (Restaurant OS)

A modern, full-stack, multi-tenant Hotel & Restaurant Management Platform designed for high-turnover dining floors, quick-service restaurants, and boutique hotel properties. Powered by **React 19 + Vite 7** on the frontend and **Node.js / Express** on the backend, backed by **Supabase PostgreSQL** and **WebSockets (STOMP over SockJS)** for zero-polling real-time updates.

---

## Key Modules & Capabilities

### 1. Multi-Tenant Architecture & SuperAdmin Console (`/superadmin`)
- **Property Management**: Onboard and configure multiple hotel/restaurant properties (e.g. *Hotel Lay Bhari*, *Hotel Grand Heritage*).
- **Tenant Customization**: Property-specific currency symbols (₹ INR, $ USD, etc.), tax rates (GST/VAT), branding, and URL slug routing (`/:slug/menu`).
- **Dynamic RBAC Security**: Granular Role-Based Access Control framework with module-level permissions (`can_view`, `can_add`, `can_edit`, `can_delete`, `can_manage`) and an **Active / Inactive** soft-lifecycle approach.

---

### 2. Hotel Owner Dashboard (`/hotel-dashboard`)
Unified command center equipped with 10 dedicated operational tabs:

1. **Dining Floor Operations & Real-time Pulse**:
   - Live revenue metrics: Today's Sales, Active Kitchen Queue, Completed Orders, Raw Material Expenses, Gross & Net Profit.
   - Interactive Floor Pulse showing real-time table occupancy (Occupied, Reserved, Free).
   - Sales trend charts (Daily, Weekly, Monthly) and Kitchen Stock Warnings.
2. **Table Floor Plan & Table POS**:
   - Visual grid of all dining tables with real-time occupancy badges.
   - Strict table number uniqueness validation (prevents duplicate table creation).
   - Table lifecycle management: Soft **Active / Inactive** state toggle (no destructive hard deletes).
3. **Live Table Orders & Billing**:
   - **Streamlined Owner Order Flow**: 1-click order creation directly sets items to `SERVED` (Delivered to Table), eliminating unnecessary intermediate kitchen staging for owners.
   - **Order Modification**: Append new dishes to an existing table order or remove mistakenly added items with instant subtotal and tax recalculation.
   - **Thermal Receipt & KOT Printing**: Formatted print layouts with complete item rates, line amounts, GST breakdown, and grand totals.
4. **QR Codes & Contactless Ordering**:
   - Generate and download table-specific QR codes for customer self-ordering.
5. **Restaurant Menu Engineering**:
   - Comprehensive menu catalog with category filtering, Dietary tags (Pure Veg / Non-Veg), spicy levels, and Bestseller badges.
   - Real-time price updates and dish availability toggles.
6. **Restaurant Expenses & Vouchers**:
   - Track day-to-day raw material purchases, groceries, dairy, fuel, wages, and maintenance.
   - Breakdown by spending categories with date filtering and voucher logs.
7. **Profit & Loss (P&L) Reports**:
   - Real-time ledger calculating Net Margin: `Sales Turnover - Food COGS - Operational Expenses`.
   - Period-based performance analysis (Today, This Week, This Month).
8. **Staff & Shift Attendance Roster**:
   - Staff directory with assigned operational roles (Chef, Captain, Waiter, Cashier).
   - Shift tracking (Morning, Evening, Night) with 1-click **Mark All Present**, Half-Day, Absent, and historical logs.
9. **Kitchen Inventory & Stock Management**:
   - Track raw ingredients (grains, poultry, dairy, spices, LPG cylinders).
   - Low-stock threshold alerts with instant warnings on the dining floor.
   - **1-Click Restock**: Replenish stock quantities with automatic stock health re-evaluation (`IN_STOCK` vs `LOW_STOCK`).
   - Real-time inventory asset valuation ledger.
   - Soft Active / Inactive lifecycle for ingredients.
10. **Secondary Lodging / Hotel Rooms**:
    - Room inventory matrix (Standard, Deluxe, Suite).
    - Guest reservation ledger, stay dates, and guest CRM profiles.

---

### 3. Service Staff & Floor Operations
- **Waiter POS Console (`/waiter`)**:
  - Real-time table status view and instant table order placement.
  - Live sound notifications upon order status changes.
  - Bill settlement, thermal receipt generation, and WhatsApp billing integration.
- **Kitchen Display System (KDS) (`/kitchen`)**:
  - Live ticket queue for chefs with color-coded preparation timers.
  - Single-tap progress transitions for kitchen workflow.
- **Customer Digital Menu (`/menu?table=T1` or `/:slug/menu?table=T1`)**:
  - High-speed contactless mobile menu with instant search, category pills, veg/non-veg toggles, cart management, and order submission.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, Tailwind CSS v4, React Router DOM v7, Lucide Icons, QR Code React |
| **Backend** | Node.js (ESM), Express, CORS, SockJS, WebSocket (`ws`), STOMP Protocol Broker |
| **Database** | Supabase PostgreSQL with pooled connection management |
| **Real-Time** | WebSocket STOMP messaging for zero-polling bidirectional updates |
| **Security** | JWT / Bearer / `X-Auth-Token` authentication with dynamic RBAC permission middleware |

---

## Default Access & Portals

| Role | Username | Password | Direct Portal | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `admin123` | `/superadmin` | Platform multi-tenant administration & hotels setup |
| **Hotel Owner** | `owner_laybhari` | `password123` | `/hotel-dashboard` | Hotel Lay Bhari full owner management console |
| **Manager** | `admin` | `admin123` | `/manager` | Restaurant operations, sales analytics & menu engineering |
| **Waiter POS** | `waiter` | `waiter123` | `/waiter` | Floor captain POS, table servicing & bill printing |
| **Kitchen KDS** | `kitchen` | `kitchen123` | `/kitchen` | Live kitchen display system & cooking queue |
| **Customer QR** | *(Public)* | *(Public)* | `/menu?table=t1` | Digital QR customer ordering |

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/iriteshai-ui/Hotel-Manager.git
cd Hotel-Manager/restaurant-ordering-system

# 2. Install all dependencies (concurrently installs root, server, and client)
npm run install:all
```

### Environment Configuration

Configure environment variables in `.env` and `server/.env`:

```bash
cp .env.example .env
cp .env.example server/.env
```

Ensure the following connection parameters are configured:
```env
PORT=8081
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Running the Application (Development)

```bash
# Starts both Express backend and Vite frontend concurrently
npm run dev

# Frontend: http://localhost:5001  (or http://localhost:8081 via proxy)
# Backend:  http://localhost:8081
```

### Production Build

```bash
# 1. Build optimized React client
npm run build

# 2. Launch production Node.js server (serves API & static client bundle)
npm start
```

---

## Project Structure

```
restaurant-ordering-system/
├── client/                     # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/         # Shared UI (NavBar, BillModal, TableOrderManagement, etc.)
│   │   ├── context/            # AuthContext, SocketContext (STOMP WebSockets)
│   │   └── pages/              # HotelOwnerDashboard, SuperAdminDashboard, Waiter, Kitchen, etc.
│   ├── vite.config.js          # Reverse proxy config for /api and /ws
│   └── package.json
│
├── server/                     # Node.js Express Backend
│   ├── src/
│   │   ├── db.js               # Database connection pooler
│   │   ├── multiTenantDb.js    # Multi-tenant data layer (Postgres schema, tables, inventory, P&L)
│   │   ├── stomp.js            # SockJS & STOMP protocol broker
│   │   ├── middleware/         # Auth verification & RBAC filters
│   │   └── routes/             # API routes (auth, hotelOwner, superadmin, tables, orders, menu)
│   └── package.json
│
├── package.json                # Workspace scripts for concurrent running & building
└── README.md                   # System documentation
```

---

## License

MIT License.
