"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import "../globals.css";

export default function Login() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      isRegister: isRegister ? "true" : "false",
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="container flex-col flex-center" style={{ minHeight: "100vh" }}>
      <header className="animate-fade-in text-center" style={{ marginBottom: "2rem" }}>
        <h1 className="heading-1">Macro <span className="text-gradient">Lens</span></h1>
        <p className="subtitle">Login to save and view your macro history</p>
      </header>
      
      <form className="glass-panel animate-fade-in delay-100 flex-col gap-4" style={{ width: "100%", maxWidth: "400px" }} onSubmit={handleSubmit}>
        <h2 className="heading-2 text-center" style={{ marginBottom: "1rem" }}>
           {isRegister ? "Create Account" : "Welcome Back"}
        </h2>
        
        {error && <div style={{ background: "rgba(245,158,11,0.2)", color: "var(--accent-warning)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.3)" }}>{error}</div>}

        <input 
          type="text" 
          className="input" 
          placeholder="Username" 
          required 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input 
          type="password" 
          className="input" 
          placeholder="Password" 
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <button className="btn" style={{ padding: "1rem", marginTop: "1rem" }} disabled={loading}>
          {loading ? "Please wait..." : (isRegister ? "Sign Up" : "Sign In")}
        </button>

        <p className="subtitle text-center" style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <button 
             type="button" 
             onClick={() => setIsRegister(!isRegister)}
             style={{ background: "none", border: "none", color: "var(--accent-secondary)", marginLeft: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "inherit" }}
          >
             {isRegister ? "Sign in instead" : "Create one now"}
          </button>
        </p>

      </form>
    </div>
  );
}
