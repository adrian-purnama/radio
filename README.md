# Radio Streaming Platform

Full-stack Next.js radio SPA with MongoDB + Mongoose, GridFS media storage, Socket.IO live chat, and JWT-protected admin panel.

## Features

- Continuous music player with `album-loop` and `random-loop` modes.
- Full-screen dynamic background based on active album cover.
- Real-time live chat with Socket.IO and persisted chat history.
- Admin login with JWT session cookie.
- Admin tools to create albums (image upload) and add songs (audio upload).
- API routes for auth, albums, songs, playback, chat, and media streaming.

## Tech Stack

- Next.js App Router (frontend + API routes)
- MongoDB with Mongoose
- GridFS for image/audio file storage inside MongoDB
- Socket.IO for real-time chat
- Zustand for client playback state

## Setup

1. Copy env file:
   - `cp .env.example .env` (or create `.env` manually on Windows)
2. Update values in `.env`:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ADMIN_SEED_EMAIL`
   - `ADMIN_SEED_PASSWORD`
3. Install dependencies:
   - `npm install`
4. Seed initial admin account:
   - `npm run seed:admin`

## Run

- Development: `npm run dev`
- Production build: `npm run build`
- Production server: `npm run start`

Open [http://localhost:3000](http://localhost:3000) for the player and [http://localhost:3000/admin](http://localhost:3000/admin) for admin management.

## API Summary

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/albums`, `POST /api/albums`
- `GET /api/albums/:albumId/songs`, `POST /api/albums/:albumId/songs`
- `GET /api/songs`
- `GET /api/playback/current`, `POST /api/playback/next`
- `GET /api/chat/history`
- `GET /api/media/:fileId`
