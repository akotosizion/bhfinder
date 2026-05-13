import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) return null;
  const user = session.user as any;
  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: user.role,
    isLoggedIn: true,
  };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || (session.user as any).role !== 'admin') return null;
  const user = session.user as any;
  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: user.role as 'admin',
    isLoggedIn: true,
  };
}
