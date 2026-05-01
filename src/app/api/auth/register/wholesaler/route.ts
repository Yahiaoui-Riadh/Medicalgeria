import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  phone: z.string().min(9),
  companyName: z.string().min(3),
  rcNumber: z.string().min(5),
  taxId: z.string().min(5),
  address: z.string().min(5),
  wilaya: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });
    if (existing) return NextResponse.json({ error: "Email ou téléphone déjà utilisé." }, { status: 409 });

    const rcExisting = await prisma.wholesaler.findUnique({ where: { rcNumber: data.rcNumber } });
    if (rcExisting) return NextResponse.json({ error: "Numéro RC déjà enregistré." }, { status: 409 });

    const hashed = await bcrypt.hash(data.password, 12);

    await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: hashed,
        phone: data.phone.trim(),
        role: "WHOLESALER",
        isVerified: false,
        wholesaler: {
          create: {
            companyName: data.companyName.trim(),
            rcNumber: data.rcNumber.trim(),
            taxId: data.taxId.trim(),
            address: data.address.trim(),
            wilaya: data.wilaya,
          },
        },
      },
    });

    return NextResponse.json({ success: true, message: "Compte grossiste créé. En attente de vérification." }, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    console.error("[register/wholesaler]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
