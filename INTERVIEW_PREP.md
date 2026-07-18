# HRMS-NDBS — Interview Preparation Guide

This guide explains every part of this project in plain English, assuming you know basic programming (HTML, CSS, JavaScript) but have never touched React, C#, .NET, MongoDB, or Auth0 before. By the end, you'll be able to walk an interviewer through the entire system.

---

## 1. What This Project Does, in Plain English

Imagine a mid-sized company — say 500 employees. When a manager wants to hire someone, today they'd send an email to HR, who forwards it to finance for budget approval, then back to the manager, then maybe to the department head… it's chaos. Nobody knows how many open positions exist at any given time, statuses get lost in inboxes, and there's no audit trail.

**This app replaces all of that.** It's a web application where:

- **Hiring Managers** can formally request new hires (called "raising a requisition" or "MRF"), log employee resignations, and decide whether to hire replacements.
- **HR / Talent Acquisition people** can review pending requests, approve or reject them, publish approved positions to job boards, and track candidates through an interview pipeline.
- **Admins** can oversee everything — approve resignations, manage users, configure templates (pre-filled job descriptions for common roles), manage cost centres (departments/budget units), and fix things if a position gets stuck.

The key thing the app provides is a **state machine** — every position has a clear status (Draft, Pending Approval, Approved, Posted, Filled, etc.) and you always know exactly where it is and who needs to do something about it. Nothing gets lost in an email thread.

Think of it like a Jira or Asana board, but purpose-built for hiring workflows instead of software bugs.

---

## 2. The Tech Stack, Explained One Piece at a Time

### 2.1 React (Frontend Framework)

**What it is:** A JavaScript library for building user interfaces. Instead of writing pages as flat HTML files, you write **components** — small, reusable pieces of UI that each manage their own look and behaviour.

**Why we need it here:** Our app has many different screens (dashboard, position form, ATS pipeline, admin tables) that all need to update instantly when data changes — someone approves a position, you see the status change immediately. React handles this by re-rendering only the parts of the page that actually changed.

**Key concept — Component:** A JavaScript function that returns HTML (actually JSX — HTML-like syntax inside JavaScript). In this codebase, `Button`, `Modal`, `DashboardPage`, `RaiseFormPage` are all components.

**Key concept — State:** Data that belongs to a component and can change over time. In React, you use `useState()` to declare a variable that, when changed, tells React to re-render the component. For example, `const [showModal, setShowModal] = useState(false)` means "showModal starts as false, and calling setShowModal(true) will re-render this component with the modal visible."

**Key concept — Prop:** Data passed into a component from its parent. Like function parameters but for UI. `<Button variant="primary" onClick={handleClick}>Save</Button>` — `variant` and `onClick` are props.

### 2.2 Vite (Build Tool)

**What it is:** A program that takes your React source code (many `.tsx` files) and turns them into a small, fast set of files the browser can load. It also runs a **dev server** — when you type `npm run dev`, Vite starts a local web server at `localhost:5173`, watches your files for changes, and instantly reloads the browser.

**Why we need it:** Browsers can't run TypeScript or JSX directly. Vite compiles everything into plain JavaScript and bundles it. It's much faster than older tools like Webpack.

### 2.3 TypeScript vs. JavaScript

**What it is:** A language that's JavaScript with types added. You write `const name: string = "Alice"` instead of `const name = "Alice"` — the `: string` tells the computer "this variable will always hold text, never a number." The TypeScript compiler checks for type mistakes before the code ever runs.

**Why we need it:** Our app has lots of data structures — `Position`, `Resignation`, `Candidate` — each with many fields. TypeScript catches mistakes like trying to read `position.salary` when the field is actually called `position.salaryRange`. The type definitions live in `client/src/types/models.ts`.

### 2.4 Tailwind CSS (Styling)

