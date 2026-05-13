import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [listingCount] = await sql`SELECT COUNT(*)::int as count FROM listings`;
    const [userCount] = await sql`SELECT COUNT(*)::int as count FROM users`;

    return NextResponse.json({
      totalListings: listingCount.count,
      activeListings: listingCount.count,
      totalUsers: userCount.count,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
