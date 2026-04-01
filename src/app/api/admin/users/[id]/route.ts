import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.isAdmin) {
     return NextResponse.json({ error: "Unauthorized Server Action. Admin access required." }, { status: 401 });
  }

  try {
    const { id } = params;

    // The backend uses cascade delete on the Prisma schema, so deleting the user
    // automatically wipes all their logged meals.
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("User deletion error:", error.message);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
