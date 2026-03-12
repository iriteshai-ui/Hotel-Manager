# Restaurant Ordering System

## Overview
A real-time restaurant ordering system with a React/Vite frontend and a Spring Boot backend. It uses WebSockets (STOMP over SockJS) for live updates across multiple roles: Customer, Waiter, Kitchen, and Manager.

## Architecture

### Frontend (`/client`)
- **Framework:** React 19 + Vite 7
- **Styling:** Tailwind CSS v4
- **Routing:** React Router DOM v7
- **Real-time:** @stomp/stompjs + sockjs-client
- **Port:** 5000 (dev)

### Backend (`/server`)
- **Framework:** Spring Boot 3.2.4 (Java 17+)
- **In-memory data store** (no database — state lives in `RestaurantService`)
- **WebSocket:** STOMP broker at `/ws` endpoint
- **REST API:** `/api/initial_data`, `/api/menu`, etc.
- **Port:** 8081

## Pages / Routes
| Path | Description |
|------|-------------|
| `/` | Home / landing |
| `/menu` | Customer menu for ordering |
| `/kitchen` | Kitchen display for preparing orders |
| `/waiter` | Waiter dashboard |
| `/manager` | Manager dashboard |

## Workflows
- **Start application** — Runs `cd client && npm run dev` on port 5000 (webview)
- **Start Backend** — Runs `cd server && java -jar target/restaurant-server-0.0.1-SNAPSHOT.jar` on port 8081 (console)

## Key Configuration
- Frontend connects to backend via `http://${window.location.hostname}:8081`
- WebSocket endpoint: `http://${window.location.hostname}:8081/ws`
- CORS and WebSocket allowed origins are set to `*` in Spring Boot config

## Building the Backend
```bash
cd server && mvn package -DskipTests
```
The compiled JAR is at `server/target/restaurant-server-0.0.1-SNAPSHOT.jar`.

## Dependencies
- Root: `concurrently` (for running both servers together)
- Client: see `client/package.json`
- Server: see `server/pom.xml` (Spring Boot, WebSocket, Lombok)
