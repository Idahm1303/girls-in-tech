import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/account-validation";

function isUserRole(value: unknown): value is UserRole {
  return value === "STUDENT" || value === "MENTOR" || value === "ADMIN";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findFirst({
          where: { email: { equals: parsed.data.email, mode: "insensitive" } },
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            passwordHash: true,
            role: true,
            studentProfile: { select: { profileCompletedAt: true } },
            mentorProfile: { select: { status: true } },
          },
        });

        if (
          !user?.passwordHash ||
          !(await compare(parsed.data.password, user.passwordHash))
        ) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
          role: user.role,
          profileCompleted: Boolean(user.studentProfile?.profileCompletedAt),
          mentorStatus: user.mentorProfile?.status ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.surname = user.surname;
        token.profileCompleted = user.profileCompleted;
        token.mentorStatus = user.mentorStatus;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = isUserRole(token.role) ? token.role : "STUDENT";
        session.user.surname =
          typeof token.surname === "string" ? token.surname : "";
        session.user.profileCompleted =
          typeof token.profileCompleted === "boolean"
            ? token.profileCompleted
            : false;
        session.user.mentorStatus =
          typeof token.mentorStatus === "string" ? token.mentorStatus : null;
      }
      return session;
    },
  },
});
