Bites Inventory Management System - System Design
1. Document Purpose
This document describes the current system design of the Bites Inventory Management System as implemented in the project source code. It covers the application architecture, frontend structure, backend integration, authentication and authorization model, core business modules, data flow, storage, realtime behavior, reporting, deployment, and security-related configuration.
This document reflects the current codebase. Secrets and environment-variable values are intentionally excluded.

2. System Overview
Bites Inventory is a web-based catering inventory management system used to manage inventory-related operations across the business. The application centralizes operational data for events, items, purchasing, suppliers, warehouses, staff, dispatches, returns, reports, users, roles, and system settings.
The system is implemented as a React single-page application (SPA). The frontend is built with React and Vite and communicates directly with Supabase, which provides authentication, PostgreSQL-backed data access, Storage, Realtime subscriptions, and server-side functions used by selected flows. The production frontend is configured for deployment on Vercel.
Main capabilities
- User authentication and password recovery
- Role-based access control and module permissions
- Dashboard and operational summaries
- Event management and event staff assignment
- Item and category management
- Item image management
- Purchase order management and receiving
- Supplier management
- Warehouse and inventory management
- Dispatch management
- Return management
- Driver and waiter/staff management
- Staff payment tracking
- Reports and exports
- Notifications and realtime updates
- User, role, permission, and company settings management
- Arabic/English internationalization
3. High-Level Architecture
+-----------------------------+
|        End User             |
|      Web Browser            |
+-------------+---------------+
              |
              | HTTPS
              v
+-----------------------------+
|       React SPA             |
|       Vite Build            |
|                             |
| Pages / Components          |
| Context / Auth              |
| Services                    |
| i18n                        |
+-------------+---------------+
              |
              | Supabase JS Client
              v
+-----------------------------+
|          Supabase           |
|                             |
| Auth                        |
| PostgreSQL / Data API       |
| Storage                     |
| Realtime                    |
| Functions                   |
+-------------+---------------+
              |
              v
+-----------------------------+
| Application Data            |
| Inventory / Events / Staff  |
| Purchasing / Roles / etc.   |
+-----------------------------+

Frontend hosting: Vercel
Architectural style
The frontend follows a layered client-side structure:
UI Pages & Reusable Components
            |
            v
React Context / Page State
            |
            v
Service Layer
            |
            v
Supabase Client
            |
            v
Supabase Backend Services
This separation keeps most database operations outside presentation components and allows pages to consume business-oriented service functions.
4. Technology Stack
Frontend
- React 19
- React DOM
- Vite 8
- React Router DOM 7
- React Context API
- CSS
- React Icons
- Recharts
Backend / Data Platform
- Supabase JavaScript SDK
- Supabase Authentication
- Supabase PostgreSQL / Data API
- Supabase Storage
- Supabase Realtime
- Supabase Functions for selected authentication-related flows
Internationalization
- i18next
- react-i18next
Reporting and file export
- jsPDF
- jsPDF AutoTable
- XLSX
Deployment
- Vercel
5. Frontend Application Structure
The main source structure is organized as follows:
src/
├── assets/
│   ├── icons/
│   └── images/
├── components/
│   ├── auth/
│   ├── common/
│   └── dashboard/
├── context/
├── lib/
├── pages/
├── services/
├── styles/
├── utils/
├── App.jsx
├── i18n.js
└── main.jsx
Pages
Page components represent the primary application screens:
- Dashboard
- Events
- Items
- Purchase
- Suppliers
- Warehouse
- Staff
- Dispatch
- Returns
- Reports
- Settings
- Authentication and password recovery screens
Reusable components
The project includes shared components such as:
- ProtectedRoute - route-level authentication and permission enforcement
- AppDialog - shared application dialog behavior
- Sidebar - primary application navigation
- Topbar - top navigation, user/profile behavior, notifications, and avatar handling
- StatCard - dashboard statistics
- DashboardCharts - dashboard visualizations
- EventTable - dashboard event presentation
Styling
Screen-specific and shared CSS files are kept under src/styles. Assets are stored separately under src/assets.
6. Application Routing
App.jsx defines the application's browser routes using React Router.
Public routes
/                       Get Started
/login                  Login
/forgot-password        Forgot Password
/verify-reset-otp       Verify Reset OTP
/reset-password         Reset Password
Protected routes
/dashboard              Dashboard
/events                 Events
/items                  Items
/purchase               Purchase
/suppliers              Suppliers
/warehouse              Warehouse
/staff                  Staff
/dispatch               Dispatch
/returns                Returns
/reports                 Reports
/settings                Settings / Users / Roles
Each protected route is associated with a module permission. The settings route accepts access through either the Settings or Users / Role permission module.
Unknown routes are redirected to /.
7. Authentication Design
Authentication is managed through Supabase Auth and centralized in AuthContext.
Authentication flow
User opens application
        |
        v
