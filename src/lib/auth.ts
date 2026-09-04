import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";

import { normalizePhoneNumber } from "@/lib/sms";

const providers = [
  Credentials({
    name: "WhatsApp Phone or Email",
    credentials: {
      phoneOrEmail: { label: "WhatsApp Phone or Email", type: "text" },
      email: { label: "Email (Legacy)", type: "text" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const rawInput = (
        (credentials as Record<string, string>)?.phoneOrEmail ||
        (credentials as Record<string, string>)?.email ||
        (credentials as Record<string, string>)?.phone ||
        ""
      ).trim();
      const password = (credentials as Record<string, string>)?.password || "";

      if (!rawInput || !password) {
        return null;
      }

      const normalizedPhone = normalizePhoneNumber(rawInput);

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
            { email: rawInput.toLowerCase() },
            ...(normalizedPhone ? [{ email: `${normalizedPhone}@phone.cafegames` }] : []),
          ],
        },
      });

      if (!user || !user.passwordHash) {
        return null;
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email || user.phone || `${user.id}@cafegames.local`,
        name: user.name,
        image: user.image,
      };
    },
  }),
] as Array<ReturnType<typeof Credentials> | ReturnType<typeof Google>>;

if (env.ENABLE_GOOGLE_OAUTH && env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  );
}

const typedProviders = providers as Array<
  ReturnType<typeof Credentials> | ReturnType<typeof Google>
>;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: typedProviders,
  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: env.AUTH_SECRET,
};

export function auth() {
  return getServerSession(authOptions);
}
