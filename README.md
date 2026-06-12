# Roshambo

An online multiplayer Rock, Paper, Scissors game for two players — create a room, share the code with a friend, and play in real time over WebSockets.

## Tech Stack

**Backend — NestJS + TypeScript + Drizzle ORM + PostgreSQL + socket.io**
- NestJS gives a structured, modular foundation (controllers/services/gateways) that scales better than a bare Express app as the domain grows (auth, rooms, games).
- Drizzle ORM was chosen for type-safe queries and migrations without the runtime overhead and "magic" of a heavier ORM — schema and inferred types stay close to plain TypeScript.
- PostgreSQL for durable relational data: users, rooms, participants and round history.
- socket.io powers real-time gameplay (choices, round results, room presence) where HTTP polling would be too slow and clunky.

**Frontend — React + TypeScript + Tailwind CSS v4 + Zustand + TanStack Query + socket.io-client**
- React + TypeScript for a component-driven UI with compile-time safety.
- Tailwind CSS v4 for fast, consistent styling without hand-rolled CSS files.
- TanStack Query manages server state (rooms, profile) — caching, refetching and mutation state come for free.
- Zustand holds only ephemeral UI/session state (current room, live game state) — server data is intentionally kept out of it (see Architecture Decisions).
- socket.io-client mirrors the backend gateway for a consistent real-time contract.

**Shared — `@roshambo/shared`**
- A small shared package with WebSocket event-name constants and TypeScript interfaces (DTOs), so the frontend and backend can never drift out of sync on the WS contract.

**Auth — JWT (access + refresh)**
- Short-lived access tokens (15 min) limit the blast radius of a leaked token; long-lived refresh tokens (7 days) keep users logged in. The refresh token lives only in an httpOnly cookie, never in JS-accessible storage, which mitigates XSS-based token theft.