Supabase session is checked
        |
   +----+----+
   |         |
No session  Session exists
   |         |
Login       Load profile
             |
             v
       Load role + permissions
             |
             v
       Allow authorized routes
AuthContext maintains:
- Current authenticated user
- Supabase session
- Application profile
- Authentication loading state
- Profile refresh behavior
- Sign-out behavior
- Profile avatar update behavior
- Permission helpers
Profile loading
After authentication, the system loads the user's record from profiles together with the assigned roles record and its role_permissions.
The permission rows are normalized into an object that can be checked throughout the application.
8. Authorization and Role-Based Access Control
The application implements module-level RBAC.
Each permission can contain four operations:
View
Add
Edit
Delete
A role's permissions are stored through the roles and role_permissions data structures.
Route protection
ProtectedRoute verifies, in order:
1. Authentication has finished loading.
2. A user is authenticated.
3. A corresponding application profile exists.
4. The profile is active.
5. A role has been assigned.
6. The role has permission for the requested module/action.
If access is not available, the system attempts to redirect the user to the first module they are allowed to view. If no module is accessible, an access-denied state is shown.
Permission modules represented in routing
- Dashboard
- Events
- Items
- Purchase
- Suppliers
- Warehouse
- Staff
- Dispatch
- Returns
- Reports
- Settings
- Users / Role
The Settings module also provides administration interfaces for roles, employees/users, and permission assignment.
9. State Management
The project uses the React Context API for shared client-side state.
Current context providers include:
- AuthContext
- DialogContext
- EventsContext
- ItemsContext
- PurchasesContext
- SuppliersContext
- WarehousesContext
- DispatchesContext
- ReturnsContext
- SettingsContext
- StaffContext
The providers are composed around the application in main.jsx.
The project also uses page-local React state for UI forms, filters, modals, loading states, and screen-specific behavior.
10. Service Layer
Database-facing business operations are mainly organized under src/services.
services/
├── dashboardService.js
├── dispatchService.js
├── eventsService.js
├── notificationService.js
├── purchaseService.js
├── reportsService.js
├── returnsService.js
├── settingsService.js
├── staffPaymentService.js
├── staffService.js
├── suppliersService.js
└── warehouseService.js
Responsibilities
Dashboard Service
- Loads dashboard metrics and aggregated operational information.
Events Service
- Loads events.
- Creates, updates, and removes events.
- Loads active drivers and waiters.
- Produces event detail data for export/use by the UI.
Purchase Service
- Loads purchase page data.
- Creates and updates purchase orders.
- Changes purchase status.
- Processes receiving.
- Removes purchase records.
Supplier Service
- Loads suppliers.
- Creates and updates suppliers.
- Changes supplier status.
- Removes suppliers.
Warehouse Service
- Loads warehouses.
- Creates, updates, and removes warehouse records.
Dispatch Service
- Loads dispatch data and warehouse items.
- Creates and updates dispatches.
- Updates dispatch status.
- Removes dispatches.
Returns Service
- Loads return data.
- Creates, updates, and removes returns.
Staff Service
- Loads staff.
- Handles driver/waiter creation and updates.
- Retrieves protected staff data when needed.
- Handles staff document storage operations.
- Deletes staff records.
Staff Payment Service
- Loads staff payments.
- Records staff payments.
Reports Service
- Loads reporting datasets.
- Transforms data into report-specific rows for overview, inventory, purchases, events, dispatches, returns, staff payments, warehouses, and loss reports.
Settings Service
- Loads system settings data.
- Saves general/company settings.
- Creates roles and system users.
- Saves role permissions.
- Assigns employee roles.
- Deletes roles/users.
- Supports user password reset administration.
Notification Service
- Loads notifications.
- Marks one/all notifications as read.
- Retrieves the current user ID.
- Subscribes/unsubscribes to realtime notification changes.
11. Core Business Modules
11.1 Dashboard
The Dashboard acts as the application's operational overview. It retrieves summarized information through dashboardService and presents key statistics, event information, and charts.
11.2 Events
The Events module manages catering events and related operational assignments. It integrates event data with staff such as drivers and waiters and supports event create/update/delete operations based on permissions.
The Events screen also subscribes to Supabase Realtime database changes for event status updates.
11.3 Items
The Items module manages inventory items, categories, and item images. Images are uploaded to Supabase Storage through the item-images bucket and referenced by application data.
11.4 Purchase Orders
The Purchase module manages the procurement lifecycle, including purchase orders, purchase order items, statuses, and receiving inventory.
11.5 Suppliers
The Suppliers module manages supplier records and supplier activation/status behavior.
11.6 Warehouses and Inventory
The Warehouse module manages warehouse records and inventory distribution. Warehouse inventory is represented separately from the item master data, allowing item quantities to be associated with specific warehouses.
11.7 Dispatch
The Dispatch module manages inventory leaving warehouses for operational use. Dispatch records and dispatch line items are stored separately.
11.8 Returns
The Returns module manages inventory returned after operational use. Return records and individual returned items are represented separately.
11.9 Staff
The Staff module manages operational staff, including drivers and waiters. Staff-related documents are stored in Supabase Storage using the staff-documents bucket.
11.10 Reports
The Reports module consolidates operational data into multiple report types and supports document/spreadsheet-oriented output through jsPDF, jsPDF AutoTable, and XLSX.
11.11 Settings, Users, Roles, and Permissions
The Settings area centralizes:
- Company/general settings
- System users
- Roles
- Role descriptions
- Module permissions
- User-role assignment
- User password reset administration
12. Data Model - Main Application Entities
The frontend currently references the following Supabase tables/views or data resources:
profiles
roles
role_permissions
company_settings
items
item_categories
item_images
warehouses
warehouse_inventory
suppliers
purchase_orders
purchase_order_items
events
event_waiters
staff
staff_documents
staff_payments
dispatches
dispatch_items
returns
return_items
notifications
inventory_report
Conceptual relationships
roles
  └── role_permissions
       └── module/action permissions

