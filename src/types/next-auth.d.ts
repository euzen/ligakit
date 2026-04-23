import "next-auth";
import { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
      theme?: string | null;
    };
  }

  interface User {
    role?: Role;
    theme?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    id?: string;
    theme?: string | null;
  }
}
