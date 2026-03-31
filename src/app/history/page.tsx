import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Meal } from "@prisma/client";
import { redirect } from "next/navigation";
import Image from "next/image";
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
    <main className="container flex-col gap-8" style={{ maxWidth: "1200px" }}>
      <header className="animate-fade-in text-center" style={{ marginBottom: "2rem" }}>
        <h1 className="heading-1">Macro <span className="text-gradient">Journal</span></h1>
        <p className="subtitle">Every meal, every macro, captured forever.</p>
      </header>
      
      {meals.length === 0 ? (
         <div className="glass-panel text-center animate-fade-in delay-100" style={{ padding: "6rem 2rem" }}>
             <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📸</div>
             <h2 className="heading-2">No meals logged yet</h2>
             <p className="subtitle">Start by analyzing your first meal on the dashboard!</p>
             <a href="/" className="btn" style={{ marginTop: "2rem", display: "inline-block", textDecoration: "none" }}>Go to Dashboard</a>
         </div>
      ) : (
         <div className="meal-grid animate-fade-in delay-100">
            {meals.map((meal: Meal) => {
               const items = meal.ingredients ? JSON.parse(meal.ingredients) : [];
               const date = new Date(meal.createdAt);
               
               return (
                  <div key={meal.id} className="glass-panel meal-card flex-col">
                     <div className="meal-image-container">
                        {meal.image ? (
                           <img 
                              src={meal.image} 
                              alt="Logged Meal" 
                              className="meal-image"
                           />
                        ) : (
                           <div className="meal-image-placeholder flex-center">
                              <span>No Photo Captured</span>
                           </div>
                        )}
                        <div className="meal-date-badge">
                           {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                     </div>

                     <div className="meal-content">
                        <div className="meal-header">
                           <span className="meal-time">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           <h3 className="meal-calories text-gradient">{meal.calories} <small>kcal</small></h3>
                        </div>

                        <div className="macro-row">
                           <div className="macro-item">
                              <span className="macro-label">Protein</span>
                              <span className="macro-value" style={{ color: "var(--accent-primary)" }}>{meal.protein}g</span>
                           </div>
                           <div className="macro-item">
                              <span className="macro-label">Carbs</span>
                              <span className="macro-value" style={{ color: "var(--accent-success)" }}>{meal.carbs}g</span>
                           </div>
                           <div className="macro-item">
                              <span className="macro-label">Fat</span>
                              <span className="macro-value" style={{ color: "var(--accent-secondary)" }}>{meal.fat}g</span>
                           </div>
                        </div>

                        <div className="ingredients-summary">
                           <p className="macro-label" style={{ marginBottom: "0.5rem" }}>Key Ingredients:</p>
                           <div className="ingredients-chips">
                              {items.slice(0, 4).map((ing: any, i: number) => (
                                 <span key={i} className="ingredient-chip">
                                    {ing.originalName}
                                 </span>
                              ))}
                              {items.length > 4 && <span className="ingredient-chip">+{items.length - 4} more</span>}
                           </div>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      )}
    </main>
  );
}
