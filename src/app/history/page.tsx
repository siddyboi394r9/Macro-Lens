import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Meal } from "@prisma/client";
import { redirect } from "next/navigation";
import "../globals.css";
import HistoryClient from "./HistoryClient";

export const dynamic = 'force-dynamic';

export default async function History() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
     redirect("/login");
  }

  let meals = [];
  try {
    meals = await prisma.meal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("HISTORY_QUERY_FAILED:", error.message);
    return (
      <main className="container flex-col gap-8">
        <div className="glass-panel text-center animate-fade-in" style={{ padding: "4rem", border: "1px solid var(--accent-warning)" }}>
          <h2 className="heading-2">System Sync Required</h2>
          <p className="subtitle">It looks like your database is out of sync with the new code.</p>
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "8px", marginTop: "1rem", fontFamily: "monospace", fontSize: "0.8rem", textAlign: "left", color: "#fca5a5" }}>
            {error.message}
          </div>
          <p className="subtitle" style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
            Please run <strong>npx prisma db push</strong> in your terminal to fix this.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container flex-col gap-8" style={{ maxWidth: "1200px" }}>
      <header className="animate-fade-in text-center">
        <h1 className="heading-1">Macro <span className="text-gradient">Journal</span></h1>
        <p className="subtitle">Every meal, every macro, captured forever.</p>
      </header>
      
      <HistoryClient initialMeals={meals} />
    </main>
  );
}
