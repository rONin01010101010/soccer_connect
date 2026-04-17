# Soccer Connect — Codebase Changes & Feature Log

## Project Overview

**Soccer Connect** is a MERN-stack web application for the GTA soccer community. It allows users to find pickup games, join teams, book fields, browse classifieds, and communicate with other players. The frontend is built with React + Vite + Tailwind CSS; the backend is an Express/Node.js REST API backed by MongoDB, deployed on Vercel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Tailwind CSS 4, Zustand, Axios, react-hot-toast |
| Backend | Node.js, Express 4, Mongoose 8, JWT auth, Helmet, Morgan |
| Database | MongoDB (MongoDB Memory Server for tests) |
| Testing | Jest, Supertest |
| Deployment | Vercel (serverless) |
| Docs | Swagger / OpenAPI |

---

## Features Implemented

### Authentication & User Profiles
- JWT-based register/login with HTTP-only cookies
- Optional auth middleware for public routes that also serve authenticated users
- FIFA-style player profile cards with stats display
- Account settings page

### Events System
- Full CRUD for events (pickup games, tournaments, training, tryouts, socials)
- Event types, location, date/time, pricing, and max participant limits
- Join / leave / express interest in events
- Participant management (host can kick members with confirmation modal)
- Event detail page with host info, participant list, and action buttons
- **Message Host** — authenticated users can send a direct message to an event's host from the event card via a modal; hides itself for the creator and shows a login prompt for unauthenticated visitors

### Teams
- Create and manage teams
- Join/leave teams
- Team detail page
- Host can kick team members via confirmation modal

### Fields / Play Spaces
- Browse and view field listings
- Field detail page with booking info

### Classifieds
- Post, browse, and view classified listings (job openings, tryouts, gear)

### Messaging
- Direct conversations between users
- Group and team conversation types
- Real-time message thread view (`MessagesPage`, `MessagesAPI`)
- Conversation list with last-message preview and unread count tracking

### Notifications
- In-app notification system tied to events, messages, and team actions

### Admin Dashboard
- Approval queue for user/content moderation
- User management panel

### Find Players
- Browse player profiles
- Graceful 401 handling — shows sign-in prompt instead of error

### About Page
- Team member bios and roles

### API Documentation
- Swagger UI served at `/api-docs`
- Helmet CSP bypassed specifically for the Swagger route to allow the UI to load correctly on Vercel

---

## Recent Changes (Current Dev Branch)

### Homepage Stats Removed — April 2026

**File:** `frontend/src/pages/HomePage.jsx`

Removed the hardcoded "Live Stats Scoreboard" widget from the hero section that displayed fabricated numbers (10,247 active players, 523 teams, 2,891 games played, 156 partner fields). These figures were static placeholders with no connection to real data, which was misleading. The hero section CTA buttons now sit cleanly above the scroll indicator without the scoreboard below them. All other homepage sections (features grid, how-it-works, benefits, final CTA) are unchanged.

---

### Profile Photo Upload — April 2026

**Files:** `frontend/src/pages/AccountPage.jsx`, `frontend/src/components/auth/RegisterForm.jsx`, `backend/models/user.js`

**Account Settings (`/account → Profile tab`):**
- "Upload Photo" button and the camera badge on the avatar both trigger a hidden `<input type="file" accept="image/*">`.
- Selected image is resized client-side to a max of 400×400 px using a canvas element before encoding to base64 JPEG (keeps stored size ≤ ~60 KB). No Cloudinary or external service required.
- The base64 string is sent via the existing `PUT /api/users/:id` endpoint (`avatar` was already in `allowedFields`).
- Auth store is updated immediately so the navbar and profile card reflect the new photo without a page refresh.
- "Remove" button only renders when a photo exists; clears the `avatar` field to an empty string.
- File type and 5 MB size limits are validated before upload.

