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
