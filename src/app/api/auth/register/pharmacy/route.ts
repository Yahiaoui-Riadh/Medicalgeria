import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  phone: z.string().min(9),
  name: z.string().min(3),
  licenseNumber: z.string().min(5),
  address: z.string().min(5),
  city: z.string().min(2),
  wilaya: z.string().min(2),
  openingHours: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });
    if (existing) return NextResponse.json({ error: "Email ou téléphone déjà utilisé." }, { status: 409 });

    const licExisting = await prisma.pharmacy.findUnique({ where: { licenseNumber: data.licenseNumber } });
    if (licExisting) return NextResponse.json({ error: "Numéro d'autorisation déjà enregistré." }, { status: 409 });

    const hashed = await bcrypt.hash(data.password, 12);

    const defaultHours = {
      monday: "08:00-19:00", tuesday: "08:00-19:00", wednesday: "08:00-19:00",
      thursday: "08:00-19:00", friday: "08:00-12:00", saturday: "08:00-19:00", sunday: "fermé",
    };

    await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: hashed,
        phone: data.phone.trim(),
        role: "PHARMACIST",
        isVerified: false, // Vérification manuelle par admin
        pharmacy: {
          create: {
            name: data.name.trim(),
            licenseNumber: data.licenseNumber.trim(),
            address: data.address.trim(),
            city: data.city.trim(),
            wilaya: data.wilaya,
            geoLocation: { lat: 36.737, lng: 3.086 }, // Default Alger, override via géocoding
            openingHours: (data.openingHours ?? defaultHours) as any,
          },
        },
      },
    });

    return NextResponse.json({ success: true, message: "Compte créé. En attente de vérification admin." }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    console.error("[register/pharmacy]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