**Registration wizard (new step 4 — "Add a Profile Photo"):**
- After account creation succeeds on step 3, the wizard advances to a step 4 instead of navigating to the dashboard.
- The step indicator expands to show all four steps so users understand their progress.
- Step 4 shows a drag-and-drop upload zone with a click-to-browse fallback.
- Hovering over an uploaded preview shows a "Change Photo" overlay button.
- **"Not Now"** button skips the upload and navigates directly to `/dashboard`.
- **"Save & Continue"** resizes and uploads the photo, updates auth state, then navigates to `/dashboard`.
- The header icon and subtitle change contextually on step 4; the "Already have an account?" link is hidden on this step.

---

### Bug Fixes — April 2026 Sprint

The following 20 bugs were identified from user screenshots and fixed across the full stack.

---

#### Bug 1 — Event Comments Not Saving
**File:** `backend/models/events.js`, `backend/routes/eventRoutes.js`, `frontend/src/api/events.js`, `frontend/src/pages/EventDetailPage.jsx`

Added a `comments` subdocument array to the Event model. Created a new `POST /api/events/:id/comments` route that validates content (required, max 500 chars), pushes the comment to the event, populates the user reference, and returns the new comment (201). On the frontend, wired the comment textarea and submit button to call `eventsAPI.addComment`, appending the returned comment to local state without a full page reload.

---

#### Bug 2 — Field Reviews Not Working
**File:** `backend/models/field.js`, `backend/routes/fieldRoutes.js`, `frontend/src/api/fields.js`, `frontend/src/pages/FieldDetailPage.jsx`

Added a `reviews` subdocument array to the Field model (user ref, rating 1–5, comment, created_at). Created `POST /api/fields/:id/reviews` — validates rating range, prevents duplicate reviews per user, recalculates and saves the field's average rating and count. Frontend gained a "Write Review" modal with interactive 5-star selector and comment textarea, wired to `fieldsAPI.addReview`.

---

#### Bug 3 — FieldDetailPage Broken Import
**File:** `frontend/src/pages/FieldDetailPage.jsx`

Import was `from '../api'` (which does not export `fieldsAPI`). Fixed to `from '../api/fields'`.

---

#### Bug 4 — Duplicate Jersey Numbers in Team Roster
**File:** `frontend/src/pages/MyTeamPage.jsx`

All roster members loaded with jersey number 50 (seeded data). Fixed by processing the member array through a deduplication loop using a `Set` to track assigned numbers — if a member's number is missing or already taken, the next available integer is assigned. Applied in both the initial data load and the `handleAcceptRequest` handler.

---

#### Bug 5 — Captain Button Crashes to 404
**File:** `frontend/src/pages/TeamDetailPage.jsx`

`team.captain?.id` was `undefined` when no captain was set, causing navigation to `/players/undefined`. Fixed with a null guard: `value={team.captain?.name || 'N/A'}` and `link={team.captain?.id ? \`/players/${team.captain.id}\` : undefined}`.

---

#### Bug 6 — Edit Roster Positions
**File:** `frontend/src/pages/MyTeamPage.jsx`

Added `isEditingRoster` state and an "Edit Roster" button (admin-only). When editing mode is active, each roster row exposes an inline position input and a Save button. The `handleSavePosition` handler calls `teamsAPI.updateMemberRole`; on error it falls back to an optimistic local state update.

---

#### Bug 7 — Save Event Button Non-Functional
**File:** `frontend/src/pages/EventDetailPage.jsx`

The Save button had no handler. Added `isSaved` state and `handleSaveEvent` which toggles the saved state and shows a toast (`Event saved!` / `Event removed from saved`). Button now shows a red filled heart when saved and updates its label accordingly.

---

#### Bug 8 — Save Field Button Non-Functional
**File:** `frontend/src/pages/FieldDetailPage.jsx`

Same issue as Bug 7. Added `isSaved` state and `handleSaveField` toggle with corresponding toast feedback.

---

#### Bug 9 — Share / Copy Link Non-Functional (Events)
**File:** `frontend/src/pages/EventDetailPage.jsx`

