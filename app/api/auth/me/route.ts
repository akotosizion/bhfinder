import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ isLoggedIn: false });
  }
  const user = session.user as any;
  return NextResponse.json({
    isLoggedIn: true,
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: user.role,
  });
}