**What it is:** Instead of writing CSS in separate `.css` files, Tailwind gives you short utility class names you put directly on HTML elements. `className="bg-white rounded-lg shadow-sm border p-4"` means "white background, rounded corners, light shadow, border, medium padding." No custom CSS file needed.

**Why we need it:** Our components are built with Tailwind classes directly in the JSX. This means you can understand all of a component's styling by looking at one file. The shared UI primitives (Button, Card, Input, Modal) are in `client/src/components/ui.tsx`.

### 2.5 React Router (Page Navigation)

**What it is:** A library that lets you define which component to show based on the browser URL. When the URL is `/dashboard`, React Router shows `<DashboardPage />`. When it's `/positions/abc123`, it shows `<PositionDetailPage />` with `id = "abc123"`.

**Why we need it:** Our app is a **single-page application (SPA)** — the browser never actually navigates to a new HTML page. React Router fakes navigation by swapping out which component is rendered. This makes the app feel fast because there's no full-page reload. All routes are defined in `App.tsx`.

### 2.6 React Query (Server State Management)

**What it is:** A library that handles fetching, caching, and updating data from the server (our backend API). It's different from React state (`useState`) because React state is for things the user is currently doing (is the modal open?), while React Query is for data that lives on the server (what positions exist in the database?).

**Why we need it:** Without React Query, every component that needs position data would have to manually fetch it, handle loading spinners, handle errors, and re-fetch when something changes. React Query does all of that automatically. You call `useQuery({ queryKey: ["positions"], queryFn: fetchPositions })` and it gives you `{ data, isLoading, error }` — the component re-renders when any of those values change.

**Key terminology:**
- **Query**: A read operation. "Get me all positions for this HM."
- **Mutation**: A write operation. "Create a new position." After a mutation, React Query automatically invalidates (marks as stale) related queries so they re-fetch fresh data.
- **Query Key**: An array like `["position", id]` that uniquely identifies a piece of data. React Query caches data by its key — if two components use the same key, they share the same cached data without a second network request.

### 2.7 Zustand (Client State)

**What it is:** A tiny state management library. Much simpler than alternatives like Redux. You create a "store" with `create()`, and any component can read or write to it.

**Why we need it:** Two things need to be available anywhere in the app without passing them down through dozens of component props:
- **The currently logged-in user** (`authStore.ts`) — their name, email, role, and ID
- **Toast notifications** (`toastStore.ts`) — the popup messages that appear in the top-right corner

### 2.8 ASP.NET Core / C# (Backend Framework)

**What it is:** A framework for building web servers in C# (a language similar to Java). A "web API" means it doesn't return HTML pages — it returns JSON data that the frontend React app consumes.