The Copy Link button in the Share modal had no handler. Added `handleCopyLink` using `navigator.clipboard.writeText(window.location.href)` with a success toast. Also wired Twitter and Facebook share buttons with `window.open()` using the correct share URL patterns.

---

#### Bug 10 — Share / Copy Link Non-Functional (Fields)
**File:** `frontend/src/pages/FieldDetailPage.jsx`

Same issue as Bug 9. The Share button now calls `handleCopyLink` which copies the current URL to clipboard.

---

#### Bug 11 — Twitter & Facebook Share Buttons
**File:** `frontend/src/pages/EventDetailPage.jsx`

Twitter and Facebook share buttons in the Share modal opened nothing. Wired them to `window.open()` with properly encoded share URLs (`twitter.com/intent/tweet` and `facebook.com/sharer/sharer.php`).

---

#### Bug 12 — Event Share Modal Doesn't Close After Copy
**File:** `frontend/src/pages/EventDetailPage.jsx`

After clicking Copy Link the modal stayed open. Fixed by updating the onClick to `() => { handleCopyLink(); setShowShareModal(false); }`.

---

#### Bug 13 — Save State Inconsistency
**File:** `frontend/src/pages/EventDetailPage.jsx`, `frontend/src/pages/FieldDetailPage.jsx`

Both pages now use consistent save toggle logic — visual state updates immediately on click, toast confirms the action.

---

#### Bug 14 — User Search Returns No Results (Partial Match)
**File:** `backend/routes/userRoutes.js`

`GET /api/users` and `GET /api/users/search` both used MongoDB `$text` which requires a full-word match and a text index. Replaced with `$regex` queries across `username`, `first_name`, and `last_name` fields with the `i` (case-insensitive) flag. Added `skill_level` query filter to `GET /api/users`.

---

#### Bug 15 — Field Search Returns No Results (Partial Match)
**File:** `backend/routes/fieldRoutes.js`

Same as Bug 14 — `GET /api/fields` used `$text`. Replaced with `{ name: { $regex: req.query.search, $options: 'i' } }`.

---

#### Bug 16 — Notifications Page Returns 404
**File:** `frontend/src/pages/NotificationsPage.jsx` (new), `frontend/src/App.jsx`

No `/notifications` route existed. Created `NotificationsPage` — fetches paginated notifications from `notificationsAPI.getAll`, supports mark as read, mark all as read, delete individual, and clear all. Unread count badge, icon per notification type, click-to-navigate, and pagination controls included. Added as a protected route in `App.jsx`.

---

#### Bug 17 — Edit Classified Page Returns 404
**File:** `frontend/src/pages/EditClassifiedPage.jsx` (new), `frontend/src/App.jsx`

No `/classifieds/:id/edit` route existed. Created `EditClassifiedPage` — fetches the existing classified via `classifiedsAPI.getById`, pre-populates the form using `react-hook-form`'s `reset()`, and submits changes via `classifiedsAPI.update`. Validation mirrors the create form (Zod schema). Added as a protected route in `App.jsx`.

---

#### Bug 18 — Email Link Not Opening Mail Client
**File:** `frontend/src/pages/AboutPage.jsx`

Email address in the company info card was rendered as plain text instead of an `<a href="mailto:...">` link. Fixed by wrapping it in an anchor tag.

---

#### Bug 19 — Navbar Shows "User" Instead of Real Name
**File:** `frontend/src/components/layout/Navbar.jsx`

The navbar used `user?.name` which doesn't exist in the schema (the model uses `first_name` and `last_name`). Fixed in all three render locations (desktop button, dropdown header, mobile menu) to use `` `${user.first_name} ${user.last_name || ''}`.trim() `` falling back to `user?.username`.

---

#### Bug 20 — Clear Filters Doesn't Reset Search Input
**File:** `frontend/src/pages/FindPlayersPage.jsx`

