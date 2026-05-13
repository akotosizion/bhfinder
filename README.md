# BH Finder

A full-stack boarding house listing web app built with Next.js 14, Neon PostgreSQL, and iron-session authentication.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: Neon PostgreSQL (serverless)
- **Auth**: iron-session (cookie-based sessions)
- **Hosting**: Vercel

## RBAC
- **Admin**: Full control — manage all listings and users
- **User**: Register, login, create/delete own listings

## Getting Started

```bash
npm install
npm run db:setup   # seeds database schema + admin account
npm run dev
```

## Environment Variables
Create a `.env.local` file:
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-string
```

## Deploy
Push to GitHub and connect the repo to Vercel. Add env variables in Vercel dashboard.
