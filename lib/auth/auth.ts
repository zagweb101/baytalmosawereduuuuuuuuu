import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation/schemas";
import { authConfig } from "@/lib/auth/auth.config";

const BLOCKED_STATUSES: UserStatus[] = [
  UserStatus.SUSPENDED,
  UserStatus.PENDING,
  UserStatus.PENDING_VERIFICATION,
];

function revokeToken<T extends Record<string, unknown>>(token: T) {
  return { ...token, error: "SessionRevoked" as const };
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (token.error === "SessionRevoked") {
        return token;
      }

      if (trigger === "update" && session?.sessionId) {
        token.sessionId = session.sessionId as string;
        return token;
      }

      if (user) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, status: true, sessionVersion: true },
        });

        if (!dbUser || BLOCKED_STATUSES.includes(dbUser.status)) {
          return revokeToken(token);
        }

        token.id = user.id;
        token.role = dbUser.role;
        token.status = dbUser.status;
        token.sessionVersion = dbUser.sessionVersion;
        token.statusRefreshedAt = Date.now();
        return token;
      }

      if (token.id) {
        const refreshedAt = (token.statusRefreshedAt as number | undefined) ?? 0;
        const shouldRefresh = Date.now() - refreshedAt > 60_000;

        if (shouldRefresh) {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, status: true, sessionVersion: true },
          });

          if (!dbUser) {
            return revokeToken(token);
          }

          if (
            token.sessionVersion !== undefined &&
            dbUser.sessionVersion !== token.sessionVersion
          ) {
            return revokeToken(token);
          }

          if (BLOCKED_STATUSES.includes(dbUser.status)) {
            return revokeToken(token);
          }

          if (token.sessionId) {
            const activeSession = await db.userSession.findUnique({
              where: { id: token.sessionId as string },
              select: { userId: true },
            });
            if (!activeSession || activeSession.userId !== token.id) {
              return revokeToken(token);
            }
          }

          token.role = dbUser.role;
          token.status = dbUser.status;
          token.sessionVersion = dbUser.sessionVersion;
          token.statusRefreshedAt = Date.now();
        }
      }

      return token;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        if (BLOCKED_STATUSES.includes(user.status)) {
          return null;
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
});