**Why we need it:** We need a server that:
- Stores and retrieves data from MongoDB (the React app can't talk to MongoDB directly from the browser — that would be a security nightmare)
- Validates requests (don't let someone create a position with a negative salary)
- Enforces permissions (don't let an HM approve positions — that's for admins/TA)

**Key concept — Controller:** A C# class that handles HTTP requests. `PositionsController.cs` has methods like `Create` (handles `POST /api/positions`), `Approve` (handles `PATCH /api/positions/{id}/approve`), etc. Each method receives the request, calls into a service layer, and returns a JSON response.

**Key concept — Dependency Injection (DI):** This is how controllers get access to the things they need (database repositories, notification services). At startup, `Program.cs` registers: "When something asks for an `IUserRepository`, give it a `UserRepository` instance." Then any controller that needs user data just declares `IUserRepository _userRepo` in its constructor, and the framework automatically provides one. This makes testing and swapping implementations easy.

### 2.9 MongoDB (NoSQL / Document Database)

**What it is:** Instead of storing data in rows and columns (like Excel or a SQL database), MongoDB stores data as **documents** — JSON-like objects grouped into **collections**. A document in the `positions` collection looks like:

```json
{
  "_id": "abc123",
  "jobTitle": "Senior Software Engineer",
  "status": "PENDING_APPROVAL",
  "costCentre": "CC-001",
  "salaryRange": { "min": 1200000, "max": 2200000, "currency": "INR" }
}
```

**SQL vs MongoDB analogy:** In SQL, you'd have a `positions` table with columns `job_title`, `status`, `cost_centre`. In MongoDB, each document IS the record — if one position has `replacementDetails` (an ex-employee info block) and another doesn't, that's fine, they don't have to match exactly.

**Why we chose it here:** Position documents have deeply nested data (replacement details, audit logs, hold information). MongoDB handles nested structures naturally without needing separate tables and JOINs. Also, the schema is flexible — we've added fields like `PreCollapseStatus` without needing database migrations. The downside: no multi-document transactions (so our "create position + mark resignation as REPLACED" is two sequential writes, not one atomic operation — we're transparent about this limitation in the code comments).

### 2.10 Auth0 (Authentication Service)

**What it is:** A cloud service that handles login. Instead of building a username/password system ourselves, we delegate to Auth0. They handle the login form, password storage, and security. We just trust them when they say "this person is logged in and here's who they are."

**Why we need it:** Building authentication from scratch is risky. Auth0 has a team of security engineers making sure passwords are hashed, brute-force attacks are blocked, and sessions are managed correctly. Our app just validates the token they issue.

**Key concept — JWT (JSON Web Token):** After logging in, Auth0 gives the browser a cryptographically signed string called a token. On every API request, the frontend attaches this token in the `Authorization` header. The backend verifies the signature (using a public key Auth0 provides) and extracts the user's identity and roles from it. Nobody can forge a valid token because they don't have Auth0's private signing key.

**"What's inside the token?"** — The standard fields (who the user is, when the token expires) plus custom claims we added: `https://hrms.app/roles` (the user's role — HM, HR_TA, or Admin) and `https://hrms.app/userId` (their MongoDB user ID). These claims are what the backend uses for authorization.

### 2.11 Hangfire (Background Job Scheduler)

**What it is:** A library that schedules code to run at specific times or intervals, even when nobody is using the app. Think of it like `cron` or Windows Task Scheduler, but built into the application.

**Why we need it:** Some things shouldn't happen on every page load — they'd slow everything down. Instead, we have Hangfire run them on a schedule:

| Job | Schedule | What it does |
|-----|----------|-------------|
| Send approval reminders | Daily | Finds positions stuck in PENDING_APPROVAL and notifies reviewers |
| Job-not-posted reminder | Every 2 hours | Finds approved-but-unposted positions and notifies TA |
| Hold expiry check | Daily | Releases positions whose hold period expired, warns for expiring-soon holds |
| Inactivity collapse | Daily | Collapses positions with 180+ days of inactivity, warns at 150 and 170 days |

Hangfire stores its job state in MongoDB (same database as the app data, just prefixed with `hangfire.`).

---

## 3. Authentication and Roles, End to End

Here's exactly what happens when someone uses the app:

**Step 1 — Login:** The user clicks "Sign In" on our login page. The React app (using `@auth0/auth0-react`) redirects them to Auth0's hosted login page. The user enters their email/password there (our app never sees the password). Auth0 verifies it and redirects back to our app with a JWT token.

**Step 2 — Token stored:** The React app stores this token in the browser's localStorage. On every subsequent API call, `api/client.ts` (line 40-41) reads this token and attaches it as `Authorization: Bearer <token>`.

**Step 3 — Token verified:** The backend's JWT Bearer middleware (`Program.cs` lines 94-103) intercepts every request, reads the `Authorization` header, validates the token's signature against Auth0's public key, checks it hasn't expired, and extracts the claims (user ID, roles, etc.).

**Step 4 — User created/found:** `BaseController.GetCurrentUserAsync()` looks up the Auth0 ID in our `users` MongoDB collection. If the user doesn't exist yet (first login), it auto-creates them with a default role from their Auth0 token claims.

**Step 5 — Role enforcement:** Each controller endpoint has an `[Authorize(Policy = "...")]` attribute. ASP.NET Core's authorization system checks the user's claims against the policy rules defined in `Program.cs` (lines 107-116). For example:
- `[Authorize(Policy = "HMOnly")]` checks that `https://hrms.app/roles` claim equals `hm` (case-insensitive)
- `[Authorize(Policy = "AdminOnly")]` checks for `admin`
- `[Authorize(Policy = "HMOrTA")]` checks for `hm` OR `hr_ta` OR `admin`

If the check fails, the server returns HTTP 403 Forbidden before the controller method even runs.

**Step 6 — Frontend also gates:** Before the backend check even happens, `RequireRole.tsx` wraps routes and checks the role client-side. If you're an HM, you won't see admin routes in the sidebar, and if you try to navigate to `/admin/users` directly, React redirects you to `/dashboard`.

**What "authorization policy" means:** A policy is simply a named rule. `AdminOnly` is the rule "the token must contain a `https://hrms.app/roles` claim where the value is `admin`." Policies let us attach consistent permission rules to any endpoint by name, instead of repeating the same check logic everywhere.

---

## 4. The Database Structure

Our MongoDB database (`hrms`) has these collections:

| Collection | What a document represents | Key fields |
|-----------|---------------------------|------------|
| `users` | A person who can log in | `auth0Id`, `name`, `email`, `role` (HM/HR_TA/Admin), `costCentre`, `department`, `isActive` |
| `positions` | One headcount requisition / MRF | `jobTitle`, `status` (state machine), `costCentre`, `salaryRange`, `raisedBy` (HM's ID), `reviewerId`, `positionType` (NEW_HIRE/REPLACEMENT), `replacementDetails`, `auditLog[]`, `onHold`, `preCollapseStatus` |
| `candidates` | One applicant for a position | `positionId`, `fullName`, `email`, `phone`, `currentStage`, `stageHistory[]`, `interviewFeedback[]`, `offer` |
| `resignations` | One logged employee departure | `employeeName`, `employeeEmail`, `jobTitle`, `costCentreId`, `lastSalary`, `managerId` (the HM), `status` (PENDING_APPROVAL → APPROVED/REJECTED → REPLACED/NO_REPLACEMENT), `reasonForLeaving`, `colourCode`, `replacementPositionId` |
| `notifications` | One in-app notification | `recipientId`, `type`, `positionId`, `message`, `isRead`, `channel`, `createdAt` |
| `costCentres` | One budget/department unit | `code`, `name`, `department`, `isActive` |
| `mrfTemplates` | One pre-filled position template | `costCentre`, `name`, `jobTitle`, `jdSkeleton`, `requiredSkills[]`, `salaryRange` |
| `doaList` | One approver in the delegation of authority | `name`, `email`, `title`, `isActive` |

Every document has an `_id` field (MongoDB's primary key, automatically generated as a 24-character hex string). Foreign keys (like `position.raisedBy` → `users._id`) are stored as strings — MongoDB doesn't enforce foreign key constraints, so referential integrity is maintained in application code.

---

## 5. The Core Workflows — Step by Step Stories

### 5.1 Raising a New Hire Position (HM)

1. Alice (Hiring Manager) opens the app, sees her Dashboard with status counts.
2. She clicks "Raise Requisition" on her positions page.
3. A type-choice modal appears. She picks "New Hire."
4. She's taken to the multi-section MRF form (`RaiseFormPage`). She picks an MRF template (auto-fills job title, JD, skills, salary from the template), fills in remaining fields (cost centre, division, reporting manager, location, shift details, start date, business impact).
5. She saves as draft. The position is created in MongoDB with `status: DRAFT`. She can come back and edit it later.
6. When ready, she clicks "Submit for Approval." The backend validates fields (are all required ones filled?), sets `status: PENDING_APPROVAL`, sends a notification to the selected reviewer, and auto-generates a reviewer email draft.
7. Bob (Admin or HR_TA) sees this on their Approval Queue. They can approve (status → APPROVED) or reject with a reason (status → REJECTED).
8. If approved, Claire (TA) sees it on her dashboard under "Approved, not yet posted." She clicks "Mark as Posted" (status → POSTED).
9. Claire adds candidates through the ATS pipeline — screening, interviews, feedback.
10. When someone is hired, the position moves to FILLED.

**What happens if it's rejected?** The HM sees the position on their dashboard with REJECTED status. They can click "Revise & Resubmit" on the position detail page, which opens the edit form. The backend transitions the status REJECTED → DRAFT (logging a "Revise" audit entry), and the HM can edit and resubmit.

### 5.2 The Replacement / Resignation Flow

1. Dave (Hiring Manager) has an employee resigning. He clicks "Log Employee Resignation" on his Dashboard.
2. He fills in: employee name, email, phone, BU, department, salary, job title, and cost centre. This creates a resignation with `status: PENDING_APPROVAL`.
3. The resignation appears on Dave's Dashboard under "Pending Approval." An admin (Eve) sees it on `/admin/resignations`.
4. Eve approves it (status → APPROVED). A notification is sent to Dave.
5. Dave now sees the resignation under "Approved Resignations" with Hire/No Hire buttons. He also sees it in the "Raise Requisition → Replacement" dropdown.
6. **If Dave chooses No Hire:** He provides a colour code (GREEN/RED/BLACK) and reason. The backend sets `status: NO_REPLACEMENT` and stores the reason/colour. Done.
7. **If Dave chooses Hire:** He clicks "Hire" on the approved resignation in the Replacement dropdown. This navigates him to a pre-filled MRF form with the resignation's job title, cost centre, department, and salary already filled in. He completes the form and submits.
8. The backend, in a single request: creates the Position document AND sets the resignation's `status: REPLACED`, linking the position ID back to the resignation for traceability.
9. Dave then goes through the normal MRF workflow (draft → submit → review → approve → post → hire).

**The ownership check:** When Dave clicks "Hire" on a resignation, the backend verifies `resignation.ManagerId == Dave's user ID` — so nobody can create a replacement off someone else's resignation. If Dave tries to access Bob's resignation, he gets a 403 Forbidden.

### 5.3 Position Lifecycle Rules

**On Hold:** An HM can place an approved/posted position on hold (max 30 days). The required start date shifts forward by the hold duration when released. Every morning at midnight, Hangfire releases any holds that have expired.

**Auto-Collapse:** If a position has been inactive for 180 days (no HM action), Hangfire sets it to COLLAPSED. Warnings are sent at 150 days and 170 days. The position's pre-collapse status is saved so an admin can reopen it later.

**Reopen:** An admin can reopen a collapsed position from the "All Positions" page. The backend restores the status to whatever it was before collapse (pulled from the `preCollapseStatus` field) and resets the "last HM action" timestamp so it doesn't immediately re-collapse.

**What a "state machine" is:** Think of a state machine like a board game piece — at any moment, it's on exactly one square. Each square is a "state" (DRAFT, PENDING_APPROVAL, APPROVED…). You can only move from one square to certain others — you can't go from APPROVED back to DRAFT, and you can't go directly from DRAFT to FILLED. The "transitions" (submit, approve, reject, revise) are the moves allowed between states. This guarantees nobody can accidentally skip a step or put the system in an impossible configuration.

---

## 6. Key Terminology Glossary

| Term | Definition |
|------|-----------|
| **MRF** | Manpower Requisition Form — the formal request to hire someone. In our code, each MRF is a `Position` document. |
| **DTO** | Data Transfer Object — a C# class that defines the shape of data coming in from an API request (`CreatePositionRequest`) or going out as a response. It's separate from the database model so you can hide internal fields. |
| **Endpoint** | A specific URL + HTTP method combination that the server responds to, e.g. `POST /api/positions` (create a position). |
| **Middleware** | Code that runs on every request before it reaches a controller. Used for things like authentication (validate the JWT) and error handling (catch unhandled exceptions). Defined in `Program.cs` in the order they run. |
| **Repository Pattern** | A design pattern where database access code lives in separate "repository" classes (`UserRepository`, `PositionRepository`) rather than directly in controllers. Benefits: if we ever switch databases, we only change the repository layer, not every controller. |
| **Dependency Injection (DI)** | A technique where a class asks for its dependencies in its constructor rather than creating them itself. `PositionsController(IUserRepository userRepo)` — the framework provides the `userRepo`. This makes code testable (you can pass in a fake repository for tests). |
| **JWT** | JSON Web Token — a cryptographically signed string that the server uses to verify: (1) you are who you say you are, and (2) your token hasn't been tampered with. It contains "claims" like your user ID and roles. |
| **Claim** | A key-value pair inside a JWT. `"https://hrms.app/roles": "HM"` is a claim. The backend reads claims to decide what you're allowed to do. |
| **Policy** | A named authorization rule, e.g. `"AdminOnly"` means "the claims must include `https://hrms.app/roles: admin`." Defined once, used on many endpoints via `[Authorize(Policy = "AdminOnly")]`. |
| **Hook (React)** | A special function that starts with `use` — `useState`, `useEffect`, `useQuery`. Hooks let function components "hook into" React features like state and side effects. Before hooks, you needed class components for these. |
| **Mutation vs. Query (React Query)** | A **query** reads data from the server (GET). A **mutation** changes data (POST/PATCH/DELETE). React Query treats them differently: queries auto-refetch, mutations trigger cache invalidation so related queries re-fetch. |
| **Component** | A reusable piece of UI. `<Button variant="primary">Save</Button>` renders a styled save button. Components can be nested — `DashboardPage` contains `Layout`, `Card`, `Button`, etc. |
| **Prop** | Short for "property" — data passed into a component from its parent. Like function arguments. |
| **State** | Data inside a component that can change over time and triggers re-rendering when it does. `const [count, setCount] = useState(0)` — `count` is the state, `setCount` updates it. |
| **async/await** | A way to write asynchronous code that reads like synchronous code. `const data = await fetchPositions()` means "pause here until fetchPositions finishes, then put the result in data." Without async/await, you'd need nested callback functions ("callback hell"). |
| **REST API** | A style of designing web APIs where URLs represent resources (`/api/positions`) and HTTP methods represent actions (GET = read, POST = create, PATCH = update, DELETE = delete). |
| **CRUD** | Create, Read, Update, Delete — the four basic operations on any data resource. Every collection in our app has CRUD endpoints (some restricted by role). |

---

## 7. Likely Interview Questions and How to Answer Them

### Q1: "Why MongoDB instead of a SQL database?"

**Answer:** Our data is document-oriented — a Position has nested arrays (auditLog entries, requiredSkills) and optional sub-objects (replacementDetails, onHold info) that don't exist on every record. MongoDB stores this naturally as a single document rather than spreading it across multiple tables requiring JOINs. The tradeoff is no multi-document transactions — our "create position + mark resignation as REPLACED" is two sequential writes, not one atomic operation. We acknowledge this limitation in the code comments.

### Q2: "How does the app know if someone is an Admin?"

**Answer:** The role comes from Auth0 as a custom claim (`https://hrms.app/roles`) inside the JWT token. On every request, the backend's JWT middleware extracts this claim. Controllers use `[Authorize(Policy = "AdminOnly")]` — ASP.NET Core's authorization system checks if the claim value is `admin` (case-insensitive). If not, the server returns 403 before the controller code runs. The frontend also has a `RequireRole` component that gates routes client-side, but the real enforcement is server-side because you can't trust the browser.

### Q3: "What happens if two people try to approve the same position at once?"

**Answer:** MongoDB's `ReplaceOneAsync` (which our repository uses for updates) replaces the entire document in a single atomic operation. If two approvals happen simultaneously, whichever write happens second will overwrite the first — but since both set status = APPROVED, the result is the same. There IS a potential race condition in the resignation-creation flow where two HMs could try to create replacement positions off the same approved resignation. We handle this with the ownership check (ManagerId must match the current user) and the status guard (only APPROVED resignations can be linked). The position creation mutation happens in a single request, and if the resignation was already flipped to REPLACED by a concurrent request, the second attempt won't find it in APPROVED status and skips the update.

### Q4: "Why background jobs instead of checking on every page load?"

**Answer:** The app could check "has this position been inactive for 180 days?" every time someone loads the dashboard. But this is wasteful — you're doing that database query thousands of times per day when the answer only changes once per day. By delegating to Hangfire, we run the check ONCE at midnight, update the statuses, and any user who loads their dashboard afterward sees the correct, pre-computed state. Hangfire also handles idempotency — it checks if a notification was already sent before sending a duplicate.

### Q5: "Walk me through what happens when someone clicks Submit on the MRF form."

**Answer:** The frontend calls `updatePosition(id, payload)` (save the draft fields), then on success calls `submitPosition(id, { reviewerId, approvalSkipped, ... })`. The backend's `SubmitForApprovalAsync` method: (1) validates all required fields are filled, (2) if approvalSkipped is true, sets status = APPROVED immediately with a skip-reason audit entry, (3) otherwise sets status = PENDING_APPROVAL, notifies the reviewer, and auto-generates a reviewer email draft, (4) logs all this in the audit trail. React Query invalidates the positions cache, so the HM's dashboard and positions list immediately reflect the new status.

### Q6: "How is the frontend structured — what's the component hierarchy?"

**Answer:** `main.tsx` wraps everything in `Auth0Provider` (handles Auth0 integration) and `BrowserRouter` (enables URL routing). `App.tsx` wraps content in `QueryClientProvider` (React Query). Inside, `AuthGate` checks if the user is authenticated — if not, shows the login page with demo profile cards. If authenticated, it renders `<Routes>` with role-gated routes. The `Layout` component wraps every page with a sidebar (nav links filtered by role), a header (role badge, notification bell), and a content area. Each page is a top-level component that uses React Query hooks to fetch its data and renders sub-components like Cards, Tables, Modals, and forms.

### Q7: "What security measures are in place?"

**Answer:** All authentication is delegated to Auth0 — passwords are never stored or handled by our app. Every API request requires a JWT token validated against Auth0's public key. Authorization is enforced via policies on every endpoint — role-based and ownership-based (you can only act on your own resignations). CORS is restricted to `localhost:5173` (the frontend dev server). Input validation uses FluentValidation to reject malformed requests before they reach business logic. The frontend's API client handles 401 responses by reporting "unauthorized."

### Q8: "Why separate the frontend and backend instead of a server-rendered app?"

**Answer:** A single-page application (SPA) with a separate API gives us two things: (1) The frontend can be independently deployed (just static files served by a CDN) and updated without touching the backend, and (2) The API is reusable — if we later build a mobile app, it can call the same endpoints. The tradeoff is we need CORS configuration and the frontend has to handle loading/error states explicitly.

### Q9: "What is React Query doing that a simple fetch() call wouldn't?"

**Answer:** Four things: (1) Automatic caching — if two components both need the positions list, React Query fetches once and shares the cached result. (2) Stale-while-revalidate — it shows cached data instantly, then quietly re-fetches in the background. (3) Mutation side effects — after creating a position, it automatically invalidates the positions list cache so it re-fetches. (4) Loading/error state management — every query gives you `isLoading`, `isError`, and `data` without manual state management. Without React Query, you'd need useEffect + useState in every component and manual cache invalidation.

### Q10: "How does the Resignation → Replacement flow keep data consistent?"

**Answer:** The key design decision is that the REPLACED status is NOT set when the HM clicks "Hire" — it's set when the actual MRF position is created. This prevents orphaned states (resignation marked REPLACED but no position exists because the HM abandoned the form). The flow is: HM sees approved resignation → clicks Hire → navigates to pre-filled MRF form → fills it in and clicks Submit → backend creates Position AND sets resignation to REPLACED in the same request handler (two sequential writes since MongoDB doesn't support transactions on standalone instances). If the HM navigates away without submitting the MRF, the resignation stays APPROVED — eligible for another replacement attempt later.

### Q11: "What are the Hangfire jobs doing, and why those specific schedules?"

**Answer:** Four jobs: (1) Approval reminders (daily) — reviews are a human process, daily is frequent enough without being spam. (2) Job-not-posted reminder (every 2 hours) — every 2 hours catches delays quickly. (3) Hold expiry (daily) — holds last up to 30 days, daily checking is sufficient. (4) Inactivity collapse (daily) — collapse happens at 180 days, daily granularity is fine for a process that takes months. Each job checks for idempotency (was this notification already sent recently?) before acting.

### Q12: "Explain the position lifecycle — what states can a position be in?"

**Answer:** Eight states: DRAFT (being filled in by HM), PENDING_APPROVAL (waiting for reviewer), APPROVED (ready for posting), REJECTED (sent back with feedback — revisable), ON_HOLD (temporarily paused, auto-releases), POSTED (published to job boards, candidates being tracked), FILLED (position filled — terminal), COLLAPSED (180 days inactive — admin can reopen). The REJECTED state is not terminal — the HM can revise and resubmit. Each state transition is logged in the audit trail with who did it, when, and why. The state machine enforces valid transitions — you can't go from APPROVED back to DRAFT, but you can go from REJECTED to DRAFT via the Revise action.

### Q13: "How would you add a new role, say 'Department Head'?"

**Answer:** (1) Add the role string to the `UserRole` enum in the backend model (`Models/User.cs`). (2) Add an authorization policy in `Program.cs` if the role needs unique permissions. (3) Add the role to existing policies if it should share permissions (e.g., Department Head might be added to `HMOrTA`). (4) Add a `RequireRole` check on any new frontend routes. (5) Add a nav item filter in `Layout.tsx`. (6) Update the seed data / demo profiles. The key insight is that roles are just strings in a claim — adding a new one is mostly configuration, not code.

### Q14: "What happens when the MongoDB connection drops?"

**Answer:** The MongoDB driver has built-in connection pooling and automatic reconnection. If the connection drops during a request, the driver throws an exception that our `GlobalExceptionHandler` middleware catches and returns as a 500 error with a user-friendly message. Hangfire jobs would fail the current execution but retry on the next scheduled run. The frontend would show an error state (the React Query `isError` flag triggers the error UI in each component). In production, you'd run MongoDB as a replica set for high availability.

### Q15: "Walk me through the full ATS pipeline — from candidate added to hired."

**Answer:** (1) TA opens a posted position's candidates page. (2) Clicks "Add Candidate" — fills in name, email, phone, source (job board, referral, etc.). The candidate starts at APPLIED stage. (3) TA moves the candidate through stages: SCREENING → INTERVIEW_SCHEDULED → INTERVIEW_COMPLETED. Each transition is logged in `stageHistory`. (4) At any interview stage, TA can log feedback: interviewer name, 1-5 star rating, and notes. Multiple feedback entries can exist per candidate. (5) If the candidate reaches OFFER stage, TA enters salary, start date, and offer letter status (SENT/ACCEPTED/DECLINED). (6) When the candidate accepts, TA moves them to HIRED, and the position auto-closes to FILLED (via `CandidateService.AutoClosePositionAsync`). The whole pipeline is displayed as a drag-and-drop Kanban board where cards represent candidates and columns represent stages.
