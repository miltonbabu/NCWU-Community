# NCWU International Student Community Web

A full-stack web platform for **North China Water Resources University (NCWU)** international students — featuring social feeds, language exchange, marketplace, event management, HSK learning tools, Discord integration, AI chatbot, and more.

![Node.js](https://img.shields.io/badge/Node.js-20-green)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Features

### Social & Community
- Social feed with posts, comments, likes, shares (gallery/text/poll post types)
- Anonymous posting with privacy controls (public, department, emergency visibility)
- Real-time notifications via Socket.IO
- User profiles with avatars, departments, academic years

### Language Exchange
- Matchmaking system for language partners (Chinese ↔ English/others)
- 1-on-1 real-time chat with translation support
- Interest-based matching (languages, hobbies, goals)

### Marketplace
- Buy/sell items within the campus community
- Image galleries, categories, search & filtering
- Buy request system with status tracking

### Events
- Create and manage campus events
- RSVP system (interested / going)
- Event export (CSV)

### HSK Learning Tools
- **HSK 1–6** vocabulary flashcards with audio
- Grammar pattern database (5000+ example sentences)
- Character writing practice
- Progress tracking per level

### Discord Integration
- Server channels and group management
- Message history sync
- Admin moderation tools

### AI Chatbot (Xingyuan / 星源)
- GLM-powered conversational assistant
- Chat history with context retention
- Usage analytics dashboard

### Administration
- Full admin dashboard (user management, content moderation, analytics)
- System health monitoring
- Audit logging
- Password recovery workflow
- Soft-delete / hard-delete content management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 3, Radix UI |
| **Backend** | Express 4, TypeScript, Node.js 20 |
| **Database (Dev)** | SQLite via sql.js (WASM, in-process, zero-config) |
| **Database (Prod)** | PostgreSQL via node-postgres (auto-switch by NODE_ENV) |
| **Auth** | Firebase Authentication (Google OAuth + email/password) |
| **Real-time** | Socket.IO |
| **File Storage** | Cloudinary |
| **AI** | ZhipuAI GLM API |
| **CI/CD** | GitHub Actions → GitHub Pages (frontend) + Render (backend) |

---

## Project Structure

```
├── app/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route pages
│   │   ├── lib/                 # Utilities, API client
│   │   └── contexts/             # React contexts (auth, theme, socket)
│   ├── public/
│   └── .env                     # Frontend env vars (gitignored)
│
├── server/                      # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── config/              # Database adapters, types
│   │   │   ├── database.ts      # DB router (SQLite ↔ PostgreSQL)
│   │   │   ├── sqliteAdapter.ts
│   │   │   ├── postgresqlAdapter.ts
│   │   │   ├── sqliteImpl.ts    # Original sql.js implementation
│   │   │   └── sqlTransformer.ts # SQLite → PostgreSQL SQL converter
│   │   ├── routes/              # API route handlers (18 files)
│   │   ├── middleware/           # Auth, validation, rate limiting
│   │   ├── utils/               # Helpers (auth tokens, moderation)
│   │   └── index.ts             # Server entry point
│   ├── migrations/              # PostgreSQL schema files
│   ├── Dockerfile
│   └── .env                     # Backend env vars (gitignored)
│
├── .github/workflows/
│   ├── frontend.yml             # Deploy to GitHub Pages
│   └── backend.yml              # Deploy to Render
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9
- A Firebase project (for Google Auth)

### 1. Clone & Install

```bash
git clone git@github.com:miltonbabu/NCWU-Community.git
cd NCWU-Community

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../app && npm install
```

### 2. Environment Variables

Copy the example env files and fill in your values:

**Backend (`server/.env`):**
```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Development: SQLite (no DATABASE_URL needed)
# Production: Set this to your PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/ncwu_community

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase (Google Auth)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# GLM AI (optional - Xingyuan chatbot)
GLM_API_KEY=your_glm_api_key
```

**Frontend (`app/.env`):**
```env
VITE_API_URL=http://localhost:3001/api

VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

See [server/.env.example](server/.env.example) and [app/.env.example](app/.env.example) for full templates.

### 3. Run Locally

```bash
# Terminal 1: Start backend (port 3001)
cd server
npm run dev

# Terminal 2: Start frontend (port 5173)
cd app
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Database Architecture

This project uses a **dual-database adapter pattern**:

| Environment | Database | How it works |
|------------|----------|--------------|
| **Development** | SQLite (sql.js) | File-based, zero config, runs in-memory via WASM |
| **Production** | PostgreSQL | Connection-pooled via `pg`, auto-created schema on first run |

The switch is automatic based on `NODE_ENV`:
- `NODE_ENV=development` → SQLite (default)
- `NODE_ENV=production` → PostgreSQL (requires `DATABASE_URL`)

All 47 tables are defined in both schemas. The SQL transformer ([`sqlTransformer.ts`](server/src/config/sqlTransformer.ts)) automatically converts:
- `?` placeholders → `$1`, `$2` (PostgreSQL style)
- `datetime('now')` → `NOW()`
- PRAGMA statements → stripped

---

## Deployment

### Frontend (GitHub Pages)

Pushing to `main` branch automatically triggers the [frontend workflow](.github/workflows/frontend.yml):
- Builds the React app with `npm run build`
- Deploys static assets to GitHub Pages

**Required GitHub Secrets:** `VITE_API_URL`, `VITE_FIREBASE_*`

### Backend (Render)

Pushing changes to `server/**` triggers the [backend workflow](.github/workflows/backend.yml):
- Installs dependencies, compiles TypeScript
- Deploys to Render as a Node.js service

**Required GitHub Secrets:**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET`, `PORT`, `FRONTEND_URL`
- `CLOUDINARY_*`, `FIREBASE_*`, `GLM_API_KEY`
- `RENDER_SERVICE_ID`, `RENDER_API_KEY`

### Manual Docker Deployment

```bash
cd server
npm run build        # Compile TypeScript to dist/
docker build -t ncwu-backend .
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e NODE_ENV=production \
  ncwu-backend
```

---

## API Endpoints

| Category | Base Path | Key Endpoints |
|----------|-----------|----------------|
| **Auth** | `/api/auth` | `/signup`, `/login`, `/google`, `/profile`, `/forgot-password` |
| **Social** | `/api/social` | `/feed`, `/posts`, `/comments`, `/likes`, `/tags` |
| **Marketplace** | `/api/market` | `/posts`, `/buy-request`, `/comments`, `/likes` |
| **Events** | `/api/events` | `/events`, `/interest`, `/going`, `/export` |
| **Language Exchange** | `/api/language-exchange` | `/matches`, `/chats`, `/messages` |
| **Discord** | `/api/discord` | `/groups`, `/messages`, `/members` |
| **HSK** | `/api/hsk` | `/vocabulary/:level`, `/grammar/:level`, `/characters` |
| **Admin** | `/api/admin` | `/dashboard`, `/users`, `/settings`, `/audit-logs` |
| **Upload** | `/api/upload` | `/image`, `/avatar` |
| **Health** | `/api/health` | Status check |

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.
