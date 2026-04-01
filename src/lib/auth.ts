import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthOptions, DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin?: boolean;
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

        try {
          // 1. Admin Override Check
          if (
            process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD &&
            credentials.username === process.env.ADMIN_USERNAME && 
            credentials.password === process.env.ADMIN_PASSWORD
          ) {
            console.log("Admin account authenticated.");
            return { id: "admin-superuser", name: "Administrator", isAdmin: true };
          }

          // 2. Standard User Registration & Login
          if (credentials.isRegister === "true") {
             console.log("Attempting registration for:", credentials.username);
             const existing = await prisma.user.findUnique({ where: { username: credentials.username }});
             if (existing) throw new Error("Username taken");
             
             const hashed = await bcrypt.hash(credentials.password, 10);
             const user = await prisma.user.create({
               data: { username: credentials.username, password: hashed }
             });
             console.log("Registration successful for:", user.username);
             return { id: user.id, name: user.username };
          } else {
             console.log("Attempting login for:", credentials.username);
             const user = await prisma.user.findUnique({ where: { username: credentials.username } });
             if (!user) throw new Error("User not found");
             
             const isValid = await bcrypt.compare(credentials.password, user.password);
             if (!isValid) throw new Error("Invalid password");
             
             console.log("Login successful for:", user.username);
             return { id: user.id, name: user.username };
          }
        } catch (err: unknown) {
          const error = err as Error;
          console.error("AUTH_ERROR:", error.message);
          // Re-throw so NextAuth handles it, but now we have it in our logs
          throw error;
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) { 
        token.id = user.id;
        // Correctly handle isAdmin property from the authorize return object
        if ("isAdmin" in user && user.isAdmin) {
          token.isAdmin = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token.id) {
        session.user.id = token.id as string;
        session.user.isAdmin = !!token.isAdmin;
      }
      return session;
    }
  },
  pages: { signIn: "/login" }
};
