import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// DELETE a listing
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const listingId = parseInt(params.id);

  try {
    // Get listing to check ownership
    const listing = await sql`SELECT user_id FROM listings WHERE id = ${listingId}`;
    if (listing.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Admin can delete any; user can only delete their own
    if (session.role !== 'admin' && listing[0].user_id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`DELETE FROM listings WHERE id = ${listingId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete listing error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT update a listing
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const listingId = parseInt(params.id);

  try {
    const listing = await sql`SELECT user_id FROM listings WHERE id = ${listingId}`;
    if (listing.length === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (session.role !== 'admin' && listing[0].user_id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, description, price, location, bedrooms, bathrooms, contact_number, amenities, image_url } = await req.json();

    const result = await sql`
      UPDATE listings
      SET title = ${title}, description = ${description}, price = ${price},
          location = ${location}, bedrooms = ${bedrooms}, bathrooms = ${bathrooms},
          contact_number = ${contact_number}, amenities = ${amenities}, image_url = ${image_url}
      WHERE id = ${listingId}
      RETURNING *
    `;

    return NextResponse.json({ success: true, listing: result[0] });
  } catch (error) {
    console.error('Update listing error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
