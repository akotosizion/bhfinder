import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const sql = neon(process.env.DATABASE_URL!);
        const { identifier, password } = credentials!;

        const users = await sql`
          SELECT * FROM users WHERE email = ${identifier} OR username = ${identifier}
        `;
        if (!users.length) return null;
        const user = users[0];

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return null;

        return {
          id: String(user.id),
          name: user.username,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        const sql = neon(process.env.DATABASE_URL!);
        const existing = await sql`SELECT id FROM users WHERE email = ${profile.email}`;
        if (!existing.length) {
          const username = (profile.name || profile.email.split('@')[0]).replace(/\s+/g, '_');
          await sql`
            INSERT INTO users (username, email, password_hash, role)
            VALUES (${username}, ${profile.email}, '', 'user')
          `;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const sql = neon(process.env.DATABASE_URL!);
        const dbUsers = await sql`SELECT id, username, role FROM users WHERE email = ${token.email}`;
        if (dbUsers.length) {
          token.userId = dbUsers[0].id;
          token.username = dbUsers[0].username;
          token.role = dbUsers[0].role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).userId = token.userId;
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
