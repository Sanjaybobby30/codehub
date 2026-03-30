# CodeHub — Real-time Collaborative Code Editor

🚀 **Live Demo:** https://codehub-nnjavjk31-sanjaybobby30s-projects.vercel.app

## Features
- 💻 Real-time collaborative code editing
- 💬 Live chat between users
- 📁 File system with create/rename/delete
- ▶️ Code execution in 60+ languages
- 👥 Multi-user rooms with live presence

## Tech Stack
- **Frontend:** React, Vite, TailwindCSS, Socket.IO
- **Backend:** Node.js, Express, Socket.IO
- **Database:** MongoDB Atlas
- **Code Execution:** Judge0 CE
- **Deployed on:** Vercel (client) + Railway (server)
A real-time collaborative coding environment with chat, file management, and code execution.

## Project Structure

```
code-hub/
├── client/        # React + Vite frontend
├── server/        # Node.js + Express + Socket.IO backend
└── package.json   # Root convenience scripts
```

---

## Prerequisites

- Node.js v18+
- MongoDB running locally (or Atlas URI)

---

## Setup & Run

### 1. Configure Environment Variables

**Server** — `server/.env`:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/codehubbb
```

**Client** — `client/.env`:
```
VITE_BACKEND_URL=http://localhost:3000

# Optional — for higher code execution rate limits:
# VITE_RAPIDAPI_KEY=your_rapidapi_key_here
```

### 2. Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Start the Server

```bash
cd server
npm run dev      # hot reload via nodemon
```

### 4. Start the Client

```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Code Execution — Judge0

The app uses **Judge0 CE** (free, open-source) to execute code — this **replaces the old Piston API** which shut down public access on 2/15/2026.

### Free tier (default — no setup needed)
The community instance at `https://ce.judge0.com` is used automatically. No API key required. Suitable for development and light use.

### Higher rate limits (optional)
1. Sign up free at [RapidAPI — Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce)
2. Copy your API key
3. Add it to `client/.env`:
```
VITE_RAPIDAPI_KEY=your_key_here
```

### Self-hosting Judge0 (production)
```bash
git clone https://github.com/judge0/judge0.git
cd judge0
cp judge0.conf.example judge0.conf
docker-compose up -d db redis
sleep 10
docker-compose up -d
```
Then update `client/src/api/index.jsx` to point to your instance.

### Supported Languages (60+)
JavaScript, Python 2/3, TypeScript, Java, C, C++, C#, Go, Rust, Ruby, PHP,
Bash, Kotlin, Swift, Scala, Haskell, Lua, R, Perl, SQL, and more.

---

## Bugs Fixed (full history)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `server/server.js` | MongoDB URL hardcoded | Reads `MONGO_URI` from `.env` |
| 2 | `server/server.js` | Deprecated mongoose options | Removed |
| 3 | `server/server.js` | User not deleted from DB on disconnect | Added `User.deleteOne()` |
| 4 | `FormComponent.jsx` | Backend URL hardcoded | Uses `VITE_BACKEND_URL` env var |
| 5 | `client/.env` | File missing | Created |
| 6 | `actions.js` | `USER_JOIN_ERROR` missing | Added |
| 7 | `SocketContext.jsx` | `USER_JOIN_ERROR` unhandled | Added handler |
| 8 | `RunCodeContext.jsx` | Language reset on every keystroke | Fixed dependency array |
| 9 | `RunCodeContext.jsx` | Crash when no file open | Added null guard |
| 10 | `FileContext.jsx` | `langMap` crash on unknown extension | Added null guard |
| 11 | `FileContext.jsx` | Language effect fired on content change | Fixed to `currentFile?.name` only |
| 12 | `FileContext.jsx` | Language casing mismatch | Normalised to CapitaliseFirst |
| 13 | `RunCodeContext.jsx` | Output panel blank on API error | Always calls `setOutput` |
| 14 | **All API files** | Piston API shut down (2/15/2026) | **Migrated to Judge0 CE** |