profiles
  └── role_id -> roles

items
  ├── item_categories
  ├── item_images
  └── warehouse_inventory
       └── warehouses

purchase_orders
  ├── suppliers
  └── purchase_order_items
       └── items

events
  └── event_waiters
       └── staff

dispatches
  └── dispatch_items
       └── items / warehouse inventory

returns
  └── return_items
       └── items

staff
  ├── staff_documents
  └── staff_payments
This diagram is conceptual and describes relationships implied by the application code; database constraints should remain the authoritative definition of the physical schema.
13. Supabase Storage
The application uses Supabase Storage for uploaded files.
Storage buckets referenced by the code
item-images
- Stores inventory item images.
avatars
- Stores user profile/avatar images used by the application top bar/profile experience.
staff-documents
- Stores staff-related uploaded documents.
The application handles upload/removal behavior through the Supabase client. Storage security should be enforced through Supabase bucket policies in addition to frontend permission checks.
14. Realtime Design
Supabase Realtime is used for selected live updates.
Events
The Events page creates a realtime channel for PostgreSQL changes so event status changes can be reflected without requiring a full manual reload.
Notifications
notificationService creates a realtime channel for notification changes and exposes subscribe/unsubscribe behavior to the UI.
Database change
      |
      v
Supabase Realtime
      |
      v
