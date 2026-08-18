# SmartTransit — Implemented Admin APIs Reference

This document provides a comprehensive reference for all implemented Admin API endpoints under `app/api/admin/` and `app/api/auth/admin/`.

---

## Security & Authorization

All endpoints in this reference (except `/api/auth/admin/login`) are protected. They require:
- A valid `admin_session` cookie containing a HS256 JWT.
- The JWT payload must contain `role: "admin"`.
- Requests missing or carrying invalid credentials will return `401 Unauthorized` or `403 Forbidden`.

---

## 1. Authentication

### Login
- **Endpoint**: `POST /api/auth/admin/login`
- **Headers**: `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "username": "admin@smarttransit.com",
    "password": "hashed_password_admin_123"
  }
  ```
- **Success Response (200 OK)**:
  *Sets Cookie*: `admin_session=<JWT>; Path=/; Max-Age=86400; HttpOnly; SameSite=lax`
  ```json
  {
    "success": true,
    "user": {
      "id": "6a5d1c96c415a00e11f6c7f3",
      "name": "Super Admin",
      "email": "admin@smarttransit.com",
      "role": "admin"
    }
  }
  ```

---

## 2. Bus Management CRUD

### List Buses
- **Endpoint**: `GET /api/admin/buses`
- **Query Parameters**:
  - `status`: Filter by status (`active` / `disabled`)
  - `routeId`: Filter by assigned route ID
- **Success Response (200 OK)**: Returns an array of populated bus objects.

### Create Bus
- **Endpoint**: `POST /api/admin/buses`
- **Payload**:
  ```json
  {
    "busNumber": "DHAKA-METRO-KA-11-2222",
    "capacity": 40,
    "routeId": "route_object_id",
    "driverId": "driver_user_object_id",
    "status": "active"
  }
  ```
- **Success Response (201 Created)**: Returns the newly created bus object.

### Fetch Bus Detail
- **Endpoint**: `GET /api/admin/buses/:id`

### Update Bus
- **Endpoint**: `PATCH /api/admin/buses/:id`
- **Payload**: Fields to modify (e.g. `capacity`, `busNumber`, `routeId`, `driverId`, `status`)

### Delete Bus
- **Endpoint**: `DELETE /api/admin/buses/:id`

### Update Bus Status
- **Endpoint**: `PATCH /api/admin/buses/:id/status`
- **Payload**: `{ "status": "disabled" }` (values: `active`, `disabled`)

### Assign Driver
- **Endpoint**: `PATCH /api/admin/buses/:id/assign-driver`
- **Payload**: `{ "driverId": "user_id_here" }`

### Assign Route
- **Endpoint**: `PATCH /api/admin/buses/:id/assign-route`
- **Payload**: `{ "routeId": "route_id_here" }`

---

## 3. Route & Bus Stop Management CRUD

### List Routes
- **Endpoint**: `GET /api/admin/routes`

### Create Route
- **Endpoint**: `POST /api/admin/routes`
- **Payload**:
  ```json
  {
    "name": "Route 101: Mirpur to Motijheel",
    "stops": ["stop_id_1", "stop_id_2"],
    "distance": 12.5,
    "estimatedDuration": 45
  }
  ```

### Update Route
- **Endpoint**: `PATCH /api/admin/routes/:id`

### Delete Route
- **Endpoint**: `DELETE /api/admin/routes/:id`

### Reorder Route Stops
- **Endpoint**: `PATCH /api/admin/routes/:id/stops`
- **Payload**: `{ "stops": ["stop_id_2", "stop_id_1"] }`

### List Bus Stops
- **Endpoint**: `GET /api/admin/bus-stops`

### Create Bus Stop
- **Endpoint**: `POST /api/admin/bus-stops`
- **Payload**: Supports `latitude` & `longitude` coordinates directly:
  ```json
  {
    "name": "Mirpur 10 Circle Stop",
    "latitude": 23.8069,
    "longitude": 90.3701
  }
  ```

---

## 4. Schedule Management CRUD

### List Schedules
- **Endpoint**: `GET /api/admin/schedules`
- **Query Parameters**: `routeId`, `busId`

### Create Schedule
- **Endpoint**: `POST /api/admin/schedules`
- **Payload**:
  ```json
  {
    "routeId": "route_id",
    "busId": "bus_id",
    "departureTimes": ["08:00", "12:00"],
    "frequency": "Every 4 hours"
  }
  ```

### Toggle Schedule Activation State
- **Endpoint**: `PATCH /api/admin/schedules/:id/toggle`
- **Payload**: `{ "isActive": false }`

---

## 5. Transport Analytics APIs

All analytics endpoints accept optional filtering query parameters:
- `startDate`: ISO String (e.g. `2026-07-01`)
- `endDate`: ISO String

### Route Popularity
- **Endpoint**: `GET /api/admin/analytics/route-popularity`
- **Description**: Returns sorted list of routes with completed trip counts.

### Average Delays
- **Endpoint**: `GET /api/admin/analytics/average-delay`
- **Description**: Returns average trip delay minutes per route.

### Completed Trip Counts
- **Endpoint**: `GET /api/admin/analytics/completed-trips`
- **Query Parameters**: `groupBy` (`route`, `bus`, or `driver`)

### Fleet & Bus Utilization
- **Endpoint**: `GET /api/admin/analytics/bus-utilization`
- **Description**: Compares completed trips vs scheduled trips per bus.

### Driver Performance Evaluation
- **Endpoint**: `GET /api/admin/analytics/driver-performance`
- **Description**: Calculates completed trips, delay minutes, and punctuality rate per driver.

### Peak Activity Hours
- **Endpoint**: `GET /api/admin/analytics/peak-hours`
- **Description**: Counts trip start events aggregated by hour-of-day.

### Dashboard Master Overview
- **Endpoint**: `GET /api/admin/analytics/overview`
- **Description**: Returns KPI statistics (buses, routes, pending approvals, complaints, avg delays) for dashboard widgets.
