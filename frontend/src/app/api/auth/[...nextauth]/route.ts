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
        try {
          const url = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api') + '/auth/login/';
          console.log("NEXTAUTH AUTHORIZE: Fetching from", url);
          
          const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" }
          })
          
          console.log("NEXTAUTH AUTHORIZE: Response status", res.status);
          const responseText = await res.text();
          console.log("NEXTAUTH AUTHORIZE: Response body", responseText);
          
          if (res.ok) {
            const user = JSON.parse(responseText);
            return {
              id: user.id,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name
            } as any
          }
          return null
        } catch (error) {
          console.error("NEXTAUTH AUTHORIZE ERROR:", error);
          return null;
        }
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
      const signedToken = jwt.sign(payload, process.env.DJANGO_JWT_SECRET || "mewowmowmowmowmowomowmwoomwomwo");
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
