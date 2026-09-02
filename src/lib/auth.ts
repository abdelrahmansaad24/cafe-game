import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";

const providers = [
  Credentials({
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const parsedCredentials = loginSchema.safeParse(credentials);
      if (!parsedCredentials.success) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: parsedCredentials.data.email },
      });
      if (!user || !user.passwordHash) {
        return null;
      }

      const isValid = await verifyPassword(
        parsedCredentials.data.password,
        user.passwordHash,
      );
      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
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
