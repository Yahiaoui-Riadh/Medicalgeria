import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user as any;
      const isLoggedIn = !!user;
      const role = user?.role;
      const path = nextUrl.pathname;

      const isOnPharmacy   = path.startsWith("/pharmacy");
      const isOnPatient    = path.startsWith("/patient");
      const isOnWholesaler = path.startsWith("/wholesaler");
      const isOnAdmin      = path.startsWith("/admin");
      const isOnCommande   = path.startsWith("/commande");

      // Zones protégées par rôle
      if (isOnPharmacy   && role !== "PHARMACIST") return Response.redirect(new URL("/login?error=unauthorized", nextUrl));
      if (isOnPatient    && role !== "PATIENT")     return Response.redirect(new URL("/login?error=unauthorized", nextUrl));
      if (isOnWholesaler && role !== "WHOLESALER")  return Response.redirect(new URL("/login?error=unauthorized", nextUrl));
      if (isOnAdmin      && role !== "ADMIN")       return Response.redirect(new URL("/login?error=unauthorized", nextUrl));
      // /commande : tout utilisateur connecté
      if (isOnCommande && !isLoggedIn) return Response.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, nextUrl));

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.pharmacyId = (user as any).pharmacyId;
        token.patientId = (user as any).patientId;
        token.wholesalerId = (user as any).wholesalerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).pharmacyId = token.pharmacyId;
        (session.user as any).patientId = token.patientId;
        (session.user as any).wholesalerId = token.wholesalerId;
      }
      return session;
    },
  },
  providers: [], // Add providers with server-side logic in auth.ts
} satisfies NextAuthConfig;
