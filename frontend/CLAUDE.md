# Frontend — React Architecture

## Folder Structure
src/
├── api/          # axios instance + HTTP functions (auth.api.ts, rooms.api.ts, users.api.ts)
├── queries/      # TanStack Query hooks (auth.queries.ts, rooms.queries.ts, users.queries.ts)
├── socket/       # socket.io client split by domain
│   ├── socket.client.ts   # single instance, withCredentials: true
│   ├── room.socket.ts     # room:* events
│   └── game.socket.ts     # game:* events
├── store/        # Zustand stores (UI state ONLY)
├── components/   # ui/, shared/, auth/, room/, game/
├── pages/
├── routes/
├── hooks/
├── utils/        # validations-auth/, validations-room/, validations-game/
└── lib/

## State Management Rules (CRITICAL)
- Zustand: UI state ONLY (current user, current room, game state)
- TanStack Query: ALL server data, loading states, error states, caching
- NEVER store server data in Zustand
- clearAuth() must call queryClient.clear()
- No isLoading in Zustand stores — use TanStack Query for that

## Zustand Stores
auth.store.ts: { user: UserResponseDto | null, setUser, clearUser }
room.store.ts: { room: RoomResponseDto | null, participants, setRoom, clearRoom }
game.store.ts: { status, myChoice, opponentChose, roundResult, score, restartRequestedByOpponent, actions... }

## HTTP Client (api/client.ts)
- axios instance with withCredentials: true
- interceptor: on 401 → POST /auth/refresh → retry request → else redirect /login
- NEVER use fetch directly — always use axios instance

## Routing
/ → redirect to /login or /rooms/new based on auth
/login → public, redirect to /rooms/new if authenticated
/register → public, redirect to /rooms/new if authenticated  
/rooms/new → protected
/rooms/:code → protected
/profile → protected
TanStack Router with beforeLoad guards in both directions

## File Naming Conventions
Components: name.component.tsx
Pages: name.page.tsx
Stores: name.store.ts
Hooks: use-name.hook.ts
API functions: name.api.ts
Query hooks: name.queries.ts

## Component Rules
- Every component MUST handle: loading / error / data states
- NO God components — max one responsibility per component
- Logic in hooks, not in components
- Toaster only in root layout
- NO magic strings — use @roshambo/shared constants

## Query Keys
Use key-factory pattern, ONE approach everywhere:
export const roomKeys = {
  my: () => ['rooms', 'my'] as const,
  detail: (code: string) => ['rooms', code] as const,
}

## Design System
Tailwind CSS v4, Space Grotesk font
CSS variables in index.css via @theme {}
Components via shadcn/ui + cva variants
NO external animation libraries — Tailwind keyframes only

## Anti-patterns (from NomNomSave analysis)
- NO manual cache on top of TanStack Query (useState for server data)
- NO magic strings anywhere
- NO duplicate query key approaches
- NO isLoading in Zustand
- NO God components
- NO Toaster outside root
- Auth routes MUST redirect authenticated users
- Error states are NOT optional