# Cafe Games

Mobile-friendly cafe games platform with secure authentication first, then games added incrementally.

## Tech stack

- Next.js (App Router, TypeScript)
- PostgreSQL + Prisma
- Auth.js (NextAuth) with JWT sessions
- Google OAuth + Credentials (email/password)
- Argon2id password hashing with application pepper

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create env file:

   ```bash
   # Linux/macOS
   cp .env.example .env
   # Windows PowerShell
   Copy-Item .env.example .env
   ```

3. Fill `.env` values:
   - `DATABASE_URL`
   - `DB_POOL_MAX` (keep at `5` or lower)
   - `GEMINI_API_KEY`
   - `AUTH_SECRET`
   - `AUTH_PEPPER`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`

4. Generate Prisma client and run migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Start dev server:

   ```bash
   npm run dev
   ```

## Auth routes and pages

- Auth handler: `/api/auth/[...nextauth]`
- Signup API: `/api/auth/signup`
- Login page: `/login`
- Signup page: `/signup`
- Protected page: `/dashboard`

## OAuth feature flag

Google sign-in is disabled by default with a feature flag:

```env
ENABLE_GOOGLE_OAUTH="false"
NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH="false"
```

Set both to `"true"` only after you have valid Google OAuth credentials configured and are ready to enable the provider.

## Database connection limit

This app uses a single shared `pg.Pool` through Prisma and enforces a hard cap:

```env
DB_POOL_MAX="5"
```

Optional tuning:

```env
DB_POOL_IDLE_TIMEOUT_MS="10000"
DB_POOL_CONNECTION_TIMEOUT_MS="5000"
```

## Game 1: ربع قرد / Quarter Monkey

Routes:
- Lobby: `/games/quarter-monkey?lang=en` or `?lang=ar`
- Room: `/games/quarter-monkey/<8-digit-room-code>?lang=ar`

Core flow:
1. Create public/private room (private rooms require password).
2. Join by room code or from public list.
3. Host starts game when at least 2 players joined.
4. On your turn, add one character.
5. Next player can continue, suspect previous player, or finish current word.
6. Country validation is done on backend with Gemini.

Environment:
- `GEMINI_API_KEY` is required for country validation actions.

## Clever Cloud PostgreSQL note

If you are using Clever Cloud PostgreSQL addon variables, build `DATABASE_URL` in this format:

`postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DB>?schema=public`
