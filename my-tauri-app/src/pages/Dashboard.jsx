import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getComptableStats } from "../services/backofficeApi";
import { getReservations } from "../services/reservationsApi";
import { invokeCommand } from "../services/tauri";

/* ── Helpers ─────────────────────────────────────────────────── */

const ROLE_LABEL = { ROLE_ADMIN: "Administrateur", ROLE_COMPTABLE: "Comptable", ROLE_TECHNICIEN: "Technicien", ROLE_USER: "Utilisateur" };
const ROLE_BADGE = { ROLE_ADMIN: "badge-red", ROLE_COMPTABLE: "badge-blue", ROLE_TECHNICIEN: "badge-orange", ROLE_USER: "badge-grey" };

const PRIORITY_BADGE = { high: "badge-red", medium: "badge-orange", low: "badge-grey" };
const PRIORITY_LABEL = { high: "Haute", medium: "Moyenne", low: "Basse" };

function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
}

/* ── Sous-composants ─────────────────────────────────────────── */

function KpiCard({ icon, label, value, color }) {
    return (
        <div className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <span className="stat-card-label">{label}</span>
                <span style={{ fontSize: 18, opacity: 0.5 }}>{icon}</span>
            </div>
            <div className="stat-card-value" style={color ? { color } : {}}>{value ?? "—"}</div>
        </div>
    );
}

function QuickLink({ to, icon, label, desc }) {
    return (
        <Link to={to} className="ql-card">
            <span className="ql-card-icon">{icon}</span>
            <span className="ql-card-label">{label}</span>
            <span className="ql-card-desc">{desc}</span>
        </Link>
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

const Dashboard = () => {
    const { user, hasRole } = useAuth();

    const [stats, setStats]               = useState(null);
    const [tickets, setTickets]           = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading]           = useState(true);

    const isCompta = hasRole(["ROLE_ADMIN", "ROLE_COMPTABLE"]);
    const isTech   = hasRole(["ROLE_ADMIN", "ROLE_TECHNICIEN"]);
    const isAdmin  = hasRole("ROLE_ADMIN");

    const name  = user?.displayName ?? user?.username ?? user?.email ?? "Utilisateur";
    const roles = user?.roles ?? [];
    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    useEffect(() => {
        const tasks = [];
        if (isCompta) tasks.push(getComptableStats().then(setStats).catch(() => {}));
        if (isTech)   tasks.push(invokeCommand("get_tickets").then(d => setTickets(Array.isArray(d) ? d : [])).catch(() => {}));
        if (isCompta) tasks.push(getReservations().then(d => setReservations(Array.isArray(d) ? d : [])).catch(() => {}));
        Promise.all(tasks).finally(() => setLoading(false));
    }, []);

    const openTickets = tickets.filter(t => t.status === "open");

    return (
        <>
            {/* ── En-tête ── */}
            <div className="page-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 className="page-title">{greeting()}, {name} 👋</h1>
                        <p className="page-subtitle">{today}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {roles.map(r => (
                            <span key={r} className={`badge ${ROLE_BADGE[r] ?? "badge-grey"}`}>
                                {ROLE_LABEL[r] ?? r}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="page-body">

                {/* ── KPIs ── */}
                {(isCompta || isTech) && (
                    <section style={{ marginBottom: 28 }}>
                        <SectionTitle>Vue d'ensemble</SectionTitle>
                        <div className="stat-grid">
                            {isTech && (
                                <KpiCard
                                    icon="🎫"
                                    label="Tickets ouverts"
                                    value={loading ? "…" : openTickets.length}
                                    color={openTickets.length > 0 ? "var(--warning)" : "var(--success)"}
                                />
                            )}
                            {isCompta && (
                                <>
                                    <KpiCard icon="🖥️" label="Baies" value={loading ? "…" : stats?.total_baies} />
                                    <KpiCard icon="📦" label="Offres actives" value={loading ? "…" : stats?.total_offres} />
                                    <KpiCard icon="📋" label="Commandes" value={loading ? "…" : stats?.total_commandes} />
                                    <KpiCard
                                        icon="📊"
                                        label="Taux d'occupation"
                                        value={loading ? "…" : stats ? `${Number(stats.taux_occupation).toFixed(1)} %` : "—"}
                                        color={
                                            stats?.taux_occupation >= 90 ? "var(--danger)"
                                            : stats?.taux_occupation >= 60 ? "var(--warning)"
                                            : "var(--success)"
                                        }
                                    />
                                </>
                            )}
                        </div>
                    </section>
                )}

                {/* ── Tickets ouverts récents ── */}
                {isTech && !loading && openTickets.length > 0 && (
                    <section style={{ marginBottom: 28 }}>
                        <SectionTitle linkTo="/tickets" linkLabel="Gérer les tickets →">
                            Tickets ouverts
                        </SectionTitle>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {openTickets.slice(0, 4).map(t => (
                                <div key={t.id} className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{t.title}</div>
                                        <div style={{ color: "var(--text-muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {t.description}
                                        </div>
                                    </div>
                                    <span className={`badge ${PRIORITY_BADGE[t.priority] ?? "badge-grey"}`}>
                                        {PRIORITY_LABEL[t.priority] ?? t.priority}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Réservations récentes ── */}
                {isCompta && !loading && reservations.length > 0 && (
                    <section style={{ marginBottom: 28 }}>
                        <SectionTitle linkTo="/comptable/reservations" linkLabel="Voir tout →">
                            Réservations récentes
                        </SectionTitle>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {reservations.slice(0, 4).map(r => (
                                <div key={r.id} className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{r.client_name}</div>
                                        <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                                            {r.offer_name} · <strong style={{ color: "var(--text)" }}>{r.amount} €</strong>/mois
                                        </div>
                                    </div>
                                    <span className={`badge ${r.status === "active" ? "badge-green" : "badge-grey"}`}>
                                        {r.status === "active" ? "Actif" : r.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Accès rapide ── */}
                <section style={{ marginBottom: 28 }}>
                    <SectionTitle>Accès rapide</SectionTitle>
                    <div className="ql-grid">
                        <QuickLink to="/offers"    icon="📦" label="Offres"         desc="Consulter les offres disponibles" />
                        {/*isTech    && <QuickLink to="/tickets"                  icon="🎫" label="Tickets"        desc="Gérer les demandes de support" />*/}
                        {isCompta  && <QuickLink to="/comptable"                icon="📊" label="Comptabilité"   desc="Tableau de bord financier" />}
                        {/*isCompta  && <QuickLink to="/comptable/clients"        icon="👥" label="Clients"        desc="Liste des clients" />*/}
                        {isCompta  && <QuickLink to="/comptable/reservations"   icon="📋" label="Réservations"   desc="Suivi des réservations" />}
                        {/*isAdmin   && <QuickLink to="/admin/baies"              icon="🖥️" label="Baies"          desc="Gestion des baies serveur" />*/}
                        {isAdmin   && <QuickLink to="/admin/offres"             icon="🛒" label="Gestion Offres" desc="Créer et modifier les offres" />}
                        {isAdmin   && <QuickLink to="/admin/utilisateurs"       icon="👤" label="Utilisateurs"   desc="Gérer les comptes" />}
                    </div>
                </section>

            </div>
        </>
    );
};

export default Dashboard;
