import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { NextAuthOptions, DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"]
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        isRegister: { label: "Register", type: "hidden" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        if (credentials.isRegister === "true") {
           const existing = await prisma.user.findUnique({ where: { username: credentials.username }});
           if (existing) throw new Error("Username taken");
           const hashed = await bcrypt.hash(credentials.password, 10);
           const user = await prisma.user.create({
             data: { username: credentials.username, password: hashed }
           });
           return { id: user.id, name: user.username };
        } else {
           const user = await prisma.user.findUnique({ where: { username: credentials.username } });
           if (!user) throw new Error("User not found");
           const isValid = await bcrypt.compare(credentials.password, user.password);
           if (!isValid) throw new Error("Invalid password");
           return { id: user.id, name: user.username };
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: { signIn: "/login" }
};
