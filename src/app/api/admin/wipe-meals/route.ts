import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function DELETE() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.isAdmin) {
     return NextResponse.json({ error: "Unauthorized Server Action. Admin access required." }, { status: 401 });
  }

  try {
    // Delete all meals across all users
    await prisma.meal.deleteMany({});
    
    return NextResponse.json({ success: true, message: "All meal data wiped successfully." });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Wipe Database error:", error.message);
    return NextResponse.json({ error: "Failed to wipe database" }, { status: 500 });
  }
}