Subscribed React client
      |
      v
Update UI state
15. Notifications
Notifications are represented by the notifications data resource and integrated into the top navigation.
The notification service supports:
- Fetching notifications
- Marking a notification as read
- Marking all notifications as read
- Realtime notification subscription
This design separates persistent notification state from the visual notification dropdown in the top bar.
16. Internationalization
Internationalization is initialized through src/i18n.js using i18next and react-i18next.
The application is designed to support multiple languages, including English and Arabic UI content. Language-aware assets are also present for parts of the authentication experience.
Internationalization is handled at the presentation layer through translation keys rather than duplicating entire application modules.
17. Reporting Architecture
The reporting flow can be summarized as:
Supabase operational data
          |
          v
reportsService
          |
          v
Normalize / aggregate report rows
          |
          v
Reports UI
          |
     +----+----+
     |         |
     v         v
   PDF       Excel
reportsService contains transformations for:
- Overview reports
- Inventory reports
- Purchase reports
- Event reports
- Dispatch reports
- Return reports
- Staff payment reports
- Warehouse reports
- Loss reports
PDF generation is supported by jsPDF and jsPDF AutoTable, while spreadsheet output uses XLSX.
18. Typical Data Flows
18.1 Login and authorization
Login form
   |
   v
Supabase Auth
   |
   v
Authenticated session
   |
   v
Load profile + role + role_permissions
   |
   v
Normalize permissions in AuthContext
   |
   v
ProtectedRoute checks module access
   |
   v
Authorized screen
18.2 Standard CRUD flow
User action on page
       |
       v
Permission check
       |
       v
Page calls service function
       |
       v
Supabase data operation
       |
   +---+---+
   |       |
Success  Error
   |       |
   v       v
Refresh/  Dialog or
update UI error state
18.3 Inventory procurement flow
Supplier
   |
   v
Purchase Order
   |
   v
Purchase Order Items
   |
   v
Receive Purchase
   |
   v
Warehouse Inventory
18.4 Operational stock flow
Warehouse Inventory
       |
       v
    Dispatch
       |
       v
Operational / Event Use
       |
       v
     Return
       |
       v
Inventory / Return Result
19. UI Design Structure
The authenticated application uses reusable navigation and dashboard components to maintain consistency across operational screens.
Shared shell concepts
- Sidebar navigation
- Top navigation bar
- User avatar/profile controls
- Notifications
- Main content region
- Shared application dialogs
- Screen-specific tables/forms/modals
The application styling is organized into shared dashboard styles and module-specific CSS files, allowing each business screen to have specialized layout rules while retaining the common application shell.
20. Error and User Feedback Design
The system uses loading states, page-level error handling, and shared dialog behavior to communicate operation results.
Authorization failures are explicitly handled by ProtectedRoute, including:
- Unauthenticated user
- Missing profile
- Inactive account
- Missing role
- Missing permission
Service operations return or throw errors to the page layer, where the UI can present success/error feedback.
21. Deployment Design
The frontend is configured for Vercel deployment.
Because React Router is used as client-side routing, vercel.json rewrites incoming application paths to index.html:
/(.*) -> /index.html
This allows routes such as /events or /reports to load correctly when opened directly or refreshed in the browser.
Build lifecycle
Source Code
    |
    v
Vite Build
    |
    v
Static Production Bundle
    |
    v
Vercel
    |
    v
Browser SPA
    |
    v
