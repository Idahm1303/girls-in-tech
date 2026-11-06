import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      surname: string;
      profileCompleted: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    surname: string;
    profileCompleted: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    surname?: string;
    profileCompleted?: boolean;
  }
}
