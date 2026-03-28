import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const context = formData.get('context') as string | null;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = image.type || 'image/jpeg';
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `You are an elite automated nutrition parser analyzing food images.
Look closely at the provided food image. Identify ALL the discernible raw ingredients, cooking mediums, and sub-components used to make or represent this plate.
${context ? `\nThe user provided the following extra context about this meal: "${context}"` : ""}

You MUST return a perfectly formed JSON array of objects. Do not wrap the JSON in markdown code blocks (\`\`\`).
Each object in the array MUST strictly conform to this structure:
{ "name": "Specific ingredient name", "amount": "Estimated measurement (e.g. 150g, 1 tbsp, 1 slice, 0.5 cup)" }

Your response must be exclusively the JSON array literal. Do not add any conversational text.`;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { data: buffer.toString("base64"), mimeType } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const text = result.response.text();
    
    let ingredients = [];
    try {
      ingredients = JSON.parse(text);
    } catch {
       return NextResponse.json({ error: 'Failed to properly parse the AI JSON output formatting.' }, { status: 500 });
    }

    return NextResponse.json({ ingredients });
  } catch (err) {
    console.error("Gemini Error:", err);
    return NextResponse.json({ error: 'Failed to process the image through the AI model' }, { status: 500 });
  }
}