Supabase Backend
22. Environment Configuration
The Supabase client is configured from Vite environment variables.
Expected variable names referenced by the code include:
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
Actual values must not be committed to documentation or shared publicly.
The project contains an .env file locally; secrets or environment-specific values should remain outside source documentation and should be managed using appropriate local/deployment environment configuration.
23. Security Design
Application-level controls
- Supabase session-based authentication
- Protected client-side routes
- Active/inactive profile validation
- Role assignment validation
- Module-level permissions
- View/Add/Edit/Delete action permissions
- Storage separation for uploaded assets/documents
HTTP security headers
The Vercel configuration currently defines:
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
Important backend enforcement principle
Frontend route and button checks improve the user experience but must not be treated as the only security boundary. Database tables, Storage buckets, and sensitive backend operations should also be protected by appropriate Supabase authorization/RLS and Storage policies.
24. Performance and Maintainability Considerations
Current design choices that support maintainability include:
- Dedicated service modules for business/data operations
- Reusable navigation and dashboard components
- Centralized authentication context
- Centralized permission checks
- Separate page-specific styles
- Context providers for shared state
- Realtime subscriptions only where live updates are required
- Image compression utility for image handling
- Separate report transformation functions
As the system grows, additional improvements may include stronger domain separation, automated tests, centralized API error normalization, typed data models, and further decomposition of very large page components.
25. Source-to-Responsibility Map
Area	Main Source Location	Responsibility
Application routes	src/App.jsx	Public/protected routes and module mapping
Application bootstrap	src/main.jsx	React root and context provider composition
Authentication	src/context/AuthContext.jsx	Session, user, profile, role, permissions
Route authorization	src/components/auth/ProtectedRoute.jsx	Authentication and module access enforcement
Supabase client	src/lib/supabase.js	Backend client initialization
Dashboard	src/pages/Dashboard.jsx, src/services/dashboardService.js	Operational overview
Events	src/pages/Events.jsx, src/services/eventsService.js	Event and staff assignment operations
Items	src/pages/Items.jsx	Item/category/image management
Purchases	src/pages/Purchase.jsx, src/services/purchaseService.js	Procurement and receiving
Suppliers	src/pages/Suppliers.jsx, src/services/suppliersService.js	Supplier management
Warehouses	src/pages/Warehouse.jsx, src/services/warehouseService.js	Warehouse management
Dispatch	src/pages/Dispatch.jsx, src/services/dispatchService.js	Outgoing inventory operations
Returns	src/pages/Returns.jsx, src/services/returnsService.js	Returned inventory operations
Staff	src/pages/Staff.jsx, src/services/staffService.js	Drivers/waiters and staff documents
Staff payments	src/services/staffPaymentService.js	Staff payment records
Reports	src/pages/Reports.jsx, src/services/reportsService.js	Reporting and exports
Settings	src/pages/Settings.jsx, src/services/settingsService.js	Company settings, users, roles, permissions
Notifications	src/services/notificationService.js, src/components/dashboard/Topbar.jsx	Notification retrieval/realtime UI
Localization	src/i18n.js	Language configuration
Deployment	vercel.json	SPA rewrite and security headers


26. System Design Summary
Bites Inventory is structured as a React/Vite SPA with a Supabase backend and Vercel deployment. The frontend is divided into business pages, reusable components, shared contexts, and service modules. Authentication is provided by Supabase Auth, while application authorization is based on profiles, roles, and granular module permissions. Operational data is persisted in Supabase, uploaded files are handled through Storage, and selected workflows use Realtime updates.
The architecture supports the main catering inventory lifecycle:
Configuration & Users
        |
        v
Items / Suppliers / Warehouses / Staff
        |
        v
Purchasing & Receiving
        |
        v
Warehouse Inventory
        |
        v
Events & Dispatch
        |
        v
Returns
        |
        v
Reports & Operational Monitoring
This design provides a centralized foundation for managing Bites inventory operations while keeping authentication, permissions, operational modules, reporting, and deployment responsibilities clearly separated in the codebase.