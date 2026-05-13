import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Auto-expire listings older than 30 days
    await sql`
      UPDATE listings SET status = 'inactive'
      WHERE status = 'active' AND created_at < NOW() - INTERVAL '30 days'
    `;

    const [totals] = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive
      FROM listings
    `;
    const [userCount] = await sql`SELECT COUNT(*)::int as count FROM users`;

    return NextResponse.json({
      totalListings: totals.total,
      activeListings: totals.active,
      inactiveListings: totals.inactive,
      totalUsers: userCount.count,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
