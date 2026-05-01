import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Majuscule requise")
    .regex(/[0-9]/, "Chiffre requis")
    .regex(/[^A-Za-z0-9]/, "Symbole requis"),
  phone: z.string().min(9),
  fullName: z.string().min(2),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Email ou téléphone déjà utilisé." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: hashed,
        phone: data.phone.trim(),
        role: "PATIENT",
        isVerified: true, // Auto-vérification pour patients (SMS OTP en prod)
        patient: {
          create: {
            fullName: data.fullName.trim(),
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            address: data.address ?? null,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, message: "Compte créé avec succès.", userId: user.id },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0]?.message ?? "Données invalides" }, { status: 400 });
    }
    console.error("[register/patient]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
