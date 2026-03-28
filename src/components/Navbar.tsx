"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import "../app/globals.css";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav style={{ padding: "1.5rem 3rem", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
      <Link href="/" style={{ textDecoration: "none" }}>
        <span style={{ fontWeight: 800, fontSize: "1.5rem", color: "white" }}>
           Macro <span className="text-gradient">Lens</span>
        </span>
      </Link>
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        {session ? (
          <>
            <Link href="/history" className="subtitle" style={{ textDecoration: "none", color: "white", fontWeight: 600 }}>🕰️ History</Link>
            <span className="subtitle" style={{ opacity: 0.3 }}>|</span>
            <span style={{ fontWeight: 600, color: "var(--accent-primary)" }}>@{session.user?.name}</span>
            <button onClick={() => signOut()} className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>Log Out</button>
          </>
        ) : (
          <Link href="/login" className="btn" style={{ padding: "0.5rem 1.5rem" }}>Login</Link>
        )}
      </div>
    </nav>
  );
}
