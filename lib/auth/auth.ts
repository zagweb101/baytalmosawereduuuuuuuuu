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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        return token;
      }

      if (token.id) {
        const refreshedAt = (token.statusRefreshedAt as number | undefined) ?? 0;
        const shouldRefresh = Date.now() - refreshedAt > 60_000;

        if (shouldRefresh) {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, status: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.status = dbUser.status;
          }
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
