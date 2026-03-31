"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

type AdminUser = { id: string, username: string, totalMeals: number };
type AdminStats = {
  users: AdminUser[];
  totalMeals: number;
  timeSeries: { date: string, count: number }[];
};

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<"overview" | "controls">("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Stats
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Crucial Warning: Are you sure you want to PERMANENTLY delete user "@${username}" and all their meals?`)) return;
    
    // Optimistic Update
    if (stats) setStats({ ...stats, users: stats.users.filter(u => u.id !== id) });

    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Failed to delete user", err);
      fetchStats(); // Resync on failure
    }
  };

  const handleGlobalWipe = async () => {
    if (!confirm("🚨 MASSIVE DESTRUCTIVE ACTION 🚨\n\nAre you sure you want to permanently delete ALL MEALS across the entire database to free up space? This will leave users with 0 history.")) return;
    
    try {
      await fetch('/api/admin/wipe-meals', { method: 'DELETE' });
      alert("Success: All meal data has been securely wiped from the database.");
      fetchStats(); // Update tables to show 0
    } catch (err) {
      console.error("Failed to wipe database", err);
      alert("Operation failed. See console.");
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex-center" style={{ height: "400px", flexDirection: "column", gap: "1rem" }}>
        <p className="subtitle">Authenticating and fetching secure data...</p>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 w-full animate-fade-in">
      
      {/* Tabs UI */}
      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--card-border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
        <button 
          onClick={() => setActiveTab("overview")}
          style={{ 
            background: "transparent", border: "none", color: activeTab === "overview" ? "var(--foreground)" : "#71717a", 
            fontSize: "1.2rem", fontWeight: 700, padding: "0.5rem 1rem", cursor: "pointer",
            borderBottom: activeTab === "overview" ? "2px solid var(--accent-primary)" : "2px solid transparent",
            transition: "all 0.2s ease"
          }}
        >
          📈 System Overview
        </button>
        <button 
          onClick={() => setActiveTab("controls")}
          style={{ 
            background: "transparent", border: "none", color: activeTab === "controls" ? "var(--foreground)" : "#71717a", 
            fontSize: "1.2rem", fontWeight: 700, padding: "0.5rem 1rem", cursor: "pointer",
            borderBottom: activeTab === "controls" ? "2px solid var(--accent-warning)" : "2px solid transparent",
            transition: "all 0.2s ease"
          }}
        >
          ⚙️ Operations
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="animate-fade-in delay-100 flex-col gap-6">
          
          {/* Top Line Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
             <div className="glass-panel text-center">
                <p className="subtitle" style={{ fontSize: "1rem" }}>Total Registered Users</p>
                <h3 className="text-gradient" style={{ fontSize: "3.5rem", fontWeight: 800, margin: 0 }}>{stats.users.length}</h3>
             </div>
             <div className="glass-panel text-center">
                <p className="subtitle" style={{ fontSize: "1rem" }}>Total Meals Logged</p>
                <h3 className="text-gradient" style={{ fontSize: "3.5rem", fontWeight: 800, margin: 0, backgroundImage: "linear-gradient(135deg, var(--accent-success), var(--accent-secondary))" }}>{stats.totalMeals}</h3>
             </div>
          </div>

          {/* Time Series Graph */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
             <h2 className="heading-2">Platform Activity Volume</h2>
             <p className="subtitle" style={{ marginBottom: "2rem", fontSize: "0.9rem" }}>Total meals submitted per day across all users.</p>
             
             <div style={{ height: "400px", width: "100%" }}>
               {stats.timeSeries.length === 0 ? (
                  <div className="flex-center w-full h-full subtitle">No usage data to graph.</div>
               ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.timeSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="#71717a" style={{ fontSize: "0.8rem" }} />
                      <YAxis stroke="#71717a" style={{ fontSize: "0.8rem" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(24, 24, 27, 0.9)", borderColor: "var(--card-border)", borderRadius: "8px", backdropFilter: "blur(4px)" }} />
                      <Area type="monotone" dataKey="count" stroke="var(--accent-primary)" strokeWidth={3} fill="url(#colorUsage)" />
                    </AreaChart>
                  </ResponsiveContainer>
               )}
             </div>
          </div>

        </div>
      )}

      {activeTab === "controls" && (
        <div className="animate-fade-in delay-100 flex-col gap-6">
          
          <div className="glass-panel" style={{ border: "1px solid rgba(239, 68, 68, 0.4)" }}>
             <h2 className="heading-2" style={{ color: "var(--accent-warning)" }}>⚠️ Database Purge</h2>
             <p className="subtitle" style={{ fontSize: "0.9rem", maxWidth: "800px", marginBottom: "1.5rem" }}>
               Executing this command will instantly drop every single meal entry across the entire database infrastructure. Users will retain their accounts, but their history portals will be completely reset. Use this to rapidly free up block storage.
             </p>
             <button onClick={handleGlobalWipe} className="btn" style={{ background: "transparent", border: "2px solid #ef4444", color: "#ef4444", padding: "1rem 2rem" }}
               onMouseOver={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; }}
               onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
             >
                🧨 EXECUTING: WIPE ALL MEALS GLOBALLY
             </button>
          </div>

          <div className="glass-panel">
            <h2 className="heading-2">User Directory</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left", color: "#a1a1aa", fontSize: "0.85rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "1rem" }}>User ID</th>
                    <th style={{ padding: "1rem" }}>Username</th>
                    <th style={{ padding: "1rem" }}>Total Meals Logged</th>
                    <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#a1a1aa" }}>{user.id}</td>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>@{user.username}</td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ background: "rgba(168, 85, 247, 0.1)", color: "var(--accent-primary)", padding: "0.2rem 0.8rem", borderRadius: "10px", fontWeight: "bold" }}>
                          {user.totalMeals} logs
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <button onClick={() => handleDeleteUser(user.id, user.username)} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderColor: "rgba(239, 68, 68, 0.3)", color: "#fca5a5" }}>
                          Delete User
                        </button>
                      </td>
                    </tr>
                  ))}
                  {stats.users.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#71717a" }}>No registered users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
