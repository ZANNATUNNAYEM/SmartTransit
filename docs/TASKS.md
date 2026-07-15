# SmartTransit — Task Breakdown
### Scope: Project Initialization + Common Workflow + Member 3 Modules

Format: JSON. Each task has an `id`, `title`, `description`, `dependencies` (task ids that must be done first), `estimatedEffort`, and `subtasks` (if the task is large enough to split).

```json
{
  "project": "SmartTransit",
  "scopeOwner": "Member 3",
  "phases": [
    {
      "id": "phase-0",
      "title": "Project Initialization",
      "tasks": [
        {
          "id": "0.1",
          "title": "Set up Next.js project",
          "description": "Initialize the base Next.js app that will serve as both frontend and backend.",
          "dependencies": [],
          "estimatedEffort": "1h",
          "subtasks": [
            {
              "id": "0.1.1",
              "title": "Create Next.js app",
              "description": "Run create-next-app with App Router enabled, JavaScript (not TypeScript), TailwindCSS pre-configured."
            },
            {
              "id": "0.1.2",
              "title": "Configure folder structure",
              "description": "Set up app/(routes), app/api, lib/, models/, components/, middleware.js at project root."
            },
            {
              "id": "0.1.3",
              "title": "Set up environment variables",
              "description": "Create .env.local with placeholders for MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, GOOGLE_MAPS_API_KEY, ONESIGNAL_APP_ID, ONESIGNAL_API_KEY, OPENWEATHER_API_KEY. Add .env.local to .gitignore."
            },
            {
              "id": "0.1.4",
              "title": "Initialize git repo and push skeleton",
              "description": "Create GitHub repo, push initial skeleton so teammates can clone and start in parallel."
            }
          ]
        },
        {
          "id": "0.2",
          "title": "Connect MongoDB Atlas with Mongoose",
          "description": "Set up a cached database connection utility suitable for Next.js serverless/route-handler environment.",
          "dependencies": [
            "0.1"
          ],
          "estimatedEffort": "1h",
          "subtasks": [
            {
              "id": "0.2.1",
              "title": "Create MongoDB Atlas cluster",
              "description": "Set up free-tier cluster, database user, network access (allow all IPs for dev), and get connection string."
            },
            {
              "id": "0.2.2",
              "title": "Write lib/db.js connection utility",
              "description": "Implement cached connection pattern (global.mongooseConn) to avoid creating new connections on every serverless invocation."
            },
            {
              "id": "0.2.3",
              "title": "Test connection",
              "description": "Create a temporary test API route that connects and returns a success message; verify in browser/Postman."
            }
          ]
        },
        {
          "id": "0.3",
          "title": "Set up custom server for Socket.io",
          "description": "Because Next.js serverless API routes can't hold persistent WebSocket connections, wrap Next.js in a custom Node server so Socket.io can attach to the same HTTP server.",
          "dependencies": [
            "0.1"
          ],
          "estimatedEffort": "2h",
          "subtasks": [
            {
              "id": "0.3.1",
              "title": "Write server.js",
              "description": "Create a custom server that initializes Next.js request handling manually instead of using `next dev`/`next start` directly."
            },
            {
              "id": "0.3.2",
              "title": "Attach Socket.io to HTTP server",
              "description": "Initialize a Socket.io server instance on the same underlying HTTP server object."
            },
            {
              "id": "0.3.3",
              "title": "Update package.json scripts",
              "description": "Change dev/start scripts to run `node server.js` instead of the default Next.js CLI commands."
            },
            {
              "id": "0.3.4",
              "title": "Decide deployment target",
              "description": "Confirm with team: VPS or Render/Railway (supports long-running Node process) instead of pure Vercel serverless, since Socket.io needs it."
            }
          ]
        },
        {
          "id": "0.4",
          "title": "Base UI shell",
          "description": "Set up shared layout, navigation, and role-based routing skeleton so feature pages can be added incrementally.",
          "dependencies": [
            "0.1"
          ],
          "estimatedEffort": "1.5h",
          "subtasks": [
            {
              "id": "0.4.1",
              "title": "Root layout + global styles",
              "description": "Set up app/layout.js with TailwindCSS globals, fonts, and a basic responsive shell."
            },
            {
              "id": "0.4.2",
              "title": "Placeholder route folders",
              "description": "Create empty route folders for /login, /register, /passenger, /driver, /admin so structure exists before features are built."
            }
          ]
        }
      ]
    },
    {
      "id": "phase-1",
      "title": "Common Workflow — Registration & Login System",
      "tasks": [
        {
          "id": "1.1",
          "title": "Build User model",
          "description": "Mongoose schema supporting all three roles with role-specific fields.",
          "dependencies": [
            "0.2"
          ],
          "estimatedEffort": "1h",
          "subtasks": [
            {
              "id": "1.1.1",
              "title": "Define base schema",
              "description": "Fields: name, email (unique), phone, passwordHash, role (enum: passenger/driver/admin), createdAt."
            },
            {
              "id": "1.1.2",
              "title": "Define driver-specific subfields",
              "description": "driverDetails: { licenseNumber, organizationName }, isApproved (default false for drivers, true for passengers/admin), status (pending/active/rejected)."
            },
            {
              "id": "1.1.3",
              "title": "Add password hashing hook",
              "description": "Pre-save Mongoose middleware to hash password with bcrypt before storing."
            }
          ]
        },
        {
          "id": "1.2",
          "title": "Build registration API route",
          "description": "POST /api/auth/register — handles both passenger and driver signups.",
          "dependencies": [
            "1.1"
          ],
          "estimatedEffort": "1.5h",
          "subtasks": [
            {
              "id": "1.2.1",
              "title": "Input validation",
              "description": "Validate required fields, email format, password strength, and duplicate email check."
            },
            {
              "id": "1.2.2",
              "title": "Role-conditional logic",
              "description": "If role === 'driver', require licenseNumber and organizationName, and set status = 'pending'."
            },
            {
              "id": "1.2.3",
              "title": "Save user and respond",
              "description": "Hash password, save document, return sanitized user object (no password hash) with success message."
            }
          ]
        },
        {
          "id": "1.3",
          "title": "Build login API route",
          "description": "POST /api/auth/login — authenticates and issues JWTs.",
          "dependencies": [
            "1.1"
          ],
          "estimatedEffort": "1.5h",
          "subtasks": [
            {
              "id": "1.3.1",
              "title": "Credential verification",
              "description": "Look up user by email, compare password with bcrypt."
            },
            {
              "id": "1.3.2",
              "title": "Block unapproved drivers",
              "description": "If role === 'driver' and isApproved === false, reject login with a clear pending-approval message."
            },
            {
              "id": "1.3.3",
              "title": "Issue JWT tokens",
              "description": "Generate short-lived access token and longer-lived refresh token, embed userId + role in payload, set as httpOnly cookies."
            }
          ]
        },
        {
          "id": "1.4",
          "title": "Auth middleware & route protection",
          "description": "Central logic to validate tokens and restrict access by role.",
          "dependencies": [
            "1.3"
          ],
          "estimatedEffort": "2h",
          "subtasks": [
            {
              "id": "1.4.1",
              "title": "middleware.js edge check",
              "description": "Verify JWT presence/validity for protected route groups (/admin, /driver, /passenger) and redirect to /login if missing/invalid."
            },
            {
              "id": "1.4.2",
              "title": "Server-side role guard helper",
              "description": "Reusable function used inside API route handlers to confirm req user's role matches the required role before proceeding."
            },
            {
              "id": "1.4.3",
              "title": "Refresh token endpoint",
              "description": "POST /api/auth/refresh — issues a new access token using a valid refresh token."
            },
            {
              "id": "1.4.4",
              "title": "Logout endpoint",
              "description": "POST /api/auth/logout — clears auth cookies."
            }
          ]
        },
        {
          "id": "1.5",
          "title": "Frontend auth pages",
          "description": "Register and login UI, connected to the above APIs.",
          "dependencies": [
            "1.2",
            "1.3"
          ],
          "estimatedEffort": "2h",
          "subtasks": [
            {
              "id": "1.5.1",
              "title": "Registration form",
              "description": "Form with role toggle (passenger/driver) that conditionally shows license/organization fields for drivers."
            },
            {
              "id": "1.5.2",
              "title": "Login form",
              "description": "Simple email/password form with error state handling (invalid credentials, pending approval)."
            },
            {
              "id": "1.5.3",
              "title": "Auth context/hook",
              "description": "Client-side useAuth() hook/context to expose current user + role across the app, and handle redirect-after-login by role."
            }
          ]
        }
      ]
    },
    {
      "id": "phase-2",
      "title": "Common Workflow — Admin Role & Transportation Management (shell)",
      "tasks": [
        {
          "id": "2.1",
          "title": "Admin dashboard shell",
          "description": "Protected layout for all admin pages.",
          "dependencies": [
            "1.4"
          ],
          "estimatedEffort": "1h",
          "subtasks": [
            {
              "id": "2.1.1",
              "title": "Admin layout with sidebar nav",
              "description": "Navigation links: Driver Approvals, Buses/Routes/Schedules, Complaints, Analytics, ETA settings."
            }
          ]
        },
        {
          "id": "2.2",
          "title": "Driver approval queue",
          "description": "Admin can review and approve/reject pending driver registrations.",
          "dependencies": [
            "2.1",
            "1.1"
          ],
          "estimatedEffort": "2h",
          "subtasks": [
            {
              "id": "2.2.1",
              "title": "GET /api/admin/drivers/pending",
              "description": "Returns all users with role=driver and status=pending."
            },
            {
              "id": "2.2.2",
              "title": "PATCH /api/admin/drivers/:id/approve",
              "description": "Sets isApproved=true, status='active'. Optionally triggers a notification to the driver."
            },
            {
              "id": "2.2.3",
              "title": "PATCH /api/admin/drivers/:id/reject",
              "description": "Sets status='rejected' with optional reason field."
            },
            {
              "id": "2.2.4",
              "title": "Admin UI table",
              "description": "List pending drivers with license/org details and Approve/Reject buttons."
            }
          ]
        }
      ]
    },
    {
      "id": "phase-3",
      "title": "Module 1 (Member 3) — Bus, Route & Schedule Management",
      "tasks": [
        {
          "id": "3.1",
          "title": "Data models: Bus, Route, BusStop, Schedule",
          "description": "Core entity schemas with relationships.",
          "dependencies": [
            "0.2"
          ],
          "estimatedEffort": "2h",
          "subtasks": [
            {
              "id": "3.1.1",
              "title": "BusStop schema",
              "description": "name, location {type: Point, coordinates}, with 2dsphere index for geo queries."
            },
            {
              "id": "3.1.2",
              "title": "Route schema",
              "description": "name, stops: [ObjectId ref BusStop] (ordered array), distance, estimatedDuration."
            },
            {
              "id": "3.1.3",
              "title": "Bus schema",
              "description": "busNumber, capacity, routeId (ref Route), driverId (ref User), status (active/disabled/maintenance), currentLocation."
            },
            {
              "id": "3.1.4",
              "title": "Schedule schema",
              "description": "routeId, busId, departureTimes: [String], frequencyMinutes."
            }
          ]
        },
        {
          "id": "3.2",
          "title": "Bus management CRUD",
          "description": "Admin-only endpoints and UI to manage buses.",
          "dependencies": [
            "3.1",
            "1.4"
          ],
          "estimatedEffort": "2.5h",
          "subtasks": [
            {
              "id": "3.2.1",
              "title": "API: create/list/update/delete bus",
              "description": "POST, GET, PATCH, DELETE /api/admin/buses — all guarded by admin role check."
            },
            {
              "id": "3.2.2",
              "title": "Disable/enable bus toggle",
              "description": "PATCH endpoint to flip status between active/disabled without deleting the record."
            },
            {
              "id": "3.2.3",
              "title": "Assign driver to bus",
              "description": "PATCH endpoint + UI dropdown to set/change driverId on a bus (only approved drivers selectable)."
            },
            {
              "id": "3.2.4",
              "title": "Admin UI: bus table + form",
              "description": "Table listing all buses with status badges, edit modal/form for create/update."
            }
          ]
        },
        {
          "id": "3.3",
          "title": "Route & bus stop management CRUD",
          "description": "Admin-only endpoints and UI to manage routes and stops.",
          "dependencies": [
            "3.1",
            "1.4"
          ],
          "estimatedEffort": "2.5h",
          "subtasks": [
            {
              "id": "3.3.1",
              "title": "API: CRUD for BusStop",
              "description": "Create/list/update/delete stops, each with lat/lng (ideally picked on a map in the UI)."
            },
            {
              "id": "3.3.2",
              "title": "API: CRUD for Route",
              "description": "Create/list/update/delete routes; support reordering the stops array."
            },
            {
              "id": "3.3.3",
              "title": "Assign bus(es) to route",
              "description": "PATCH endpoint to link a bus's routeId; UI dropdown in the bus form."
            },
            {
              "id": "3.3.4",
              "title": "Admin UI: route builder",
              "description": "Form to name a route and add/reorder/remove stops from it."
            }
          ]
        },
        {
          "id": "3.4",
          "title": "Schedule management CRUD",
          "description": "Admin-only endpoints and UI to manage timetables.",
          "dependencies": [
            "3.1",
            "3.3"
          ],
          "estimatedEffort": "2h",
          "subtasks": [
            {
              "id": "3.4.1",
              "title": "API: CRUD for Schedule",
              "description": "Create/list/update/delete schedules tied to a route+bus."
            },
            {
              "id": "3.4.2",
              "title": "Admin UI: schedule table",
              "description": "List schedules grouped by route, with add/edit departure times."
            },
            {
              "id": "3.4.3",
              "title": "Data sync validation",
              "description": "Prevent scheduling a disabled bus or a bus not assigned to the selected route; keep referential integrity across Bus/Route/Schedule."
            }
          ]
        }
      ]
    },
    {
      "id": "phase-4",
      "title": "Module 2 (Member 3) — Complaint Resolution & Smart Route Optimization",
      "tasks": [
        {
          "id": "4.1",
          "title": "Complaint data model",
          "description": "Schema to capture passenger complaints and service requests.",
          "dependencies": [
            "0.2"
          ],
          "estimatedEffort": "0.5h",
          "subtasks": [
            {
              "id": "4.1.1",
              "title": "Define Complaint schema",
              "description": "Define Complaint schema with fields (userId, category, description, relatedBusId, relatedRouteId, status, resolutionNote, createdAt)."
            },
            {
              "id": "4.1.2",
              "title": "Implement Mongoose model",
              "description": "Implement Mongoose model and export it from models/Complaint.js."
            },
            {
              "id": "4.1.3",
              "title": "Configure database indexes",
              "description": "Configure database indexes on query-intensive fields like userId, status, and createdAt."
            }
          ]
        },
        {
          "id": "4.2",
          "title": "Complaint submission & tracking (passenger side)",
          "description": "Allow passengers to submit and view status of complaints.",
          "dependencies": [
            "4.1",
            "1.4"
          ],
          "estimatedEffort": "1.5h",
          "subtasks": [
            {
              "id": "4.2.1",
              "title": "POST /api/complaints",
              "description": "Passenger submits complaint with category, description, and optional related bus/route reference."
            },
            {
              "id": "4.2.2",
              "title": "GET /api/complaints/mine",
              "description": "Passenger views their own submitted complaints and current status."
            }
          ]
        },
        {
          "id": "4.3",
          "title": "Complaint resolution (admin side)",
          "description": "Admin views, manages, and resolves complaints.",
          "dependencies": [
            "4.1",
            "1.4"
          ],
          "estimatedEffort": "2h",
          "subtasks": [
            {
              "id": "4.3.1",
              "title": "GET /api/admin/complaints",
              "description": "List all complaints with filters (status, category, date range)."
            },
            {
              "id": "4.3.2",
              "title": "PATCH /api/admin/complaints/:id",
              "description": "Update status (open/in-progress/resolved) and add a resolution note."
            },
            {
              "id": "4.3.3",
              "title": "Admin UI: complaint management table",
              "description": "Table with filters, status badges, and a detail/resolution modal."
            }
          ]
        },
        {
          "id": "4.4",
          "title": "Smart route optimization engine",
          "description": "Analyze historical data to flag problem routes/buses and suggest optimizations.",
          "dependencies": [
            "4.1",
            "3.1"
          ],
          "estimatedEffort": "3h",
          "subtasks": [
            {
              "id": "4.4.1",
              "title": "Define scoring criteria",
              "description": "Decide rule-based metrics: e.g. delay frequency per route, complaint count per route/bus, overload signals (capacity vs. reported ridership if available)."
            },
            {
              "id": "4.4.2",
              "title": "Aggregation query implementation",
              "description": "MongoDB aggregation pipeline joining Trip/Complaint/Schedule data to compute per-route/per-bus scores."
            },
            {
              "id": "4.4.3",
              "title": "GET /api/admin/route-optimization",
              "description": "Endpoint returning ranked list of flagged routes/buses with reasons (e.g. 'high delay frequency', 'high complaint volume')."
            },
            {
              "id": "4.4.4",
              "title": "Admin UI: recommendations panel",
              "description": "Card/list view showing flagged routes with supporting stats and suggested action text."
            }
          ]
        }
      ]
    },
    {
      "id": "phase-5",
      "title": "Module 3 (Member 3) — Transport Analytics Dashboard",
      "tasks": [
        {
          "id": "5.1",
          "title": "Analytics aggregation endpoints",
          "description": "Backend endpoints computing key metrics from Trip/Bus/Complaint/User data.",
          "dependencies": [
            "3.1",
            "4.1"
          ],
          "estimatedEffort": "3h",
          "subtasks": [
            {
              "id": "5.1.1",
              "title": "Route popularity metric",
              "description": "Aggregate trip counts per route over a selected date range."
            },
            {
              "id": "5.1.2",
              "title": "Average delay metric",
              "description": "Compute average delay (scheduled vs. actual trip times) per route/bus."
            },
            {
              "id": "5.1.3",
              "title": "Completed trips & bus utilization",
              "description": "Count completed trips per bus, calculate utilization rate against scheduled trips."
            },
            {
              "id": "5.1.4",
              "title": "Driver performance summary",
              "description": "Pull punctuality/delay stats per driver for dashboard display (data likely populated by Member 2's attendance feature — coordinate on schema)."
            },
            {
              "id": "5.1.5",
              "title": "Peak travel hours",
              "description": "Aggregate trip/passenger activity by hour-of-day to identify peak windows."
            }
          ]
        },
        {
          "id": "5.2",
          "title": "Filtering support",
          "description": "Allow analytics queries to be filtered by date range, route, or driver.",
          "dependencies": [
            "5.1"
          ],
          "estimatedEffort": "1h",
          "subtasks": [
            {
              "id": "5.2.1",
              "title": "Parse date range queries",
              "description": "Add support for parsing date range queries (startDate, endDate) in the aggregation endpoints."
            },
            {
              "id": "5.2.2",
              "title": "Integrate route-based filtering",
              "description": "Integrate route-based filtering into the analytics pipelines."
            },
            {
              "id": "5.2.3",
              "title": "Integrate driver-based filtering",
              "description": "Integrate driver-based filtering into the analytics pipelines."
            },
            {
              "id": "5.2.4",
              "title": "Implement filter query validation",
              "description": "Implement validation for query parameters to prevent database errors."
            }
          ]
        },
        {
          "id": "5.3",
          "title": "Admin UI: analytics dashboard",
          "description": "Visual dashboard consuming the aggregation endpoints.",
          "dependencies": [
            "5.1",
            "5.2"
          ],
          "estimatedEffort": "3h",
          "subtasks": [
            {
              "id": "5.3.1",
              "title": "Charting setup",
              "description": "Integrate a charting library (e.g. recharts) for bar/line charts."
            },
            {
              "id": "5.3.2",
              "title": "Dashboard layout",
              "description": "Grid of cards/charts: route popularity, delays, utilization, peak hours, driver performance."
            },
            {
              "id": "5.3.3",
              "title": "Filter controls",
              "description": "Date range picker + route/driver dropdown filters wired to the API."
            }
          ]
        }
      ]
    },
    {
      "id": "phase-6",
      "title": "Module 4 (Member 3) — Weather-aware ETA Prediction",
      "tasks": [
        {
          "id": "6.1",
          "title": "OpenWeather API integration",
          "description": "Backend service to fetch live weather data.",
          "dependencies": [
            "0.1"
          ],
          "estimatedEffort": "1.5h",
          "subtasks": [
            {
              "id": "6.1.1",
              "title": "Weather fetch utility",
              "description": "lib/weather.js — function to call OpenWeather API by lat/lng and return normalized condition (clear/rain/storm/etc.) + severity."
            },
            {
              "id": "6.1.2",
              "title": "Caching layer",
              "description": "Cache weather results per location for a few minutes to avoid excessive API calls."
            }
          ]
        },
        {
          "id": "6.2",
          "title": "ETA adjustment logic",
          "description": "Combine base ETA (from Member 1's Google Maps integration) with weather severity.",
          "dependencies": [
            "6.1"
          ],
          "estimatedEffort": "2h",
          "subtasks": [
            {
              "id": "6.2.1",
              "title": "Define adjustment rules",
              "description": "e.g. +10% ETA for moderate rain, +25% for heavy rain/storm, no change for clear weather."
            },
            {
              "id": "6.2.2",
              "title": "GET /api/eta/:busId",
              "description": "Endpoint returning base ETA + weather-adjusted ETA + condition label, using Member 1's live location data as input."
            }
          ]
        },
        {
          "id": "6.3",
          "title": "Weather advisory notifications",
          "description": "Notify passengers during severe weather.",
          "dependencies": [
            "6.1"
          ],
          "estimatedEffort": "1.5h",
          "subtasks": [
            {
              "id": "6.3.1",
              "title": "Advisory trigger logic",
              "description": "When severity crosses a threshold, generate an advisory message for affected routes."
            },
            {
              "id": "6.3.2",
              "title": "Send via OneSignal",
              "description": "Coordinate with Member 2's notification integration to dispatch the advisory (or implement directly if not yet built)."
            }
          ]
        },
        {
          "id": "6.4",
          "title": "Passenger-facing UI",
          "description": "Display adjusted ETA and advisories on the passenger bus-tracking view.",
          "dependencies": [
            "6.2"
          ],
          "estimatedEffort": "1h",
          "subtasks": [
            {
              "id": "6.4.1",
              "title": "Build weather advisory banner component",
              "description": "Build a weather advisory banner component that displays active warnings/alerts."
            },
            {
              "id": "6.4.2",
              "title": "Update bus-tracking cards",
              "description": "Update the bus-tracking cards to show both the base ETA and the weather-adjusted ETA."
            },
            {
              "id": "6.4.3",
              "title": "Add weather adjustment tooltip/badge",
              "description": "Add a visual indicator/tooltip describing current weather conditions and the adjustment percentage."
            }
          ]
        }
      ]
    }
  ]
}
```
