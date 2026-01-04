# Architecture Map

## Routes/Pages

### Public Routes
- `/` - HomePage
- `/quote` - QuotePage (quote request form)
- `/track` - TrackingPage (shipment tracking)
- `/about` - AboutPage
- `/blog` - BlogListPage (list published blog posts)
- `/blog/:slug` - BlogPostPage (single blog post)
- `/privacy` - PrivacyPage
- `/terms` - TermsPage

### Auth Routes (Gated by AuthPublicGate)
- `/login` - ClientLoginPage
- `/register` - ClientRegisterPage
- `/admin/login` - AdminLoginPage
- `/post-login` - PostLoginRedirectPage (redirects based on role)

### Protected Routes

#### Client Only (`RequireRoles: ["client"]`)
- `/my-shipments` - MyShipmentsPage

#### Admin/Employee (`RequireRoles: ["admin", "employee"]`)
- `/admin` - AdminLayout wrapper
  - `/admin` (index) - AdminDashboardPage
  - `/admin/shipments` - AdminShipmentsPage
  - `/admin/quotes` - AdminQuotesPage
  - `/admin/blog` - AdminBlogPage
  - `/admin/users` - AdminUsersPage (admin-only nested route)

---

## Key Components

### Layout Components
- `Header.tsx` - Main navigation, auth UI, role-based menu items
- `Footer.tsx` - Site footer
- `AdminLayout.tsx` - Admin sidebar layout with nested routing

### Feature Components
- `admin/LiveShipmentsCard.tsx` - Dashboard widget showing shipment statuses

---

## Services/API Files

### Frontend Services (`src/services/`)
- `apiClient.ts` - Base HTTP client with auth (fetchWithAuth, handleResponse, token management)
- `authService.ts` - Client registration (registerClient)
- `shipmentsService.ts` - Shipment CRUD operations (create, list, update status, get by ID, client list)
- `quotesService.ts` - Quote creation (public) and admin quote listing
- `adminQuotesService.ts` - Admin quote operations
- `adminUsersService.ts` - User management (list, create users with roles)
- `blogService.ts` - Blog post operations (public & admin)
- `states.ts` - US states data (utility)

### API Configuration
- `config/api.ts` - API_BASE_URL configuration

### Backend Server (`server/`)
- `index.js` - Express server with routes:
  - `/api/health` - Health check
  - `/api/notifications/status` - Send shipment status emails
  - `/api/notifications/new-quote` - Send quote notifications
  - `/api/blog` - Public blog endpoints (GET list, GET by slug)
  - `/api/admin/blog` - Admin blog CRUD (GET, POST, PATCH, DELETE)
  - `/api/admin/users` - User management (GET, POST)
  - `/api` - Mounted shipments router
- `routes/shipmentsRouter.js` - Shipment & quote routes:
  - POST `/api/quotes` - Create quote (public)
  - GET `/api/quotes` - List quotes (admin/employee)
  - POST `/api/shipments/from-quote` - Convert quote to shipment
  - GET `/api/shipments` - List shipments (admin/employee)
  - GET `/api/shipments/:id` - Get shipment by ID
  - PATCH `/api/shipments/:id/status` - Update shipment status
- `middleware/auth.js` - Auth middleware (requireAuth, requireRole, requireOneOf)
- `lib/supabaseAdmin.js` - Supabase admin client (service role)
- `notifications/adminAlerts.js` - Admin email notifications
- `notifications/transportStatus.js` - Shipment status email notifications
- `utils/email.js` - Email utility functions

---

## Auth/Session Handling

### Frontend Auth
- `context/AuthContext.tsx` - Main auth context provider
  - Manages user state, role, loading state
  - Fetches role from `profiles` table
  - Auto-creates client profile on first login
  - Handles session refresh and auth state changes
  - Exports `useAuth()` hook and `Role` type
- `routes/RequireRoles.tsx` - Route guard component
  - Checks user role against allowed roles
  - Redirects unauthorized users
- `routes/AuthPublicGate.tsx` - Conditional public access gate
  - Controls public access via `VITE_AUTH_PUBLIC_ENABLED` env var
  - Always allows login routes
- `services/authService.ts` - Client registration
- `utils/adminAuth.ts` - Admin key storage (localStorage utilities)

### Backend Auth
- `server/middleware/auth.js` - Express middleware
  - `requireAuth` - Validates JWT token
  - `requireRole(role)` - Ensures specific role
  - `requireOneOf([roles])` - Ensures one of multiple roles
- Uses Supabase JWT tokens for authentication

### Auth Flow
1. User registers/logs in via Supabase Auth
2. `AuthContext` fetches session and role from `profiles` table
3. If no profile exists, auto-creates one with "client" role
4. Role-based route guards enforce access control
5. API calls include JWT token in Authorization header
6. Backend middleware validates token and role

---

## Database/External Services
- **Supabase** - Auth + Database (PostgreSQL)
  - Tables: `profiles`, `shipments`, `quotes`, `blog_posts`
  - RLS (Row Level Security) policies
  - Database functions (e.g., `convert_quote_to_shipment`)

---

## Unused/Duplicate Files

### Unused Files
- `src/pages/BlogPage.tsx` - **UNUSED** (stub component, not imported in App.tsx)
  - Only `BlogListPage` and `BlogPostPage` are used
  - Consider deleting if not needed

### Potential Duplications
- `apiClient.ts` and `shipmentsService.ts` both define `getAccessTokenOrThrow()` with similar logic
- `config/api.ts` and inline API_BASE_URL definitions in services (prefer using config/api.ts)

---

## Notes
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: Express.js + Node.js
- Auth: Supabase Auth with JWT tokens
- Routing: React Router v7 with nested routes
- State: React Context API for auth state
- API: RESTful endpoints with Bearer token auth

