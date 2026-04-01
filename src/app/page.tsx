"use client";

import { useState, useEffect, useRef } from "react";
import "./globals.css";
import { QRCodeSVG } from "qrcode.react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [image, setImage] = useState<File | null>(null);
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [ingredients, setIngredients] = useState<{name: string; amount: string}[]>([]);
  const [nutrition, setNutrition] = useState<{calories: number; protein: number; carbs: number; fat: number; breakdown: {originalName: string; fdcName: string; amount: string; macros: {calories: number; protein: number; carbs: number; fat: number}}[]} | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Live Link Session variables
  const [sessionId] = useState(() => uuidv4());
  const [mobileLink, setMobileLink] = useState("");
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Generate the pairing link
    const generateLink = () => {
        const origin = window.location.origin;
        setMobileLink(`${origin}/mobile?session=${sessionId}`);
    };
    generateLink();

    // Start polling the sync backend
    pollingInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/sync?session=${sessionId}`);
        const data = await res.json();
        
        if (data.status === 'success' && data.image) {
           // We received an image! Convert base64 to File
           const resFile = await fetch(data.image);
           const blob = await resFile.blob();
           const file = new File([blob], "mobile-capture.jpg", { type: "image/jpeg" });
           setImage(file);
        }
      } catch {
        // Silent catch for background polling
      }
    }, 1500);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [sessionId]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImage(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("context", context);
      
      const res = await fetch("/api/decipher", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        alert("AI Processing Failed: " + data.error);
        return;
      }
      if (data.ingredients) setIngredients(data.ingredients);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateIngredient = (index: number, field: "name" | "amount", value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleCalculateNutrition = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });
      const data = await res.json();
      if (data.nutrition) {
        setNutrition(data.nutrition);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!image || !nutrition) return;
    setIsSaving(true);
    try {
      // Convert image File to Base64 for storage
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });
      reader.readAsDataURL(image);
      const base64ImageRaw = await base64Promise;

      // Compress using Canvas
      const compressedBase64 = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          // Max dimension 800px for history
          const scale = Math.min(1, 800 / Math.max(img.width, img.height));
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Compress to 0.7 quality jpeg
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = base64ImageRaw;
      });

      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nutrition,
          image: compressedBase64
        }),
      });
      if (res.ok) setSaved(true);
    } catch (err) {
      console.error("Failed to save meal:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="container flex-col gap-8" style={{ maxWidth: "1200px" }}>
      <header className="animate-fade-in text-center">
        <h1 className="heading-1">Macro <span className="text-gradient">Lens</span></h1>
        <p className="subtitle">Snap a photo of your meal. AI will handle the rest.</p>
      </header>

      <div className="analysis-grid" style={{ display: "grid", gridTemplateColumns: image ? "1fr" : "1fr 300px", gap: "2rem", transition: "all 0.5s ease" }}>
        
        {/* Main Interface Block */}
        <div className="glass-panel animate-fade-in delay-100 flex-col gap-6" style={{ alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "400px" }}>
          
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: "2px dashed var(--card-border)",
              borderRadius: "var(--radius-lg)",
              padding: "4rem 2rem",
              width: "100%",
              height: "100%",
              cursor: "pointer",
              background: image ? "rgba(168, 85, 247, 0.05)" : "transparent",
              transition: "all 0.3s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {image ? (
              <div className="flex-col flex-center gap-4">
                <span style={{ fontSize: "3rem", filter: "drop-shadow(0 0 10px rgba(168,85,247,0.5))" }}>📸</span>
                <p style={{ fontWeight: 600, fontSize: "1.2rem" }}>{image.name}</p>
                <p className="subtitle" style={{ fontSize: "0.9rem", color: "var(--accent-success)" }}>Successfully synched and ready for analysis!</p>
                <p className="subtitle" style={{ fontSize: "0.8rem", marginTop: "-10px" }}>Click or drag to replace</p>
              </div>
            ) : (
              <div className="flex-col flex-center gap-4">
                <span style={{ fontSize: "3rem" }}>🍽️</span>
                <h3 className="heading-2" style={{ marginBottom: 0 }}>Drop food photo here</h3>
                <p className="subtitle">or click to browse local files</p>
              </div>
            )}
            <input 
              id="file-upload" 
              type="file" 
              accept="image/*" 
              style={{ display: "none" }} 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
              }} 
            />
          </div>

          <input 
            type="text" 
            className="input" 
            placeholder="Optional: Add context (e.g. 'Cooked in olive oil', 'From Sweetgreen')" 
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />

          <button 
            className="btn" 
            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
            onClick={handleAnalyze}
            disabled={!image || isLoading}
          >
            {isLoading ? "✨ Deciphering..." : "Analyze Meal"}
          </button>
        </div>

        {/* Live Link QR Block (Only visible when no image is loaded) */}
        {!image && (
           <div className="live-link-box glass-panel animate-fade-in delay-200 flex-col flex-center text-center gap-4" style={{ padding: "2rem" }}>
              <div style={{ background: "rgba(168,85,247,0.1)", padding: "1rem", borderRadius: "50%", marginBottom: "0.5rem" }}>
                 <span style={{ fontSize: "2rem" }}>📱</span>
              </div>
              <h3 className="heading-2" style={{ fontSize: "1.2rem", marginBottom: 0 }}>Live Link</h3>
              <p className="subtitle" style={{ fontSize: "0.9rem" }}>Scan with your phone to take a live photo</p>
              
              <div style={{ background: "white", padding: "1rem", borderRadius: "10px", marginTop: "1rem", display: mobileLink ? "block" : "none" }}>
                 {mobileLink && <QRCodeSVG value={mobileLink} size={150} />}
              </div>
              <p className="subtitle" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>Waiting for camera stream...</p>
           </div>
        )}

      </div>

      {ingredients.length > 0 && !nutrition && (
        <div className="glass-panel animate-fade-in delay-200">
          <h2 className="heading-2">Deciphered <span className="text-gradient">Ingredients</span></h2>
          <div className="flex-col gap-4" style={{ marginTop: "1.5rem" }}>
            {ingredients.map((ing, idx) => (
              <div key={idx} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <input 
                  className="input" 
                  value={ing.name} 
                  onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                />
                <input 
                  className="input" 
                  style={{ width: "120px" }} 
                  value={ing.amount} 
                  onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                />
                <button 
                  className="btn btn-secondary" 
                  onClick={() => removeIngredient(idx)}
                  style={{ padding: "0.5rem 1rem" }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button 
              className="btn btn-secondary" 
              onClick={() => setIngredients([...ingredients, { name: "New Ingredient", amount: "100g"}])}
            >
              + Add Ingredient
            </button>
            <button 
              className="btn" 
              style={{ marginTop: "1rem" }}
              onClick={handleCalculateNutrition}
              disabled={isCalculating}
            >
              {isCalculating ? "Calculating..." : "Calculate Nutrition ➔"}
            </button>
          </div>
        </div>
      )}

      {nutrition && (
        <div className="glass-panel animate-fade-in delay-300">
          <h2 className="heading-2 text-gradient">Nutrition Overview</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginTop: "2rem" }}>
            
            <div className="glass-panel flex-col flex-center cursor-default" style={{ padding: "2rem 1rem", border: "1px solid rgba(245, 158, 11, 0.4)" }}>
              <p className="subtitle" style={{ fontSize: "1rem" }}>Calories</p>
              <h3 style={{ fontSize: "3rem", margin: 0, fontWeight: 800 }}>{Math.round(nutrition.calories)}</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--accent-warning)" }}>kcal</p>
            </div>
            
            <div className="glass-panel flex-col flex-center cursor-default" style={{ padding: "2rem 1rem", border: "1px solid rgba(168, 85, 247, 0.4)" }}>
              <p className="subtitle" style={{ fontSize: "1rem" }}>Protein</p>
              <h3 style={{ fontSize: "3rem", margin: 0, fontWeight: 800 }}>{Math.round(nutrition.protein)}g</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--accent-primary)" }}>macros</p>
            </div>
            
            <div className="glass-panel flex-col flex-center cursor-default" style={{ padding: "2rem 1rem", border: "1px solid rgba(16, 185, 129, 0.4)" }}>
              <p className="subtitle" style={{ fontSize: "1rem" }}>Carbs</p>
              <h3 style={{ fontSize: "3rem", margin: 0, fontWeight: 800 }}>{Math.round(nutrition.carbs)}g</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--accent-success)" }}>macros</p>
            </div>
            
            <div className="glass-panel flex-col flex-center cursor-default" style={{ padding: "2rem 1rem", border: "1px solid rgba(59, 130, 246, 0.4)" }}>
              <p className="subtitle" style={{ fontSize: "1rem" }}>Fat</p>
              <h3 style={{ fontSize: "3rem", margin: 0, fontWeight: 800 }}>{Math.round(nutrition.fat)}g</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--accent-secondary)" }}>macros</p>
            </div>
            
          </div>

          <div style={{ marginTop: "2rem" }}>
             <h3 className="heading-2" style={{ fontSize: "1.2rem" }}>Ingredient Breakdown</h3>
             <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
               {nutrition.breakdown.map((item: {originalName: string; fdcName: string; amount: string; macros: {calories: number}}, i: number) => (
                 <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1rem", background: "rgba(255,255,255,0.05)", borderLeft: "4px solid var(--accent-primary)", borderRadius: "var(--radius-sm)" }}>
                   <span>{item.originalName} ({item.amount}) <span style={{color: "gray", fontSize: "0.8rem", marginLeft: "10px"}}>mapped to: {item.fdcName}</span></span>
                   <span style={{ color: "var(--accent-secondary)", fontWeight: 600 }}>{Math.round(item.macros.calories)} kcal</span>
                 </li>
               ))}
             </ul>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem" }}>
             {session && !saved && (
                <button 
                   className="btn" 
                   style={{ flex: 1, padding: "1rem", fontSize: "1.1rem", background: "var(--accent-success)" }}
                   onClick={handleSaveMeal}
                   disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "💾 Save Meal to Log"}
                </button>
             )}
             
             {saved && (
                <button 
                   className="btn" 
                   style={{ flex: 1, padding: "1rem", fontSize: "1.1rem", background: "rgba(16, 185, 129, 0.2)", color: "var(--accent-success)", border: "1px solid var(--accent-success)", cursor: "default" }}
                   disabled
                >
                  ✅ Saved Successfully!
                </button>
             )}

             <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: "1rem", fontSize: "1.1rem" }}
                onClick={() => {
                   setNutrition(null);
                   setIngredients([]);
                   setImage(null);
                   setSaved(false);
                }}
             >
               Start New Meal
             </button>
          </div>
        </div>
      )}

    </main>
  );
}
