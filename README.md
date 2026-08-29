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

## Vercel Hosting Notes
- We are using secrets as fallback values directly within the codebase due to some issues with environment variables during Vercel hosting.
- Extra files have been added to the repository in accordance with Vercel's hosting guidelines.


┌─────────────────────────────────────────────────────────────────────┐
│                        REGISTER FLOW                                │
└─────────────────────────────────────────────────────────────────────┘
  User fills register form (page.tsx:57-87)
           │
           ▼
  POST /api/auth/register/  ──────────────────┐
           │                                   │
           ▼                                   │
  Django register_user()                       │
  (todos/views.py:25-45)                      │
  • Creates User in DB                         │
  • Returns { success, email }                 │
           │                                   │
           ▼                                   │
  signIn("credentials", { email, password })   │
  (page.tsx:83)                                │
           │                                   │
           └──────────► NextAuth Credentials Callback
                          authorize() calls Django /auth/login/
                          (route.ts:13-44)
                               │
                               ▼
                         Django login_user()
                         (todos/views.py:47-60)
                         • authenticate(email, password)
                         • Returns user data
                               │
                               ▼
                         authorize returns user object
                         { id, email, first_name, last_name }
                               │
                               ▼
                         NextAuth creates encrypted JWT cookie
                         (session strategy: "jwt")
                               │
                               ▼
                         jwt callback runs (route.ts:54-61)
                         • token.email = user.email
                         • token.sub = user.id
                         • token.name = user.full_name
                               │
                               ▼
                         Session cookie stored in browser
                         (HTTP-only, encrypted)
┌─────────────────────────────────────────────────────────────────────┐
│                        API REQUEST FLOW                             │
└─────────────────────────────────────────────────────────────────────┘
  User interacts with Dashboard (page.tsx)
           │
           ▼
  useSWR() or manual fetchWithAuth()
           │
           ▼
  fetchWithAuth(endpoint, options)
  (lib/fetch.ts:5-20)
  • getSession() → reads NextAuth session cookie
  • session.accessToken ←── session callback runs HERE
  • Attaches Authorization: Bearer <jwt>
           │
           ▼
  Django API endpoint (e.g., /api/todos/)
           │
           ▼
  JWTAuthentication.authenticate()
  (config/auth.py:7-25)
  • Reads Bearer token from header
  • Decodes HS256 with DJANGO_JWT_SECRET
  • Extracts email from payload
  • get_or_create user by email
  • Returns (user, token)
           │
           ▼
  TodoViewSet / protected view
  • request.user is now set
  • Returns todo data
┌─────────────────────────────────────────────────────────────────────┐
│                    SESSION CALLBACK (THE BRIDGE)                    │
└─────────────────────────────────────────────────────────────────────┘
  Called EVERY TIME session is accessed:
  ┌──────────────────────────────────────────────────────────────┐
  │  async session({ session, token })                           │
  │                                                              │
  │  1. Build payload:                                           │
  │     { sub, email, exp: now + 1hr }                           │
  │                                                              │
  │  2. jwt.sign(payload, DJANGO_JWT_SECRET)                     │
  │     → Creates a STANDARD JWT Django can verify              │
  │                                                              │
  │  3. session.accessToken = signedToken                        │
  │     → Custom property for fetchWithAuth to read             │
  │                                                              │
  │  4. session.user.name = token.name                           │
  │     → Sync display name from NextAuth token                  │
  │                                                              │
  │  5. return session                                           │
  └──────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│                    KEY SHARED SECRETS                              │
├─────────────────────────────────────────────────────────────────────┤
│  DJANGO_JWT_SECRET = "mewowmow..."                                 │
│  • Used by NextAuth session callback to SIGN the JWT              │
│  • Used by Django JWTAuthentication to VERIFY the JWT             │
│  • Must be identical in both environments                         │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│                    LOGOUT FLOW                                     │
└─────────────────────────────────────────────────────────────────────┘
  signOut() from next-auth/react
       │
       ▼
  NextAuth clears the HTTP-only session cookie
       │
       ▼
  useSession() returns { data: null }
       │
       ▼
  Dashboard shows login/register UI
