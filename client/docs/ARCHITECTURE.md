# Application Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Approval Workflow System                  │
│                     (React + TypeScript)                     │
└─────────────────────────────────────────────────────────────┘
```

## Application Flow

```
                         ┌─────────────┐
                         │   Browser   │
                         │   Startup   │
                         └──────┬──────┘
                                │
                                ▼
                         ┌─────────────┐
                         │      /      │
                         │  (Root)     │
                         └──────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    │   Auto Redirect to    │
                    │      /signin          │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │                       │
            ┌───────▼──────┐       ┌──────▼────────┐
            │   /signin    │       │ /admin-signin │
            │  Sign In     │       │  Admin Login  │
            │   Page       │       │     Page      │
            └───────┬──────┘       └──────┬────────┘
                    │                     │
        ┌───────────┼───────────┐         │
        │           │           │         │
┌───────▼──────┐ ┌──▼────────┐ │  ┌──────▼────────┐
│  /employee   │ │ /manager  │ │  │    /admin     │
│  Employee    │ │  Manager  │ │  │  Admin View   │
│    View      │ │   View    │ │  │   Dashboard   │
└──────────────┘ └───────────┘ │  └───────────────┘
                                │
                                └──────┐
                                       │
                                ┌──────▼────────┐
                                │ /approval/:id │
                                │ Detail View   │
                                │   (Future)    │
                                └───────────────┘
```

## Component Hierarchy

```
App (Router)
│
├── Routes
│   │
│   ├── Route: /
│   │   └── Navigate → /signin
│   │
│   ├── Route: /signin
│   │   └── SignIn Component
│   │       ├── Form (email, password)
│   │       ├── Submit Handler
│   │       └── Navigation Links
│   │
│   ├── Route: /admin-signin
│   │   └── AdminSignIn Component
│   │       ├── Form (name, email, password, confirm)
│   │       ├── Submit Handler
│   │       └── Navigation Links
│   │
│   ├── Route: /admin
│   │   └── AdminView Component
│   │       ├── Header (with navigation)
│   │       ├── Filters Section
│   │       │   ├── Search Input
│   │       │   └── Category Filter
│   │       ├── Approvals Table
│   │       │   ├── Table Headers
│   │       │   ├── Table Rows (mapped data)
│   │       │   └── Action Buttons
│   │       └── Notes Section
│   │
│   ├── Route: /employee
│   │   └── EmployeeView Component
│   │       ├── Header (with navigation)
│   │       ├── Approval Form
│   │       │   ├── Reason Textarea
│   │       │   ├── Date Inputs
│   │       │   ├── Category Select
│   │       │   ├── Leave Type Radio
│   │       │   ├── File Upload
│   │       │   └── Action Buttons
│   │       └── Information Section
│   │
│   └── Route: /manager
│       └── ManagerView Component
│           ├── Header (with navigation)
│           ├── Filter Tabs
│           │   ├── Pending Tab
│           │   ├── Approved Tab
│           │   ├── Rejected Tab
│           │   └── All Tab
│           ├── Approvals List
│           │   └── Approval Cards (mapped)
│           │       ├── Card Header
│           │       ├── Card Body (details)
│           │       └── Action Buttons
│           └── Guidelines Section
```

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                      User Actions                         │
└────────────┬──────────────────────────────────┬──────────┘
             │                                  │
      ┌──────▼──────┐                    ┌──────▼──────┐
      │  Employee   │                    │   Manager   │
      │   Submits   │                    │   Reviews   │
      │   Request   │                    │   Request   │
      └──────┬──────┘                    └──────┬──────┘
             │                                  │
             │      ┌─────────────────┐         │
             └─────▶│  Approval Data  │◀────────┘
                    │   (useState)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  State Update   │
                    │   & Re-render   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Admin View    │
                    │   Monitoring    │
                    └─────────────────┘
```

## Workflow States

```
┌─────────────┐
│   PENDING   │ ← Initial state when employee submits
└──────┬──────┘
       │
       │ Manager Action
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌────────┐ ┌──────────┐
│APPROVED│ │ REJECTED │ ← Final states
└────────┘ └──────────┘
```

## Color Coding System

```
┌────────────────────────────────────────────────────────┐
│  Role          │  Color Scheme      │  Purpose        │
├────────────────┼────────────────────┼─────────────────┤
│  Admin         │  Purple Gradient   │  Oversight      │
│  (#667eea →    │  (#764ba2)         │  & Monitoring   │
│                │                    │                 │
│  Employee      │  Green Gradient    │  Growth &       │
│  (#56ab2f →    │  (#a8e063)         │  Requests       │
│                │                    │                 │
│  Manager       │  Pink Gradient     │  Review &       │
│  (#f093fb →    │  (#f5576c)         │  Decisions      │
│                │                    │                 │
│  Status:       │                    │                 │
│  - Approved    │  Green (#d4edda)   │  Success        │
│  - Pending     │  Yellow (#fff3cd)  │  Waiting        │
│  - Rejected    │  Red (#f8d7da)     │  Declined       │
└────────────────┴────────────────────┴─────────────────┘
```

