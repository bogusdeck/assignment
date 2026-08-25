import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import jwt from "jsonwebtoken"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api') + '/auth/login/', {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        })
        const user = await res.json()
        if (res.ok && user) {
          return {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
          } as any
        }
        return null
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.sub = user.id.toString();
        // @ts-ignore
        token.name = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user.name || '');
      }
      return token;
    },
    async session({ session, token }) {
      const payload = {
        sub: token.sub,
        email: token.email,
        exp: Math.floor(Date.now() / 1000) + (60 * 60)
      };
      const signedToken = jwt.sign(payload, process.env.NEXTAUTH_SECRET || "test-secret");
      // @ts-ignore
      session.accessToken = signedToken;
      if (session.user) {
        session.user.name = token.name as string;
      }
      return session;
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
