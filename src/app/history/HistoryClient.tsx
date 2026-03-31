"use client";

import { useState, useMemo } from "react";
import type { Meal as PrismaMeal } from "@prisma/client";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area
} from "recharts";

type Meal = PrismaMeal & { image?: string | null };

export default function HistoryClient({ initialMeals }: { initialMeals: Meal[] }) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [activeTab, setActiveTab] = useState<"journal" | "stats">("journal");
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "3M" | "ALL">("1M");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Line toggle states
  const [visibleMetrics, setVisibleMetrics] = useState({
    calories: true,
    protein: true,
    carbs: true,
    fat: true
  });

  const toggleMetric = (key: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this meal? It will be removed from your logs instantly.")) return;
    
    setDeletingId(id);
    // Optimistic UI update
    setMeals(prev => prev.filter(m => m.id !== id));
    
    try {
      await fetch(`/api/meals/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Failed to delete", err);
      // Revert if error
      setMeals(initialMeals);
    } finally {
      setDeletingId(null);
    }
  };

  const chartData = useMemo(() => {
    // 1. Filter by Time Range
    const now = new Date();
    let cutoffDate = new Date(0); // ALL
    if (timeRange === "1W") cutoffDate = new Date(now.setDate(now.getDate() - 7));
    else if (timeRange === "1M") cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
    else if (timeRange === "3M") cutoffDate = new Date(now.setMonth(now.getMonth() - 3));

    const filteredMeals = meals.filter(m => new Date(m.createdAt) >= cutoffDate);

    // 2. Aggregate by Date
    const dailyData: Record<string, { date: string; dateObj: Date; calories: number; protein: number; carbs: number; fat: number }> = {};

    filteredMeals.forEach(meal => {
      const d = new Date(meal.createdAt);
      // Create a stable local date string (e.g., 'Mar 30')
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { date: dateStr, dateObj: d, calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      dailyData[dateStr].calories += meal.calories;
      dailyData[dateStr].protein += meal.protein;
      dailyData[dateStr].carbs += meal.carbs;
      dailyData[dateStr].fat += meal.fat;
    });

    // 3. Sort Chronologically
    return Object.values(dailyData).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [meals, timeRange]);

  return (
    <div className="flex-col gap-6 w-full animate-fade-in">
      
      {/* Tabs UI */}
      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--card-border)", paddingBottom: "1rem", marginBottom: "1rem", justifyContent: "center" }}>
        <button 
          onClick={() => setActiveTab("journal")}
          style={{ 
            background: "transparent", border: "none", color: activeTab === "journal" ? "var(--foreground)" : "#71717a", 
            fontSize: "1.2rem", fontWeight: 700, padding: "0.5rem 1rem", cursor: "pointer",
            borderBottom: activeTab === "journal" ? "2px solid var(--accent-primary)" : "2px solid transparent",
            transition: "all 0.2s ease"
          }}
        >
          📷 Macro Journal
        </button>
        <button 
          onClick={() => setActiveTab("stats")}
          style={{ 
            background: "transparent", border: "none", color: activeTab === "stats" ? "var(--foreground)" : "#71717a", 
            fontSize: "1.2rem", fontWeight: 700, padding: "0.5rem 1rem", cursor: "pointer",
            borderBottom: activeTab === "stats" ? "2px solid var(--accent-secondary)" : "2px solid transparent",
            transition: "all 0.2s ease"
          }}
        >
          📊 User Stats
        </button>
      </div>

      {activeTab === "journal" && (
        <>
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
                   const isDeleting = deletingId === meal.id;
                   
                   return (
                      <div key={meal.id} className="glass-panel meal-card flex-col" style={{ opacity: isDeleting ? 0.5 : 1, transition: "opacity 0.2s ease" }}>
                         <div className="meal-image-container">
                            {meal.image ? (
                               /* eslint-disable-next-line @next/next/no-img-element */
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
                                  {items.slice(0, 4).map((ing: {originalName: string}, i: number) => (
                                     <span key={i} className="ingredient-chip">
                                        {ing.originalName}
                                     </span>
                                  ))}
                                  {items.length > 4 && <span className="ingredient-chip">+{items.length - 4} more</span>}
                               </div>
                            </div>

                            <button
                              onClick={() => handleDelete(meal.id)}
                              disabled={isDeleting}
                              style={{ 
                                marginTop: "1rem", width: "100%", padding: "0.75rem", background: "none", 
                                border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--foreground)", 
                                borderRadius: "var(--radius-sm)", cursor: isDeleting ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease", fontWeight: 600,
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.borderColor = "var(--accent-warning)"; e.currentTarget.style.color = "var(--accent-warning)"; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)"; e.currentTarget.style.color = "var(--foreground)"; }}
                            >
                              {isDeleting ? "Deleting..." : "🗑️ Delete Entry"}
                            </button>
                         </div>
                      </div>
                   );
                })}
             </div>
          )}
        </>
      )}

      {activeTab === "stats" && (
        <div className="glass-panel animate-fade-in delay-100 flex-col gap-6" style={{ padding: "2rem" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
             <div>
                <h2 className="heading-2" style={{ marginBottom: "0.25rem" }}>Dietary Analytics</h2>
                <p className="subtitle" style={{ fontSize: "0.9rem" }}>Track your daily macro aggregations against FDA recommended targets.</p>
             </div>
             
             {/* Time Horizon Toggles (Google Finance Style) */}
             <div style={{ display: "flex", gap: "0.5rem", background: "rgba(0,0,0,0.4)", padding: "0.25rem", borderRadius: "8px" }}>
                {(["1W", "1M", "3M", "ALL"] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    style={{
                      background: timeRange === range ? "rgba(255,255,255,0.1)" : "transparent",
                      border: "none", color: timeRange === range ? "var(--foreground)" : "#71717a",
                      padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600
                    }}
                  >
                    {range}
                  </button>
                ))}
             </div>
          </div>

          {/* Metric Legend Toggles (Google Finance Style) */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--card-border)" }}>
             <button 
                onClick={() => toggleMetric("calories")}
                style={{ flex: 1, minWidth: "120px", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "1rem", background: visibleMetrics.calories ? "rgba(245, 158, 11, 0.1)" : "transparent", border: visibleMetrics.calories ? "1px solid var(--accent-warning)" : "1px solid var(--card-border)", borderRadius: "var(--radius-md)", cursor: "pointer", opacity: visibleMetrics.calories ? 1 : 0.5, transition: "all 0.2s" }}
             >
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "0.25rem" }}>Calories</span>
                <span style={{ color: "var(--accent-warning)", fontWeight: "bold" }}>● Toggle</span>
             </button>
             <button 
                onClick={() => toggleMetric("protein")}
                style={{ flex: 1, minWidth: "120px", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "1rem", background: visibleMetrics.protein ? "rgba(168, 85, 247, 0.1)" : "transparent", border: visibleMetrics.protein ? "1px solid var(--accent-primary)" : "1px solid var(--card-border)", borderRadius: "var(--radius-md)", cursor: "pointer", opacity: visibleMetrics.protein ? 1 : 0.5, transition: "all 0.2s" }}
             >
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "0.25rem" }}>Protein</span>
                <span style={{ color: "var(--accent-primary)", fontWeight: "bold" }}>● Toggle</span>
             </button>
             <button 
                onClick={() => toggleMetric("carbs")}
                style={{ flex: 1, minWidth: "120px", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "1rem", background: visibleMetrics.carbs ? "rgba(16, 185, 129, 0.1)" : "transparent", border: visibleMetrics.carbs ? "1px solid var(--accent-success)" : "1px solid var(--card-border)", borderRadius: "var(--radius-md)", cursor: "pointer", opacity: visibleMetrics.carbs ? 1 : 0.5, transition: "all 0.2s" }}
             >
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "0.25rem" }}>Carbs</span>
                <span style={{ color: "var(--accent-success)", fontWeight: "bold" }}>● Toggle</span>
             </button>
             <button 
                onClick={() => toggleMetric("fat")}
                style={{ flex: 1, minWidth: "120px", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "1rem", background: visibleMetrics.fat ? "rgba(59, 130, 246, 0.1)" : "transparent", border: visibleMetrics.fat ? "1px solid var(--accent-secondary)" : "1px solid var(--card-border)", borderRadius: "var(--radius-md)", cursor: "pointer", opacity: visibleMetrics.fat ? 1 : 0.5, transition: "all 0.2s" }}
             >
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#a1a1aa", marginBottom: "0.25rem" }}>Fat</span>
                <span style={{ color: "var(--accent-secondary)", fontWeight: "bold" }}>● Toggle</span>
             </button>
          </div>

          <div style={{ height: "400px", width: "100%", marginTop: "1rem" }}>
             {chartData.length === 0 ? (
                <div className="flex-center h-full w-full" style={{ height: "100%", color: "#52525b" }}>No data points in this timeframe</div>
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-warning)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent-warning)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCarbs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" style={{ fontSize: "0.8rem", fill: "#71717a" }} tickMargin={10} axisLine={false} tickLine={false} />
                    {/* Hiding Y axis to keep it clean like Google Finance, tooltips handle data */}
                    <YAxis hide domain={[0, 'dataMax']} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: "rgba(24, 24, 27, 0.9)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", backdropFilter: "blur(10px)", color: "white" }} 
                       itemStyle={{ fontWeight: "bold" }}
                    />
                    
                    {/* FDA References */}
                    {visibleMetrics.calories && <ReferenceLine y={2000} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', fill: '#f59e0b', fontSize: 10, value: 'FDA Rec Kcal' }} />}
                    {visibleMetrics.protein && <ReferenceLine y={50} stroke="#a855f7" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', fill: '#a855f7', fontSize: 10, value: 'FDA Rec Pro' }} />}
                    {visibleMetrics.carbs && <ReferenceLine y={275} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', fill: '#10b981', fontSize: 10, value: 'FDA Rec Carbs' }} />}
                    {visibleMetrics.fat && <ReferenceLine y={78} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', fill: '#3b82f6', fontSize: 10, value: 'FDA Rec Fat' }} />}

                    {visibleMetrics.calories && <Area type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={3} fill="url(#colorCal)" />}
                    {visibleMetrics.protein && <Area type="monotone" dataKey="protein" stroke="#a855f7" strokeWidth={3} fill="url(#colorPro)" />}
                    {visibleMetrics.carbs && <Area type="monotone" dataKey="carbs" stroke="#10b981" strokeWidth={3} fill="url(#colorCarbs)" />}
                    {visibleMetrics.fat && <Area type="monotone" dataKey="fat" stroke="#3b82f6" strokeWidth={3} fill="url(#colorFat)" />}
                    
                  </AreaChart>
                </ResponsiveContainer>
             )}
          </div>
        </div>
      )}

    </div>
  );
}
