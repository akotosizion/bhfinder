import { SessionOptions, getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export interface SessionData {
  userId?: number;
  username?: string;
  email?: string;
  role?: 'admin' | 'user';
  isLoggedIn?: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'bhfinder_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}

export async function requireAuth(req?: NextRequest): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return null;
  }
  return session;
}

export async function requireAdmin(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return null;
  }
  return session;
}
