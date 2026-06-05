# README Notes

## Commands
- `docker-compose up -d` — start PostgreSQL
- `npm run migrate` — run migrations
- `npm run migrate:generate` — generate new migration
- `npm run db:studio` — open Drizzle Studio
- `npm run dev:backend` — start backend
- `npm run dev:frontend` — start frontend
- `npm run dev` — start both

## Environment Variables
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/roshambo
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=http://localhost:5173

## Architecture Notes
- JWT validated only at WS handshake
- RefreshToken not stored in DB
- In-memory Map for active round choices only
- Score stored in RoomParticipant.score
- Room belongs to creator — one active room per user
- legacy-peer-deps=true in .npmrc — eslint-plugin-react peer dep conflict

## Known Issues
- Docker PostgreSQL runs on port 5433 (not 5432) — local PostgreSQL was already 
  using 5432. If you don't have local PostgreSQL, change back to 5432 in 
  docker-compose.yml and backend/.env