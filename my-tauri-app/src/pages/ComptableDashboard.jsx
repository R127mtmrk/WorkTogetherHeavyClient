import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getComptableStats } from "../services/backofficeApi";
import { getClients } from "../services/clientsApi";
import { getReservations } from "../services/reservationsApi";

/* ── Helpers ─────────────────────────────────────────────────── */

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d) ? String(value) : d.toLocaleDateString("fr-FR");
}

function formatEur(n) {
    return Number(n).toLocaleString("fr-FR") + " €";
}

/* ── Sous-composants ─────────────────────────────────────────── */

function KpiCard({ icon, label, value, sub, color }) {
    return (
        <div className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <span className="stat-card-label">{label}</span>
                <span style={{ fontSize: 18, opacity: 0.5 }}>{icon}</span>
            </div>
            <div className="stat-card-value" style={color ? { color } : {}}>{value ?? "—"}</div>
            {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
        </div>
    );
}

function SectionTitle({ children, linkTo, linkLabel }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                {children}
            </h2>
            {linkTo && (
                <Link to={linkTo} style={{ fontSize: 12, color: "var(--accent)" }}>{linkLabel ?? "Voir tout →"}</Link>
            )}
        </div>
    );
}

/* ── Composant principal ─────────────────────────────────────── */

function ComptableDashboard() {
    const [stats, setStats]             = useState(null);
    const [reservations, setReservations] = useState([]);
    const [clients, setClients]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState("");

    useEffect(() => {
        Promise.all([
            getComptableStats().then(setStats),
            getReservations().then(d => setReservations(Array.isArray(d) ? d : [])),
            getClients().then(d => setClients(Array.isArray(d) ? d : [])),
        ])
            .catch(e => setError(typeof e === "string" ? e : e?.message ?? "Erreur de chargement."))
            .finally(() => setLoading(false));
    }, []);

    /* Calculs dérivés */
    const activeRes    = reservations.filter(r => r.status === "active");
    const inactiveRes  = reservations.filter(r => r.status !== "active");
    const totalRevenu  = activeRes.reduce((s, r) => s + (r.amount ?? 0), 0);

    // Top clients par revenu
    const revenueByClient = activeRes.reduce((acc, r) => {
        acc[r.client_name] = (acc[r.client_name] ?? 0) + (r.amount ?? 0);
        return acc;
    }, {});
    const topClients = Object.entries(revenueByClient)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

    const occupation = typeof stats?.taux_occupation === "number" ? stats.taux_occupation : parseFloat(stats?.taux_occupation ?? 0);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">📊 Tableau de bord comptable</h1>
                <p className="page-subtitle">Vue financière et analytique de l'activité</p>
            </div>

            <div className="page-body">

                {error && (
                    <div style={{ background: "#3d1111", border: "1px solid #7a2020", color: "#f08080", padding: "10px 14px", borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* ── KPIs ── */}
                <section style={{ marginBottom: 28 }}>
                    <SectionTitle>Indicateurs clés</SectionTitle>
                    <div className="stat-grid">
                        <KpiCard
                            icon="💶"
                            label="Revenu mensuel actif"
                            value={loading ? "…" : formatEur(totalRevenu)}
                            sub={`${activeRes.length} réservation${activeRes.length > 1 ? "s" : ""} active${activeRes.length > 1 ? "s" : ""}`}
                            color="var(--success)"
                        />
                        <KpiCard
                            icon="📋"
                            label="Commandes totales"
                            value={loading ? "…" : stats?.total_commandes}
                            sub={`${inactiveRes.length} inactive${inactiveRes.length > 1 ? "s" : ""}`}
                        />
                        <KpiCard
                            icon="👥"
                            label="Clients"
                            value={loading ? "…" : clients.length || stats?.total_baies && "—"}
                            sub="clients enregistrés"
                        />
                        <KpiCard
                            icon="📦"
                            label="Offres disponibles"
                            value={loading ? "…" : stats?.total_offres}
                        />
                        <KpiCard
                            icon="🖥️"
                            label="Baies"
                            value={loading ? "…" : stats?.total_baies}
                        />
                        <KpiCard
                            icon="📊"
                            label="Taux d'occupation"
                            value={loading ? "…" : `${occupation.toFixed(1)} %`}
                            color={occupation >= 90 ? "var(--danger)" : occupation >= 60 ? "var(--warning)" : "var(--success)"}
                        />
                    </div>
                </section>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

                    {/* ── Réservations récentes ── */}
                    <section>
                        <SectionTitle linkTo="/comptable/reservations" linkLabel="Toutes les réservations →">
                            Réservations récentes
                        </SectionTitle>
                        {loading && <div className="card" style={{ color: "var(--text-muted)", textAlign: "center", padding: 32 }}>Chargement…</div>}
                        {!loading && reservations.length === 0 && (
                            <div className="card" style={{ color: "var(--text-muted)", textAlign: "center", padding: 32 }}>Aucune réservation.</div>
                        )}
                        {!loading && reservations.slice(0, 5).map(r => (
                            <div key={r.id} className="card" style={{ padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{r.client_name}</div>
                                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                                        {r.offer_name} · {formatDate(r.start_date)} → {formatDate(r.end_date)}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                                    <span style={{ fontWeight: 700, fontSize: 13, color: "var(--success)" }}>{formatEur(r.amount)}</span>
                                    <span className={`badge ${r.status === "active" ? "badge-green" : "badge-grey"}`}>
                                        {r.status === "active" ? "Actif" : r.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </section>

                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                        {/* ── Top clients ── */}
                        <section>
                            <SectionTitle linkTo="/comptable/clients" linkLabel="Tous les clients →">
                                Top clients (revenu)
                            </SectionTitle>
                            {!loading && topClients.length === 0 && (
                                <div className="card" style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>Aucune donnée.</div>
                            )}
                            {!loading && topClients.map(([name, amount], i) => {
                                const maxAmount = topClients[0]?.[1] ?? 1;
                                const pct = Math.round((amount / maxAmount) * 100);
                                return (
                                    <div key={name} className="card" style={{ padding: "12px 16px", marginBottom: 8 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                            <span style={{ fontWeight: 600, fontSize: 13 }}>
                                                <span style={{ color: "var(--text-muted)", marginRight: 8, fontSize: 11 }}>#{i + 1}</span>
                                                {name}
                                            </span>
                                            <span style={{ fontWeight: 700, color: "var(--success)", fontSize: 13 }}>{formatEur(amount)}</span>
                                        </div>
                                        <div style={{ background: "var(--bg-card2)", borderRadius: 4, height: 4, overflow: "hidden" }}>
                                            <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 4, transition: "width .4s" }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </section>

                        {/* ── Répartition statuts ── */}
                        <section>
                            <SectionTitle>Répartition des réservations</SectionTitle>
                            <div className="card" style={{ padding: "16px 20px" }}>
                                {loading && <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 16 }}>Chargement…</div>}
                                {!loading && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        {[
                                            { label: "Actives",   count: activeRes.length,   color: "var(--success)" },
                                            { label: "Inactives", count: inactiveRes.length,  color: "var(--text-muted)" },
                                        ].map(({ label, count, color }) => {
                                            const total = reservations.length || 1;
                                            const pct = Math.round((count / total) * 100);
                                            return (
                                                <div key={label}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                                                        <span style={{ color: "var(--text-muted)" }}>{label}</span>
                                                        <span style={{ fontWeight: 700, color }}>{count} <span style={{ color: "var(--text-dim)", fontWeight: 400 }}>({pct} %)</span></span>
                                                    </div>
                                                    <div style={{ background: "var(--bg-card2)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                                                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .4s" }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </>
    );
}

export default ComptableDashboard;
