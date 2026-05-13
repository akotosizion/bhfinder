import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) return null;
  return {
    userId: (session.user as any).userId,
    username: (session.user as any).username,
    email: session.user.email,
    role: (session.user as any).role,
    isLoggedIn: true,
  };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || (session.user as any).role !== 'admin') return null;
  return {
    userId: (session.user as any).userId,
    username: (session.user as any).username,
    email: session.user.email,
    role: (session.user as any).role as 'admin',
    isLoggedIn: true,
  };
}
