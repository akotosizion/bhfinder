import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json();
    if (!identifier) {
      return NextResponse.json({ error: 'Email or username required' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Find user
    const users = await sql`
      SELECT id, email, username FROM users
      WHERE email = ${identifier} OR username = ${identifier}
    `;

    // Always return success — prevents user enumeration
    if (!users.length) {
      return NextResponse.json({ success: true });
    }

    const user = users[0];

    // Generate secure token (1 hour expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Invalidate old tokens, store new one
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`;
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
    `;

    // Send email via Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"BH Finder" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Reset your BH Finder password',
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff; border-radius: 12px; border: 1px solid #eee;">
          <h1 style="font-size: 22px; font-weight: 800; letter-spacing: 2px; margin-bottom: 8px;">BH FINDER</h1>
          <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 28px;">
            Hi <strong>${user.username}</strong>, we received a request to reset your password.
            Click the button below to set a new one. This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #000; color: #fff; padding: 14px 32px;
                    border-radius: 8px; font-weight: 700; font-size: 15px; text-decoration: none;">
            Reset Password
          </a>
          <p style="color: #999; font-size: 13px; margin-top: 24px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #bbb; font-size: 12px;">BH Finder &mdash; Find Your Perfect Boarding House</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: true }); // Still return success for security
  }
}
