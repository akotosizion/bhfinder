import { NextResponse } from 'next/server';

// Logout is now handled by NextAuth's signOut() on the client
// This route is kept for backward compatibility only
export async function POST() {
  return NextResponse.json({ success: true });
}
