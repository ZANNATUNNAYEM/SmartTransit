# SmartTransit — Admin API Endpoints

All routes are Next.js Route Handlers under `app/api/`. Every endpoint except the
Authentication section requires a valid JWT with `role: admin`, enforced via
`middleware.js` plus a server-side role guard inside each handler.

---

## 1. Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/admin/login` | Login for admins — returns user profile and sets JWT cookie |
| POST | `/api/auth/register` | Register (used by passengers/drivers; admin accounts typically seeded, not self-registered) |
| POST | `/api/auth/login` | Login (general) — returns access + refresh JWT (role embedded in payload) |
| POST | `/api/auth/refresh` | Issue new access token from a valid refresh token |
| POST | `/api/auth/logout` | Clear auth cookies |
| GET | `/api/auth/me` | Return currently authenticated user's profile + role |

### POST `/api/auth/admin/login`

Performs credentials-based login for administrative accounts, setting an HTTP-Only session cookie.

#### Headers
`Content-Type: application/json`

#### Request Body
```json
{
  "username": "admin@smarttransit.com",
  "password": "hashed_password_admin_123"
}
```

#### Responses

- **`200 OK`**: Login successful.
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

- **`400 Bad Request`**: Missing credentials.
  ```json
  {
    "error": "Username (email) and password are required"
  }
  ```

- **`401 Unauthorized`**: User not found or incorrect password.
  ```json
  {
    "error": "Invalid email or password"
  }
  ```

- **`403 Forbidden`**: Valid credentials, but the user does not have the `admin` role.
  ```json
  {
    "error": "Access denied. Admins only."
  }
  ```

- **`500 Internal Server Error`**: Database error or unexpected server failure.
  ```json
  {
    "error": "Internal Server Error"
  }
  ```

---

## 2. Admin Dashboard (overview)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard/summary` | Top-level KPIs: total buses, active drivers, pending approvals, open complaints, today's trips |
| GET | `/api/admin/dashboard/alerts` | Recent unresolved emergencies + high-severity maintenance reports (for a dashboard "needs attention" widget) |

---

## 3. User Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users, filterable by `role`, `status` (query params) |
| GET | `/api/admin/users/:id` | Get single user detail |
| PATCH | `/api/admin/users/:id` | Update a user (e.g. edit name/phone, force role change) |
| DELETE | `/api/admin/users/:id` | Deactivate/remove a user (soft-delete via `status`) |
| GET | `/api/admin/drivers/pending` | List drivers awaiting approval |
| PATCH | `/api/admin/drivers/:id/approve` | Approve a pending driver → `isApproved: true`, `status: active` |
| PATCH | `/api/admin/drivers/:id/reject` | Reject a pending driver with optional reason |
| PATCH | `/api/admin/drivers/:id/disable` | Disable an already-active driver (e.g. after violations) |

---

## 4. Bus Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/buses` | List all buses (filter by `status`, `routeId`) |
| POST | `/api/admin/buses` | Create a new bus |
| GET | `/api/admin/buses/:id` | Get single bus detail |
| PATCH | `/api/admin/buses/:id` | Update bus (capacity, busNumber, etc.) |
| DELETE | `/api/admin/buses/:id` | Delete a bus |
| PATCH | `/api/admin/buses/:id/status` | Enable/disable/mark maintenance — dedicated status-only endpoint |
| PATCH | `/api/admin/buses/:id/assign-driver` | Assign or reassign a driver to this bus |
| PATCH | `/api/admin/buses/:id/assign-route` | Assign or reassign this bus to a route |

---

## 5. Route & Bus Stop Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/routes` | List all routes |
| POST | `/api/admin/routes` | Create a route |
| GET | `/api/admin/routes/:id` | Get single route with populated stops |
| PATCH | `/api/admin/routes/:id` | Update route name/metadata |
| DELETE | `/api/admin/routes/:id` | Delete a route |
| PATCH | `/api/admin/routes/:id/stops` | Reorder/add/remove stops on a route (send new ordered stop-id array) |
| GET | `/api/admin/bus-stops` | List all bus stops |
| POST | `/api/admin/bus-stops` | Create a bus stop (name + lat/lng) |
| GET | `/api/admin/bus-stops/:id` | Get single stop detail |
| PATCH | `/api/admin/bus-stops/:id` | Update stop name/location |
| DELETE | `/api/admin/bus-stops/:id` | Delete a stop |

---

## 6. Schedule Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/schedules` | List all schedules (filter by `routeId`, `busId`) |
| POST | `/api/admin/schedules` | Create a schedule for a route+bus |
| GET | `/api/admin/schedules/:id` | Get single schedule detail |
| PATCH | `/api/admin/schedules/:id` | Update departure times / frequency |
| DELETE | `/api/admin/schedules/:id` | Delete a schedule |
| PATCH | `/api/admin/schedules/:id/toggle` | Activate/deactivate a schedule without deleting it |

---

## 7. Transport Analytics Dashboard

All accept common query params: `startDate`, `endDate`, `routeId`, `busId`, `driverId` for filtering.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/analytics/route-popularity` | Trip counts per route over the selected range |
| GET | `/api/admin/analytics/average-delay` | Average delay per route/bus |
| GET | `/api/admin/analytics/completed-trips` | Completed trip counts per bus/route/driver |
| GET | `/api/admin/analytics/bus-utilization` | Utilization rate (completed trips vs. scheduled) per bus |
| GET | `/api/admin/analytics/driver-performance` | Punctuality, delay frequency, completed trips per driver |
| GET | `/api/admin/analytics/peak-hours` | Trip/passenger activity aggregated by hour-of-day |
| GET | `/api/admin/analytics/overview` | Combined single-call response bundling the above for the main dashboard view |

---

## Notes / open decisions

- `PATCH /status`, `/assign-driver`, `/assign-route` on buses are separate dedicated
  endpoints rather than folded into one generic `PATCH /api/admin/buses/:id` — keeps
  permission checks and audit logging simpler per action. Can be merged into the
  general update payload if the team prefers fewer, more generic endpoints.
- `GET /api/admin/analytics/overview` is a practical bundling endpoint (not explicit
  in the original PRD) so the dashboard's first paint doesn't need 6 parallel fetches.
  Drop it if granular-only endpoints are preferred.
