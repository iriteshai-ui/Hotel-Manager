# AURA Dining & Hotel Management System

A modern, real-time Hotel & Restaurant Management platform featuring a high-performance **React 19 + Vite 7** frontend and a **Node.js / Express** backend backed by **Supabase PostgreSQL** and **WebSockets (STOMP over SockJS)**.

---

## Features

- **Multi-Role Dashboards**:
  - **Manager Portal**: Real-time sales insights, revenue analytics, table management, QR code generation, and team controls.
  - **Waiter Dashboard**: Real-time order notifications, table delivery routing, instant bill printing (`window.print()`), and WhatsApp billing.
  - **Kitchen Display System (KDS)**: Live prep queue with status progression (Placed $\rightarrow$ Preparing $\rightarrow$ Ready).
  - **Customer QR Ordering**: Contactless digital menu with real-time text search, category filtering, cart, and instant order placement.
- **Real-Time Live Sync**: WebSocket STOMP broker broadcasting table status changes, order placement, and kitchen updates across all devices with zero polling.
- **Supabase PostgreSQL**: Persistent cloud database with auto-seeding for staff users, tables, and signature menu items.

---

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, React Router DOM v7, Lucide Icons, QR Code React
- **Backend**: Node.js (ESM), Express, CORS, SockJS, WebSocket (WS), STOMP Broker
- **Database**: Supabase PostgreSQL with connection pooling
- **Security**: Token-based authentication with role-based access control (RBAC)

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested on Node 20 & 24)
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/iriteshai-ui/Hotel-Manager.git
cd Hotel-Manager

# Install all dependencies (root, backend, and frontend)
npm run install:all
```

### Environment Configuration

Copy `.env.example` to `.env` in both the root and `server/` directories and provide your Supabase credentials:

```bash
cp .env.example .env
cp .env.example server/.env
```

Set the following variables:
```env
PORT=8081
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Running the Application

```bash
# Start both backend and frontend concurrently
npm run dev

# Frontend runs on: http://localhost:5001
# Backend runs on:  http://localhost:8081
```

### Building for Production

```bash
# Build the client
npm run build

# Start the unified Node.js server (serves API & static frontend)
npm start
```

---

## Default Staff Credentials

| Role | Username | Password | Direct Portal |
| :--- | :--- | :--- | :--- |
| **Manager** | `admin` | `admin123` | `/manager` |
| **Waiter** | `waiter` | `waiter123` | `/waiter` |
| **Kitchen** | `kitchen` | `kitchen123` | `/kitchen` |
| **Customer QR** | *(Public)* | *(Public)* | `/menu?table=t1` |

---

## Project Structure

```
├── client/                     # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/         # NavBar, BillModal, etc.
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # CustomerMenu, Kitchen, Waiter, Manager
│   │   └── SocketContext.jsx   # Real-time WebSocket + STOMP provider
│   └── vite.config.js          # Vite config & API/WS reverse proxy
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── db.js               # Supabase PostgreSQL client & data layer
│   │   ├── stomp.js            # SockJS & WebSocket STOMP protocol broker
│   │   ├── middleware/         # Auth filter & token validation
│   │   └── routes/             # Auth, Tables, Orders, Menu, Insights
│   └── package.json
│
├── package.json                # Unified workspace scripts
└── README.md
```

---

## License

MIT License.
