# Taskboy

A minimal, terminal-themed task management system.

**Live Demo**: [https://taskboy.vercel.app/](https://taskboy.vercel.app/)

## Tech Stack
- **Frontend**: Next.js (App Router, React)
- **Backend**: Django (Python, Django REST Framework)
- **Database**: PostgreSQL (via Supabase) / SQLite (local fallback)
- **Styling**: Tailwind CSS. I chose Tailwind over pure CSS because it allows for much faster development and rapid iteration of the retro terminal aesthetic.

## Custom Authentication System
Taskboy uses a completely custom, stateless authentication system bridging Next.js and Django:
1. When a user registers or logs in, the Next.js `NextAuth` Credentials provider sends a request to the Django backend.
2. The Django backend authenticates the user against the database and returns a success response.
3. Next.js generates a secure, signed JWT access token in the `jwt` callback, using a shared secret (`DJANGO_JWT_SECRET`).
4. This JWT is stored in an HTTP-only session cookie by NextAuth.
5. On subsequent API requests (like fetching or modifying tasks), the Next.js client securely fetches this JWT and attaches it to the `Authorization: Bearer` header.
6. The Django backend decodes the JWT using the shared secret and identifies the user instantly without needing database session lookups.

## Running the Project
Use the provided bash scripts to easily set up and run the project locally.

1. **Setup**: Run `./setup.sh` to install all dependencies for both the frontend and backend.
2. **Start**: Run `./start.sh` to launch both servers simultaneously.

The frontend will run on `http://localhost:3000` and the backend on `http://localhost:8000`.

## Environment Variables
*(Note: Included here for assignment submission as this is a private repo)*

### Frontend (\`frontend/.env.production\` & \`frontend/.env.local\`)
```env
NEXT_PUBLIC_API_URL=https://taskboy-api.vercel.app/api
NEXTAUTH_URL=https://taskboy.vercel.app
NEXTAUTH_SECRET=mewowmowmowmowmowomowmwoomwomwo
```

### Backend (\`backend/.env\`)
```env
DATABASE_URL=postgresql://postgres.xojmvrsttuxgfxtdcydq:toto_assignment123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
DB_HOST=aws-0-ap-northeast-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.xojmvrsttuxgfxtdcydq
DB_PASSWORD=toto_assignment123
DJANGO_SECRET_KEY=meowmeowmeowmeowmeow12342345132
DEBUG=True
NEXTAUTH_SECRET=mewowmowmowmowmowomowmwoomwomwo
ALLOWED_ORIGINS=http://localhost:3000,https://taskboy.vercel.app
```
