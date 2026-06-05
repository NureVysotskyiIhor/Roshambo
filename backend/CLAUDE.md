# Backend — NestJS Architecture

## Module Structure
Each module follows this pattern:
module.ts → controller.ts → service.ts → repository.ts → mapper.ts → dto/

## Layers (strict separation)
- Controller: HTTP routing only, delegates to Service
- Gateway: WS routing only, thin, delegates to Service  
- Service: business logic only
- Repository: Drizzle ORM queries only
- Store: in-memory Map (only in game/)
- Mapper: Entity → ResponseDto (NEVER return raw DB entity)

## Module List
- auth/: register, login, refresh, logout
- users/: profile, avatar update
- rooms/: create, join, my room, update
- game/: choices, round result, winner determination
- gateway/: single app.gateway.ts, delegates to RoomsService and GameService
- shared/: guards, filters, decorators

## Shared Module Contents
guards/jwt-auth.guard.ts
guards/ws-auth.guard.ts — validates JWT from httpOnly cookie at handshake only
filters/http-exception.filter.ts
filters/ws-exception.filter.ts — emits error event to client
decorators/current-user.decorator.ts
decorators/ws-current-user.decorator.ts

## Auth
- WS: read JWT from handshake.headers.cookie using `cookie` package
- HTTP: standard Bearer JWT via JwtAuthGuard
- Token validated at WS handshake only — session trusted for lifetime

## Naming Conventions
- Files: auth.service.ts, auth.controller.ts, auth.repository.ts
- DTOs: CreateRoomDto, JoinRoomDto, UpdateUserDto
- Always use uuid for IDs
- Enums for status fields (never raw strings)

## Database
- ORM: Drizzle
- All enums defined at DB level
- Explicit indexes on foreign keys
- Composite unique index on (roomId, userId) in RoomParticipant
- No computed/derived fields stored (calculate via query)
- Timestamps: createdAt on all tables, updatedAt where data changes

## Game Store (in-memory)
Located in game/game.store.ts
Stores active round choices: roomCode → { playerOneChoice, playerTwoChoice }
Cleared after round completes and is written to DB

## Error Handling
- HTTP: throw NestJS built-in exceptions (NotFoundException, UnauthorizedException)
- WS: throw WsException, caught by WsExceptionFilter → emits error event
- Always validate DTO + check business context in Service

## Environment Variables
DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN=15m, JWT_REFRESH_EXPIRES_IN=7d
PORT=3000, FRONTEND_URL=http://localhost:5173