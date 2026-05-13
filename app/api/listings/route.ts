import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET all listings (public)
export async function GET() {
  try {
    const listings = await sql`
      SELECT l.*, u.username as owner_name
      FROM listings l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `;
    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST new listing (authenticated users only)
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, price, location, bedrooms, bathrooms, contact_number, amenities, image_url } = await req.json();

    if (!title || !location || !price) {
      return NextResponse.json({ error: 'Title, location, and price are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO listings (title, description, price, location, bedrooms, bathrooms, contact_number, amenities, image_url, user_id)
      VALUES (${title}, ${description}, ${price}, ${location}, ${bedrooms || 0}, ${bathrooms || 0}, ${contact_number}, ${amenities || []}, ${image_url}, ${session.userId})
      RETURNING *
    `;

    return NextResponse.json({ success: true, listing: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
