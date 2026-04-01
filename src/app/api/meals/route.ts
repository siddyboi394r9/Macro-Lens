import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { calories, protein, carbs, fat, breakdown, image } = body;

    const meal = await prisma.meal.create({
      data: {
        userId: session.user.id,
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        ingredients: JSON.stringify(breakdown),
        image
      }
    });

    return NextResponse.json({ success: true, meal });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Meal creation failed:", error);
    return NextResponse.json({ error: `Failed to save meal: ${error.message}` }, { status: 500 });
  }
}
