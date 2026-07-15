# Product Requirements Document (PRD)
## SmartTransit: Public Transportation Monitoring & Passenger Assistance System

**Course:** CSE471 – System Analysis and Design
**Group No:** 12 | **Lab Section:** 03 | **Term:** Summer 2026
**Team:** Maimuna Morshed (22301319), Lubainah Mehjabin (22301260), Zannatun Nayem (23301681)

---

## 1. Overview

SmartTransit is a full-stack web platform that modernizes public transportation by connecting three user types — **Passengers**, **Drivers**, and **Administrators** — through one centralized system. It provides real-time bus tracking, intelligent route planning, live trip monitoring, emergency reporting, weather-aware ETA prediction, and transportation analytics, all built on a single Next.js codebase.

### 1.1 Problem Statement
Public transportation in most cities lacks real-time visibility for passengers, digital operational tools for drivers, and centralized oversight for administrators — leading to poor scheduling, unsafe passenger experiences, and inefficient fleet management.

### 1.2 Goals
- Give passengers live, reliable bus tracking and ETA information.
- Give drivers a simple digital tool to manage trips, status, and incident reporting.
- Give administrators a centralized dashboard to manage the entire transport network and make data-driven decisions.
- Improve passenger safety through fast emergency reporting and response.

---

## 2. Tech Stack & Architecture

| Layer | Choice |
|---|---|
| Framework | **Next.js (App Router)** — full-stack, frontend + backend in one codebase |
| Language | JavaScript |
| Styling | TailwindCSS |
| Database | MongoDB Atlas |
| ORM/ODM | Mongoose |
| Auth | Custom JWT (access + refresh tokens, httpOnly cookies) |
| Real-time | Socket.io |
| Deployment | Vercel (or VPS if custom server is required) |

