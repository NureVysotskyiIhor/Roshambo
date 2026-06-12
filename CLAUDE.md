# roshambo — Project Context

## What is this
Online multiplayer Rock, Paper, Scissors game for two players.
Monorepo with NestJS backend, React frontend, and shared TypeScript package.

## Monorepo Structure
/
├── backend/       # NestJS + TypeScript
├── frontend/      # React + TypeScript + Tailwind CSS v4
├── shared/        # @roshambo/shared — WS constants, shared types
├── docker-compose.yml
└── package.json   # npm workspaces root

## Tech Stack
- Backend: NestJS + TypeScript + Drizzle ORM + PostgreSQL + socket.io
- Frontend: React + TypeScript + Tailwind CSS v4 + Zustand + TanStack Query + socket.io-client
- Auth: JWT (accessToken 15min + refreshToken 7days, httpOnly cookie)
- Package manager: npm
- Monorepo: npm workspaces (@roshambo/shared)

## Architecture Decisions (DO NOT change without reason)
- JWT validated only at WS handshake, not on every event
- RefreshToken NOT stored in DB — lives only in httpOnly cookie
- In-memory Map for active round choices only — everything else in PostgreSQL
- RoomParticipant.score (PostgreSQL) — cumulative historical score, never reset
- sessionScores (in-memory) — live session score, reset on disconnect
- Room belongs to creator — one active room per user
- When opponent disconnects → room returns to `waiting`, score resets
- When creator disconnects → room becomes `finished`
- All WS event names are constants in @roshambo/shared/events.constants.ts

## Database Models
User: id, username, password, email?, isEmailVerified, avatarUrl, role, createdAt, updatedAt
Room: id, code (nanoid(6)), name?, status (waiting/in_progress/finished), isPrivate, creatorId, createdAt, updatedAt
RoomParticipant: id, roomId, userId, role (player), score, joinedAt, leftAt?
Round: id, roomId, playerOneId, playerTwoId, playerOneChoice, playerTwoChoice, winnerId?, createdAt, finishedAt

## WS Events
room:join, room:joined, room:player_joined, room:left, room:opponent_left, room:closed
game:choice, game:opponent_chose, game:round_result, game:score_updated
game:restart, game:restart_requested, game:started
error

## HTTP Endpoints
POST /auth/register, POST /auth/login, POST /auth/logout, POST /auth/refresh
GET /users/me, PATCH /users/me
GET /rooms/my, POST /rooms, GET /rooms/by-code/:code, GET /rooms/:roomId/participants, POST /rooms/:code/join, PATCH /rooms/:code

## Shared Package (@roshambo/shared)
All WS event names as constants
All shared TypeScript interfaces (UserResponseDto, RoomResponseDto, etc.)
Import as: import { EVENTS } from '@roshambo/shared'

## Anti-patterns (NEVER do this)
- Never store server data in Zustand (only UI state)
- Never duplicate state (no playerCount in Room, no status in RoomParticipant)
- Never use magic strings for events — always use @roshambo/shared constants
- Never put business logic in Controller or Gateway — delegate to Service
- Never return raw DB entities — always use Mapper → ResponseDto