## File Structure Tree

```
OdooxAmalthea/
│
├── client/
│   ├── public/
│   │   └── vite.svg
│   │
│   ├── src/
│   │   ├── assets/
│   │   │   └── react.svg
│   │   │
│   │   ├── pages/
│   │   │   ├── AdminSignIn.tsx    (208 lines)
│   │   │   ├── SignIn.tsx         (82 lines)
│   │   │   ├── AdminView.tsx      (183 lines)
│   │   │   ├── EmployeeView.tsx   (217 lines)
│   │   │   └── ManagerView.tsx    (208 lines)
│   │   │
│   │   ├── styles/
│   │   │   ├── AdminSignIn.css    (89 lines)
│   │   │   ├── SignIn.css         (89 lines)
│   │   │   ├── AdminView.css      (168 lines)
│   │   │   ├── EmployeeView.css   (202 lines)
│   │   │   └── ManagerView.css    (290 lines)
│   │   │
│   │   ├── App.tsx               (Routing - 24 lines)
│   │   ├── App.css               (Global - 15 lines)
│   │   ├── index.css             (Reset - 23 lines)
│   │   └── main.tsx              (Entry - 9 lines)
│   │
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
│
├── server/                       (Future backend)
│
├── WORKFLOW_GUIDE.md            (User guide)
├── QUICK_START.md               (Setup guide)
├── PROJECT_SUMMARY.md           (Overview)
├── FEATURES.md                  (Checklist)
└── ARCHITECTURE.md              (This file)
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Stack                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   React     │  │  TypeScript  │  │    Vite      │  │
│  │    19.1     │  │     5.9      │  │     7.1      │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   React     │  │     CSS3     │  │   ESLint     │  │
│  │  Router v6  │  │   Modules    │  │     9.x      │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## State Management

```
Component Level State (useState)
│
├── AdminSignIn
│   └── formData { name, email, password, confirmPassword }
│
├── SignIn
│   └── formData { email, password }
│
├── AdminView
│   ├── searchTerm (string)
│   ├── selectedCategory (string)
│   └── approvals (Approval[])
│
├── EmployeeView
│   └── formData { reason, startDate, endDate, category, 
│                   leaveType, attachments }
│
└── ManagerView
    ├── activeFilter (string)
    └── approvalRequests (ApprovalRequest[])
```

## Routing Configuration

```javascript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Navigate to="/signin" />} />
    <Route path="/signin" element={<SignIn />} />
    <Route path="/admin-signin" element={<AdminSignIn />} />
    <Route path="/admin" element={<AdminView />} />
    <Route path="/employee" element={<EmployeeView />} />
    <Route path="/manager" element={<ManagerView />} />
    <Route path="/approval/:id" element={<AdminView />} />
    <Route path="*" element={<Navigate to="/signin" />} />
  </Routes>
</BrowserRouter>
```

## Responsive Breakpoints

```
┌────────────────────────────────────────────────────┐
│  Device      │  Width Range      │  Layout Change  │
├──────────────┼───────────────────┼─────────────────┤
│  Mobile      │  320px - 767px    │  Stack layout   │
│  Tablet      │  768px - 1023px   │  2-column grid  │
│  Laptop      │  1024px - 1919px  │  Full layout    │
│  Desktop     │  1920px+          │  Full layout    │
└────────────────────────────────────────────────────┘
```

## API Integration Points (Future)

```
POST   /api/auth/login          → User authentication
POST   /api/auth/admin-login    → Admin authentication
GET    /api/approvals           → Fetch all approvals
POST   /api/approvals           → Create new approval
PUT    /api/approvals/:id       → Update approval status
GET    /api/approvals/:id       → Get approval details
DELETE /api/approvals/:id       → Delete approval
GET    /api/users               → Fetch users
POST   /api/notifications       → Send notifications
```

## Performance Considerations

```
┌─────────────────────────────────────────────────┐
│  Optimization Strategy                          │
├─────────────────────────────────────────────────┤
│  ✓ React 19 with automatic memoization         │
│  ✓ Vite for fast HMR and builds                │
│  ✓ Code splitting ready (lazy loading)         │
│  ✓ CSS separate from JS                        │
│  ✓ Minimal dependencies                        │
│  ✓ TypeScript for type checking at build       │
└─────────────────────────────────────────────────┘
```

## Security Considerations (Future)

```
┌─────────────────────────────────────────────────┐
│  Security Layer                                 │
├─────────────────────────────────────────────────┤
│  → JWT token authentication                     │
│  → HTTPS only in production                     │
│  → CSRF token protection                        │
│  → Input sanitization                           │
│  → File upload validation                       │
│  → Rate limiting on API                         │
│  → XSS prevention                               │
└─────────────────────────────────────────────────┘
```

---

**Architecture Version:** 1.0.0  
**Last Updated:** October 4, 2025  
**Status:** Phase 1 Complete - UI & Routing Implementation
