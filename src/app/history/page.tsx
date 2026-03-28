import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Meal } from "@prisma/client";
import { redirect } from "next/navigation";
import "../globals.css";

export const dynamic = 'force-dynamic';

export default async function History() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
     redirect("/login");
  }

  const meals = await prisma.meal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="container flex-col gap-8">
      <header className="animate-fade-in text-center">
        <h1 className="heading-1">Macro <span className="text-gradient">History</span></h1>
        <p className="subtitle">Review your past logged meals</p>
      </header>
      
      {meals.length === 0 ? (
         <div className="glass-panel text-center animate-fade-in delay-100" style={{ padding: "4rem" }}>
             <p className="subtitle">You haven&apos;t logged any meals yet...</p>
         </div>
      ) : (
         <div className="flex-col gap-6 animate-fade-in delay-100">
            {meals.map((meal: Meal) => {
               const items = JSON.parse(meal.ingredients);
               return (
                  <div key={meal.id} className="glass-panel" style={{ padding: "2rem" }}>
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--card-border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                        <span className="subtitle">{new Date(meal.createdAt).toLocaleDateString()} at {new Date(meal.createdAt).toLocaleTimeString()}</span>
                        <span className="heading-2 text-gradient" style={{ margin: 0 }}>{meal.calories} kcal</span>
                     </div>
                     <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                        <div><strong style={{ color: "var(--accent-primary)" }}>{meal.protein}g</strong> Protein</div>
                        <div><strong style={{ color: "var(--accent-success)" }}>{meal.carbs}g</strong> Carbs</div>
                        <div><strong style={{ color: "var(--accent-secondary)" }}>{meal.fat}g</strong> Fat</div>
                     </div>
                     <div>
                        <p className="subtitle" style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>Ingredients Breakdowns:</p>
                        <ul style={{ listStyle: "circle", paddingLeft: "1.5rem", color: "var(--foreground)", opacity: 0.8, fontSize: "0.9rem" }}>
                           {items.map((ing: {originalName: string; amount: string; macros: {calories: number}}, i: number) => (
                              <li key={i}>{ing.originalName} ({ing.amount}) — <span style={{ color: "var(--accent-secondary)" }}>{ing.macros.calories} kcal</span></li>
                           ))}
                        </ul>
                     </div>
                  </div>
               );
            })}
         </div>
      )}
    </main>
  );
}
