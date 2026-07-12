import { NextAuthOptions, getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { ROLE_HOME } from "./constants";
import { getAppBaseUrl } from "./utils";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { organization: true },
        });

        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.organizationId = token.organizationId as string | null;
        session.user.organizationName = token.organizationName as string | null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const appUrl = getAppBaseUrl() || baseUrl.replace(/\/$/, "");

      if (url.startsWith("/")) {
        return `${appUrl}${url}`;
      }

      try {
        const target = new URL(url);
        if (target.origin === new URL(appUrl).origin) {
          return url;
        }
      } catch {
        // ignore malformed URLs
      }

      return appUrl;
    },
  },
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getRequiredSession() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session;
}
export async function requireSession() {
  const session = await getSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) throw new Error("FORBIDDEN");
  return session;
}

export function getRoleHome(role: Role): string {
  return ROLE_HOME[role];
}