**Tooling — npm workspaces, Docker (PostgreSQL)**
- npm workspaces tie `backend`, `frontend` and `shared` together in one repo so the shared package can be imported as `@roshambo/shared` without publishing it anywhere (this was the author's first time setting up a monorepo this way).
- Docker Compose runs PostgreSQL in an isolated container, so contributors don't need to install Postgres locally or worry about version mismatches.

## Architecture Overview

### Monorepo structure
```
/
├── backend/       # NestJS + TypeScript API and WebSocket gateway
├── frontend/      # React + TypeScript + Tailwind CSS v4 client
├── shared/        # @roshambo/shared — WS event constants & shared DTOs/types
├── docker-compose.yml
└── package.json   # npm workspaces root
```

### Backend modules (`backend/src`)
- **auth/** — registration, login, logout, token refresh; issues JWT access/refresh tokens.
- **users/** — user profile retrieval and updates (`GET/PATCH /users/me`).
- **rooms/** — room lifecycle: create, join, list "my room", update; controller → service → mapper → repository layering.
- **game/** — round/score logic: tracks active in-memory choices, persists finished rounds, computes results.
- **gateway/** — the socket.io `AppGateway`, the single entry point for all real-time events (room presence and gameplay), delegating to `rooms`/`game` services.
- **db/** — Drizzle schema, centralized inferred types (`db/types.ts`), and `DbModule` (registers the Drizzle instance as a NestJS provider via the `DRIZZLE` DI token).
- **shared/** — cross-cutting building blocks: guards, HTTP/WS exception filters, decorators, and the domain exception hierarchy (`shared/exceptions/domain.exception.ts`).
- **config/** — environment variable validation (`env.validation.ts`).

### Frontend structure (`frontend/src`)
- **pages/** — route-level screens (`rooms-new.page.tsx`, `room.page.tsx`, auth pages).
- **components/** — presentational building blocks, grouped by domain (`game/`, `rooms/`, `auth/`, `ui/`, `shared/`).
- **hooks/** — custom hooks that own socket subscriptions, derived game state, and actions (`use-game-socket`, `use-game-state`, `use-game-actions`, `use-room-socket`), keeping pages thin and focused on composition.
- **store/** — Zustand stores for UI/session state only (`auth.store`, `room.store`, `game.store`).
- **queries/** — TanStack Query hooks wrapping the HTTP API (rooms, auth, users).
- **api/** — typed HTTP client functions.
- **socket/** — socket.io-client wrappers (`gameSocket`, `roomSocket`) exposing typed emit/on helpers with cleanup.
- **lib/** — validation schemas (zod), shared utilities.

## API Endpoints

**Auth** (`auth/`)
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`

**Users** (`users/`)
- `GET /users/me`
- `PATCH /users/me`

**Rooms** (`rooms/`)
- `GET /rooms/my`
- `POST /rooms`
- `GET /rooms/by-code/:code` — look up a room by its join code
- `GET /rooms/:roomId/participants` — list a room's participants
- `POST /rooms/:code/join`
- `PATCH /rooms/:code`

All WebSocket events are listed as constants in `@roshambo/shared` (`events.constants.ts`).

## How to Run Locally

### Prerequisites
- Node.js (LTS) and npm
- Docker (for PostgreSQL) — or a local PostgreSQL instance

### Setup
1. Install dependencies from the repo root (npm workspaces installs all three packages):
   ```
   npm install
   ```
2. Start PostgreSQL via Docker:
   ```
   npm run db:up
   ```
3. Copy/create environment files (see [Environment Variables](#environment-variables) below) — at minimum `backend/.env`.
4. Run database migrations:
   ```
   npm run migrate
   ```
5. Start the dev environment (builds `@roshambo/shared` automatically, then runs it in watch mode alongside the backend and frontend):
   ```
   npm run dev
   ```
   Or individually:
   ```
   npm run dev:shared
   npm run dev:backend
   npm run dev:frontend
   ```

### Other useful commands
- `npm run migrate:generate` — generate a new Drizzle migration from schema changes
- `npm run db:studio` — open Drizzle Studio to inspect the database
- `npm run db:down` — stop the PostgreSQL container
- `npm run build` — build `shared`, then `backend`, then `frontend`
- `npm run lint` / `npm run lint:fix` — lint all workspaces

## Environment Variables

Set these in `backend/.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/roshambo
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=http://localhost:5173
```

> Note the port: the Dockerized PostgreSQL is mapped to host port **5433**, not the default 5432 (see [Known Limitations](#known-limitations)).

## Key Architecture Decisions

- **JWT validated only at WS handshake, not on every event** — authenticating once when the socket connects (rather than on every `game:choice`/`room:join` etc.) avoids redundant verification work on a high-frequency real-time channel, while the handshake still guarantees only authenticated users can open a connection.

- **RefreshToken not stored in DB** — it lives only in an httpOnly cookie. This removes an entire class of token-storage concerns (no table to secure, no risk of a stale/leaked DB copy) and keeps the server stateless with respect to refresh tokens; the cookie itself is the source of truth and is inherently scoped to the browser that received it.

- **In-memory `Map` for active round choices only** — the current round's pending choices are ephemeral and only matter while both players are deciding; persisting them to Postgres on every keystroke-equivalent would add latency and write load for data that's discarded the instant the round resolves. Everything that must survive a restart or be queried later (users, rooms, finished rounds, scores) lives in PostgreSQL.

- **Score architecture — two separate concepts**:
  - `RoomParticipant.score` (PostgreSQL) — cumulative historical score that accumulates across all games and is never reset, intended as the foundation for a future leaderboard.
  - `sessionScores` (in-memory Zustand) — the live score shown during the current play session, reset to 0:0 when a player disconnects (per the requirement "score is reset when one of the players disconnects").

  This separation keeps the durable record intact for statistics while the visible game score follows the disconnect-reset rule.

- **Idempotent `room:join`** — when a client emits `room:join` for a room it's already in (e.g. on component remount or socket reconnect), the gateway detects this (`client.data.roomCode === code`) and only re-joins the socket.io room without re-running game initialization. This prevents in-progress round state from being wiped by duplicate join events.

- **Acknowledgement-based room exit** — leaving a room ("To lobby") uses a socket.io acknowledgement callback rather than fire-and-forget. The client waits for the server to confirm all cleanup (`leftAt`, status update, broadcasts) completed before disconnecting and navigating away, with a 3-second timeout fallback. This eliminates a race condition where immediate disconnect could drop the `room:left` packet and leave inconsistent state.

- **Room belongs to creator permanently (one active room per user)** — rooms are an extension of the creator's identity rather than a freestanding shared resource, which keeps the lifecycle simple: a user can always find "their" room, and creator-disconnect semantics (room → `finished`) follow naturally without needing ownership-transfer logic.

- **`leftAt` field on `RoomParticipant`** — rather than deleting a participant row when someone leaves, it's marked with a `leftAt` timestamp. This preserves participation history (who played, when, what their final score was) for future features like statistics or match history, instead of losing that data the moment someone disconnects.

- **npm workspaces** — this was the author's first time structuring a project as an npm-workspaces monorepo. It was chosen so the `@roshambo/shared` package (WS event constants, DTOs) could be consumed by both `backend` and `frontend` via a simple `import from '@roshambo/shared'`, guaranteeing the WebSocket contract can't silently drift between the two sides.

- **Docker for PostgreSQL** — running Postgres in a container means contributors don't need to install and configure a database server locally; `docker-compose up -d` gives everyone an identical, disposable database with zero host configuration (beyond the port note below).

- **`DbModule` registers Drizzle as a NestJS provider** — the Drizzle instance is created once via a `useFactory` provider bound to the `DRIZZLE` injection token, reading `DATABASE_URL` from the validated `ConfigService`. Repositories inject `DRIZZLE` instead of constructing their own DB connection, keeping database wiring inside Nest's DI container like any other dependency.

- **Domain exceptions decouple business logic from transport** — services, repositories and the game store throw transport-agnostic `DomainException` subclasses (`NotFoundError`, `BadRequestError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`) instead of NestJS `HttpException`/`WsException`. `HttpExceptionFilter` and `WsExceptionFilter` map these to the correct HTTP status codes or `error` WS events at the boundary, so the same business logic works identically whether it's called from a controller or a gateway.

- **`RoomsService.resolveJoin` returns a typed `RoomJoinResult`** — the gateway's `room:join` handler used to contain a 5-branch decision tree mixing DB lookups, participant management and game initialization. That logic now lives in `RoomsService.resolveJoin`, which returns a discriminated union (`not_found` | `active_game_conflict` | `unavailable` | `joined`). `AppGateway` simply switches on the result and emits the corresponding events — keeping the gateway a thin router.

- **`AuthGate` bootstraps the session on page load** — before the router renders, `AuthGate` calls `GET /users/me` to restore `authStore.user` from the httpOnly cookie. This fixes auth state being lost on a hard reload (the access token cookie survives, but Zustand state doesn't), without storing any tokens in client-accessible storage.

- **Grace-period disconnect handling** — when a socket disconnects unexpectedly, the gateway doesn't immediately tear down the room. It starts a 5-second timer (`RECONNECT_GRACE_MS`); if the same user reconnects within that window (e.g. a page reload), the timer is cancelled and the room/round state is preserved. Only if the grace period expires does the gateway run the normal leave logic (`room:opponent_left` / `room:closed`).

## Known Limitations

- **Profile page UI is not implemented** — the backend endpoint (`PATCH /users/me`) is fully built and working, but the corresponding frontend page was not completed due to time constraints.
- **`legacy-peer-deps=true` in `.npmrc`** — required to work around a peer-dependency conflict introduced by `eslint-plugin-react`; without it, `npm install` fails on peer-dep resolution.
- **PostgreSQL runs on host port 5433, not 5432** — the default port 5432 was already occupied by a local PostgreSQL installation during development, so `docker-compose.yml` (and `DATABASE_URL`) map the container to 5433. If you don't have a local Postgres running, you can change both back to 5432.

## Future Improvements

- Email verification via Resend
- Guest authentication via FingerprintJS
- Public rooms with a lobby/matchmaking flow
- Global leaderboard
- Player statistics (e.g. "you pick rock 60% of the time")
- Series mode (best of 3 / best of 5)
- Spectator mode — `RoomParticipant.role` already supports this, just needs UI/gateway support
- Refresh token invalidation on logout
- Profile page UI (backend already supports it)
