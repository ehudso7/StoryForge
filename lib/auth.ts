import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Fetch user subscription data
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            subscriptionTier: true,
            subscriptionStatus: true,
            wordsUsedThisMonth: true,
            tokensUsedThisMonth: true,
            usageResetDate: true,
            stripeCustomerId: true,
          },
        });
        if (dbUser) {
          session.user.subscriptionTier = dbUser.subscriptionTier;
          session.user.subscriptionStatus = dbUser.subscriptionStatus;
          session.user.wordsUsedThisMonth = dbUser.wordsUsedThisMonth;
          session.user.tokensUsedThisMonth = dbUser.tokensUsedThisMonth;
          session.user.usageResetDate = dbUser.usageResetDate;
          session.user.stripeCustomerId = dbUser.stripeCustomerId;
        }
      }
      return session;
    },
    async signIn({ user }) {
      // Reset usage if month has passed
      if (user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { usageResetDate: true },
        });

        if (dbUser && dbUser.usageResetDate) {
          const now = new Date();
          const resetDate = new Date(dbUser.usageResetDate);
          const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysSinceReset >= 30) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                wordsUsedThisMonth: 0,
                tokensUsedThisMonth: 0,
                usageResetDate: now,
              },
            });
          }
        }
      }
      return true;
    },
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
