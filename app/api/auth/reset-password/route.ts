import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// GET: Validate token
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ valid: false });

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT t.id, t.expires_at, t.used, u.email
    FROM password_reset_tokens t
    JOIN users u ON u.id = t.user_id
    WHERE t.token = ${token}
  `;

  if (!rows.length || rows[0].used || new Date(rows[0].expires_at) < new Date()) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, email: rows[0].email });
}

// POST: Reset password
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password || password.length < 6) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Validate token
    const rows = await sql`
      SELECT t.id, t.user_id, t.expires_at, t.used
      FROM password_reset_tokens t
      WHERE t.token = ${token}
    `;

    if (!rows.length || rows[0].used || new Date(rows[0].expires_at) < new Date()) {
      return NextResponse.json({ error: 'Reset link is invalid or expired.' }, { status: 400 });
    }

    const { user_id, id: tokenId } = rows[0];
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password
    await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${user_id}`;

    // Mark token as used
    await sql`UPDATE password_reset_tokens SET used = TRUE WHERE id = ${tokenId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
