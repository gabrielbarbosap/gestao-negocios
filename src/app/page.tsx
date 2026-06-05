import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicSchedule } from "@/components/public/public-schedule";
import { PublicPackages } from "@/components/public/public-packages";

export default function HomePage() {
 return (
 <div className="min-h-screen">
 <PublicHeader />

 {/* Ocean teal glow — top, centered behind logo */}
 <div aria-hidden style={{
 position: "fixed", top: "-60px", left: "50%", transform: "translateX(-50%)",
 width: "500px", height: "380px",
 background: "radial-gradient(ellipse, rgba(0,180,200,0.18) 0%, transparent 68%)",
 pointerEvents: "none", zIndex: 0,
 }} />
 {/* Sunset orange glow — bottom right */}
 <div aria-hidden style={{
 position: "fixed", bottom: "-40px", right: "-60px",
 width: "340px", height: "280px",
 background: "radial-gradient(ellipse, rgba(212,98,42,0.1) 0%, transparent 70%)",
 pointerEvents: "none", zIndex: 0,
 }} />
 {/* Gold sun glow — mid left */}
 <div aria-hidden style={{
 position: "fixed", top: "40%", left: "-80px",
 width: "260px", height: "260px",
 background: "radial-gradient(ellipse, rgba(245,192,48,0.05) 0%, transparent 70%)",
 pointerEvents: "none", zIndex: 0,
 }} />

 <main className="relative z-10 mx-auto max-w-2xl px-5 pb-20 pt-10">

 {/* ── Hero ─────────────────────────────────────────── */}
 <div className="rise" style={{ textAlign: "center", marginBottom: "44px" }}>

 {/* Logo — circular badge with pulse ring */}
 <div className="logo-badge" style={{ display: "inline-block", position: "relative", marginBottom: "24px" }}>
 {/* Outer decorative ring matching logo border color */}
 <div style={{
 position: "absolute", inset: "-8px",
 borderRadius: "50%",
 border: "2px solid rgba(0,180,200,0.25)",
 pointerEvents: "none",
 }} />
 {/* Pulse animation ring */}
 <div className="logo-ring-pulse" />
 {/* Secondary pulse — offset */}
 <div className="logo-ring-pulse" style={{ animationDelay: "1.25s" }} />

 {/* Logo image */}
 <div style={{
 width: "172px", height: "172px",
 borderRadius: "50%",
 overflow: "hidden",
 border: "4px solid var(--bg-3)",
 boxShadow:
 "0 0 0 2px var(--teal-dim), " +
 "0 0 40px rgba(0,180,200,0.25), " +
 "0 0 80px rgba(0,180,200,0.1), " +
 "0 8px 32px rgba(26,61,92,0.5)",
 position: "relative",
 }}>
 <Image
 src="/escola/logo.jpg"
 alt="Ivan Silva Surf School"
 width={172}
 height={172}
 style={{ width: "100%", height: "100%", objectFit: "cover" }}
 priority
 />
 </div>
 </div>

 {/* School name */}
 <h1 className="font-display" style={{
 fontSize: "clamp(2rem, 7vw, 3rem)",
 color: "var(--text-1)",
 lineHeight: 1.05,
 marginBottom: "10px",
 }}>
 Ivan Silva<br />
 <span style={{ color: "var(--ocean)" }}>Surf School</span>
 </h1>

 {/* Locations */}
 <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
 <span className="section-label"> Maracaipe</span>
 <span style={{ color: "var(--text-3)", fontSize: "12px" }}>×</span>
 <span className="section-label"> Praia do Borete</span>
 </div>

 <p style={{ color: "var(--text-2)", fontSize: "14px", lineHeight: 1.65, maxWidth: "300px", margin: "0 auto 20px" }}>
 Agende sua aula, evolua no surf e colecione conquistas.
 </p>

 {/* Partiu.life badge */}
 <Link href="https://partiu.life" target="_blank" className="partiu-badge">
 
 partiu.life
 </Link>
 </div>

 {/* Divider */}
 <div style={{ height: "1px", background: "var(--border)", marginBottom: "40px" }} />

 {/* ── Schedule ─────────────────────────────────────── */}
 <section className="rise-2" style={{ marginBottom: "44px" }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
 <h2 className="font-display" style={{ fontSize: "1.7rem", color: "var(--text-1)" }}>
 Horários
 </h2>
 <span className="section-label"> Agende aqui</span>
 </div>
 </div>
 <PublicSchedule />
 </section>

 {/* ── Packages ─────────────────────────────────────── */}
 <section className="rise-3">
 <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
 <h2 className="font-display" style={{ fontSize: "1.7rem", color: "var(--text-1)" }}>
 Pacotes
 </h2>
 <span className="section-label"> Parafinas</span>
 </div>
 <PublicPackages />
 </section>

 {/* ── Footer ───────────────────────────────────────── */}
 <footer style={{ marginTop: "56px", paddingTop: "20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
 <span style={{ fontSize: "12px", color: "var(--text-3)" }}>
 © Ivan Silva Surf School
 </span>
 <Link href="https://partiu.life" target="_blank" className="partiu-badge">
 
 Agendamento por partiu.life
 </Link>
 </footer>

 </main>
 </div>
 );
}
