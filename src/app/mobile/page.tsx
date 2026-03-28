"use client";

import { useEffect, useState } from "react";
import "../globals.css";

export default function MobileCamera() {
  const [session, setSession] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sid = searchParams.get("session");
    if (sid) setSession(sid);
  }, []);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    setIsUploading(true);
    setSuccess(false);

    try {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Image = reader.result;

        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session, image: base64Image }),
        });

        setSuccess(true);
      };

      reader.readAsDataURL(file);
    } catch {
      alert("Failed to sync photo");
    } finally {
      setIsUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="container flex-col flex-center text-center" style={{ minHeight: "100vh" }}>
        <h2 className="heading-2">Invalid Session</h2>
        <p className="subtitle">Please scan the QR code on your computer screen.</p>
      </div>
    );
  }

  return (
    <div className="container flex-col flex-center text-center" style={{ minHeight: "100vh", padding: "1rem", maxWidth: "450px" }}>
      <header className="animate-fade-in text-center" style={{ marginBottom: "2rem" }}>
        <h1 className="heading-1" style={{ fontSize: "2.5rem" }}>Macro <span className="text-gradient">Lens</span></h1>
        <p className="subtitle" style={{ fontSize: "1rem" }}>Linked securely to your desktop</p>
      </header>
      
      {success ? (
         <div className="glass-panel animate-fade-in flex-col gap-4" style={{ padding: "3rem 1.5rem" }}>
            <span style={{ fontSize: "4rem" }}>✅</span>
            <h2 className="heading-2" style={{ marginBottom: 0 }}>Photo Transferred!</h2>
            <p className="subtitle" style={{ fontSize: "1rem" }}>Check your laptop screen. You can snap another photo if needed.</p>
            
            <label className="btn" style={{ marginTop: "1rem", cursor: "pointer", display: "inline-block", padding: "1rem 2rem", width: "100%" }}>
                Snap Another 📸
                <input type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: "none" }} />
            </label>
         </div>
      ) : (
        <div className="glass-panel animate-fade-in flex-col gap-4" style={{ padding: "3rem 1.5rem" }}>
          <span style={{ fontSize: "4rem" }}>📷</span>
          <h2 className="heading-2" style={{ marginBottom: 0 }}>Ready to Snap</h2>
          <p className="subtitle" style={{ fontSize: "1rem" }}>Point your camera at the food to immediately connect it to your analysis session.</p>
          
          <label className="btn" style={{ marginTop: "1rem", cursor: isUploading ? "not-allowed" : "pointer", display: "inline-block", padding: "1rem 2rem", width: "100%" }}>
              {isUploading ? "Syncing..." : "Launch Camera 📸"}
              <input type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display: "none" }} disabled={isUploading} />
          </label>
        </div>
      )}
    </div>
  );
}
