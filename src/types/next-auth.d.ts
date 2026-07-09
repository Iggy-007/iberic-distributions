import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: import("@prisma/client").Role;
      organizationId: string | null;
      organizationName: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: import("@prisma/client").Role;
    organizationId: string | null;
    organizationName: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: import("@prisma/client").Role;
    organizationId: string | null;
    organizationName: string | null;
  }
}
