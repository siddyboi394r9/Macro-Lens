import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !(session.user as any).isAdmin) {
     return NextResponse.json({ error: "Unauthorized Server Action. Admin access required." }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        _count: { select: { meals: true } }
      }
    });

    const allMeals = await prisma.meal.findMany({
      select: { createdAt: true }
    });

    const totalMeals = allMeals.length;

    const dailyData: Record<string, { dateObj: Date, count: number }> = {};
    allMeals.forEach(meal => {
      const d = new Date(meal.createdAt);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { dateObj: d, count: 0 };
      }
      dailyData[dateStr].count += 1;
    });

    const timeSeries = Object.entries(dailyData)
      .map(([date, data]) => ({ date, count: data.count, __date: data.dateObj }))
      .sort((a, b) => a.__date.getTime() - b.__date.getTime())
      .map(({ date, count }) => ({ date, count }));

    return NextResponse.json({ 
      users: users.map(u => ({ id: u.id, username: u.username, totalMeals: u._count.meals })),
      totalMeals, 
      timeSeries 
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Admin stats error:", error.message);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
