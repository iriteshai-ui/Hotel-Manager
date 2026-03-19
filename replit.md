# AURA Dining — Restaurant Ordering System

## Overview
A real-time restaurant ordering system with a React/Vite frontend and a Spring Boot backend. Uses WebSockets (STOMP over SockJS) for live updates across four roles: Customer, Waiter, Kitchen, and Manager.

## Architecture

### Frontend (`/client`)
- **Framework:** React 19 + Vite 7
- **Styling:** Tailwind CSS v4
- **Routing:** React Router DOM v7 (protected routes per role)
- **Real-time:** @stomp/stompjs + sockjs-client
- **Auth:** Token stored in localStorage, sent as `X-Auth-Token` header
- **Port:** 5000 (dev)

### Backend (`/server`)
- **Framework:** Spring Boot 3.x (Java 19)
- **Database:** PostgreSQL (via `DATABASE_URL` env var / `PGHOST` etc.)
- **ORM:** Spring Data JPA + Hibernate
- **WebSocket:** STOMP broker at `/ws` endpoint
- **Auth:** Token-based via `X-Auth-Token` header (AuthFilter, AuthService)
- **Port:** 8081

## Pages / Routes
| Path | Description | Auth Required |
|------|-------------|---------------|
| `/` | Home / landing | No |
| `/login` | Staff login portal | No |
| `/menu?table=tN` | Customer menu for ordering | No (public QR) |
| `/kitchen` | Kitchen display for preparing orders | KITCHEN / MANAGER |
| `/waiter` | Waiter dashboard with bill printing | WAITER / MANAGER |
| `/manager` | Manager dashboard — QR codes, table management, insights | MANAGER only |

## Features Implemented
- **Auth:** Login/logout with role-based access (MANAGER, WAITER, KITCHEN)
- **Default credentials:** admin/admin123, waiter/waiter123, kitchen/kitchen123
- **Menu search:** Real-time text search + category filter on customer menu
- **Bill printing:** Print bill (window.print()) + WhatsApp share from Waiter/Manager
- **Table management:** Add / free / delete tables from Manager dashboard
- **Daily insights:** Revenue, order counts, top items, order log
- **QR codes:** Per-table QR that opens customer menu URL
- **Tab title:** Customer menu sets `document.title` to "Table N - AURA Dining"

## DB Tables
- `app_users` — Staff user accounts with role enum
- `restaurant_tables` — Table number, name, status, currentOrderId
- `orders` — Order entity with items stored as JSON TEXT column

## Workflows
- **Start application** — `cd client && npm run dev` (port 5000)
- **Start Backend** — `cd server && java -jar target/restaurant-server-0.0.1-SNAPSHOT.jar` (port 8081)

## Building
```bash
# Frontend
cd client && npm run build
cp -r client/dist/. server/src/main/resources/static/

# Backend JAR
cd server && mvn clean package -DskipTests
```

## Key Files
- `client/src/context/AuthContext.jsx` — Auth state provider
- `client/src/SocketContext.jsx` — WebSocket + REST context, token-aware
- `client/src/components/BillModal.jsx` — Print/WhatsApp bill modal
- `server/src/main/java/com/restaurant/filter/AuthFilter.java` — Token auth filter
- `server/src/main/java/com/restaurant/services/AuthService.java` — Token store
- `server/src/main/java/com/restaurant/services/RestaurantService.java` — Orders + tables (DB)
- `server/src/main/java/com/restaurant/controller/InsightsController.java` — Daily analytics
- `server/src/main/java/com/restaurant/controller/TableController.java` — Table CRUD
