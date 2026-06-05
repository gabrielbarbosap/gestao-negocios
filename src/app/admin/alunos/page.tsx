"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, MagnifyingGlass, CircleNotch, SealCheck, Phone, Ticket } from "@phosphor-icons/react";
import { useBusinessId } from "@/hooks/useBusinessId";
import { listCustomers } from "@/lib/firebase/customers";
import { listReservations } from "@/lib/firebase/reservations";
import { formatTime } from "@/lib/utils";
import type { Customer } from "@/types/customer";
import type { Reservation } from "@/types/reservation";

interface StudentRow {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  creditBalance: number;
  level: string;
  totalAulas: number;
  aulasConcluidas: number;
  ultimaAula: string | null;
  profileComplete: boolean;
}

export default function AlunosPage() {
  const businessId = useBusinessId();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!businessId) return;

    (async () => {
      setLoading(true);
      try {
        const [customers, reservations] = await Promise.all([
          listCustomers(businessId),
          listReservations(businessId),
        ]);

        // Agrupa reservas por aluno
        const reservationsByStudent = new Map<string, Reservation[]>();
        reservations.forEach((r) => {
          if (!reservationsByStudent.has(r.customerId)) {
            reservationsByStudent.set(r.customerId, []);
          }
          reservationsByStudent.get(r.customerId)!.push(r);
        });

        // Todos os alunos únicos (customers + alunos que só têm reservas)
        const customerMap = new Map<string, Customer>(customers.map((c) => [c.id, c]));
        const allIds = new Set([
          ...customers.map((c) => c.id),
          ...reservations.map((r) => r.customerId),
        ]);

        const rows: StudentRow[] = Array.from(allIds).map((id) => {
          const customer = customerMap.get(id);
          const rsvs = reservationsByStudent.get(id) ?? [];
          const ativas = rsvs.filter((r) => r.status !== "cancelled");
          const concluidas = rsvs.filter((r) => r.status === "completed");

          // Última aula (mais recente não cancelada)
          const ultima = ativas
            .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
            .at(0) ?? null;

          // Nome: tenta customer, depois reserva, depois UID curto
          const name = customer?.name
            || rsvs.at(0)?.customerName
            || `Aluno ${id.slice(0, 6)}`;

          return {
            customerId: id,
            name,
            email: customer?.email ?? "—",
            phone: customer?.phone,
            creditBalance: customer?.creditBalance ?? 0,
            level: customer?.level ?? "Iniciante",
            totalAulas: ativas.length,
            aulasConcluidas: concluidas.length,
            ultimaAula: ultima ? `${new Date(ultima.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} ${formatTime(ultima.startTime)}` : null,
            profileComplete: !!(customer?.phone && customer?.birthDate),
          };
        });

        // Ordena por total de aulas desc
        rows.sort((a, b) => b.totalAulas - a.totalAulas);
        setStudents(rows);
      } catch (e) {
        console.error("[alunos]", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [businessId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.phone ?? "").includes(q),
    );
  }, [students, search]);

  const totalAulas = students.reduce((sum, s) => sum + s.totalAulas, 0);

  return (
    <div className="admin-page" style={{ maxWidth: "960px", margin: "0 auto" }}>
      <header className="rise" style={{ marginBottom: "24px" }}>
        <span className="section-label" style={{ marginBottom: "12px" }}>
          <Users size={11} /> Alunos
        </span>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
          <div>
            <h1 className="font-display admin-title" style={{ color: "var(--text-1)", lineHeight: 1.05 }}>
              Alunos
            </h1>
            {!loading && (
              <p style={{ marginTop: "6px", fontSize: "13.5px", color: "var(--text-2)" }}>
                {students.length} aluno{students.length !== 1 ? "s" : ""} · {totalAulas} aulas agendadas no total
              </p>
            )}
          </div>

          {/* Busca */}
          <div style={{ position: "relative" }}>
            <MagnifyingGlass size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="warm-input"
              style={{ paddingLeft: "36px", width: "280px", height: "38px", fontSize: "13px" }}
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
          <CircleNotch size={26} className="ph-spin" style={{ color: "var(--text-3)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <Users size={32} style={{ color: "var(--text-3)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "var(--text-2)" }}>
            {search ? "Nenhum aluno encontrado." : "Nenhum aluno cadastrado ainda."}
          </p>
        </div>
      ) : (
        <div className="card rise-2" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-3)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Aluno</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Aulas</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Créditos</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Última aula</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Nível</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.customerId} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.12s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-3)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  {/* Aluno */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--bg-4)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "var(--teal-light)", flexShrink: 0 }}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <p style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-1)" }}>{s.name}</p>
                          {s.profileComplete && <SealCheck size={14} weight="fill" style={{ color: "var(--teal-light)" }} />}
                        </div>
                        <p style={{ fontSize: "11.5px", color: "var(--text-2)", marginTop: "1px" }}>{s.email}</p>
                        {s.phone && (
                          <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "1px", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Phone size={10} /> {s.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Aulas */}
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <p className="font-display" style={{ fontSize: "1.4rem", color: "var(--text-1)", lineHeight: 1 }}>{s.totalAulas}</p>
                    <p style={{ fontSize: "10.5px", color: "var(--text-3)", marginTop: "2px" }}>agendadas</p>
                  </td>

                  {/* Créditos */}
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                      <Ticket size={14} style={{ color: s.creditBalance > 0 ? "var(--teal-light)" : "var(--text-3)" }} />
                      <span className="font-display" style={{ fontSize: "1.2rem", color: s.creditBalance > 0 ? "var(--teal-light)" : "var(--text-3)" }}>
                        {s.creditBalance}
                      </span>
                    </div>
                  </td>

                  {/* Última aula */}
                  <td style={{ padding: "14px 16px" }}>
                    <p style={{ fontSize: "12.5px", color: s.ultimaAula ? "var(--text-1)" : "var(--text-3)" }}>
                      {s.ultimaAula ?? "—"}
                    </p>
                  </td>

                  {/* Nível */}
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px",
                      color: s.level === "Avançado" ? "var(--teal-light)" : s.level === "Intermediário" ? "var(--gold)" : "var(--text-2)",
                      background: s.level === "Avançado" ? "rgba(46,191,181,0.1)" : s.level === "Intermediário" ? "rgba(245,192,48,0.1)" : "var(--bg-3)",
                      border: `1px solid ${s.level === "Avançado" ? "rgba(46,191,181,0.25)" : s.level === "Intermediário" ? "rgba(245,192,48,0.25)" : "var(--border)"}`,
                    }}>
                      {s.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .admin-page { padding: 32px 28px 60px; }
        .admin-title { font-size: 2rem; }
        .ph-spin { animation: ph-spin 0.9s linear infinite; }
        @keyframes ph-spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .admin-page { padding: 20px 16px 48px; }
          .admin-title { font-size: 1.6rem; }
        }
        @media (max-width: 700px) {
          table th:nth-child(4), table td:nth-child(4),
          table th:nth-child(5), table td:nth-child(5) { display: none; }
        }
      `}</style>
    </div>
  );
}
