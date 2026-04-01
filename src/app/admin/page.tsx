import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import "../globals.css";
import AdminClient from "./AdminClient";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.isAdmin) {
     redirect("/");
  }

  return (
    <main className="container flex-col gap-8" style={{ maxWidth: "1200px" }}>
      <header className="animate-fade-in text-center" style={{ marginBottom: "1rem" }}>
        <h1 className="heading-1">Admin <span className="text-gradient">Command Center</span></h1>
        <p className="subtitle">System-wide monitoring and user management.</p>
      </header>
      
      <AdminClient />
    </main>
  );
}
