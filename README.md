# HRMS — Talent Acquisition Platform

A structured system for raising, reviewing, approving, and filling headcount requisitions. Built as a modern web application with a React frontend and an ASP.NET Core backend, backed by MongoDB.

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Quick Start](#4-quick-start)
5. [Configuration Reference](#5-configuration-reference)
6. [Seed Data & Test Accounts](#6-seed-data--test-accounts)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [Platform Features](#8-platform-features)
9. [Project Structure](#9-project-structure)

---

## 1. Overview

HRMS Talent Acquisition replaces email/papers/slack-based headcount requests with a structured workflow. Three types of users interact with the platform:

| Role | What they do |
|------|-------------|
| **Hiring Manager (HM)** | Raises new hire requisitions, logs employee resignations, decides whether to hire replacements, fills MRF forms, submits for approval |
| **HR / Talent Acquisition (HR_TA)** | Reviews pending approvals, posts approved positions to job boards, manages the candidate (ATS) pipeline for each position |
| **Admin** | Approves/rejects resignation requests, approves/rejects position requisitions, manages users/cost centres/MRF templates/DoA list, reopens collapsed positions, seeds the database |

---

## 2. Architecture

| Layer | Technology | Version |
|--------|-----------|---------|
| **Frontend** | React 19, TypeScript 6, Vite 8, Tailwind CSS 3 | `client/` |
| **State management** | Zustand 5 (auth store, toast store), React Query 5 (server state) | |
| **Routing** | React Router 7 | |
| **Auth** | Auth0 (JWT-based), `@auth0/auth0-react` 2 | |
| **Backend** | ASP.NET Core 9, C# | `server/HRMS.API/` |
| **Database** | MongoDB 3.9 driver | |
| **Background jobs** | Hangfire 1.8 (backed by MongoDB) | |
| **Validation** | FluentValidation 11 | |
| **HTTP** | Frontend uses native `fetch()` via a thin wrapper (`api/client.ts`); server is a REST API returning JSON envelopes `{ success, data, error }` | |

### How the pieces connect

```
Browser → Vite dev server (localhost:5173) → React app
    │
    ├── Auth0 (login/logout, JWT tokens)
    │
    └── ASP.NET Core API (localhost:5000)
            │
            ├── JWT Bearer middleware (validates tokens)
            ├── Controllers (handle HTTP requests)
            ├── Services (business logic)
            ├── Repositories (MongoDB data access)
            └── Hangfire (scheduled background jobs)
```

---

## 3. Prerequisites

- **Node.js** 20+ (for the React frontend)
- **.NET SDK 9.0** (for the ASP.NET Core backend)
- **MongoDB** 7+ (local instance, Docker, or Atlas — connection string configurable)
- **Auth0 account** (free tier works; used for login & role-based access)

---

## 4. Quick Start

### 4.1 Clone and install

```bash
cd hrms

# Frontend
cd client
npm install

# Backend
cd ../server/HRMS.API
dotnet restore
```

### 4.2 Environment variables

Create `client/.env`:
```env
VITE_AUTH0_DOMAIN=your-tenant.region.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=https://hrms-api.example.com
VITE_API_BASE_URL=http://localhost:5000
```

Create `server/HRMS.API/appsettings.Development.json`:
```json
{
  "Logging": { "LogLevel": { "Default": "Information" } },
  "Auth0": {
    "Domain": "your-tenant.region.auth0.com",
    "Audience": "https://hrms-api.example.com"
  },
  "ConnectionStrings": {
    "MongoDb": "mongodb://localhost:27017/hrms"
  }
}
```

### 4.3 Auth0 setup

1. Create a **Single Page Application** in your Auth0 tenant.
2. Set allowed callback/logout URLs to `http://localhost:5173`.
3. Create an **API** in Auth0 with the identifier matching `VITE_AUTH0_AUDIENCE`.
4. Add a custom claim to the Auth0 token: `https://hrms.app/roles` — set it per user to one of `HM`, `HR_TA`, or `Admin`.
5. Add a custom claim `https://hrms.app/userId` — set it to the MongoDB `_id` of the user record (created on first login).

### 4.4 Run

```bash
# Terminal 1 — MongoDB (if running locally)
mongod

# Terminal 2 — Backend
cd server/HRMS.API
dotnet run

# Terminal 3 — Frontend
cd client
npm run dev
```

Open `http://localhost:5173`. Log in as one of the test profiles. As Admin, click **Reset & Seed Database** to populate cost centres, templates, and the DoA list.

---

## 5. Configuration Reference

### Backend (`appsettings.json` / `appsettings.Development.json`)

| Key | Purpose |
|-----|---------|
| `Auth0:Domain` | Your Auth0 tenant domain |
| `Auth0:Audience` | The API identifier configured in Auth0 |
| `ConnectionStrings:MongoDb` | MongoDB connection string (database name in the URL) |

### Frontend (`client/.env`)

| Key | Purpose |
|-----|---------|
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA application client ID |
| `VITE_AUTH0_AUDIENCE` | Auth0 API identifier |
| `VITE_API_BASE_URL` | Backend base URL (default `http://localhost:5000`) |

---

## 6. Seed Data & Test Accounts

On first run, log in as Admin and use the **Reset & Seed Database** button on the Admin Dashboard. This populates:

- **5 Cost Centres**: Engineering (CC-001), Marketing (CC-002), Operations (CC-003), Finance (CC-004), HR (CC-005)
- **9 MRF Templates**: Pre-filled job title/JD/skills/salary presets for common roles
- **5 DoA entries**: Approver names/emails/titles

The login screen shows three demo profiles:

| Profile | Email | Role |
|---------|-------|------|
| Hiring Manager | `hm@example.com` | HM |
| HR/TA Recruiter | `ta@example.com` | HR_TA |
| System Administrator | `admin@example.com` | Admin |

These are just `login_hint` values — Auth0 decides which actual email/password to use.

---

## 7. User Roles & Permissions

Roles are stored as Auth0 custom claims under `https://hrms.app/roles`. The backend maps them via authorization policies defined in `Program.cs`:

| Policy | Allowed roles | Used for |
|--------|--------------|---------|
| `HMOnly` | HM | Raising MRFs, logging resignations, deciding replacements |
| `TAOnly` | HR_TA | Posting jobs |
| `AdminOnly` | Admin | User management, templates, cost centres, DoA, reopening positions, resignations approval |
| `HMOrTA` | HM, HR_TA, Admin | Approving/rejecting position requisitions |

---

## 8. Platform Features

### 8.1 Manpower Requisition (MRF)

Hiring Managers raise **New Hire** or **Replacement** requisitions. Each MRF is a `Position` document in MongoDB with a lifecycle tracked by a status field. The form captures job title, cost centre, division, JD, required skills, salary range, start date, shift details, location, experience level, and business impact.

### 8.2 Position Lifecycle (State Machine)

```
                    ┌──────────┐
                    │   DRAFT   │
                    └────┬─────┘
                         │ submit
                    ┌────▼──────────┐
              ┌─────│PENDING_APPROVAL│─────┐
              │     └──────┬──────────┘     │
           approve         │              reject
              │       skip approval        │
         ┌────▼──┐    (goes straight       │
         │APPROVED│     to APPROVED)  ┌────▼───┐
         └──┬──┬──┘                   │REJECTED│
            │  │                      └──┬─────┘
        post│  │ hold              revise│
    ┌───────▼┐ └──►ON_HOLD──►(release)──┘
    │ POSTED │
    └───┬────┘
        │ candidate hired / auto-close
   ┌────▼──┐
   │ FILLED │
   └────────┘

   Any non-terminal status ──180 days inactivity──► COLLAPSED ──admin reopen──► prior status
```

**Key transitions:**
- **Draft → PENDING_APPROVAL**: HM submits the form
- **PENDING_APPROVAL → APPROVED**: Admin/HR_TA approves (or HM skips approval with a reason)
- **PENDING_APPROVAL → REJECTED**: Admin/HR_TA rejects with a reason
- **REJECTED → DRAFT (via "Revise")**: HM can re-open a rejected position and resubmit
- **APPROVED → POSTED**: HR_TA marks the job as published
- **POSTED/APPROVED → FILLED**: Candidate hired or auto-closed
- **Any active → ON_HOLD**: HM places a temporary hold (max 30 days)
- **ON_HOLD → prior status**: Hold expires or HM releases it
- **Any active → COLLAPSED**: Auto-collapsed after 180 days of inactivity (Hangfire job)
- **COLLAPSED → prior status**: Admin reopens (uses stored `preCollapseStatus`)

### 8.3 Resignation / Replacement Workflow

A 4-state lifecycle manages employee departures and replacement decisions:

```
HM logs resignation → PENDING_APPROVAL → Admin approves/Rejects → APPROVED → HM decides HIRE/NO_HIRE
                                                                     ↓
                                                                REJECTED (dead end)
```

- **HM logs a resignation** via the Dashboard ("Log Employee Resignation" button), providing employee name, email, phone, BU, department, salary, job title, and cost centre. Status starts as `PENDING_APPROVAL`.
- **Admin reviews** pending resignations on `/admin/resignations`, approves or rejects them. On approval, a `RESIGNATION_ACTION` notification is sent to the HM.
- **HM sees approved resignations** on the HM Dashboard and in the "Raise Requisition → Replacement" dropdown. From there they can:
  - **No Hire**: Mark the resignation as `NO_REPLACEMENT` with a colour code (GREEN/RED/BLACK) and reason — no position is created.
  - **Hire Replacement**: Navigate to a pre-filled MRF form with the resignation's job title, cost centre, department, and salary. Submitting the MRF atomically sets the resignation to `REPLACED` and links the position for traceability.

### 8.4 ATS — Candidate Pipeline

Once a position is posted, HR_TA can manage candidates through a drag-and-drop Kanban board with stages: Applied → Screening → Interview Scheduled → Interview Completed → Offer → Hired. Each stage transition is logged. Interview feedback (rating + notes + interviewer name) and offer details (salary, start date, offer letter status) can be recorded. CV file uploads are supported.

### 8.5 Notifications

In-app notifications appear in the bell icon (top-right header) and on `/notifications`. Types include: approval reminders, job-not-posted reminders, hold expiry warnings, collapse warnings, position approved/rejected/filled, and resignation actions. Notification polling runs every 15 seconds. A Hangfire job sends periodic reminders for pending approvals and stale unposted positions.

### 8.6 Dashboards

Each role gets a role-specific dashboard:

| Role | Dashboard shows |
|------|----------------|
| HM | Status counts, pending approval resignations, approved resignations (with Hire/No Hire buttons), awaiting-action positions, on-hold positions, open positions |
| HR_TA | Approved-not-yet-posted count, approvals-pending count, active pipeline summaries with stage breakdowns |
| Admin | Total positions/users, positions by status, users by role, approaching-collapse list (≥150 days), seed database button |

### 8.7 Admin Panel

Accessible via `/admin/*` routes (AdminOnly-gated). Pages:
- **All Positions** — system-wide position table with status/cost-centre filters + reopen button for collapsed positions
- **Resignations** — pending approval resignation table with Approve/Reject buttons
- **Users** — create/edit/deactivate users, assign roles and cost centres
- **MRF Templates** — cost-centre-specific templates that pre-fill MRF forms (name, job title, JD skeleton, skills, salary band)
- **Cost Centres** — CRUD for organisational units
- **DoA List** — delegation of authority entries (approver names, emails, titles)

---

## 9. Project Structure

```
hrms/
├── client/                          # React + TypeScript frontend
│   ├── src/
│   │   ├── api/                     # API client + endpoint functions
│   │   │   ├── client.ts            # Fetch wrapper, auth token injection
│   │   │   ├── candidates.ts        # Candidate CRUD + stage transitions
│   │   │   ├── costCentres.ts
│   │   │   ├── dashboard.ts         # Role-specific dashboard data
│   │   │   ├── doa.ts              # Delegation of Authority
│   │   │   ├── notifications.ts
│   │   │   ├── positions.ts         # MRF CRUD + approval/posting actions
│   │   │   ├── resignations.ts      # Log/approve/decide resignation
│   │   │   ├── templates.ts        # MRF templates by cost centre
│   │   │   └── users.ts
│   │   ├── components/
│   │   │   ├── ui.tsx               # Shared primitives (Button, Card, Input, Modal, etc.)
│   │   │   ├── Layout.tsx           # Sidebar + header + notification bell
│   │   │   ├── AuditTrail.tsx
│   │   │   ├── PositionCard.tsx
│   │   │   ├── RequireRole.tsx      # Route guard by role
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── TagInput.tsx
│   │   │   └── ToastContainer.tsx
│   │   ├── hooks/                   # React Query hooks
│   │   │   ├── useCostCentres.ts
│   │   │   ├── useCurrentUser.ts    # Fetches + caches current user profile
│   │   │   ├── usePositions.ts      # Position queries + mutations
│   │   │   └── useTemplates.ts
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # HM/TA/Admin dashboards
│   │   │   ├── RaiseListPage.tsx    # HM's list + type-choice modal
│   │   │   ├── RaiseFormPage.tsx    # MRF multi-section form
│   │   │   ├── PositionsPage.tsx    # All-positions table with filters
│   │   │   ├── PositionDetailPage.tsx # Full MRF detail + actions
│   │   │   ├── ApprovalsPage.tsx    # Pending-approval queue
│   │   │   ├── CandidatesPage.tsx   # Kanban board + candidate detail drawer
│   │   │   ├── CandidateDetailPage.tsx # Full candidate detail page
│   │   │   ├── NotificationsPage.tsx
│   │   │   ├── NotAuthorizedPage.tsx # 403 catch-all
│   │   │   └── admin/               # Admin panel pages
│   │   │       ├── AdminPositionsPage.tsx
│   │   │       ├── AdminResignationsPage.tsx
│   │   │       ├── AdminUsersPage.tsx
│   │   │       ├── AdminTemplatesPage.tsx
│   │   │       ├── AdminCostCentresPage.tsx
│   │   │       └── AdminDoaPage.tsx
│   │   ├── store/
│   │   │   ├── authStore.ts         # Zustand — current user
│   │   │   └── toastStore.ts        # Zustand — toast notifications
│   │   ├── types/models.ts          # TypeScript interfaces mirroring backend models
│   │   ├── utils/constants.ts       # Status/role metadata, formatters, normalizeRole
│   │   ├── App.tsx                  # Routes + AuthGate + QueryClientProvider
│   │   ├── main.tsx                 # Entry point, Auth0Provider, toast override
│   │   └── index.css                # Tailwind directives + custom animations
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
└── server/HRMS.API/
    ├── Controllers/                 # REST endpoints (12 controllers)
    ├── Models/                      # MongoDB document models (8 models)
    ├── Services/                    # Business logic (PositionService, NotificationService, CandidateService, MongoDbService)
    ├── Repositories/                # Data access (MongoRepository base + typed repos)
    ├── DTOs/                        # Request/response data transfer objects
    ├── Middleware/                   # ClaimsTransformation, GlobalExceptionHandler
    ├── Validators/                  # FluentValidation request validators
    ├── Jobs/                        # Hangfire background jobs
    ├── Program.cs                   # App startup, DI, middleware, auth policies, Hangfire config
    ├── appsettings.json
    └── HRMS.API.csproj
```
