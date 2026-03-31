import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership of the meal before deleting
    const existingMeal = await prisma.meal.findUnique({
      where: { id }
    });

    if (!existingMeal || existingMeal.userId !== session.user.id) {
       return NextResponse.json({ error: "Meal not found or unauthorized to delete" }, { status: 404 });
    }

    await prisma.meal.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Meal securely deleted." });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Meal deletion failed:", error);
    return NextResponse.json({ error: `Failed to delete meal: ${error.message}` }, { status: 500 });
  }
}