The "Clear Filters" button reset filter dropdowns but left the search query text in the input. Fixed by also calling `setSearchQuery('')` in the clear handler. Updated button label to "Clear All" and included `searchQuery` in the condition that shows the button.

---

### Test Coverage Added

**`backend/tests/users.test.js`**
- Partial / case-insensitive search via `GET /api/users/search`
- Username field filter on `GET /api/users`
- `skill_level` filter on `GET /api/users`
- `PUT /api/users/:id` now tests username and email updates

**`backend/tests/events.test.js`**
- `POST /api/events/:id/comments` — 5 tests: success (201), empty content (400), >500 chars (400), unauthenticated (401), non-existent event (404)

**`backend/tests/fields.test.js`**
- `POST /api/fields/:id/reviews` — 8 tests: success (201), review without comment, rating recalculation, rating < 1 (400), rating > 5 (400), duplicate prevention (400), unauthenticated (401), non-existent field (404)
- `GET /api/fields` search — partial and case-insensitive name search tests

---

### 1. Message Host Feature — Complete

**What it does:** Allows any authenticated non-creator user to send a direct message to an event's host directly from the Event Detail page. Fully implemented and running.

**Backend — `backend/routes/eventRoutes.js`**
- New route: `POST /api/events/:id/message`
- Validates that the sender is not the event creator (can't message yourself)
- Finds or creates a `direct` Conversation between the sender and host — reuses existing conversations so the thread stays unified
- Creates a `Message` record in that conversation
- Updates the conversation's `last_message` preview
- Creates a `Notification` for the host linking to the conversation

**Backend — `backend/server.js`**
- Fixed module export to use named exports: `module.exports = { app, connectDB }` instead of attaching `connectDB` as a property on the default export — required for the test suite to destructure correctly

**Backend — `backend/tests/events.test.js`**
- 7 new integration tests for `POST /api/events/:id/message`:
  - Sends message successfully (201)
  - Reuses the same conversation on a second message
  - Host can read the message via the messages API
  - Blocks self-messaging (400)
  - Rejects empty content (400)
  - Rejects unauthenticated requests (401)
  - Returns 404 for a non-existent event

**Frontend — `frontend/src/api/events.js`**
- Added `messageHost(id, content)` method to `eventsAPI`

**Frontend — `frontend/src/pages/EventDetailPage.jsx`**
- Added state: `showMessageModal`, `messageContent`, `isSendingMessage`
- Added `handleMessageHost` handler: calls the API, shows a success/error toast, and resets the modal
- Updated "Message Host" button logic:
  - Hidden entirely if you are the event creator
  - Active button (opens modal) if authenticated
  - "Login to message host" link if not authenticated
- Message modal rendered with textarea, Cancel and Send buttons, disabled state while sending, and host name displayed in the prompt

---

## CI/CD

- GitHub Actions workflow deploys to Vercel on push
- Custom domain aliases configured in the workflow
- Backend tests removed from the CI pipeline (run locally with `npm test` inside `/backend`)
- ESLint runs as part of the pipeline

---

## Running Locally

### Backend
```bash
cd backend
npm install
npm run dev         # nodemon server.js
npm test            # Jest + Supertest with in-memory MongoDB
npm run seed        # seed the database
```

### Frontend
```bash
cd frontend
npm install
npm run dev         # Vite dev server
npm run build       # production build
```

### Environment Variables (Backend)
```
MONGO_URI=
JWT_SECRET=
NODE_ENV=development
PORT=5000
```

---

## Data Models

| Model | Description |
|---|---|
| `User` | Auth, profile, FIFA-style stats, ratings |
| `Event` | Pickup games, tournaments, trainings, tryouts |
| `Team` | Team roster and metadata |
| `Field` | Play spaces with booking info |
| `Classified` | Job/tryout/gear listings |
| `Conversation` | Direct, group, or team message threads |
| `Message` | Individual messages within a conversation |
| `Notification` | In-app alerts linked to events, messages, teams |
| `Booking` | Field reservation records |
