import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // base64 image

    if (!image) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "Tu es un expert en lecture d'ordonnances médicales algériennes. Extrait les médicaments avec précision. Réponds UNIQUEMENT par un objet JSON : {\"medicines\": [{\"nom\": \"...\", \"dosage\": \"...\", \"posologie\": \"...\"}]}" 
        },
        { 
          role: "user", 
          content: [
            { type: "text", text: "Liste tous les médicaments présents sur cette ordonnance avec leur dosage et posologie." }, 
            { type: "image_url", image_url: { url: image } } 
          ] 
        }
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    const result = JSON.parse(content || "{\"medicines\": []}");
    return NextResponse.json({ medicines: result.medicines || [] });
  } catch (err: any) {
    console.error("[GROQ ERROR]:", err);
    return NextResponse.json({ error: "L'IA de Groq a renvoyé une erreur: " + (err.message || "Inconnue") }, { status: 500 });
  }
}
