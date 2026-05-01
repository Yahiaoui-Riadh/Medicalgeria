import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse(credentials);
        
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { patient: true, pharmacy: true, wholesaler: true }
        });

        if (!user || !user.password) return null;
        
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          pharmacyId: user.pharmacy?.id,
          patientId: user.patient?.id,
          wholesalerId: user.wholesaler?.id,
          name: user.patient?.fullName ?? user.pharmacy?.name ?? user.wholesaler?.companyName,
        };
      },
    }),
  ],
});