### 2.1 Architecture Notes
- **API layer:** Implemented via Next.js Route Handlers (`app/api/**/route.js`) — no separate Express server. Each route handler connects to MongoDB via a cached Mongoose connection (standard Next.js serverless pattern).
- **Real-time caveat:** Socket.io requires a persistent, long-lived server process, which standard Next.js serverless API routes do **not** support well (especially on Vercel's serverless functions). To keep this "full-stack Next.js," the recommended approach is a **custom Node server** (`server.js`) that wraps the Next.js request handler and attaches Socket.io to the same HTTP server. This means deployment target should be a VPS or Render/Railway rather than pure Vercel serverless — worth confirming as a team since it affects deployment choice.
- **Auth middleware:** Next.js `middleware.js` for route protection at the edge (checking JWT validity), plus server-side role checks inside each API route handler.
- **File/image uploads** (e.g. incident report images): stored via a cloud provider (Cloudinary or S3-compatible) rather than local disk, since serverless/VPS filesystems aren't persistent-safe.

### 2.2 External APIs
| API | Purpose |
|---|---|
| Google Maps Platform API | Live bus tracking, nearby stop search, route visualization, directions |
| OneSignal Push Notification API | Real-time push notifications (arrivals, delays, alerts, announcements) |
| OpenWeather API | Live weather data for ETA adjustment and travel advisories |

---

## 3. User Roles & Permissions

| Role | Description | Key Permissions |
|---|---|---|
| **Passenger** | Primary end-user | Search/track buses, save routes, report emergencies/lost items, submit feedback, receive notifications |
| **Driver** | Verified transport operator | Manage assigned buses/trips, update status, share GPS, report maintenance/incidents |
| **Administrator** | System super-user | Manage buses/drivers/routes/schedules, approve drivers, resolve complaints, view analytics |

---

## 4. Common Workflows (Shared)

### 4.1 Registration & Login
- Passengers/drivers register with name, email, phone, password.
- Drivers additionally submit license number + transport organization details.
- Driver accounts remain `pending` until admin approval; passengers are active immediately.
- JWT issued on login; role embedded in token payload for route-level authorization.

### 4.2 Admin Role & Transportation Management
- Admin logs into a dedicated dashboard.
- Reviews and approves/rejects driver registration requests.
- Only approved drivers and active buses become visible/usable to passengers.
- Central point for managing buses, routes, bus stops, and schedules.

---

## 5. Feature Modules

### Module 1 — Core Operations
| Owner | Feature | Sub-features |
|---|---|---|
| Member 1 | **Smart Route Planning & Live Bus Tracking** | Search by route/destination/nearby stop · live map view (Google Maps API) · route info, ETA, distance · nearby stops · save favourite routes/stops |
| Member 2 | **Driver Trip & Fleet Operation Management** | Driver dashboard · start/end trip · status updates (Running/Delayed/Maintenance/Breakdown) · live GPS broadcast (Socket.io) · auto-logged trip history (duration, distance) |
| **Member 3 (you)** | **Bus, Route & Schedule Management** | Admin CRUD for buses, routes, stops, schedules · assign buses to routes · allocate drivers · enable/disable buses · keep transport data synchronized system-wide |

### Module 2 — Safety & Personalization
| Owner | Feature | Sub-features |
|---|---|---|
| Member 1 | **Passenger Journey Assistant & Favourite Routes** | Personalized dashboard · recent searches · travel history · frequent destinations · intelligent travel suggestions |
| Member 2 | **Bus Maintenance & Incident Reporting** | Driver-submitted reports (bus, location, category, images, severity) · admin review, scheduling, technician assignment · maintenance history |
| **Member 3 (you)** | **Complaint Resolution & Smart Route Optimization** | Centralized complaint management (passenger complaints, emergency reports, service requests) · historical data analysis to flag delayed routes/overloaded buses/inefficient schedules · route optimization recommendations |

### Module 3 — Communication & Insight
| Owner | Feature | Sub-features |
|---|---|---|
| Member 1 | **Passenger Safety & Emergency Reporting** | Emergency reporting (accident, medical, harassment, suspicious activity) · auto-sends location + bus info + description to admin · report status tracking |
| Member 2 | **Driver Attendance & Performance Evaluation** | Auto-recorded attendance, completed trips, punctuality, delay frequency · driver-facing history/monthly reports · admin performance evaluation view |
| **Member 3 (you)** | **Transport Analytics Dashboard** | Route popularity, avg. delay, completed trips, driver performance, bus utilization, peak hours · filter by date/route/driver |

### Module 4 — Feedback & Intelligence
| Owner | Feature | Sub-features |
|---|---|---|
| Member 1 | **Passenger Feedback, Ratings & Lost-and-Found** | Post-trip ratings/reviews · lost item reporting & status tracking · admin recovery-status management |
| Member 2 | **Smart Notification & Communication System** | OneSignal integration · arrival/delay/cancellation/emergency/diversion alerts for passengers · admin announcements/maintenance reminders for drivers |
| **Member 3 (you)** | **Weather-aware ETA Prediction** | OpenWeather API integration · combine live weather + route/location data to adjust ETA · automatic advisories during severe weather |

> ⚠️ **Note on module mapping:** the source assignment PDF's layout was scrambled during text extraction, so this Member 1/2/3 mapping is a best-effort reconstruction. Please confirm against your actual rubric/slide deck before finalizing task assignments.

---

## 6. Core Data Models (high-level)

- **User** — `name, email, phone, passwordHash, role (passenger|driver|admin), driverDetails{licenseNo, orgName}, isApproved, status`
- **Bus** — `busNumber, capacity, routeId, driverId, status(active/disabled), currentLocation{lat,lng}`
- **Route** — `name, stops[BusStopId], distance, estimatedDuration`
- **BusStop** — `name, location{lat,lng}`
- **Schedule** — `routeId, busId, departureTimes[], frequency`
- **Trip** — `busId, driverId, startTime, endTime, distance, status`
- **Complaint** — `userId, category, description, relatedBus/Route, status, resolutionNote`
- **EmergencyReport** — `passengerId, busId, location, category, description, status`
- **MaintenanceReport** — `busId, driverId, category, images[], severity, status`
- **Feedback** — `userId, tripId, rating, comment`
- **LostItem** — `passengerId, description, status`
- **Notification** — `userId, type, message, read`

---

## 7. Non-Functional Requirements

- **Security:** password hashing (bcrypt), JWT with short-lived access tokens + refresh tokens, role-based route guards, input validation/sanitization.
- **Real-time performance:** GPS location updates should propagate to subscribed clients within ~2–3 seconds via Socket.io.
- **Scalability:** MongoDB indexes on frequently queried fields (route IDs, geolocation via `2dsphere` index).
- **Reliability:** graceful handling of third-party API failures (Google Maps/OpenWeather/OneSignal) with fallback states in UI.
- **Usability:** responsive design (mobile-first, since drivers/passengers will primarily use mobile).

---

## 8. Your Scope Summary — Member 3

**Common Workflow contribution:** Registration/Login system + Admin Role & Transportation Management dashboard shell (driver approval, route to protected admin pages).

**Module ownership:**
1. Bus, Route & Schedule Management (Module 1)
2. Complaint Resolution & Smart Route Optimization (Module 2)
3. Transport Analytics Dashboard (Module 3)
4. Weather-aware ETA Prediction (Module 4)

**Suggested build order:** Project init → Auth (Common) → Admin approval flow (Common) → Bus/Route/Schedule CRUD → Complaint management + basic route optimization logic → Analytics dashboard (depends on trip/complaint data existing) → Weather-aware ETA (depends on route/location data from Member 1).

---

## 9. Open Questions
- Deployment target given Socket.io's custom-server requirement (VPS/Render vs. Vercel serverless) — needs team decision.
- Confirm actual Member 1/2/3 feature assignments against the official rubric.
- File storage provider for incident/maintenance images (Cloudinary vs. S3-compatible).
